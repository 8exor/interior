import reply from "../Common/reply.js";
import { ListCrypto } from "../Models/ListCrypto.js";

import fetch from 'node-fetch';
import variables from "../Config/variables.js";
import { GFunction } from "../Globals/GFunction.js";

import { ListCoin } from './../Models/ListCoin.js';
// import ALL_TRADES from "../RunnerEngine/Ohlc.js";
import ohlcMaker from "../RunnerEngine/ohlcMaker.js";
import Nohlc from "../RunnerEngine/Nohlc.js";
import { CL } from "cal-time-stamper";
import myCache from './../Node-cache/cache.js';

import _ from "lodash";

import  { Op } from "sequelize";



const getTickerdata = async (listed_coins_array, index = 0) => {

        if(listed_coins_array.length == index) return listed_coins_array;

        let element = listed_coins_array[index];
        element = element.dataValues;
        let symbol = (element.currency + element.pair_with);

        let data = await Nohlc.instantOhlc(symbol,'1d') || [];    
        let listed_coin = await ListCoin.findOne({ where: {symbol }});

        element.price  =  listed_coin.dataValues.current_price || "0";            
        element.change  = data?.ohlc.P || "0";         
        element.volume  = data?.ohlc.v || "0";         
        element.high  = data?.ohlc.h ||  "0";         
        element.low  = data?.ohlc.l || "0";
        
        return getTickerdata(listed_coins_array,index + 1);
}


function insertKey(key, value, obj, pos) {
    return Object.keys(obj).reduce((ac, a, i) => {
        if (i === pos) ac[key] = value;
        ac[a] = obj[a];
        return ac;
    }, {})
}



const top10coin = async (req,res) => {

    // var result = await ListCrypto.findAll({
    //     attributes:{
    //         exclude:['active_status','address','deposit', 'withdraw']
    //     }
    // });



    const excluded_fields = ['active_status','address','deposit','deposit_min','deposit_max','deposit_commission', 'deposit_commission_type','withdraw','withdraw_min','withdraw_max','withdraw_commission', 'withdraw_commission_type','buy','buy_min','buy_max','buy_commission', 'buy_commission_type','sell','sell_min','sell_max','sell_commission', 'sell_commission_type'];


    var crypto = await ListCrypto.findAll({
        attributes:{
            exclude: excluded_fields
        },
        where: {
            active_status : 1,
            currency: { [Op.in]: ["XRP", "ETH", "BNB", "SOL", "DOGE", "MATIC", "SHIB", "BTC", "DOT", "ADA"] },
            pair_with: "USDT"
        }
    });

    var coin = await ListCoin.findAll({
        attributes:{
            exclude: excluded_fields
        },
        where: {
            active_status : 1,
            currency: { [Op.in]: ["CHT"] },
            pair_with: "USDT"
        }
    });

    var result = crypto.concat(coin);

    var current_prices = myCache.get('getCurrentPrice');

    // console.log(current_prices);

    // return;

    // Adding Price Key in Resulted Data
    result.forEach(element => {
        let finder = current_prices.find(o => o.symbol === element.symbol);

        element.dataValues['price'] = (finder != null) ? finder.price : "0";            
        element.dataValues['change'] = (finder != null) ? finder.change : "0";         
        element.dataValues['volume'] = (finder != null) ? finder.volume : "0";         
        element.dataValues['high'] = (finder != null) ? finder.high : "0";         
        element.dataValues['low'] = (finder != null) ? finder.low : "0";   
        element.dataValues['isFav'] = false;
    });

    // Get Ticker Data for Listed Coins
    let l_result = result.filter(el => Object.keys(el.dataValues).includes('current_price'));
   
    if(l_result.length != 0)
    {
        l_result = await getTickerdata(l_result);

        let o_result = result.filter(el => !(Object.keys(el.dataValues).includes('current_price')));

        result = o_result.concat(l_result);
    }
    
    // Add Slug data If Slug Exists In Query
    // const slug_data = !req.query.slug ? null : current_prices.find(o => o.symbol === req.query.slug); 

    // Group By Pair With
    // result = reply.groupBy('pair_with', result);
    
    // result = insertKey('FAV', [], result, 0);

    return res.json(reply.success('Top 10 Coins fetched Successfully' , result));
}

export default {

    top10coin,

    async get(req,res){

        // var result = await ListCrypto.findAll({
        //     attributes:{
        //         exclude:['active_status','address','deposit', 'withdraw']
        //     }
        // });
        const excluded_fields = ['active_status','address','deposit','deposit_min','deposit_max','deposit_commission', 'deposit_commission_type','withdraw','withdraw_min','withdraw_max','withdraw_commission', 'withdraw_commission_type','buy','buy_min','buy_max','buy_commission', 'buy_commission_type','sell','sell_min','sell_max','sell_commission', 'sell_commission_type'];


        var crypto = await ListCrypto.findAll({
            attributes:{
                exclude: excluded_fields
            },
            where: {
                active_status : 1
            }
        });

        var coin = await ListCoin.findAll({
            attributes:{
                exclude: excluded_fields
            },
            where: {
                active_status : 1
            }
        });

        var result = crypto.concat(coin);

        

        if(myCache.has('getTickers')){
            var tickers = myCache.get('getTickers');
        }else
        {
            var tickers = await getTickers();
        }
        var listed_tickers = await getListedTickers();

        var current_prices = myCache.get('getCurrentPrice');

        // Adding Price Key in Resulted Data
        result.forEach(element => {
            let finder = current_prices.find(o => o.symbol === element.symbol);

            element.dataValues['price'] = (finder != null) ? finder.price : "0";            
            element.dataValues['change'] = (finder != null) ? finder.change : "0";         
            element.dataValues['volume'] = (finder != null) ? finder.volume : "0";         
            element.dataValues['high'] = (finder != null) ? finder.high : "0";         
            element.dataValues['low'] = (finder != null) ? finder.low : "0";   
            element.dataValues['isFav'] = false;
        });

        // Get Ticker Data for Listed Coins
        let l_result = result.filter(el => Object.keys(el.dataValues).includes('current_price'));
       
        if(l_result.length != 0)
        {
            l_result = await getTickerdata(l_result);

            let o_result = result.filter(el => !(Object.keys(el.dataValues).includes('current_price')));

            result = o_result.concat(l_result);
        }
        
        // Add Slug data If Slug Exists In Query
        // const slug_data = !req.query.slug ? null : current_prices.find(o => o.symbol === req.query.slug); 

        // Group By Pair With
        result = reply.groupBy('pair_with', result);
        
        result = insertKey('FAV', [], result, 0);

        return res.json(reply.success('List Crypto(s) fetched Successfully' , result , { tickers , listed_tickers }));
    }, 

    // Get Market Depth And Order Volume Data

    async getMarketData(req,res){

        const symbol = req.params.symbol ;
        let limit = req.query.limit || 10;
        limit = !isNaN(limit) ? limit : 10;

        let last_three_char = symbol.substr(symbol.length - 3);

        
        if(!variables.allowed_pair_with.includes(last_three_char))
        {
            return res.json(reply.failed('Invalid Symbol'));
        }
        // const response = await fetch(GClass.getDepthApi(symbol,limit));
        // const result = await response.json();
        var result = myCache.get('all_market_data');

        result = result.find((sym) => _.has(sym, symbol));
        result = result?.[symbol] ;

        if(!result.lastUpdateId)
        {
            return res.json(reply.failed('Invalid Data'));
        }
        

        // const slicedArray = newResult.slice(0, 10);

        return res.send(reply.success('Market Data Fetched Successfully' , result));
    },

    async getTradeHistory(req,res){

        const symbol = req.params.symbol ;
        let limit = req.query.limit || 10;
        limit = !isNaN(limit) ? limit : 10;

        let last_three_char = symbol.substr(symbol.length - 3);

        if(!variables.allowed_pair_with.includes(last_three_char))
        {
            return res.json(reply.failed('Invalid Symbol'));
        }
        // const response = await fetch(GClass.getTradeApi(symbol,limit));
        // const result = await response.json();

        var result = myCache.get('all_trade_history');

        // console.log(result.length);
        
        result = result?.find((sym) => _.has(sym, symbol));
        result = result?.[symbol] ;

        if(result.msg)
        {
            return res.json(reply.failed('Invalid Data'));
        }

        

        // Map Data in keys According to Socket results
        const newResult = result.map(rec => {
            return {
                "e": "trade",      // Event type
                "s": symbol,       // Symbol
                "t": rec.id,       // Trade ID
                "p": rec.price,    // Price
                "q": rec.qty,      // Quantity
                "T": rec.time,     // Trade time
                "m": rec.isBuyerMaker, // Is the buyer the market maker? // true for sell and false for green
              }
            });


            const slicedArray = newResult.slice(0, 10);

            // newResult = _.take(newResult, 10)

            // console.log(slicedArray.length);
        return res.send(reply.success('Trade History Fetched Successfully', slicedArray ));
    }
}


//Get LISTED TICKER PAIR
async function getListedTickers(){
    var res_array = [];

    var tickers = await ListCoin.findAll({
        attributes: [ 'currency' , 'pair_with' , 'symbol'],
        where: {
            active_status : 1
        }
    });
    
    tickers.forEach(element => {
        let pair = element.currency + element.pair_with ;
        res_array.push(pair);
    });
    
    return res_array;
}

// Get All Ticker Pairs
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

// Get Current Price Of All Symbols

async function getCurrentPrice(ticker_array){
    var result_prices = [];
    
    const response = await fetch(GClass.get24hrApi);
  
    const result = await response.json();

    var currency_conversion_rate = '0';

    if(GClass.is_fiat_currency_available)
    {
        let rslt = await fetch(GClass.all_currency_conversions).then(r => r.json().then(re => re));
        rslt = rslt?.data.find(e => e.pair == GClass.selected_fiat_currency_pair);
        currency_conversion_rate = rslt.rate || '0';
    }
   
    ticker_array.forEach(element => {

        // Check If Symbol is in INR
        let isOther = false ;
        if(element.includes(GClass.selected_fiat_currency))
        {
            isOther = true;
            element = element.replace(GClass.selected_fiat_currency , 'USDT');
        }
        var obj = {};
        if(result.length > 0){
             obj = result?.find(o => o.symbol === element);
        }

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
                price: CL.mul(addData.price , currency_conversion_rate ),
                change: addData.change,
                high: CL.mul(addData.high , currency_conversion_rate ),
                low: CL.mul(addData.low , currency_conversion_rate ),
                volume: addData.volume
            }
        }
        

        result_prices.push(addData);
    });
    return result_prices;
}

// CONVERSION FUNCTIONS

// function negativeChange(change , price , conversion_rate)
// {
//         let p = CL.sub('100' , change );
//         let divide = CL.div('100', p );
//         let sp = CL.mul(price , divide ); // higher

//         let n_sp = CL.mul(sp , conversion_rate); // converted  sp
//         let c_sp = CL.mul(price , conversion_rate );

//         let n_price_dec = CL.sub(n_sp , c_sp );
//         let n_percent_change = CL.div(n_price_dec , n_sp ) * 100;

//         return {
//             p,divide,sp,n_sp,c_sp,n_price_dec,n_percent_change
//         };

// }

// console.log('YOU ARE HERE',negativeChange(20 , 96 , 100));


// async function multiplecall() {
//     const fetchReq1 = fetch(
//         `https://api3.binance.com/api/v3/ticker/price`
//       ).then((res) => res.json());
      
//       const fetchReq2 = fetch(
//         `https://api3.binance.com/api/v3/ticker/24hr`
//       ).then((res) => res.json());
            
//       // do fetch requests in parallel
//       // using the Promise.all() method
//       const allData = await Promise.all([fetchReq1, fetchReq2]);
      
//       return allData;
// }

// Get Verified By Binance Tickers
// async function getVerifiedTickers(array) {
//     const url = 'https://api3.binance.com/api/v3/exchangeInfo?symbols=';
//     const url_query =  JSON.stringify(array).replaceAll('"',"%22").replace('[','%5B').replace(']','%5D');
//     const response = await fetch(url + url_query);
//     const data = await response.json();
//     return data;
// }



