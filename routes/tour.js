var express = require("express");
var router = express.Router();
var Tour = require("../models/tour");
const multer = require("multer");
const multipart = require("connect-multiparty");
var filter = require("../config/filter_Func");
var check = require("../config/check_valid");
var totalValues = require("../config/setup_totalValues");
/* GET home page. */

// using upload image

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage
});

router.get("/exportData", (req, res) => {
  Tour.find((err, docs) => {
    var total_quantity = 0,
      total_order = 0,
      total_profit = 0;
    for (var i = 0; i < docs.length; i++) {
      docs[i].number = i + 1;
      var quantity = 0;
      var totalPrice = 0;
      for (var s = 0; s < docs[i].orderList.length; s++) {
        total_order += docs[i].orderList.length;
        if (docs[i].orderList[s].status == 1) {
          quantity += docs[i].orderList[s].totalQuantity;
          var discount = 1;
          if (docs[i].orderList[s].couponCode.discount) {
            discount = 1 - docs[i].orderList[s].couponCode.discount;
          }
          totalPrice +=
            docs[i].orderList[s].totalQuantity * docs[i].price * discount;
        }
      }
      total_quantity += quantity;
      total_profit += totalPrice;
      var obj = {
        qty: quantity,
        price: totalPrice.toFixed(1)
      };
      docs[i].orderInfo = obj;
    }
    var objTotal = {
      title: "Total",
      orderInfo: { qty: total_quantity, price: total_profit.toFixed(1) },
      orderList: []
    };
    objTotal.orderList.length = total_order;
    docs.push(objTotal);
    res.writeHead(200, {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=report.csv"
    });

    res.end(
      dataToCSV(docs, [
        "Tour Name",
        "Total Quantity",
        "Total Order",
        "Total Profit"
      ]),
      "binary"
    );
  });
});

router.post("/filter_Month", async (req, res) => {
  if (req.body.searchMonth == 0) {
    res.redirect("./tourList/1");
  } else {
    var filter_month = await filter.filter_month(req.body.searchMonth);
    var sumQuantity = 0;
    var sumProfit = 0;
    var sumOrder = 0;
    filter_month.forEach(s => {
      sumQuantity += s.qty;
      sumProfit += s.price;
      sumOrder += s.order;
    });
    Tour.find((err, docs) => {
      for (var i = 0; i < docs.length; i++) {
        docs[i].number = i + 1;
        docs[i].orderInfo = filter_month[i];
      }
      res.render("tour/tourList", {
        tours: docs,
        tour: "tour",
        sumProfit: sumProfit.toFixed(1),
        sumQuantity: sumQuantity,
        sumOrder: sumOrder,
        sessionUser: req.session.user,
        notification: req.session.messsages
      });
    });
  }
});
router.get("/tourList/:page", isLoggedIn, async (req, res) => {
  await Tour.paginate({},
    {
      // pagination
      page: req.params.page,
      limit: 10
    },
    async (err, rs) => {
      // to do view tour list
      var docs = rs.docs;
      var sumProfit = 0;
      var sumQuantity = 0;
      var sumOrder = 0;
      var numberOrder = (Number(req.params.page) - 1) * 10 + 1;
      for (var i = 0; i < docs.length; i++) {
        var totalOrder_eachTour = await totalValues.totalOrder_eachTour(
          docs[i]._id
        );
        docs[i].number = numberOrder;
        numberOrder++;
        var quantity = 0;
        var totalPrice = 0;
        for (var s = 0; s < docs[i].orderList.length; s++) {
          quantity += docs[i].orderList[s].totalQuantity;
          if (docs[i].orderList[s].status == 1) {
            var discount = 1;
            if (docs[i].orderList[s].couponCode.discount) {
              discount = 1 - docs[i].orderList[s].couponCode.discount;
            }
            totalPrice +=
              docs[i].orderList[s].totalQuantity * docs[i].price * discount;
          }
        }
        var obj = {
          qty: quantity,
          price: totalPrice.toFixed(1),
          order: totalOrder_eachTour
        };
        sumOrder += totalOrder_eachTour;
        sumProfit += totalPrice;
        sumQuantity += quantity;
        docs[i].orderInfo = obj;
      }
      res.render("tour/tourList", {
        tours: docs,
        tour: "tour",
        sumProfit: sumProfit.toFixed(1),
        sumQuantity: sumQuantity,
        sumOrder: sumOrder,
        sessionUser: req.session.user,
        notification: req.session.messsages
      });
    }
  );
});

router.get("/tourDetail/:id", (req, res) => {
  var proId = req.params.id;
  var arrOrder = [];
  var sumPrice = 0;
  var sumQty = 0;
  Tour.findById(proId, (err, docs) => {
    if (docs.orderList) {
      for (var i = 0; i < docs.orderList.length; i++) {
        if (docs.orderList[i].couponCode.discount) {
          docs.orderList[i].totalPrice -=
            docs.orderList[i].totalPrice *
            docs.orderList[i].couponCode.discount;
        }

        if (docs.orderList[i].status == 1) {
          docs.orderList[i].status = "Done";
          arrOrder.push(docs.orderList[i]);
          sumPrice += docs.orderList[i].totalPrice;
          sumQty += docs.orderList[i].totalQuantity;
        } else if (docs.orderList[i].status == -1) {
          docs.orderList[i].status = "Cancel";
          arrOrder.push(docs.orderList[i]);
        } else if (docs.orderList[i].status == 0) {
          docs.orderList[i].status = "Pending";
          arrOrder.push(docs.orderList[i]);
        }
      }
    }

    res.render("tour/tourDetail", {
      proDetail: docs,
      orderDetail: arrOrder,
      totalOrderPrice: sumPrice,
      totalOrderQty: sumQty,
      tour: "tour",
      sessionUser: req.session.user,
      notification: req.session.messsages
    });
  });
});

router.get("/tour-upload/:id", (req, res) => {
  Tour.findById(req.params.id, (err, doc) => {
      res.render("tour/tourUpload", {
        keyUpdate: req.params.id,
        tour: "tour",
        pro: doc,
        sessionUser: req.session.user,
        notification: req.session.messsages
      });
    });
  });

router.post(
  "/tour-upload/:id",
  upload.single("imagePath"),
  async (req, res) => {
    var checks = await check.check_valid(req.body.title);
    if (checks == false) {
      await res.render("tour/tourUpload", {
        keyUpdate: req.params.id,
        messages: "The fields have special characters.!",
        tour: "tour",
        sessionUser: req.session.user,
        notification: req.session.messsages
      });
    } else {
      var key = req.params.id;
      if (key == "new") {
        var pro = new Tour({
          imagePath: req.file.originalname, // req.body.imagePath
          title: req.body.title.trim(),
          description: req.body.description,
          category: req.body.category,
          price: req.body.price,
          depart: req.body.depart,
          destination: req.body.destination,
          date: req.body.dates,
          duration: req.body.duration,
          seat: req.body.seat,
          tourGuide: req.body.tourguide,
          hotel: req.body.hotel,
          reviews: [],
          orderList: [],
          tourRate: 0,
          totalProfit: 0
        });
        pro.save();
      } else {
        await Tour.findOneAndUpdate(
          {
            _id: key
          },
          {
            $set: {
              imagePath: req.file.originalname, // req.body.imagePath
              title: req.body.title,
              description: req.body.description,
              category: req.body.category,
              price: req.body.price,
              depart: req.body.depart,
              destination: req.body.destination,
              date: req.body.dates,
              duration: req.body.duration,
              seat: req.body.seat,
              tourGuide: req.body.tourguide,
              hotel: req.body.hotel
            }
          },
          {
            new: true,
            upsert: true
          },
          (err, doc) => {}
        );        
      }
      res.redirect("../tourList/1");
    }
  }
);

router.get("/tour-update", (req, res) => {
  res.render("tour/tourUpdate", {
    tour: "tour",
    sessionUser: req.session.user,
    notification: req.session.messsages
  });
});

module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.oldUrl = req.url;
  res.redirect("/user/signin");
}

function dataToCSV(dataList, headers) {
  var allObjects = [];
  // Pushing the headers, as the first arr in the 2-dimensional array 'allObjects' would be the first row
  allObjects.push(headers);

  //Now iterating through the list and build up an array that contains the data of every object in the list, in the same order of the headers
  dataList.forEach(function(object) {
    var arr = [];
    arr.push(object.title);
    arr.push(object.orderInfo.qty);
    arr.push(object.orderList.length);
    arr.push(object.orderInfo.price);

    // Adding the array as additional element to the 2-dimensional array. It will evantually be converted to a single row
    allObjects.push(arr);
  });

  // Initializing the output in a new variable 'csvContent'
  var csvContent = "";

  // The code below takes two-dimensional array and converts it to be strctured as CSV
  // *** It can be taken apart from the function, if all you need is to convert an array to CSV
  allObjects.forEach(function(infoArray, index) {
    var dataString = infoArray.join(",");
    csvContent += index < allObjects.length ? dataString + "\n" : dataString;
  });

  // Returning the CSV output
  return csvContent;
}
