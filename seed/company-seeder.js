var Company = require('../models/company');
var mongoose = require('mongoose');
const mongo = mongoose.connect('mongodb://localhost:27017/WorldTraveler',{useNewUrlParser: true});
mongo.then(() => {
    console.log('connected');
    }).catch((err) => {
    console.log('err', err);
    });
var companies = [
    new Company({
        companyName: 'World Traveler',
        address: '01 Pasteur, district 1, HCM city, Viet Nam',
        phoneNum: '0909999929',
        email: 'worldtraveler@gmail.com',
        description: 'This is a company provide about tour for traveling.'
    })
];
var done = 0;
for(var i = 0 ; i< companies.length; i++){
    companies[i].save(function(err,result){
        done++;
        if(done == companies.length){
            exit();
        }
    });
}
function exit(){
    mongoose.disconnect();
}