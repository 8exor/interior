import myEvents from "./Emitter.js";
import crypto from "crypto";
import { Trade } from "../Models/Trade.js";
import _ from 'lodash';
import { TS } from "cal-time-stamper";

let LAST_PRICES = {};
 									
// tid	time  currency  with_currency  symbol at_price quantity sell_order_id buy_order_id start_time	end_time  last_price

const get_last_price = async (symbol,default_price) => {

    let last_price = LAST_PRICES[symbol] || null ;

    if(last_price == null)
    {
        // Get Latest Trade from Database and set it
        let is_finded = await Trade.findOne({ 
            where: { symbol}, 
            order: [['id','DESC']]
        });


        if(is_finded)
        {
            last_price = is_finded.at_price;
        }
        else
        {
            last_price = default_price ;
        }

        LAST_PRICES[symbol] = last_price;
    }
    
    return last_price;

}

const set_last_price = (symbol,new_last_price) => {
    LAST_PRICES[symbol] = new_last_price;
}

const On_Trade_Done = async ({currency , with_currency , at_price, quantity,  sell_order_id, buy_order_id , tid = null }) => {

    let time = Date.now();
    tid = (tid == null) ? crypto.randomBytes(10).toString("hex") : tid ;

    let symbol = currency + with_currency;

    let Gvar_time = TS.get_1m_TimeStamp(); //raka
    let start_time = Gvar_time.start_time;
    let end_time  = Gvar_time.end_time;

    let last_price = await get_last_price(symbol,at_price) ;

    // Trade Object
    let trade_object = { time,tid, currency , with_currency ,symbol, start_time,end_time,at_price, quantity, last_price,sell_order_id, buy_order_id };

    // Set Updated Last Price
    set_last_price(symbol,at_price);

    //Save In DB
    await Trade.create(trade_object);   

    // Send Live Trade event To user
    let data = {
        e: "trade",
        T: time,
        s: symbol,
        tid,
        p: at_price,
        q: quantity,
        m: _.gte(parseFloat(at_price), parseFloat(last_price)) ? false : true,// candle color red if true and green if false ;
    };
    myEvents.emit("SEND_DATA", "trade", symbol, data);
    myEvents.emit("SEND_OHLC_DATA", symbol);
    myEvents.emit("SEND_TICKER_DATA", data);
}

myEvents.on('TRADE_EXECUTED',On_Trade_Done);

myEvents.on('INITIAL_TRADE',On_Trade_Done);

export default LAST_PRICES ;