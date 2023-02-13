import CValidator from "../../Validator/CustomValidation.js";
import { DepositCryptoLogs } from "../../Models/DepositCryptoLogs.js"
import { WalletTransaction } from "../../Models/WalletTransaction.js"
import { Order } from "../../Models/Order.js";
import{Commission} from "../../Models/Commission.js"
import Helper from "../../Common/Helper.js"
import reply from "../../Common/reply.js"
import { Op, Sequelize } from "sequelize";
import {User} from "../../Models/User.js"
import {ListCoin} from '../../Models/ListCoin.js'
import exactmath from 'exact-math'
const config = {
    ePlus:Infinity,
    eMinus:Infinity,
    returnString:true
}
import _ from 'lodash'
import { startOfDay, subDays } from 'date-fns'



async function deposit_wallet_transactions_get(req,res){
    let request = req.query

     //custom validation
    let { status , message} = await CValidator(request, {
        t_type:"required|in:bank,crypto",
    });

    if (!status) { return res.send(reply.failed(message)); }

    let whereCondition = {};
    let relationCondition = {};

    whereCondition.token_type = (request.t_type == "bank") ? 'FIAT' : { [Op.ne]:'FIAT'};

    let {symbol,amount,current_status,date,name,sortby,sortbyname} = request

   
    //symbol Filter
    if(symbol){  
        whereCondition.symbol= {
            [Op.substring] : symbol
        }
    }
    //Amount Filter
    if(amount){
        whereCondition.amount= {
            [Op.substring] : amount
        }
    }

    //Status Filter
    if(current_status){
        whereCondition.status= {
            [Op.substring] : current_status
        }
    }

    //Date Filter
    if(date){
        whereCondition.created_at= {
            [Op.substring] : Helper.get_trailing_zero(date)
        }
    }

    //name filter
    if(name){
        relationCondition.name= {
            [Op.substring] :name
        }
    }


    try {
        //helper pagination
        const paginate= (sortbyname== 'name') ? Helper.getPaginate(req,sortbyname,sortby,User) : Helper.getPaginate(req,sortbyname,sortby)

        let where_condition= {where:whereCondition,include: [{model:User,where:relationCondition,attributes: {exclude: ['password'] }}]}
        let finalquery= Object.assign(where_condition,paginate)
        const get_data = await DepositCryptoLogs.findAll(finalquery);
        const count= await DepositCryptoLogs.count(finalquery)

        //pagination
        let final = reply.paginate(paginate.page,get_data,paginate.limit,count)
        return res.send(reply.success("Wallet Transaction Fetched Successfully", final));
    } catch (error) {
        console.log(error)
        return res.send(reply.failed("Unable to fetch at this moment"));
    }
   
}


const wallet_transactions_get = async (req,res) => {
    let request = req.query

    //custom validation
    let { status , message} = await CValidator(request, {
        t_type:"required|in:bank,crypto",
    });

   if (!status) { return res.send(reply.failed(message)); }

   let whereCondition = {};
   let relationCondition = {};

   
   let {t_type,currency,amount,current_status,date,name,sortby,sortbyname} = request

   whereCondition.transfer_via = t_type;

   //currency Filter
    if(currency){  
        whereCondition.currency= {
            [Op.substring] : currency
        }
    }
   //Amount Filter
    if(amount){  
        whereCondition.amount= {
            [Op.substring] : amount
        }
    }

    //Status Filter
    if(current_status){
        whereCondition.status= {
            [Op.substring] : current_status
        }
    }

    //Date Filter
    if(date){
        whereCondition.created_at= {
            [Op.substring] : Helper.get_trailing_zero(date)
        }
    }

    //name filter
    if(name){
        relationCondition.name= {
            [Op.substring] :name
        }
    }


   //helper pagination

   try {
    const paginate= (sortbyname== 'name') ? Helper.getPaginate(req,sortbyname,sortby,User) : Helper.getPaginate(req,sortbyname,sortby)

    let where_condition= {where:whereCondition,include: [{model:User,where:relationCondition,attributes: {exclude: ['password'] }}]}
    let finalquery= Object.assign(where_condition,paginate)
    const get_data = await WalletTransaction.findAll(finalquery);
    const count= await WalletTransaction.count(finalquery)
 
     //pagination
     let final = reply.paginate(paginate.page,get_data,paginate.limit,count)
     return res.send(reply.success("Wallet withdraw Transaction Fetched Successfully", final));
   } catch (error) {
       console.log(error)
       return res.send(reply.failed("Unable to fetch at this moment"));
   }
   
   
}

const listedCoinCP= async(symbol)=>{
    
    try {
        const ExchangesListedCoin = await ListCoin.findOne({
            where:{symbol} ,
          });
    return ExchangesListedCoin ? ExchangesListedCoin.current_price :0 

    } catch (error) {
        console.log({error});
        return 0
    }
    
 
}

const trading_fee_report_get = async (req,res) => {
let request = req.query
let {duration,commission_currency,commission,date,order_type,name,sortbyname,sortby} = request
let whereCondition = {};
let relationCondition = {};
let nestedCondition = {};

 //Duration Filter  -----day,week,month
 const durations= { day:1, week: 7, month:30,}
 if(duration){  
    let startDay = startOfDay(subDays(new Date(),durations[duration]))
    let endDay = startOfDay(new Date())
    // console.log({startDay,endDay})

    whereCondition.created_at= {
        [Op.between] :[startDay,endDay]
    }
 }


 //filter commision_currency
 if(commission_currency){
    whereCondition.commission_currency= {
        [Op.substring] :commission_currency
    }
}
//filter commision
 if(commission){
    whereCondition.commission= {
        [Op.substring] :commission
    }
}
//filter date
 if(date){
    whereCondition.created_at= {
        [Op.substring] :Helper.get_trailing_zero(date)
    }
}
//filter type
 if(order_type){
    relationCondition.order_type= {
        [Op.substring] :order_type
    }
}
//filter name
 if(name){
    nestedCondition.name= {
        [Op.substring] :name
    }
}
try {
    // console.log({sortbyname,sortby})
    const paginate= (sortbyname== 'order_type') ? Helper.getPaginate(req,sortbyname,sortby,Order) : (sortbyname== 'name') ? Helper.getPaginate(req,sortbyname,sortby,Order,User):Helper.getPaginate(req,sortbyname,sortby)
    let where_condition= {where:whereCondition, include: [{model:Order,attributes:['id','user_id','order_type'],where:relationCondition,include:[{model:User,where:nestedCondition,attributes: {exclude: ['password'] }}]}] }
    // console.log({pag:paginate.order})
    let finalquery= Object.assign(where_condition,paginate)
    const get_data = await Commission.findAll(finalquery);
    const count= await Commission.count(finalquery)

    //################## for total commision ##########################//
    let total_commission = await Commission.findAll();
    let GroupBy_key= reply.groupBy('commission_currency',total_commission);

    let keys= Object.keys(GroupBy_key);

    let map1 = keys.map((e)=> {
        return e + 'USDT';
    } )

    map1 = map1.toString()

    let url = "https://datalake.network3.info/current-price/"+map1
    let data = await fetch(url)
    let response = await data.json()
    response= response.data

    response=response.filter((j)=> j.symbol != undefined)
    // console.log({cache:myCache.get('getCurrentPrice')})

    let Fdata= total_commission.map(async(el)=>{
        let current_price= response?.find((o)=>{
            if (el.commission_currency=='USDT') {
                return o.price=1
            }
            return o?.symbol.includes(el.commission_currency)
        })
        el.dataValues.usdt_comm = (current_price != undefined) ? exactmath.mul(el.commission, current_price.price,config) :exactmath.mul(el.commission, await listedCoinCP(el.commission_currency+"USDT"),config)  
        // console.log({huhu:el.dataValues.usdt_comm})
        return el;
    })

    Fdata = await Promise.all(Fdata)
    let total =  _.sumBy(Fdata,(o)=>{
        // console.log({o:o.dataValues.usdt_comm})
        return parseFloat(o.dataValues.usdt_comm)
    })

    //pagination
    let final = reply.paginate(paginate.page,get_data,paginate.limit,count)
    return res.send(reply.success("Trade  Fetched Successfully", {final,total}));

} catch (error) {
    console.log(error)
    return res.send(reply.failed("Unable to fetch at this moment",error));
}
   
}

const client_report_get = async (req,res) => {
    let request = req.query
     //custom validation
     let { status , message} = await CValidator(request, {
        status:"in:verified,unverified",
    });

    if (!status) { return res.send(reply.failed(message)); }

    let{duration,name,email,user_status,date,sortbyname,sortby} = request
    let whereCondition = {};
   
    //Duration Filter (day,week,month)
    const durations= { day:1, week: 7, month:30,}
    if(duration){  
        let startDay = startOfDay(subDays(new Date(),durations[duration]))
        let endDay = startOfDay(new Date())
        // console.log({startDay,endDay})

        whereCondition.created_at= {
            [Op.between] :[startDay,endDay]
        }
    }
    //Name Filter
    if(name){  
        whereCondition.name= {
            [Op.substring] : name
        }
    }

    //Email Filter
    if(email){  
        whereCondition.email= {
            [Op.substring] : email
        }
    }

    //Status Filter
    if(user_status){  
        let status1 = (request.user_status == 'verified') ? 1 : 0;
        whereCondition.user_verify= {
            [Op.substring] : status1
        }
    }

    //Date Filter
    if(date){  
        whereCondition.created_at= {
            [Op.substring] : Helper.get_trailing_zero(date)
        }
    }
  

    //helper pagination
   try {
    // console.log({sortbyname,sortby})
    const paginate=  Helper.getPaginate(req,sortbyname,sortby)
    let where_condition= {attributes:{exclude:['password']},where:whereCondition}
    let finalquery= Object.assign(where_condition,paginate)
    const get_data = await User.findAll(finalquery);
    const count= await User.count(finalquery)
 
     //pagination
     let final = reply.paginate(paginate.page,get_data,paginate.limit,count)
     return res.send(reply.success("Users Fetched Successfull", final));
   } catch (error) {
       console.log(error)
       return res.send(reply.failed("Unable to fetch at this moment"));
   }
}

export default {
    deposit_wallet_transactions_get,
    wallet_transactions_get,
    trading_fee_report_get,
    client_report_get
}