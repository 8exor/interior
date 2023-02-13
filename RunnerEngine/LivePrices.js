import { ListCoin } from '../Models/ListCoin.js';
import _ from 'lodash';
import myEvents from './Emitter.js';
import Nohlc from './Nohlc.js';


let LIVE_PRICES = {}


const setLivePrice = async (symbol , current_price) => {
     let result = await ListCoin.update({ current_price}, {
       where: getFromSymbol(symbol)
    });
    // It Return 1 or 0 ;
}

const getLivePrice = async (symbol) => {
    let result = await ListCoin.findOne({
        attributes: ['current_price'], 
        where: getFromSymbol(symbol) 
    });

    return result?.current_price || 0;
}

const getFromSymbol = (symbol) => {
    // Available Pairs with BTC, USDT , TRX , INR , BNB
    let last_char = _.endsWith(symbol, 'USDT') ? -4 : -3 ;

    return {
        currency: symbol.slice(0,last_char),
        pair_with: symbol.slice(symbol.length + last_char),
    }
}

// Make a function for below
//set current price data initailly from database here 

const addLivePrice = async (symbol , price) => {
   
    setLivePrice(symbol , price);

    let ohlc = await Nohlc.instantOhlc(symbol,'1d') || [] ;
    
    let per_change = await Nohlc.getPercentageChange(symbol,price);
    
    myEvents.emit('SEND_DATA' , 'ticker' , symbol , {
        s: symbol,
        c: price,
        P: per_change,
        h:  Object.keys(ohlc).length != 0 ?  ohlc.ohlc.h : price,
        l:  Object.keys(ohlc).length != 0 ?  ohlc.ohlc.l : price
    });
} 


myEvents.on('SEND_TICKER_DATA', (trade)  => {
    // console.log('EVENET HERE');
    addLivePrice(trade.s , trade.p);

});

export default LIVE_PRICES;

// var sluginfos = {
//     slug: $this.slug,
//     current_price: parseFloat(e_data.c),
//     current_change: parseFloat(e_data.P).toFixed(2),
//     current_high: parseFloat(e_data.h),
//     current_low: parseFloat(e_data.l),
//   };


// A: "2.55900000"
// B: "17.63800000"
// C: 1644909602246
// E: 1644909602412
// F: 76972035
// L: 76997399
// O: 1644823202246
// P: "-0.510"
// Q: "1.18600000"
// a: "0.00292600"
// b: "0.00292500"
// c: "0.00292500"
// e: "24hrTicker"
// h: "0.00297700"
// l: "0.00289500"
// n: 25365
// o: "0.00294000"
// p: "-0.00001500"
// q: "261.60695800"
// s: "LTCBTC"
// v: "89146.62700000"
// w: "0.00293457"
// x: "0.00294100"


