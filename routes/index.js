var express = require('express');
var router = express.Router();
var Product = require('../models/product')
const multer = require('multer');
const multipart = require('connect-multiparty')



let totalItemProfit = 0;
let totalAllOrder = 0;
let obj_DailySales = {}

router.get('/', isLoggedIn, async (req, res) => {
  var arrTitle = []
  var arrProfit = []
  var arrPercent = []
  var totalProfit = 0;
  var totalOrder = 0;
  var d = new Date(); // Today!
  var today = new Date()
  d.setDate(d.getDate() - 1); // Yesterday!
  var totalYesterday = 0;
  var totalToday = 0;
  Product.find((err, docs) => {
    for (var i = 0; i < docs.length; i++) {
      arrTitle.push(docs[i].title)
      arrProfit.push(docs[i].totalProfit)
      totalOrder += docs[i].orderList.length;
      var totalPrice = 0;
      for (var s = 0; s < docs[i].orderList.length; s++) {
        var discount = 1;
        if (docs[i].orderList[s].couponCode.discount) {
          discount = 1 - docs[i].orderList[s].couponCode.discount
        }
        totalPrice += (docs[i].orderList[s].totalQuantity * docs[i].price) * discount

        if (docs[i].orderList[s].orderDate.toISOString().slice(0, 10) == d.toISOString().slice(0, 10)) {
          totalYesterday += docs[i].orderList[s].totalPrice
        }
        if (docs[i].orderList[s].orderDate.toISOString().slice(0, 10) == today.toISOString().slice(0, 10)) {
          totalToday += docs[i].orderList[s].totalPrice;
        }
      }
      //totalProfit += docs[i].totalProfit
      totalProfit += totalPrice

    }
    var dailySales = 0

    if (totalYesterday == 0 && totalToday != 0) {
      dailySales = 100
      obj_DailySales.dailySales = dailySales;
      obj_DailySales.icon = 'fa fa-long-arrow-up',
        obj_DailySales.color = 'text-success'
    }else if(totalYesterday == 0 && totalToday == 0){
      obj_DailySales.dailySales = dailySales;
      obj_DailySales.icon = 'fa fa-long-arrow-down',
        obj_DailySales.color = 'text-danger'
    }else {
      dailySales = (((totalToday - totalYesterday) / totalYesterday) * 100).toFixed(1);
      if (dailySales <= 0) {
        obj_DailySales.dailySales = dailySales;
        obj_DailySales.icon = 'fa fa-long-arrow-down',
          obj_DailySales.color = 'text-danger'
      } else {
        obj_DailySales.dailySales = dailySales;
        obj_DailySales.icon = 'fa fa-long-arrow-up',
          obj_DailySales.color = 'text-success'
      }
    }

    docs.forEach(s => {
      var obj = {}
      obj.name = s.title;
      obj.percent = ((s.totalProfit / totalProfit) * 100).toFixed(1)
      arrPercent.push(obj)
    })
    totalItemProfit = totalProfit;
    totalAllOrder = totalOrder
    res.locals.arrPercent = JSON.stringify(arrPercent)
    res.locals.arrTitle = JSON.stringify(arrTitle)
    res.locals.arrProfit = JSON.stringify(arrProfit)
    res.render('pages/index', {
      dashboard: 'dashboard',
      totalProfit: totalProfit.toFixed(1),
      totalOrder: totalOrder,
      dailySales: obj_DailySales,
      sessionUser: req.session.user._id
    })
  })
})

router.post('/', async (req, res) => {
  var start = req.body.start.trim();
  var end = req.body.end.trim();
  var arrPercent = []
  Product.find(async (err, doc) => {
    var arrTitle = []
    var arrProfit = []
    for (var i = 0; i < doc.length; i++) {
      arrTitle.push(doc[i].title)
      var totalPrice = 0;
      for (var s = 0; s < doc[i].orderList.length; s++) {
        var dates = doc[i].orderList[s].orderDate.toISOString().slice(0, 10)
        if (dates >= start && dates <= end) {
          var discount = 1;
          if (doc[i].orderList[s].couponCode.discount) {
            discount = 1 - doc[i].orderList[s].couponCode.discount
          }
          totalPrice += (doc[i].orderList[s].totalQuantity * doc[i].price) * discount
        } else if (!start && !end) {
          totalPrice += doc[i].orderList[s].totalQuantity * doc[i].price
        } else if (dates >= start && !end) {
          var discount = 1;
          if (doc[i].orderList[s].couponCode.discount) {
            discount = 1 - doc[i].orderList[s].couponCode.discount
          }
          totalPrice += (doc[i].orderList[s].totalQuantity * doc[i].price) * discount
        } else if (!start && dates <= end) {
          var discount = 1;
          if (doc[i].orderList[s].couponCode.discount) {
            discount = 1 - doc[i].orderList[s].couponCode.discount
          }
          totalPrice += (doc[i].orderList[s].totalQuantity * doc[i].price) * discount
        }
      }
      arrProfit.push(totalPrice)
    }
    doc.forEach(s => {
      var obj = {}
      obj.name = s.title;
      obj.percent = ((s.totalProfit / totalItemProfit) * 100).toFixed(1)
      arrPercent.push(obj)
    })

    res.locals.arrPercent = JSON.stringify(arrPercent)
    res.locals.arrTitle = JSON.stringify(arrTitle)
    res.locals.arrProfit = JSON.stringify(arrProfit)
    await res.render('pages/index', {
      dashboard: 'dashboard',
      totalProfit: totalItemProfit.toFixed(1),
      totalOrder: totalAllOrder,
      dailySales: obj_DailySales,
    })
  })
})

router.post('/filterOption', (req, res) => {
  totalItemProfit
  var arr = []
  if (!req.body.proName.trim() && req.body.category != "0") {
    Product.find({
      'userGroup': req.body.category
    }, (err, docs) => {
      docs.forEach(s => {
        var obj = {};
        obj.name = s.title;
        obj.percent = ((s.totalProfit / totalItemProfit) * 100).toFixed(1)
        arr.push(obj)
      })
      res.locals.arrProfit = JSON.stringify(arr)
    })
  } else if (req.body.proName.trim() && req.body.category === "0") {
    Product.find({
      'title': {
        '$regex': req.body.proName,
        '$options': 'i'
      }
    }, (err, docs) => {
      docs.forEach(s => {
        var obj = {};
        obj.name = s.title;
        obj.percent = ((s.totalProfit / totalItemProfit) * 100).toFixed(1)
        arr.push(obj)
      })
      res.locals.arrProfit = JSON.stringify(arr)
    })
  } else if (req.body.proName.trim() && req.body.category !== "0") {
    Product.find({
      'title': {
        '$regex': req.body.proName,
        '$options': 'i'
      },
      userGroup: req.body.category
    }, (err, docs) => {
      docs.forEach(s => {
        var obj = {};
        obj.name = s.title;
        obj.percent = ((s.totalProfit / totalItemProfit) * 100).toFixed(1)
        arr.push(obj)
      })
      res.locals.arrProfit = JSON.stringify(arr)
    })
  } else if (!req.body.proName.trim() && req.body.category === "0") {
    Product.find((err, docs) => {
      docs.forEach(s => {
        var obj = {};
        obj.name = s.title;
        obj.percent = ((s.totalProfit / totalItemProfit) * 100).toFixed(1)
        arr.push(obj)
      })
      res.locals.arrPercent = JSON.stringify(arr)
    })
  }
  // res.locals.arrTitle = JSON.stringify(arrTitle)
  // res.locals.arrProfit = JSON.stringify(arrProfit)
  res.render('pages/index', {
    dashboard: 'dashboard',
    totalProfit: totalItemProfit.toFixed(1),
    totalOrder: totalAllOrder
  })
})




router.get('/downloadCSV',(req,res)=>{
  var ws = fs.createWriteStream('my.csv');
  csv.write([["a1","b1"],["a2","b2"],["a3","b3"]],{headers:true}).pipe(ws)
  res.render('pages/index', {
    dashboard: 'dashboard'
  })
})



module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.oldUrl = req.url;
  res.redirect('/user/signin');
}