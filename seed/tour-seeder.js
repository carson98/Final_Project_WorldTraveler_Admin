var Tour = require('../models/tour');
var mongoose = require('mongoose');
const mongo = mongoose.connect('mongodb://localhost:27017/shopping', { useNewUrlParser: true });
mongo.then(() => {
    console.log('connected');
}).catch((err) => {
    console.log('err', err);
});
var tours = [
new Tour({
    imagePath: "NhaTrang-DaLat.jpg",
    title: "Phú Quốc",
    category: true,
    price: 500,
    depart: {
      id: "",
      name: "Hà Nội"
    },
    destination: {
      id: "",
      name: "Phú Quốc"
    },
    duration: 4,
    seat: 5,
    tourGuide: "Dũng",
    hotel: 4,
    description: "",
    reviews: [],
    orderList: [],
    tourRate: 0,
    totalProfit: 0
  })
];
var done = 0;
for (var i = 0; i < tours.length; i++) {
    tours[i].save(function (err, result) {
        done++;
        if (done == tours.length) {
            exit();
        }
    });
}
function exit() {
    mongoose.disconnect();
}