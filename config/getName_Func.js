var Tour = require("../models/tour");
module.exports = async (id) => {
  var name = null;
  await Tour.findById(id, (err, data) => {
    try {
      name = data.title;
    } catch (error) {

    }
  });   
  return await name;
};