var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressHbs = require('express-handlebars')
var mongoose = require('mongoose');
var session = require('express-session')
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var indexRouter = require('./routes/index');
var couponRouter = require('./routes/coupons')
var orderRouter = require('./routes/order');
var usersRouter = require('./routes/users');
var tourRouter = require('./routes/tour')
var bodyParser = require('body-parser')
var glosbe_Daily = require('./config/setup_GlosbeDaily')
var i18n = require('i18n')

var app = express();
mongoose.connect('mongodb://localhost:27017/WorldTraveler', {
  useNewUrlParser: true
});
require('./config/passport')
// view engine setup
app.engine('.hbs', expressHbs({
  defaultLayout: 'layout',
  extname: '.hbs',
  helpers: {
    __: function() { return i18n.__.apply(this, arguments); },
    __n: function() { return i18n.__n.apply(this, arguments); }
  },
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/'
}))
app.set('view engine', '.hbs');



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(validator());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(session({
  secret: 'mysupersecret',
  resave: false,
  saveUninitialized: false
}))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


i18n.configure({
  locales: ['vn', 'en'],
  fallbacks: {'en': 'vn'},
  defaultLocale: 'en',
  cookie: 'locale',
  queryParameter: 'lang',
  directory: __dirname + '/locales',
  directoryPermissions: '755',
  autoReload: true,
  updateFiles: true,
  api: {
    '__': '__',  //now req.__ becomes req.__
    '__n': '__n' //and req.__n can be called as req.__n
  }
});
app.use(i18n.init);

app.get('/vn', function (req, res) {
  res.cookie('locale', 'vn', { maxAge: 900000, httpOnly: true });
  res.redirect('back');
});

app.get('/en', function (req, res) {
  res.cookie('locale', 'en', { maxAge: 900000, httpOnly: true });
  res.redirect('back');
});

app.use('/tour', tourRouter)
app.use('/order', orderRouter);
app.use('/coupon', couponRouter);
app.use('/user', usersRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});


// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;