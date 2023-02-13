import { Order } from "../Models/Order.js";
import Sequelize from "sequelize";
const { Op } = Sequelize;
import _ from "lodash";
import myEvents from "../RunnerEngine/Emitter.js";
import { CL } from "cal-time-stamper";


const get_ob_query = async ({ currency, with_currency }, order_type) => {
  return await Order.findAll({
    raw: true,
    where: {
      currency,
      with_currency,
      order_type,
      current_status: ["partially_completed", "placed"],
      b_orderid: {
        [Op.eq]: null
      }
    },
    attributes: ["at_price", "quantity", "pending_qty", "current_status"]
  });
}

const get_order_book = (type, order = 'asc', limit = 10) => {

  type = _.groupBy(type, (s) => '_' + parseFloat(s.at_price));

  let n_type = _.map(type, (value, key) => {
    let kk = key.slice(1);
    return [parseFloat(kk), value];
  });

  n_type = n_type.sort(function (a, b) {
    return order == 'asc' ? CL.sub(a[0], b[0]) : CL.sub(b[0], a[0]);
  });

  n_type = n_type.slice(0, limit);


  n_type = _.map(n_type, (el) => {

    let element = el[1];

    let sum = 0;

    element.forEach(ele => {
      let qty = ele.current_status == "placed" ? ele.quantity : ele.pending_qty;
      sum = CL.add(sum, qty);
    });

    el[1] = sum;
    return el;

  });

  return n_type;

}


// ============= CHANGED FIXED SUM BUGS BY JATIN (DIMPAL SIR) 06 AUGUST 2022 SATURDAY 08:24 pm ============
// const get_order_book = (type, order = 'asc' , limit = 10) => {

//     type =  _.groupBy(type, (s) => '_' + parseFloat(s.at_price));

//     type = _(type)
//     .toPairs()
//     .orderBy([0], [order])
//     .fromPairs()
//     .value();

//     type = Object.fromEntries(
//       Object.entries(type).slice(0, limit)
//     );

//     for (const key in type) {
//       if (Object.hasOwnProperty.call(type, key)) {
//         let element = type[key];

//         let sum = 0 ;

//         element.forEach(ele => {
//           let qty = ele.current_status == "placed" ? ele.quantity : ele.pending_qty ;
//           sum = CL.add(sum , qty );
//         });

//         type[key.slice(1)] = sum ;
//         delete type[key];
//       }
//     }

//     type = _.toPairs(type);

//     type = _.orderBy(type, (s) => parseFloat(s[0]), order);

//     return type;
// }

const getDepthOrderBook = async ({ currency, with_currency }, limit = 10, is_event = true) => {

  let asks = await get_ob_query({ currency, with_currency }, 'sell') || [];

  let bids = await get_ob_query({ currency, with_currency }, 'buy') || [];

  asks = get_order_book(asks, 'asc', limit);
  bids = get_order_book(bids, 'desc', limit);

  let depth = {
    lastUpdateId: Date.now(),
    asks,
    bids
  };

  if (is_event) {
    myEvents.emit('SEND_DATA', 'depth', currency + with_currency, depth);  // send depth data to socket
  }

  return depth;
}

myEvents.on("TRADE_EXECUTED", getDepthOrderBook);
myEvents.on("PLACE_ORDER_2", getDepthOrderBook);
myEvents.on("CANCEL_ORDER", getDepthOrderBook);

export default { get_ob_query, get_order_book, getDepthOrderBook }