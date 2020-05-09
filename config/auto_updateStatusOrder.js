var Tour = require('../models/tour')
module.exports = async (date_wantUpdate) => {
    var today = await new Date()
    var dateUpdate = 0
    var pro = await Tour.find(async (err, docs) => {
        await docs.forEach(s => {
            s.orderList.forEach(x => {
                var orderDate = x.orderDate.toISOString().slice(8, 10)
                if ((Number(today.toISOString().slice(8, 10)) - Number(orderDate) == date_wantUpdate) && x.status != 1) {
                    dateUpdate = x.orderDate;
                }
            })
        })
    })
    if(dateUpdate != 0){
        await Tour.findOneAndUpdate({
            'orderList.orderDate': dateUpdate
        },{
            'orderList.$.status': 1
        },{
            upsert: true,
            new:true
        },(err,rs)=>{
        })
    }
    return dateUpdate
}