var express = require("express");
var router = express.Router();
var Tour = require("../models/tour");
var User = require("../models/user");
var url = require("url");
var filter = require("../config/filter_Func");

let arrFilters = [];
router.get("/orderList", isLoggedIn, async (req, res) => {
  var arr = [];
  await Tour.paginate(
    {},
    {
      // pagination
      page: req.params.page,
      limit: 10,
    }
  ),
    await User.find(
      {
        role: "Customer",
      },
      async (err, users) => {
        var numberStt = 0;
        // Filter user role -> orderList (orderDate,totalPrice) -> sub_order (proId) -> orderNumber.
        await Tour.find(async (err, tours) => {
          await users.forEach((u) => {
            u.orderList.forEach((s) => {
              var obj = {};
              obj.email = u.email;
              numberStt++;
              obj.orderDate = s.orderDate;
              obj.totalPrice = s.totalPrice;
              obj.totalItem = 0;
              obj.id = u._id;
              obj.numberOrder = s.number;
              s.sub_order.forEach((sb) => {
                obj.totalItem = obj.totalItem + sb.orderNumber.length;
                sb.orderNumber.forEach((o) => {
                  tours.forEach((result) => {
                    result.orderList.forEach((p) => {
                      if (result._id == sb.proId && p.numberOrder == o) {
                        if (p.status == 1) {
                          obj.status = "Done";
                        } else if (p.status == 0) {
                          obj.status = "Pending";
                        } else if (p.status == -1) {
                          obj.status = "Cancel";
                        }
                      }
                    });
                  });
                });
              });
              obj.number = numberStt;
              arr.push(obj);
            });
          });
        });
        arrFilters = await arr;
        await res.render("orders/orderList", {
          orders: "order",
          orderList: arr,
          sessionUser: req.session.user,
          notification: req.session.messsages,
        });
      }
    );
});

router.get("/filter_newOrder/:date", async (req, res) => {
  var arr = [];
  await User.find(
    {
      role: "Customer",
    },
    async (err, users) => {
      var numberStt = 0;
      // Filter user role -> orderList (orderDate,totalPrice) -> sub_order (proId) -> orderNumber.
      await Tour.find((err, tours) => {
        users.forEach((u) => {
          u.orderList.forEach((s) => {
            var obj = {};
            obj.email = u.email;
            numberStt++;
            obj.orderDate = s.orderDate;
            obj.totalPrice = s.totalPrice;
            // obj.totalItem = s.sub_order.length
            obj.totalItem = 0;
            obj.id = u._id;
            obj.numberOrder = s.number;
            var check = false;
            s.sub_order.forEach((sb) => {
              obj.totalItem = obj.totalItem + sb.orderNumber.length;
              sb.orderNumber.forEach((o) => {
                tours.forEach((result) => {
                  result.orderList.forEach((p) => {
                    if (
                      result._id == sb.proId &&
                      p.numberOrder == o &&
                      p.orderDate.toISOString().slice(0, 10) == req.params.date
                    ) {
                      if (p.status == 0) {
                        obj.status = "Pending";
                        check = true;
                      }
                    }
                  });
                });
              });
            });
            if (check == true) {
              obj.number = numberStt;
              arr.push(obj);
            }
          });
        });
      });
      res.render("orders/orderList", {
        orders: "order",
        orderList: arr,
        sessionUser: req.session.user,
        notification: req.session.messsages,
      });
    }
  );
});
router.post("/filter_orderPending", async (req, res) => {
  var arr = [];
  arrFilters.forEach((s) => {
    if (s.status == 0) {
      arr.push(s);
    }
  });
  res.render("orders/orderList", {
    orders: "order",
    orderList: arr,
    sessionUser: req.session.user,
    notification: req.session.messsages,
  });
});

// Filter Status
router.post("/filter_status", async (req, res) => {
  if (req.body.status == 2) {
    res.redirect("./orderList");
  } else {
    var arr = [];
    arrFilters.forEach((s) => {
      if (s.status == req.body.status) {
        arr.push(s);
      }
    });
    res.render("orders/orderList", {
      orders: "order",
      orderList: arr,
      sessionUser: req.session.user,
      notification: req.session.messsages,
    });
  }
});

router.get("/orderDetail/:numberOrder", async (req, res) => {
  var numOrder = req.params.numberOrder;
  var arr = numOrder.split("-");
  User.findById(arr[0], (err, user) => {
    Tour.find((err, tour) => {
      var arrTour = [],
        arr_proDelet = [];
      var obj = {
        orderList: [],
      };
      user.orderList.forEach((s) => {
        if (s.number == arr[1]) {
          obj.totalPrice = s.totalPrice;
          obj.orderDate = s.orderDate;
          s.sub_order.forEach((x) => {
            tour.forEach((pro) => {
              if (pro._id == x.proId) {
                x.orderNumber.forEach((o) => {
                  pro.orderList.forEach((p) => {
                    if (o == p.numberOrder) {
                      p.proName = pro.title;
                      p.proPrice = pro.price;
                      p.proId = pro._id;
                      p.img = pro.imagePath;
                      arrTour.push(p); // view tour detail
                      // setup delete tour
                      var proDelete = {
                        _id: pro._id,
                        numberOrder: p.numberOrder,
                      };
                      arr_proDelet.push(proDelete);
                    }
                  });
                });
              }
            });
          });
        }
      });
      obj.userInfo = arrTour[0].userInfo;
      obj.couponCode = arrTour[0].couponCode;
      obj.orderList = arrTour;
      if (arrTour[0].status == 1) {
        obj.status = "Done";
      } else if (arrTour[0].status == 0) {
        obj.status = "Pending";
      } else if (arrTour[0].status == -1) {
        obj.status = "Cancel";
      }
      res.render("orders/orderDetail", {
        orders: "order",
        orderDetail: obj,
        sessionUser: req.session.user,
        notification: req.session.messsages,
        arr_proDelet: JSON.stringify(arr_proDelet),
      });
    });
  });
});

router.post("/updateStatus_Order", async (req, res) => {
  var arr_proDelet = JSON.parse(req.body.arrPro);
  // forEeach find proId -> get old status + profit -> findoneandUpdate -> update status
  await arr_proDelet.forEach((arr) => {
    var check = false;
    Tour.findOneAndUpdate(
      {
        _id: arr._id,
        "orderList.numberOrder": arr.numberOrder,
      },
      {
        $set: {
          "orderList.$.status": Number(req.body.status),
        },
      },
      {
        new: true,
        upsert: true,
      },
      (err, docs) => {
        if (docs) {
          check = true;
        }
        if (check == true) {
          Tour.findById(arr._id, async (err, doc) => {
            var totalValues = 0;
            var returnSeat = doc.seat;
            doc.orderList.forEach((p) => {
              if (p.status == 1) {
                totalValues += p.totalHasDiscount;
              }
            });
            console.log(totalValues);
            var statusCancle = doc.orderList.filter((s) => {
              if (s.numberOrder == arr.numberOrder) return s;
            });
            console.log(statusCancle[0]);
            if (statusCancle[0].status == -1) {
              returnSeat = returnSeat + statusCancle[0].totalQuantity;
            }
            Tour.findByIdAndUpdate(
              arr._id,
              {
                $set: {
                  totalProfit: totalValues,
                  seat: returnSeat,
                },
              },
              {
                upsert: true,
                new: true,
              },
              (err, tours) => {}
            );
          });
        }
      }
    );
  });
  await res.redirect("./orderList");
});

module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.oldUrl = req.url;
  res.redirect("/user/signin");
}
