import { Trade } from "../Models/Trade.js";
import myEvents from "./Emitter.js";
import _ from 'lodash';
import Sequelize from 'sequelize';
import { GClass } from "../Globals/GClass.js";
import { ListCoin } from "../Models/ListCoin.js";
import { CL, TI, TS } from "cal-time-stamper";

const { Op } = Sequelize;

const limit = 1000;
const time_diff = 60000;

const getOldTimestamps = ({ start_time, end_time, time_diff }, interval) => {

    let n_limit = parseFloat(CL.mul(limit, TI.TimeInMinutes(interval)));

    let diff = (time_diff + 1) * n_limit;

    return {
        start_time: parseFloat(CL.sub(start_time, diff)),
        end_time: parseFloat(CL.sub(end_time, diff)),
        time_diff,
    }
}

const getAllTrades = async (symbol, start_time, end_time) => {
    return await Trade.findAll({
        raw: true,
        where: {
            symbol,
            start_time: {
                [Op.gte]: start_time,
            },
            end_time: {
                [Op.lte]: end_time,
            }
        }
    });
}

const ohlcForApi = async (symbol, interval , start_time = null) => {

    let timestamps = TS.getTimeStamp('1m', start_time); // current Timestamp  12:50 start - 12:50:59:9999

    // calculate first start timestamp after limit
    let first_timestamp = getOldTimestamps(timestamps, interval);


    let ALL_TRADES = await getAllTrades(symbol, first_timestamp.start_time, timestamps.end_time);

    // get Exact Trade
    let exact_trade = await Trade.findAll({
        raw: true,
        where: {
            symbol,
            start_time: first_timestamp.start_time,
            end_time: first_timestamp.end_time
        }
    });


    // GET OLDER DATA
    if (exact_trade.length == 0) {
        let older_trade = await Trade.findOne({
            raw: true,
            where: {
                symbol,
                start_time: {
                    [Op.lte]: first_timestamp.start_time,
                }
            },
            order: [['id', 'DESC']]
        });

        // console.log(JSON.stringify(older_trade));
        // console.log('end_time', first_timestamp.end_time)
        // console.log('end_time', CL.sub(first_timestamp.end_time,(time_diff + 1)))
        if (older_trade) {
            let make = older_trade;
            make['start_time'] = first_timestamp.start_time;
            make['end_time'] = first_timestamp.end_time;
            make['quantity'] = 0;
            ALL_TRADES.unshift(make)
            // console.log(ALL_TRADES);
        }

    }

    // return;

    // console.log(_.groupBy(ALL_TRADES,item => `${item.start_time}-${item.end_time}`));

    let allMintueTradeData = _.groupBy(ALL_TRADES, 'start_time');

    let result = [];
    let ohlc = {};

    let last_key = null;
    for (const key in allMintueTradeData) {

        if (last_key != null) {
            let differ = CL.sub(key, last_key);
            if (differ != time_diff) {
                var x = CL.div(differ, time_diff);
                let dummyKey = last_key;
                for (var i = 1; i < x; i++) {
                    result.push({
                        start_time: parseFloat(CL.add(dummyKey, time_diff)),
                        end_time: parseFloat(CL.add(dummyKey, time_diff, (time_diff - 1))),
                        ohlc: {
                            o: ohlc.c,
                            h: ohlc.c,
                            l: ohlc.c,
                            c: ohlc.c,
                            v: 0
                        }
                    });
                    dummyKey = parseFloat(CL.add(dummyKey, time_diff));
                }
            }

        }

        last_key = key;

        // calcultae OHLC
        ohlc = {
            o: _.minBy(allMintueTradeData[key], (tr) => parseFloat(tr.time)).at_price,
            h: _.maxBy(allMintueTradeData[key], (tr) => parseFloat(tr.at_price)).at_price,
            l: _.minBy(allMintueTradeData[key], (tr) => parseFloat(tr.at_price)).at_price,
            c: _.maxBy(allMintueTradeData[key], (tr) => parseFloat(tr.time)).at_price,
            v: _.sumBy(allMintueTradeData[key], (tr) => parseFloat(tr.quantity)),
        }


        result.push({
            start_time: parseFloat(key),
            end_time: parseFloat(CL.add(key, (time_diff - 1))),
            ohlc
        });





    }
    if (last_key != null) {
        
    let differ = parseFloat(CL.sub(timestamps.start_time, last_key));


    if (differ != time_diff) {
        var x = CL.div(differ, time_diff);

        let dummyKey = last_key;
        for (var i = 0; i < x; i++) {
            result.push({
                start_time: parseFloat(CL.add(dummyKey, time_diff)),
                end_time: parseFloat(CL.add(dummyKey, time_diff, (time_diff - 1))),
                ohlc: {
                    o: ohlc.c,
                    h: ohlc.c,
                    l: ohlc.c,
                    c: ohlc.c,
                    v: 0
                }
            });
            dummyKey = parseFloat(CL.add(dummyKey, time_diff));
        }
        }
    }

    return result;

}

const getOHLC = async (symbol, interval = '1m' , start_time = null) => {


    let result_array = await ohlcForApi(symbol, interval , start_time);

    if(result_array.length == 0){
        return;
    }
    
    let chunk_size = 1;

    if (interval == '1m') {
        
        return result_array;
    }

    if (!interval.includes('M')) {
        chunk_size = TI.TimeInMinutes(interval);
    }

    let is_exact_timestamp = result_array[0]['start_time'];

    let nn = TS.getTimeStamp(interval, is_exact_timestamp);

    let dd = result_array.filter(re => re.end_time <= nn.end_time);
    let dd2 = result_array.filter(re => re.end_time > nn.end_time);

    if (nn.start_time != is_exact_timestamp) {
        let f_ohlc = dd[0]['ohlc'];
        let f_dd = {};
        f_dd['start_time'] = nn.start_time;
        f_dd['end_time'] = nn.start_time + (time_diff - 1);
        f_dd['ohlc'] = {
            o: f_ohlc.o,
            h: f_ohlc.h,
            l: f_ohlc.l,
            c: f_ohlc.c,
            v: 0
        };
        dd.unshift(f_dd);
    }

    let chunked_arrays = [];

    if (nn.start_time != is_exact_timestamp) {
        chunked_arrays = _.chunk(dd2, chunk_size);
        chunked_arrays.unshift(dd);
    }
    else {
        chunked_arrays = _.chunk(result_array, chunk_size);
    }

    // console.log(JSON.stringify(chunked_arrays));
    let x = {};
    let final_result = [];
    chunked_arrays.forEach(ele => {

        x = {
            "start_time": ele[0].start_time,
            "end_time": ele[ele.length - 1].end_time,
            "ohlc": {
                "o": ele[0].ohlc.o,
                "h": _.maxBy(ele, (tr) => parseFloat(tr.ohlc.h)).ohlc.h,
                "l": _.minBy(ele, (tr) => parseFloat(tr.ohlc.l)).ohlc.l,
                "c": ele[ele.length - 1].ohlc.c,
                "v": _.sumBy(ele, (tr) => parseFloat(tr.ohlc.v)),
            }
        };

        final_result.push(x);
    });
    return final_result;

}

const get_24h_last_price = async (symbol) => {

let yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
    let last_trade = await Trade.findOne({
        raw: true,
        where: {
            symbol,
            time: {
                [Op.lte]: yesterday,
            }
        }
    });

    if(last_trade)
    {
        return last_trade.at_price ;
    }
    
    let first_trade = await Trade.findOne({
        raw: true,
        where: {
            symbol,
            time: {
                [Op.gte]: yesterday,
            }
        }
    });

    return first_trade ? first_trade.at_price : 0 ;
    
}

const getPercentageChange = async (symbol ,current_price) => {
    let last_24hr_price = await get_24h_last_price(symbol);

    let price_change = CL.sub(current_price , last_24hr_price );
    let divisor = parseFloat(last_24hr_price) == 0 ? 1 : last_24hr_price ;
    let percentage_change = CL.div(price_change,divisor  ) ;
    percentage_change = CL.mul(percentage_change , 100 );
    return CL.round(percentage_change, -3);
}

const getListCoinCurrentPrice = async (symbol) => {
    let coin =  await ListCoin.findOne({
        where:{
            symbol
        }
    });

    return coin ? coin.current_price : 0 ;
}

const instantOhlc = async (symbol , interval='1m') => {
    let timestamps = TS.getTimeStamp(interval);

    let ALL_TRADES = await getAllTrades(symbol, timestamps.start_time, timestamps.end_time);
    let current_price = await getListCoinCurrentPrice(symbol);

    let per_change = await getPercentageChange(symbol,current_price);

    let ohlc = {};
    if(ALL_TRADES.length != 0)
    {
        ohlc = {
            o: _.minBy(ALL_TRADES, (tr) => parseFloat(tr.time)).at_price,
            h: _.maxBy(ALL_TRADES, (tr) => parseFloat(tr.at_price)).at_price,
            l: _.minBy(ALL_TRADES, (tr) => parseFloat(tr.at_price)).at_price,
            c: _.maxBy(ALL_TRADES, (tr) => parseFloat(tr.time)).at_price,
            v: _.sumBy(ALL_TRADES, (tr) => parseFloat(tr.quantity)),
            P: per_change
        }
    }

    return {
        start_time: timestamps.start_time,
        end_time: timestamps.end_time,
        ohlc
    } 
}
// console.time('START');
// getOHLC('TESTUSDT','5m');
// console.timeEnd('START');


export default {
    getOHLC,
    instantOhlc,
    get_24h_last_price,
    getPercentageChange
}

myEvents.on('SEND_OHLC_DATA' , async (symbol) => {
    let response = await instantOhlc(symbol);
    // console.log('EVENET',response);
    myEvents.emit("SEND_DATA", "kline", symbol, [response]);
})