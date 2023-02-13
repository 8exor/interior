import Helper from "../Common/Helper.js";
import reply from "../Common/reply.js";
import Sequelize from "sequelize";
import Validator from "validatorjs";
import fetch from "node-fetch";
import { Order } from "../Models/Order.js";
import { UserCrypto } from "./../Models/UserCrypto.js";
import { ListCoin } from "./../Models/ListCoin.js";
import { ListCrypto } from "./../Models/ListCrypto.js";
import _ from "lodash";
import { User } from "./../Models/User.js";
import { Trade } from "./../Models/Trade.js";
import crypto from "crypto";
import { GFunction } from "../Globals/GFunction.js";
import myEvents from "../RunnerEngine/Emitter.js";
import { GClass } from "../Globals/GClass.js";
import BinanceListner from "../EventsHandler/handleEvents.js";
import Nohlc from "../RunnerEngine/Nohlc.js";
import OrderMatching from "../RunnerEngine/OrderMatching.js";
import { Spot } from "@binance/connector";
import { Liquidity } from "../Models/Liquidity.js";
import OrderBookHelper from "../Common/OrderBookHelper.js";
import { Ledger_Log_Events, TransactionType } from './../Common/AllEvents.js';
import { Commission } from "../Models/Commission.js";
import { BinanceTrade } from "../Models/BinanceTrade.js";
import { CL } from "cal-time-stamper";


const { Op } = Sequelize;
const INITIAL_PRICE_API =
  "3t6w9z$CLF)J@NcRfUjWnZr4u7x!ABD*G-KaPdSgVkYp2s5v8y/B?E(HLMbQeThW";

//=========BITQIX BINANCE CLIENT CREDENTIALS ==============

const apiKey = "WuaqG0p3IoWppEJ2rRS7N1LaRPwRZX57Eoxh93DXLTAF82X6TpDBP3OZx5ZHwkvx";
const apiSecret = "TgrLTpgOo8p4mn2uGe0nphEfVfX37FCJA8pkGtPwpjG59CPIHNXcG7Uosl0rNQuS";

const client = new Spot(apiKey, apiSecret);

//======================================================

const ORDER_STATUS = {
  placed: "placed",
  completed: "completed",
  partially: "partially_completed",
  canceled: "canceled",
};

const ORDER_TYPE = {
  limit: "limit",
  market: "market",
  stopLimit: "stop_limit",
};

//  ========================================================================//
//  =======================      OTHER FUNCTIONS    ========================//
//  ========================================================================//

function firstError(validation) {
  let first_key = Object.keys(validation.errors.errors)[0];
  return validation.errors.first(first_key);
}

function validatePlaceOrder(list_crypto, list_coin, orderType, qty) {
  if (list_crypto) {
    if (!list_crypto.active_status) {
      return reply.failed("This Pair is not active at this time.");
    }

    if (orderType == "buy") {
      if (!list_crypto.buy) {
        return reply.failed((list_crypto.buy_desc).length == 0 ? "Unable to Trade On It." : list_crypto.buy_desc);
      }

      if (list_crypto.buy_min > qty) {
        return reply.failed(
          list_crypto.buy_min_desc
        );
      }

      if (list_crypto.buy_max < qty) {
        return reply.failed(
          list_crypto.buy_max_desc
        );
      }
    } else {
      if (!list_crypto.sell) {
        return reply.failed((list_crypto.sell_desc).length == 0 ? "Unable to Trade On It." : list_crypto.sell_desc);
      }

      if (list_crypto.sell_min > qty) {
        return reply.failed(
          list_crypto.sell_min_desc
        );
      }

      if (list_crypto.sell_max < qty) {
        return reply.failed(
          list_crypto.sell_max_desc
        );
      }
    }
  } else {
    if (!list_coin.active_status) {
      return reply.failed("This Pair is not active at this time.");
    }

    if (orderType == "buy") {
      if (!list_coin.buy) {
        return reply.failed((list_coin.buy_desc).length == 0 ? "Unable to Trade On It." : list_coin.buy_desc);
      }

      if (list_coin.buy_min > qty) {
        return reply.failed(
          list_coin.buy_min_desc
        );
      }

      if (list_coin.buy_max < qty) {
        return reply.failed(
          list_coin.buy_max_desc
        );
      }
    } else {
      if (!list_coin.sell) {
        return reply.failed((list_coin.sell_desc).length == 0 ? "Unable to Trade On It." : list_coin.sell_desc);
      }

      if (list_coin.sell_min > qty) {
        return reply.failed(
          list_coin.sell_min_desc
        );
      }

      if (list_coin.sell_max < qty) {
        return reply.failed(
          list_coin.sell_max_desc
        );
      }
    }
  }

  return reply.success("validated success.");
}


function retr_dec(num) {
  return (num.split('.')[1] || []).length;
}

function f_rand(min = 0, max = 1) {

  let minlenght = min.includes(".") ? retr_dec(min) : 0;
  let maxlenght = max.includes(".") ? retr_dec(max) : 0;

  let max_decimal = _.gt(parseFloat(minlenght), parseFloat(maxlenght)) ? minlenght : maxlenght;

  let random = _.random(min, max);

  return _.round(random, max_decimal);

}

// UpdateOrderTableStatus
async function UpdateOrderTableStatus(order_id, status) {
  let result = await Order.update(
    { current_status: status },
    {
      where: {
        id: order_id,
      },
    }
  );

  return result;
}

//  ========================================================================//
//  =======================    EXPORT FUNCTIONS     ========================//
//  ========================================================================//

const place_Order = async (req, res) => {
  var request = req.body;

  let validation = new Validator(request, {
    at_price: "required|numeric|min:0.0000000001",
    currency: "required",
    quantity: "required|numeric|not_in:0",
    with_currency: "required|different:currency",
    total: "required|numeric|not_in:0",
    order_type: "required|in:buy,sell",
    type: "required|in:market,limit,stop_limit",
    stop_price: "required_if:type,stop_limit",
  });

  if (validation.fails()) {
    return res.json(reply.failed(firstError(validation)));
  }

  request["quantity"] = parseFloat(request["quantity"]); // Remove extra zeros

  //======================== Validation MIN , MAX , ACTIVE =============================//
  let [list_crypto, list_coin] = await Promise.all([
    ListCrypto.findOne({
      where: {
        currency: request["currency"],
        pair_with: request["with_currency"],
      },
    }),
    ListCoin.findOne({
      where: {
        currency: request["currency"],
        pair_with: request["with_currency"],
      },
    }),
  ]);

  // Calling Validate Place Order method
  let validatedOrder = validatePlaceOrder(
    list_crypto,
    list_coin,
    request["order_type"],
    request["quantity"]
  );

  if (validatedOrder.status_code == "0") {
    return res.json(reply.failed(validatedOrder.message));
  }
  //======================== Validation MIN , MAX , ACTIVE =============================//

  // Add User Id in request
  request["user_id"] = req.user.id;
  const order_type = request["order_type"];
  var ordered_currency =
    order_type == "buy" ? request["with_currency"] : request["currency"];

  // Validation for Stop Limit Type
  if (request["type"] == ORDER_TYPE.stopLimit) {
    if (
      order_type == "buy" &&
      !(parseFloat(request["at_price"]) >= parseFloat(request["stop_price"]))
    ) {
      return res.json(
        reply.failed("Trigger Price must be less than At Price")
      );
    }

    if (
      order_type == "sell" &&
      !(parseFloat(request["at_price"]) <= parseFloat(request["stop_price"]))
    ) {
      return res.json(
        reply.failed("Trigger Price must be greater than At Price")
      );
    }
  }

  // Check If User Has Crypto
  const check_crypto = await UserCrypto.findOne({
    where: {
      user_id: request["user_id"],
      currency: ordered_currency,
    },
  });

  // If User Dont have Ordered Currency
  if (!check_crypto) {
    return res.json(reply.failed("Insufficient Funds"));
  }

  // Calculate Total
  let total = CL.mul(
    request.at_price,
    request.quantity
  );
  request["total"] = total;

  // URGENT WORK WE WILL CHANGE IT 
  let liquidity = null;
  let lessthan = order_type == "buy" ? total : request['quantity'];
  if (req.user.id == 1 && list_coin) {
    // ordered_currency
    var liquidity_currency =
      order_type == "buy" ? request["currency"] + request["with_currency"] : request["currency"] + "SELF";

    liquidity = await Liquidity.findOne({
      where: {
        symbol: liquidity_currency
      },
    });


    if (!liquidity) {
      return res.json(reply.failed("Liquidity is Not Provided."));
    } else {

      if (_.lt(parseFloat(liquidity.available), parseFloat(lessthan))) {
        return res.json(reply.failed('Liquidity Too Low.'));
      }
    }


  }


  // For Market Type  **May Be Match Order While Placing
  if (request["type"] == ORDER_TYPE.market) {
    let orderBy = order_type == "sell" ? "ASC" : "DESC";
    let order_type_2 = order_type == "sell" ? "asks" : "bids";

    // const m_p = await OrderBookSide(order_type, 1, orderBy)
    const m_p = [];

    if (m_p.length == 0) {
      const requesting = await fetch(
        GClass.getDepthApi(request["currency"] + request["with_currency"])
      );
      const response = await requesting.json();
      request["at_price"] = response[order_type_2][0][0];
    } else {
      request["at_price"] = m_p[0]["p"];
    }
  }



  if (request["with_currency"] != "USDT") {
    let cp = await GFunction.getSymbolPrice(request["with_currency"], true);
    total = CL.mul(total, cp.price);
  }

  // Add Minimum Order Value Check here
  // let min_value = CL.sub(total, minimum_order_total);

  // if (Number(min_value) < 0) {
  //     return res.json(reply.failed(`Minimum ${order_type} amount is ${minimum_order_total}`));
  // }

  // If User Dont have Sufficient Funds
  let freezed = order_type == "buy" ? request["total"] : request.quantity;

  let decision = CL.sub(
    parseFloat(check_crypto.balance),
    freezed
  );

  if (Number(decision) < 0) {
    return res.json(reply.failed("Insufficient Balance"));
  }

  // For Stop Limit Type ** Works on it Later
  if (request["type"] == ORDER_TYPE.stopLimit) {
  }

  // FOR LIMIT TYPE ORDER

  // **Calculate Commion in future

  // Update User Crypto
  const new_balance = CL.sub(
    parseFloat(check_crypto.balance),
    freezed
  );

  const new_freezed_balance = CL.add(
    parseFloat(check_crypto.freezed_balance) || 0,
    freezed
  );

  /****************************************** Implement Binance placeOrder  Logic *************************************************/

  var checkCurrency = {
    pair_with: request["with_currency"],
    currency: request["currency"],
  };
  request["order_type"] == "sell"
    ? (checkCurrency.sell = true)
    : (checkCurrency.buy = true);

  const BinanceListedCoin = await ListCrypto.findOne({
    where: checkCurrency,
  });

  if (BinanceListedCoin) {
    const symbol = (
      request["currency"] + request["with_currency"]
    ).toUpperCase();
    const side = request["order_type"].toUpperCase(); // new code added
    const quantity = request["quantity"];
    const price = request["at_price"];
    let type = request["type"].toUpperCase();
    var options = { price: price, quantity: quantity, timeInForce: "GTC" };
    if (type == "STOP_LIMIT") {
      type = "TAKE_PROFIT_LIMIT";
      options.stopPrice = request["stop_price"];
    }

    var deleteOrder = null;
    // // CREATE ORDER
    try {
      request["new_client_order_id"] = options["newClientOrderId"] = crypto
        .randomBytes(10)
        .toString("hex");

      const order = (deleteOrder = await Order.create(request));
      var response = await client.newOrder(symbol, side, type, options);
      // console.log("rahuk", response);
      request["b_orderid"] = response.data.orderId;
      request["extra"] = JSON.stringify(response.data);
      order.b_orderid = response.data.orderId;
      order.extra = JSON.stringify(response.data);
      order.save();

      // -- Updating in Database
      check_crypto.balance = new_balance;
      check_crypto.freezed_balance = new_freezed_balance;
      check_crypto.save();

      // Raman S
      myEvents.emit(Ledger_Log_Events.freeze_balance, {
        user_id: request["user_id"],
        currency: request["currency"],
        transaction_type: TransactionType.order,
        attached_id: response?.data?.id || request["new_client_order_id"],
        amount: request['order_type'] == 'sell' ? request['quantity'] : total,
        comment: `${request['order_type'].toUpperCase()} Order Placed For ${symbol} On Binance`,
        symbol: request["currency"] + request["with_currency"]
      });
      // Raman E

      myEvents.emit("SEND_ORDER_UPDATE", req.user.referral_code, {
        update: true,
      });
      return res.json(reply.success("Order Placed Successfully", request));
    } catch (error) {
      if (deleteOrder?.id) {
        await Order.destroy({
          where: {
            id: deleteOrder.id,
          },
        });
      }
      console.log(error);
      // new code added
      if (error.response.data.code == "-1013") {
        return res.json(reply.failed("Amount should be greater than $10. !!!!"));
      }
      if (error.response.data.code == "-2010") {
        return res.json(
          reply.failed("Account has insufficient balance !!!!")
        );
      }
      return res.json(reply.failed(error.response.data.msg));
    }
    /****************************************** End Binance placeOrder  Logic *************************************************/
  } else {
    const ExchangesListedCoin = await ListCoin.findOne({
      where: checkCurrency,
    });
    if (!ExchangesListedCoin)
      return res.json(
        reply.failed(
          request["order_type"] +
          " is Disabled for " +
          (request["currency"] + request["with_currency"]).toUpperCase()
        )
      );



    var coin_live_price = ExchangesListedCoin.current_price;

    let variance = CL.div(CL.mul(coin_live_price, 20), 100);

    let min_value = CL.sub(coin_live_price, variance);
    let maxvalue = CL.add(coin_live_price, variance);

    var checkLimit = _.inRange(request["at_price"], min_value, maxvalue);
    if (!checkLimit) {
      return res.json(
        reply.failed(
          "order at price should be between " + min_value + " and " + maxvalue
        )
      );
    }

    /*********************** coin Listed on our exchange **************************/
    /*********************** coin Listed on our exchange **************************/

    // -- Updating in Database
    // console.log({new_balance:new_balance, new_freezed_balance:new_freezed_balance });

    check_crypto.balance = new_balance;
    check_crypto.freezed_balance = new_freezed_balance;
    check_crypto.save();

    let order;
    // CREATE ORDER
    try {
      order = await Order.create(request);

      // Decrease Liquidity
      if (req.user.id == 1 && liquidity) {
        liquidity.available = CL.sub(liquidity.available, lessthan);
        liquidity.save();
      }

      // Raman S
      myEvents.emit(Ledger_Log_Events.freeze_balance, {
        user_id: request["user_id"],
        currency: request['order_type'] == 'buy' ? request["with_currency"] : request["currency"],
        transaction_type: TransactionType.order,
        attached_id: order?.id,
        amount: request['order_type'] == 'sell' ? request['quantity'] : total,
        comment: `${request['order_type'].toUpperCase()} Order Placed For ${request["currency"] + request["with_currency"]}`,
        symbol: request["currency"] + request["with_currency"]
      });
      // Raman E


      myEvents.emit("PLACE_ORDER_2", order);
      // Send Order Update To User
      myEvents.emit("SEND_ORDER_UPDATE", req.user.referral_code, {
        update: true,
      });

      return res.json(reply.success("Order Placed Successfully"));
    } catch (error) {
      if (order) {
        Order.destroy({
          where: {
            id: order.id,
          },
        });
      }
      console.log(error);
    }
  }
}



export default {
  async get(req, res) {
    if (
      !req.query.type ||
      (req.query.type != "remaining" && req.query.type != "completed" && req.query.type != "all")
    ) {
      return res.json(reply.failed("Invalid Type"));
    }

    var current_status_query =
      req.query.type == "remaining"
        ? ["placed", "partially_completed"]
        : ["completed", "canceled"];


      if(req.query.type == "all"){
        current_status_query = ["placed", "partially_completed","completed", "canceled"];
      }
     

    // Adding Pagination And Order By
    const pagination = Helper.getPaginate(req, "id");

    // Serach Queries
    const query = {
      where: {
        current_status: {
          [Op.or]: current_status_query,
        },
        user_id: req.user.id, // Request User
      },
    };

    const finalQuery = Object.assign(query, pagination);

    var total_count = await Order.count(query);

    var result = await Order.findAll(finalQuery);
    result = reply.paginate(
      pagination.page,
      result,
      pagination.limit,
      total_count
    );

    return res.json(reply.success("Orders fetched Successfully", result));
  },


  async getOldOrderBook(req, res) {
    var request = req.query;

    let validation = new Validator(request, {
      currency: "required",
      with_currency: "required|different:currency",
      limit: "numeric",
    });

    if (validation.fails()) {
      return res.json(reply.failed(firstError(validation)));
    }

    let limit = request["limit"] ?? 10;

    let depth = await OrderBookHelper.getDepthOrderBook(request, limit, false);

    return res.json(reply.success("Order Book fetched Successfully", depth));
  },

  async getTrades(req, res) {
    let currency = req.query.currency;
    let with_currency = req.query.with_currency;
    let limit = req.query.limit || 10;

    let trades = await Trade.findAll({
      attributes: [
        ["time", "T"],
        "e",
        "m",
        "at_price",
        "p",
        ["quantity", "q"],
        ["symbol", "s"],
        ["tid", "t"],
        "last_price",
      ],
      where: {
        symbol: currency + with_currency,
      },
      limit: limit,
      order: [["id", "DESC"]],
    });

    return res.json(reply.success("Trades fetched Successfully", trades));
  },

  place_Order,

  async getOHLC(req, res) {
    let symbol = req.query.symbol || "TESTUSDT";
    let interval = req.query.interval || "1m";
    let start_timestamp = req.query.start_timestamp || null;

    let result = await Nohlc.getOHLC(symbol, interval);

    return res.json(reply.success("OHLC fetched Successfully", result));
  },

  async set_initial_price(req, res) {
    let API_KEY = req.query.API_KEY || null;

    if (API_KEY == null) {
      return res.json({
        status_code: "0",
        message: "Unauthorized !!",
        data: "Access Denied !!!",
      });
    }

    if (API_KEY != INITIAL_PRICE_API) {
      return res.json({
        status_code: "0",
        message: "Unauthorized !!",
        data: "Access Denied !!!",
      });
    }

    var request = req.body;

    let validation = new Validator(request, {
      at_price: "required|numeric|min:0.0000000001",
      currency: "required",
      with_currency: "required|different:currency",
    });

    if (validation.fails()) {
      return res.json(reply.failed(firstError(validation)));
    }

    let initial = await Trade.findOne({
      where: {
        symbol: req.body.currency + req.body.with_currency,
      },
      order: [["time", "ASC"]],
    });

    if (initial) {
      return res.json(reply.failed("Initial Price Already Set!"));
    }

    // { currency, symbol, at_price, quantity, order_type, tid , time , sell_order_id , buy_order_id }
    let object = {
      currency: req.body.currency,
      with_currency: req.body.with_currency,
      at_price: req.body.at_price,
      quantity: "1",
      sell_order_id: "1",
      buy_order_id: "1",
    };

    myEvents.emit("INITIAL_TRADE", object);
    return res.json(reply.success("Initial Price Set Successfully"));
  },

  // Binance cancel order
  // async cancelOrder(req, res) {

  //     if (req.query.referral_code != '') {
  //         myEvents.emit('SEND_ORDER_UPDATE', req.query.referral_code, { update: true });
  //     }

  //     res.send('Done');
  // },
  async cancelOrder(req, res) {
    if (isNaN(req.params.order_id))
      return res.json(reply.failed("Invalid Order Id"));

    // check if order exist or not
    const order_details = await Order.findOne({
      where: {
        id: req.params.order_id,
        user_id: req.user.id,
      },
    });
    if (!order_details) {
      return res.json(reply.failed("Order Doesn`t Exist"));
    }

    //   if the order is already completed...
    if (
      order_details.current_status == ORDER_STATUS.completed ||
      order_details.current_status == ORDER_STATUS.canceled
    )
      return res.json(
        reply.failed("Your order is already " + order_details.current_status)
      );

    // Check Order Of Binance
    const binance_order_id = order_details.b_orderid || null;
    if (binance_order_id) {
      try {
        const symbol = order_details.currency + order_details.with_currency;
        let cancelOrder = await client.cancelOrder(symbol, {
          orderId: binance_order_id,
        });
        console.log("cancelOrder", cancelOrder);
      } catch (error) {
        return res.json(reply.failed(error.message));
      }
    }
    //  amount of the cancel order..
    let amount =
      order_details.order_type == "buy"
        ? CL.mul(
          order_details.quantity,
          order_details.at_price
        )
        : order_details.quantity;
    // pending for partially completed
    // ###################################### pending ///////////////////////////////////////
    if (
      order_details.current_status == ORDER_STATUS.partially &&
      parseFloat(order_details.pending_qty) != 0
    ) {
      // # pending amount of the cancel order..
      amount =
        order_details.order_type == "buy"
          ? CL.mul(
            order_details.pending_qty,
            order_details.at_price
          )
          : order_details.pending_qty;
    }

    // # update the order details and create the order status.......

    await UpdateOrderTableStatus(order_details.id, ORDER_STATUS.canceled);

    // # currency of the canceling order..
    let currency =
      order_details.order_type == "buy"
        ? order_details.with_currency
        : order_details.currency;


    // Raman S
    myEvents.emit(Ledger_Log_Events.cancel_freeze_balance, {
      user_id: req.user.id,
      currency: currency,
      transaction_type: TransactionType.order,
      attached_id: order_details.id,
      amount: amount,
      comment: `Order Canceled For ${order_details["currency"] + order_details["with_currency"]} having ID ${order_details.id}`,
      symbol: order_details["currency"] + order_details["with_currency"]
    });
    // Raman E

    // # Getting the freezed balance of the order.

    let freezed_crypto = await UserCrypto.findOne({
      where: {
        user_id: req.user.id,
        currency: currency,
      },
    });
    let freezed_balance = freezed_crypto.freezed_balance;
    // console.log({ freezed_balance, amount });
    // # Remainning freezed balnce after canceled the current order.
    let remaining_freezed_balance = _.gt(
      parseFloat(amount),
      parseFloat(freezed_balance)
    )
      ? CL.sub(amount, freezed_balance)
      : CL.sub(freezed_balance, amount);

    // // # Update the freezed balance.
    freezed_crypto.freezed_balance = remaining_freezed_balance;
    freezed_crypto.balance = CL.add(
      freezed_crypto.balance,
      amount
    );
    freezed_crypto.save();

    myEvents.emit("CANCEL_ORDER", {
      at_price: order_details.at_price,
      quantity:
        order_details.pending_qty != 0
          ? order_details.pending_qty
          : order_details.quantity,
      currency: order_details.currency,
      with_currency: order_details.with_currency,
      order_type: order_details.order_type,
      order_id: order_details.id
    });
    myEvents.emit("SEND_ORDER_UPDATE", req.user.referral_code, {
      update: true,
    });

    return res.json(reply.success("Order Canceled Successfully."));
  },

  /*********************** Admin Order Info For Pump and Dump *************************/

  async admin_order_info(req, res) {
    var request = req.body;
    let validation = new Validator(request, {
      currency: "required",
      pair_with: "required|different:currency",
      current_price: "required|numeric|not_in:0",
      pump_dump_price: "required|numeric|not_in:0",
      type: "required|in:UP,DOWN",
    });

    if (validation.fails()) {
      return res.json(reply.failed(firstError(validation)));
    }
    const type = request["type"].toUpperCase();
    const currency = request["currency"].toUpperCase();
    const pair_with = request["pair_with"].toUpperCase();
    const current_price = parseFloat(request["current_price"]);
    const pump_dump_price = parseFloat(request["pump_dump_price"]);

    let whereCondition = {
      order_type: type == "UP" ? "sell" : "buy",

      currency: currency,
      with_currency: pair_with,
      current_status: ["partially_completed", "placed"],
      // user_id :{
      //     // [Op.not] : req.user.id
      // },
      at_price:
        type == "UP"
          ? {
            [Op.gte]: current_price,
            [Op.lte]: pump_dump_price,
          }
          : {
            [Op.lte]: current_price,
            [Op.gte]: pump_dump_price,
          },
    };

    if (type == "UP")
      if (current_price > pump_dump_price)
        return res.json(
          reply.failed("at_price must be less then PUMP & DUMP price")
        );
    if (type == "DOWN")
      if (current_price < pump_dump_price)
        return res.json(
          reply.failed("PUMP & DUMP price must be less then at price")
        );

    let orders = await Order.findAll({ where: whereCondition });

    let total_quantity = 0;

    if (orders) {

      orders.map(orderItem => {

        let latest_qty = 0;

        if (orderItem.current_status == "partially_completed") {
          latest_qty = orderItem.pending_qty;
        } else {
          latest_qty = orderItem.quantity;
        }

        total_quantity = CL.add(total_quantity, latest_qty);

      });

    }


    let user_currency = type == "UP" ? pair_with : currency;
    let user_crypto = await UserCrypto.findOne({
      where: {
        user_id: req.user.id,
        currency: user_currency,
      },
    });



    let result = {
      orders,
      total_quantity: total_quantity,
      user_crypto: user_crypto == null ? 0 : user_crypto.dataValues.balance,
      user_currency,
    };
    return res.json(
      reply.success("total Quantity fatched successfully", result)
    );
  },


  //  Bulk Order Created

  async bulk_orders(req, res) {

    var request = req.body;

    let validation = new Validator(request, {
      'total_orders': 'required|numeric|max:1000|min:1',
      'currency': 'required',
      'amount_type': 'required|in:exact,range',
      'min': 'required|numeric',
      'max': 'required_if:amount_type,range|numeric',  // gt:min
      'qty_type': 'required|in:exact,range',
      'qty_min': 'required|numeric',
      'qty_max': 'required_if:qty_type,range|numeric',   // gt:qty_min
      'with_currency': 'required|different:currency',
      'order_type': 'required|in:buy,sell',
    });

    if (validation.fails()) {
      return res.json(reply.failed(firstError(validation)));
    }

    // Validator is not providing #### gt:min & gt:qty_min ###  validation so i have used custom condition.
    if (request['amount_type'] == "range") {

      if (request['max'] < request['min']) {
        return res.json(reply.failed("The max field should be greater than min if amount type is range."));
      }

    }

    if (request['qty_type'] == "range") {

      if (request['qty_max'] < request['qty_min']) {
        return res.json(reply.failed("The qty max field should be greater than qty min if qty type is range."));
      }
    }

    let ress = await bulk_order_loop(request);

    return res.json(
      ress ? reply.failed(ress) :
        reply.success("Bulk Order Created Successfully", ress)
    );

  },



  async getOrderData(req, res) {
    if (!req.query.id) {
      return res.json(reply.failed("Invalid Data"));
    }

    let order_data = await Order.findOne({
      where: {
        id: req.query.id,
        user_id: req.user.id
      }
    });

    if (!order_data) {
      return res.json(reply.failed("No Order Data Fetched"));
    }


    let b_trade_data = [];
    let trade_data = [];
    let commission_data = [];
    if (order_data.b_orderid) {
      b_trade_data = await BinanceTrade.findAll({
        where:
        {
          'order_id': req.query.id,
        },
        attributes: ['id', 'symbol', 'at_price', 'quantity', 'created_at']
      });
    }
    else {

      let field = order_data.order_type == 'buy' ? 'buy_order_id' : 'sell_order_id';
      trade_data = await Trade.findAll({
        where:
        {
          [field]: req.query.id,
        },
        attributes: ['id', 'symbol', 'at_price', 'quantity', 'created_at']
      });

    }

    commission_data = await Commission.findAll({
      raw: true,
      where:
      {
        attached_id: req.query.id,
        commission_type: 'order'
      },
      attributes: ['id', 'attached_id', 'commission']
    });

    let data = (order_data.b_orderid) ? b_trade_data : trade_data;

    data = data.map((obj, index) => {
      obj = Object.assign(obj.dataValues, { commission: commission_data[index]?.commission ?? 0 });
      return obj;
    });

    return res.json(reply.success("Trade Orders fetched Successfully", { order_data, data }));

  }

};

//====================================================================//
//=========  Event Subscribe For Binance Account   ===================//
//====================================================================//


async function bulk_order_loop(request, index = 0) {

  if (request['total_orders'] == index) {
    return 'Placed Successfully';
  }
  request['at_price'] = (request['amount_type'] == 'range') ? f_rand(request['min'], request['max']) : request['min'];
  request['quantity'] = (request['qty_type'] == 'range') ? f_rand(request['qty_min'], request['qty_max']) : request['qty_min'];

  let record = {
    'user_id': '1',
    'currency': request['currency'],
    'with_currency': request['with_currency'],
    'at_price': request['at_price'],
    'quantity': request['quantity'],
    'total': CL.mul(request['quantity'], request['at_price']),
    'order_type': request['order_type'],
    'type': 'limit',
    'current_status': 'placed',
  };

  let order_response = await new Promise(resolve => place_Order({ body: record, user: { id: 1 } }, { json: resolve }));

  if (order_response.status_code == '1') {
    await bulk_order_loop(request, index + 1);
  } else {
    return order_response.message;
  }

}

async function orderStatusEvent(data) {
  var data = JSON.parse(data);
  console.log({ data });

  if (data.e == "executionReport" && (data.X == "FILLED" || data.X == "PARTIALLY_FILLED")) {

    const order_detail = await Order.findOne({
      where: {
        new_client_order_id: data.c,
        current_status: {
          [Op.not]: ORDER_STATUS.completed
        }
      },
    });
    if (order_detail) {
      let order_type = data.S.toLowerCase();
      let order_id = order_detail.id;
      let with_currency = order_detail.with_currency;
      let at_price = with_currency == "INR" ? order_detail.at_price : data.p;
      let quantity = data.l; // for completed quantity  ===== data.q ====> for total quantity
      let currency = order_detail.currency;

      let match_price = at_price;
      if (parseFloat(order_detail.at_price) != parseFloat(data.L) && with_currency != "INR") {
        match_price = parseFloat(data.L);
      }

      let addDeductArray = {
        order_type,
        tid: data.c,
        at_price,
        match_price: match_price,
        quantity,
        currency,
        with_currency,
        c_order_id: order_id
      };

      //inserting binance trade 
      let binanceData = {
        currency,
        with_currency,
        order_id,
        order_type,
        symbol: currency + with_currency,
        at_price: match_price,
        quantity,
        tid: crypto.randomBytes(10).toString("hex"),
        time: data.O
      };

      await BinanceTrade.create(binanceData);


      if (order_type == "buy") {
        addDeductArray.buyer_id = order_detail.user_id;
        OrderMatching.addDeductCryptosBuyer(addDeductArray);
      } else {
        addDeductArray.seller_id = order_detail.user_id;
        OrderMatching.addDeductCryptoSeller(addDeductArray);
      }
      order_detail.pending_qty = order_detail.pending_qty == 0 ? CL.sub(data.q, data.l) : CL.sub(order_detail.pending_qty, data.l);
      order_detail.pending_qty = CL.sub(data.q, data.l);
      order_detail.current_status = (data.X == "PARTIALLY_FILLED") ? ORDER_STATUS.partially : ORDER_STATUS.completed;
      order_detail.save();

      /// for update Event
      const user_info = await User.findOne({
        where: {
          id: order_detail.user_id,
        },
      });
      myEvents.emit("SEND_ORDER_UPDATE", user_info.referral_code, {
        update: true,
      });
    }

  }

}

// let listen_key = "";
// BinanceListner.generateListenKey(client, orderStatusEvent, function (l_key) {
//   listen_key = l_key;
// });


// setInterval(binanceEventUpdate, 100800); // 28 min

// function binanceEventUpdate() {
//   console.log("rahullllll")
//   client.renewListenKey(listen_key);
// }
