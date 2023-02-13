import pkg from "sequelize"
import reply from "../../Common/reply.js"
import { Model } from "../../Database/sequelize.js"
import CValidator from "../../Validator/CustomValidation.js"
import { startOfDay,endOfDay,startOfWeek ,startOfMonth } from 'date-fns'

const { Op, QueryTypes } = pkg;

const top10Coin = async (req,res) => {
    let request ={}
    request.duration = req.params.duration || "";
    
    //custom validation
     let validate = await CValidator(request, {
        duration:"required|in:day,week,month"
    })
    if (!validate.status) { return res.send(reply.failed(validate.message)); }
    let start_date = ''
    let end_date = new Date();


    switch(request.duration){
         case 'week':
            start_date = new Date(endOfDay(end_date.setDate(end_date.getDate() - 7))).toISOString().substring(0, 19).replace('T', ' ');
            end_date = new Date((endOfDay(new Date())).getTime() ).toISOString().substring(0, 19).replace('T', ' ');
          break;
         case 'month':
            start_date = new Date(endOfDay(end_date.setDate(end_date.getDate() - 30))).toISOString().substring(0, 19).replace('T', ' ');
            end_date = new Date((endOfDay(new Date())).getTime() ).toISOString().substring(0, 19).replace('T', ' ');
          break;
          default:
            start_date = new Date(endOfDay(end_date.setDate(end_date.getDate() - 1))).toISOString().substring(0, 19).replace('T', ' ');
            end_date = new Date((endOfDay(new Date())).getTime() ).toISOString().substring(0, 19).replace('T', ' ');
        }

    // console.log({ss:request.duration,start_date,end_date});

    try {
        let raw_query = `SELECT Round(sum(quantity),8) as totalQuantit, currency, COUNT(*) AS totalrows FROM orders where current_status = 'completed' AND created_at BETWEEN '${start_date}' AND '${end_date}' GROUP BY currency ORDER BY totalrows DESC LIMIT 3`
       let d = await Model.query(raw_query,{ type: QueryTypes.SELECT })
        return res.send(reply.success('Fetched Successfully',d))
    } catch (error) {
        console.log(error)
        return res.send(reply.failed('Unable to fetch'))
    }

    
}

export default{
    top10Coin
}