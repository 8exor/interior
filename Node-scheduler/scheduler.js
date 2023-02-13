import  schedule from 'node-schedule';
import { ListCrypto } from '../Models/ListCrypto.js';
import myCache from './../Node-cache/cache.js';
import fetch  from 'node-fetch';
import { CL } from "cal-time-stamper";

import { GClass } from '../Globals/GClass.js';
import _ from 'lodash';

async function getTickers(){
    var res_array = [];

    var tickers = await ListCrypto.findAll({
        attributes: [ 'currency' , 'pair_with' , 'symbol']
    });
    
    tickers.forEach(element => {
        let pair = element.currency + element.pair_with ;
        res_array.push(pair);
    });
    
    
    return res_array;
}

async function getCurrentPrice(ticker_array){
    var result_prices = [];
    try {
        
   
    
    const response = await fetch(GClass.get24hrApi);
  
    const result = await response.json();
    // console.log({result})

    if( Array.isArray(result)){
        myCache.set('get24hrApi' , result);
    }

    var currency_conversion_rate = '0';

    if(GClass.is_fiat_currency_available)
    {
        let rslt = await fetch(GClass.all_currency_conversions).then(r => r.json().then(re => re));
        rslt = rslt?.data.find(e => e.pair == GClass.selected_fiat_currency_pair);
        currency_conversion_rate = rslt.rate || '0';
    }
    // console.log({ticker_array})
   
    ticker_array?.forEach(element => {

        // Check If Symbol is in INR
        let isOther = false ;
        if(element.includes(GClass.selected_fiat_currency))
        {
            isOther = true;
            element = element.replace(GClass.selected_fiat_currency , 'USDT');
        }
        // console.log({element})


        let obj = result?.find(o => o.symbol === element);

        let addData = {
            symbol: element , 
            price: (obj != null) ? obj.lastPrice : "0", 
            change: (obj != null) ? parseFloat(obj.priceChangePercent).toFixed(2) : "0",
            high: (obj != null) ? obj.highPrice : "0",
            low: (obj != null) ? obj.lowPrice : "0",
            volume: (obj != null) ? obj.volume : "0",
        }

        if(isOther)
        {
            addData = {
                symbol: addData.symbol.replace('USDT',GClass.selected_fiat_currency),
                price: CL.mul(addData.price , currency_conversion_rate),
                change: addData.change,
                high: CL.mul(addData.high , currency_conversion_rate),
                low: CL.mul(addData.low , currency_conversion_rate),
                volume: addData.volume
            }
        }
        

        result_prices.push(addData);
    });
    return result_prices;

} catch (error) {
        console.log({error})
}
}

const CronFunction1 = async () => {
    var tickers = await getTickers();
    var current_prices = await getCurrentPrice(tickers);
    myCache.set('getTickers' , tickers);
    myCache.set('getCurrentPrice' , current_prices);
}

const getAllMarketData = async () => {

    var tickers = [];
    if(myCache.has('getTickers')){
        tickers = myCache.get('getTickers');
    }else
    {
        tickers = await getTickers();
    }

    let call_apis =  tickers.map(async (symbol) => {

         // Check If Symbol is in INR
         let element = symbol;
 
         if(element.includes(GClass.selected_fiat_currency))
         {
             element = element.replace(GClass.selected_fiat_currency , 'USDT');
         }

        const response = await fetch(GClass.getDepthApi(element,10));
        var result = await response.json();
        return {[symbol]: result};
    });

    let all_market_data = await Promise.all(call_apis);
    myCache.set('all_market_data' ,all_market_data);
    // console.log(all_market_data);

}

const getTradeHistorys = async () => {

    var tickers = [];
    if(myCache.has('getTickers')){
        tickers = myCache.get('getTickers');
    }else
    {
        tickers = await getTickers();
    }

    // console.log(tickers);
    let call_apis =  tickers.map(async (symbol) => {

        // Check If Symbol is in INR
        let element = symbol;

        if(element.includes(GClass.selected_fiat_currency))
        {
            element = element.replace(GClass.selected_fiat_currency , 'USDT');
        }

        const response = await fetch(GClass.getTradeApi(element,10));
        var result = await response.json();
        return {[symbol]: result};
    });

   
    let all_trade_history = await Promise.all(call_apis);

    myCache.set('all_trade_history',all_trade_history);
}

async function getConversionRate() {

    var result = await fetch(GClass.all_currency_conversions).then(r => r.json().then(re => re));
   
    result = result?.data.find(e => e.pair == GClass.selected_fiat_currency_pair);

    myCache.set('getConversionRate' , { rate: result.rate });

}


const getAllSymbolPrice = async () => {
    
    var current_mp = await fetch(GClass.getAllSymbolPrice).then(re => re.json());
    myCache.set('getAllSymbolPrice' , current_mp );
}

const Cron_Execute = async () => {
    console.log('Cron Running..');
    CronFunction1();
    getAllMarketData();
    getTradeHistorys();
    getConversionRate();
    getAllSymbolPrice();
}

CronFunction1();
getAllMarketData();
getTradeHistorys();
getConversionRate();
getAllSymbolPrice();


// Run After Every 10 Seconds
// const job = schedule.scheduleJob('*/10 * * * * *', Cron_Execute);
const job = schedule.scheduleJob('*/30 * * * * *', Cron_Execute);


export default {}