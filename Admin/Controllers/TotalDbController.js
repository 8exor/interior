import { CL } from "cal-time-stamper"
import _ from "lodash"
import { Op } from "sequelize"
import reply from "../../Common/reply.js"
import { GClass } from "../../Globals/GClass.js"
import { UserCrypto } from "../../Models/UserCrypto.js"
import { ListCoin } from "../../Models/ListCoin.js"
import exactMath from "exact-math"
import { Trade } from "../../Models/Trade.js"
import { GFunction } from "../../Globals/GFunction.js"
import  schedule from 'node-schedule';
import myCache from "../../Node-cache/cache.js"
import { Commission } from "../../Models/Commission.js"
import { WalletTransaction } from "../../Models/WalletTransaction.js"
import { Currency } from "../../Models/Currency.js"

import { startOfDay } from 'date-fns'



const job = schedule.scheduleJob('0 0 */1 * * *', get_live_price);
get_live_price()



const config = { returnString: true, eMinus: Infinity, ePlus:Infinity,maxDecimal: 5}

//######## Get LIsted Coin Price From Trades ########//
async function custom_repeat(listed_coin,allPrices,index=0){
    if(index==listed_coin.length){

        return allPrices.length; 
    }
    let symbol = listed_coin[index] + "USDT"

    let lprice = await Trade.findOne({
                    where:{symbol:symbol},order:[ ['id', 'DESC']],
                    attributes: ['symbol','at_price'],
                    raw:true
                })

    let obj = {'symbol':lprice.symbol,price:lprice.at_price}
    allPrices.push(obj)


    index+=1
    // console.log(allPrices.length)
    // console.log({ooo:allPrices[allPrices.length-1]})
    custom_repeat(listed_coin,allPrices,index)
}


async function get_live_price(){
    console.log('getting live prices')
     //######## Get Current Price of List Crypto ########//
     let getcurrenctPrice = await fetch(GClass.getAllSymbolPrice)
     let allPrices = await getcurrenctPrice.json()
     // console.log('prev==',allPrices.length);
     
     //######## Get Listed Coin Price#########################//
     let get_listed_coin= await ListCoin.findAll({group:'currency', attributes: ['currency']})
     let listed_coin = _.map(get_listed_coin,'currency')
     let res= await custom_repeat(listed_coin,allPrices,0)
     // let result = await Promise.all(res)
     // console.log('after==',allPrices.length,'res==',result);
 
     //######## Get INR Price #########################//
     let inr_price = await GFunction.getSymbolPrice('INR');
     // console.log({inr_price});
     let inrobj = {'symbol':'INRUSDT',price:inr_price.price}
     allPrices.push(inrobj)
     // console.log({inrrrrrr:allPrices[allPrices.length-1]})

    //######## Store in Cache #########################//
    myCache.set('dashboard_current_prices', allPrices,3600);
}

async function multiplyLivePrive(data){
    if(data.length == 0){
        return 0;
    }

    //########  Get all currencies ################//
    let exist_currency = await Currency.findAll({attributes:['symbol']})
    exist_currency = _.map(exist_currency,'symbol')

    let allPrices = myCache.get('dashboard_current_prices')

    //########  calculation in USDT ################//
        let cal_price = {}
        let total = 0;

        for(let i=0; i < data.length; i++){

            let currency = Object.keys(data[i])[0]
            let with_pair = currency+'USDT';  //#With usdt
            let c_value = data[i][Object.keys(data[i])]


            let is_exist = _.includes(exist_currency,currency)

            if(is_exist){
                // console.log({currency,with_pair,c_value})
                let currentPrice = 1
                if(currency != 'USDT'){
                    const found = allPrices.find((e) => e.symbol == with_pair);
                    // console.log({found});
                    currentPrice = found?.symbol == 'INRUSDT' ? parseFloat(exactMath.div(1,found?.price,config)) : parseFloat(found?.price)
                }
                cal_price[currency]= parseFloat(exactMath.mul(c_value,currentPrice,config)) ?? 1;
                total = parseFloat(exactMath.add(total,cal_price[currency],config))
            }
        }

        // return {cal_price,total};  
        return total
}

// multiplyLivePrive('fasfafasf')



const total = async (req,res) => {
    try {
        let data= {};

       //############ Total Public Investment ############ //
       let investment= await UserCrypto.findAll({
            where:{user_id:{[Op.ne]:1}},raw:true
        })

       let group_investment =  _.groupBy(investment,'currency')
        //##convert to USDT
       let investment_mapped = _.map(group_investment, function(value,key){
                   let sum = _.sumBy(value,function(s){
                    return parseFloat(exactMath.add(s.balance,s.freezed_balance,config)); 
                   })
                    return {[key]:sum}
                });
        data['total_investment'] =  await multiplyLivePrive(investment_mapped)


        //########## Total Commission Of Admin ############ //
        let all_commision = await Commission.findAll()
        let group_commision =  _.groupBy(all_commision,'commission_currency')
         //##convert to USDT
        let commission_mapped = _.map(group_commision, function(value,key){
            let sum = _.sumBy(value,function(s){
             return parseFloat(s.commission)
            })
             return {[key]:sum}
         });

         data['total_commission'] =  await multiplyLivePrive(commission_mapped)

        
          //########### Total Withdrawals From Excahnge ############ //
          let wallet_trans = await WalletTransaction.findAll({where:{status:'completed',type:'withdraw'}})
          let group_wallet_trans=  _.groupBy(wallet_trans,'currency')

          let wallet_trans_mapped = _.map(group_wallet_trans, function(value,key){
            let sum = _.sumBy(value,function(s){
             return parseFloat(s.amount)
            })
             return {[key]:sum}
         });

         data['total_withdraw'] =  await multiplyLivePrive(wallet_trans_mapped)

        //###########  Total Holdings In Excahnge ############ //
        let holding = await UserCrypto.findAll()
        let group_holding=  _.groupBy(holding,'currency')
        

          let holding_mapped = _.map(group_holding, function(value,key){
            let sum = _.sumBy(value,function(s){
                return parseFloat(exactMath.add(s.balance,s.freezed_balance,config)); 
                })
                return {[key]:sum}
         });
         data['total_holding'] =  await multiplyLivePrive(holding_mapped)
        

        //###########    Total Today  Withdraw commission ############ //
        let date = new Date()
        let start_date = (startOfDay(date)).getTime()
        let end_date = (date).getTime()
        // console.log(date,start_date,end_date)
        let today_withdrawal = await Commission.findAll({
            where: { commission_type: 'withdraw' , created_at: {[Op.between]:[start_date,end_date]}
            }
          });

          let group_today_withdrawal =  _.groupBy(today_withdrawal,'commission_currency')

          let today_withdrawal_mapped = _.map(group_today_withdrawal, function(value,key){
            let sum = _.sumBy(value,function(s){
                return parseFloat(s.commission); 
                })
                return {[key]:sum}
         });
         data['today_total_withdraw'] =  await multiplyLivePrive(today_withdrawal_mapped)
         
      
         
        return res.send(reply.success('Dashboard Total Record Fetched Successfully',data)) 
    } catch (error) {
        console.log('dashboard_error', error)
    }
}

export default {
    total
}
