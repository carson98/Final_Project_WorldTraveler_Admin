var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');
passport = require('passport');
var localStrategy = require('passport-local').Strategy;
const mongo = mongoose.connect('mongodb://localhost:27017/WorldTraveler', {
    useNewUrlParser: true
});
mongo.then(() => {
    console.log('connected');
}).catch((err) => {
    console.log('err', err);
});
var newUser = new User();
newUser.email = 'duminhtat98@gmail.com';
newUser.password = newUser.encryptPassword('123');
newUser.fullName = 'Minh Du'
newUser.phoneNum = '0123456789';
newUser.description = 'Hi';
newUser.status = 'Active';
newUser.role = 'Manager';
newUser.address = '01 Yersin, district 1, Ho Chi Minh city, VN';
newUser.company = 'Greenwich of University';
newUser.birthday = null;
newUser.googleId = null;
newUser.save(function (err, result) {
    exit();
});

function exit() {
    mongoose.disconnect();
}