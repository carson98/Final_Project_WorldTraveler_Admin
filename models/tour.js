var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var Schema = mongoose.Schema;
var schema = new Schema({
  imagePath: { type: String, required: true },
  title: { type: String, require: true },
  category: { type: Boolean, required: true },
  price: { type: Number, required: true },
  depart: { type: Object, required: true },
  destination: { type: Object, required: true },
  date: { type: Date, required: true, default: Date.now() },
  duration: { type: Number, required: true },
  seat: { type: Number, required: true },
  tourGuide: { type: String, required: true },
  hotel: { type: Number, required: true },
  description: { type: String, required: true },
  reviews: [],
  orderList: [],
  tourRate: { type: Number },
  totalProfit: { type: Number }
});
schema.plugin(mongoosePaginate);
module.exports = mongoose.model("Tour", schema);
