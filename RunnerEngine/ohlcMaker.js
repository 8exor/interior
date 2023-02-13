import _ from 'lodash';
import { CL, TS } from 'cal-time-stamper';
   
/////////////////////////////////////////////////////////////////////
//                              OHLC                               //
/////////////////////////////////////////////////////////////////////

// Use It For Api
const timeData = (ALL_TRADES, symbol, interval = '1m', start_timestamp = null , end_timestamp = null) => {
    
    const limit = 1000;
    let o_data, n_data ;

    // GET DATA FROM ALL_TRADES Variable
    let finded = ALL_TRADES[symbol] || null;
    
    if(!finded)
    {
        return;
    }

    // ----------------------------------------------------

    let current_time = TS.getTimeStamp(interval);
    let { start_time , end_time , time_diff} = TS.getTimeStamp(interval , start_timestamp);

    let n_time_diff = CL.mul(time_diff + 1, limit);

    let starting_start = parseFloat(CL.sub(start_time, n_time_diff));

    // Adjust it later
    if(start_timestamp != null)
    {
        starting_start = start_timestamp ;
    }
    
    let start_timestamps =  TS.getTimeStamp(interval , starting_start);
    // console.log(start_timestamps);

    // Mached Currenct Data
    let c_data = finded.filter(td => start_timestamps.start_time <= td.start_time && start_timestamps.end_time >= td.end_time);
    // console.log('c_DATA',c_data);

    let tmp_array = [];
    let temp_obj = {};

    if(c_data.length != 0)
    {
        temp_obj['start_time'] = start_timestamps.start_time;
        temp_obj['end_time'] = start_timestamps.end_time;
        temp_obj['ohlc'] = calculateOHLC(c_data)
        
        tmp_array.push(temp_obj);
    }
    // console.log(temp_obj);

    if(tmp_array.length == 0)
    {
        o_data = _.findLast(finded , td => start_timestamps.start_time >= td.start_time);
        // console.log('O_DATA',o_data);

        if(o_data)
        {
            let new_timestamps =  TS.getTimeStamp(interval , o_data.start_time);
            // console.log(new_timestamps);
            let nc_data = finded.filter(td => new_timestamps.start_time <= td.start_time && new_timestamps.end_time >= td.end_time);
            // console.log('NC_DATA',nc_data);

            temp_obj['start_time'] = start_timestamps.start_time;
            temp_obj['end_time'] = start_timestamps.end_time;
            temp_obj['ohlc'] = calculateOHLC(nc_data)
            
            tmp_array.push(temp_obj);
        }
    }
    
    if(tmp_array.length == 0)
    {
        // get Newer
        n_data = finded.find(td => start_timestamps.start_time <= td.start_time);
        // console.log('N_DATA',n_data);

        if(n_data)
        {
            let timestamps2 =  TS.getTimeStamp(interval , n_data.start_time);
            // console.log(timestamps2);
            let nc_data = finded.filter(td => timestamps2.start_time <= td.start_time && timestamps2.end_time >= td.end_time);
            // console.log('NC_DATA',nc_data);

            temp_obj['start_time'] = timestamps2.start_time;
            temp_obj['end_time'] = timestamps2.end_time;
            temp_obj['ohlc'] = calculateOHLC(nc_data)
            
            tmp_array.push(temp_obj);
        }
    }

    for (let index = 0; index < limit ; index++) {
        let temp_obj2 = {};
        let new_timestamp = TS.getTimeStamp(interval , (temp_obj.end_time + 1));
        temp_obj2['start_time'] = new_timestamp.start_time;
        temp_obj2['end_time'] = new_timestamp.end_time;

        let new_data = finded.filter(td => new_timestamp.start_time <= td.start_time && new_timestamp.end_time >= td.end_time);
        
        temp_obj2['ohlc'] = (new_data.length == 0) ? constantOHLC(temp_obj.ohlc) : calculateOHLC(new_data);

        temp_obj = temp_obj2;

        if(temp_obj2.start_time > current_time.start_time)
        {
            break;
        }
        tmp_array.push(temp_obj2);
    }

    // console.log(tmp_array.length);
    // console.log(tmp_array);

    return tmp_array;
}

// Instant Response on Trade
const instantTimeData = (ALL_TRADES, symbol, interval = '1m') => {

    let o_data, n_data ;

    // GET DATA FROM ALL_TRADES Variable
    let finded = ALL_TRADES[symbol] || null;
    
    if(!finded)
    {
        return [];
    }

    
    let start_timestamps =  TS.getTimeStamp(interval);
    
    // Matched Current Data
    let c_data = finded.filter(td => start_timestamps.start_time <= td.start_time && start_timestamps.end_time >= td.end_time);
    // console.log('c_DATA',c_data);

    let tmp_array = [];
    let temp_obj = {};

    if(c_data.length != 0)
    {
        temp_obj['start_time'] = start_timestamps.start_time;
        temp_obj['end_time'] = start_timestamps.end_time;
        temp_obj['ohlc'] = calculateOHLC(c_data)
        
        tmp_array.push(temp_obj);
        // return if got here for single data
    }
    // console.log(temp_obj);

    if(tmp_array.length == 0)
    {
        o_data = _.findLast(finded , td => start_timestamps.start_time >= td.start_time);
       
        if(o_data)
        {
            let new_timestamps =  TS.getTimeStamp(interval , o_data.start_time);
            // console.log(new_timestamps);
            let nc_data = finded.filter(td => new_timestamps.start_time <= td.start_time && new_timestamps.end_time >= td.end_time);
            
            temp_obj['start_time'] = start_timestamps.start_time;
            temp_obj['end_time'] = start_timestamps.end_time;
            
            let ohlc_old = calculateOHLC(nc_data);

            // Add constant value of ohlc beacuse it is old data
            temp_obj['ohlc'] = constantOHLC(ohlc_old);
            
            tmp_array.push(temp_obj);
        }
    }
    
    if(tmp_array.length == 0)
    {
        // get Newer
        // n_data = finded.find(td => start_timestamps.start_time <= td.start_time);
       
        // if(n_data)
        // {
        //     let timestamps2 =  TS.getTimeStamp(interval , n_data.start_time);
          
        //     let nc_data = finded.filter(td => timestamps2.start_time <= td.start_time && timestamps2.end_time >= td.end_time);
        
        //     temp_obj['start_time'] = timestamps2.start_time;
        //     temp_obj['end_time'] = timestamps2.end_time;
        //     temp_obj['ohlc'] = calculateOHLC(nc_data);
            
        //     tmp_array.push(temp_obj);
        // }

        // donot return this in future
        temp_obj['start_time'] = start_timestamps.start_time;
        temp_obj['end_time'] = start_timestamps.end_time;
        temp_obj['ohlc'] = constantOHLC({c: '1'});  // return with initial price
        tmp_array.push(temp_obj);
    }


    // console.log(tmp_array.length);
    // console.log(tmp_array);

    return tmp_array;

}

// Getting 24Hr Last Price

/////////////////////////////////////////////////////////////////

const calculateOHLC = (time_data_array) => {

    let ohlc = {};
    let combined_data_array = [];
    
    time_data_array.forEach(element => {
        combined_data_array = combined_data_array.concat(element.data);
    });

    // combined_data_array.map(el => {
    //     el['at_price'] = parseFloat(el.at_price); 
    //     return el;
    // });
    let v = 0 ;
    combined_data_array.forEach(el => {
        el['at_price'] = parseFloat(el.at_price); 
        v = parseFloat(CL.add(v , el.quantity));
    });
    
    ohlc = {
        o: _.minBy(combined_data_array, 'time').price,
        h: _.maxBy(combined_data_array, 'at_price').price,
        l: _.minBy(combined_data_array, 'at_price').price,
        c: _.maxBy(combined_data_array, 'time').price,
        v
    }

   return ohlc;
}


const constantOHLC = (ohlc) => ({
    o: ohlc.c,
    h: ohlc.c,
    l: ohlc.c,
    c: ohlc.c,
    v: "0"
});


export default { timeData, instantTimeData };