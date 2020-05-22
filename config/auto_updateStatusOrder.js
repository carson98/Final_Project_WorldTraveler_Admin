var Tour = require("../models/tour");
module.exports = async () => {
  var dateUpdate = -1;
  var today = new Date();
  var pro = await Tour.find(async (err, docs) => {
    await docs.forEach((s) => {
      s.orderList.forEach((x) => {
        var orderDate = x.orderDate.toISOString().slice(8, 10);

        if (
          Number(today.toISOString().slice(8, 10)) - Number(orderDate) == 1 &&
          x.status == 0
        ) {
          console.log(today)
          dateUpdate = x.orderDate;
        }
      });
      if (dateUpdate !== -1) {
        Tour.findOneAndUpdate(
          {
            "orderList.orderDate": dateUpdate,
          },
          {
            "orderList.$.status": -1,
          },
          {
            upsert: true,
            new: true,
          },
          (err, rs) => {}
        );
      }
    });

    
  });
};
