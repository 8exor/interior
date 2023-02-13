import myEvents from "./Emitter.js";
import _ from 'lodash';
import Sequelize from 'sequelize';
const { Op } = Sequelize;

import { Order } from "../Models/Order.js";
import crypto from "crypto";
import { GFunction } from "../Globals/GFunction.js";
import { UserCrypto } from "../Models/UserCrypto.js";
import { GClass } from "../Globals/GClass.js";
import { User } from "../Models/User.js";
import DeductCommission from "./Commission.js";
import { Ledger_Log_Events, TransactionType } from "../Common/AllEvents.js";
import { CL } from "cal-time-stamper";


const ORDER_STATUS = {
    placed: 'placed',
    completed: 'completed',
    partially: 'partially_completed',
    canceled: 'canceled'
}

let statuses = {
    [Op.or]: [ORDER_STATUS.placed, ORDER_STATUS.partially]
};

// GET All Orders
const getAllOrders = async (order_price, order_type, currency, with_currency, order_user_id) => {

    let sort_by = (order_type == 'sell') ? 'DESC' : 'ASC';

    // If Sell find buyer less than equal OR if sell find buyer Greater Than or Equal 
    let at_price = (order_type == 'sell') ? { [Op.lte]: order_price } : { [Op.gte]: order_price };


    let whereCondition = {
        current_status: statuses,
        order_type,
        at_price,
        currency,
        with_currency
    };

    // NOT ADMIN ID
    if (order_user_id != '1') {
        whereCondition['user_id'] = { [Op.ne]: order_user_id };
    }
    // console.log('wherr', whereCondition);

    let result = await Order.findAll({
        where: whereCondition,
        order: [
            ['at_price', sort_by],
        ]
    });

    return result;
}

// console.log('testing', await getAllOrders("6", "sell", "ABCD", "USDT", "2"));


const matchOrder = async (order) => {

    //symbol
    let symbol = order.currency + order.with_currency;
    // Get Order Type 
    let is_buy = order.order_type == 'buy';
    let f_order_type = is_buy ? 'sell' : 'buy';

    // If Buy Order
    if (is_buy) {
        let buyer_qty = order.quantity;

        //  Get All Sellers having status placed or partially completed
        let sellers = await getAllOrders(order.at_price, f_order_type, order.currency, order.with_currency, order.user_id);
        sellers = _.orderBy(sellers, (s) => parseFloat(s.at_price), ['asc']);

        await customSellerLoop(symbol, sellers, order, buyer_qty);

    } else {
        let seller_qty = order.quantity;  // 100 qty

        // Get All Buyers having status placed or partially completed
        let buyers = await getAllOrders(order.at_price, f_order_type, order.currency, order.with_currency, order.user_id);
        buyers = _.orderBy(buyers, (b) => parseFloat(b.at_price), ['desc']);

        await customBuyerLoop(symbol, buyers, order, seller_qty);

    }

}

const addDeductCryptosBuyer = async ({ buyer_id, match_price, at_price, quantity, currency, with_currency, c_order_id = null }) => {

    let sym = currency + with_currency; // Raman S 
    //console.log('Buyer Add Deduct' , {buyer_id ,match_price, at_price , quantity , currency , with_currency});
    let deduct_qty = CL.mul(at_price, quantity);
    let gain_qty = quantity;

    // Deduct commission 
    let re = await DeductCommission.CalculateCommission({ currency, with_currency, order_type: "buy", at_price: match_price, quantity, c_order_id, customer_id: buyer_id });
    gain_qty = re.gain_qty; //Raman S
    let com_id = re.com_id;
    let extra_frezzed = 0;

    if (_.lt(match_price, at_price)) {
        let price_diff = CL.sub(at_price, match_price);
        extra_frezzed = CL.mul(price_diff, quantity);
    }

    // Add Crypto
    let usercrypto_add = await GFunction.getUserCryptoByUserId(buyer_id, currency);

    if (usercrypto_add) {
        // console.log({gain_qty, order_type: "buy", currency});
        usercrypto_add.balance = CL.add(usercrypto_add.balance, gain_qty);
        await usercrypto_add.save();
    }
    else {
        // Create New Crypto
        await UserCrypto.create({
            user_id: buyer_id,
            currency,
            balance: gain_qty,
            freezed_balance: "0"
        });
    }

    // Credit Crypto Raman S
    myEvents.emit(Ledger_Log_Events.add_credit, {
        user_id: buyer_id,
        currency,
        transaction_type: TransactionType.order,
        attached_id: c_order_id,
        amount: quantity,
        comment: `Buy Order Executed For ${currency + with_currency} having Order Id ${c_order_id}`,
        symbol: sym
    });




    // Deduct Crypto

    let usercrypto_deduct = await GFunction.getUserCryptoByUserId(buyer_id, with_currency);

    if (usercrypto_deduct) {
        usercrypto_deduct.freezed_balance = CL.sub(usercrypto_deduct.freezed_balance, deduct_qty);
        usercrypto_deduct.balance = CL.add(usercrypto_deduct.balance, extra_frezzed);
        // console.log({ f :  usercrypto_deduct.freezed_balance, b : usercrypto_deduct.balance });
        await usercrypto_deduct.save();

        //Debit Unfreeze Crypto Raman S
        myEvents.emit(Ledger_Log_Events.un_freeze_balance, {
            user_id: buyer_id,
            currency: with_currency,
            transaction_type: TransactionType.order,
            attached_id: c_order_id,
            amount: deduct_qty,
            comment: `Unfreeze Crypto On Order Complete Order Id ${c_order_id}`,
            symbol: sym
        });

        // Raman S
        if (extra_frezzed != 0) {
            // Credit Exrta Freezed Crypto
            myEvents.emit(Ledger_Log_Events.cancel_freeze_balance, {
                user_id: buyer_id,
                currency: with_currency,
                transaction_type: TransactionType.order,
                attached_id: c_order_id,
                amount: quantity,
                comment: `Added Extra Freezed Amount On Order Complete having Order Id ${c_order_id}`,
                symbol: sym
            });
        }
    }

    //Debit Commssion Raman S
    myEvents.emit(Ledger_Log_Events.add_debit, {
        user_id: buyer_id,
        currency,
        transaction_type: TransactionType.commission,
        attached_id: com_id,
        amount: CL.sub(quantity, gain_qty),
        comment: `Buy Order Commsion For ${currency + with_currency} having Order Id ${c_order_id}`,
        symbol: sym
    });

    return 1;

}

const addDeductCryptoSeller = async ({ seller_id, match_price, at_price, quantity, currency, with_currency, c_order_id = null }) => {

    let sym = currency + with_currency; // Raman S 
    //console.log('Seller Add Deduct' , {seller_id ,match_price, at_price , quantity , currency , with_currency});

    let deduct_qty = quantity;
    let gain_qty = CL.mul(at_price, quantity);
    let main_qty = gain_qty;
    //Deduct Commission
    let re = await DeductCommission.CalculateCommission({ currency, with_currency, order_type: "sell", at_price, quantity, c_order_id, customer_id: seller_id });
    gain_qty = re.gain_qty; //Raman S
    let com_id = re.com_id;

    //console.log(`Seller Deduct ${deduct_qty} and Gain ${gain_qty}`);
    // Add Crypto
    let usercrypto_add = await GFunction.getUserCryptoByUserId(seller_id, with_currency);

    if (usercrypto_add) {
        // console.log({gain_qty, order_type: "sell", with_currency });
        usercrypto_add.balance = CL.add(usercrypto_add.balance, gain_qty);
        await usercrypto_add.save();
    }
    else {
        // Create New Crypto
        await UserCrypto.create({
            user_id: seller_id,
            currency: with_currency,
            balance: gain_qty,
            freezed_balance: "0"
        });
    }

    // Credit Crypto Raman S
    myEvents.emit(Ledger_Log_Events.add_credit, {
        user_id: seller_id,
        currency: with_currency,
        transaction_type: TransactionType.order,
        attached_id: c_order_id,
        amount: main_qty,
        comment: `Sell Order Executed For ${currency + with_currency} having Order Id ${c_order_id}`,
        symbol: sym
    });



    // Deduct Crypto

    let usercrypto_deduct = await GFunction.getUserCryptoByUserId(seller_id, currency);

    if (usercrypto_deduct) {
        usercrypto_deduct.freezed_balance = CL.sub(usercrypto_deduct.freezed_balance, deduct_qty);
        // console.log({ f :  usercrypto_deduct.freezed_balance, b : usercrypto_deduct.balance });
        await usercrypto_deduct.save();

        //Debit Unfreeze Crypto Raman S
        myEvents.emit(Ledger_Log_Events.un_freeze_balance, {
            user_id: seller_id,
            currency,
            transaction_type: TransactionType.order,
            attached_id: c_order_id,
            amount: deduct_qty,
            comment: `Unfreeze Crypto On Order Complete Order Id ${c_order_id}`,
            symbol: sym
        });
    }


    //Debit Commssion Raman S
    myEvents.emit(Ledger_Log_Events.add_debit, {
        user_id: seller_id,
        currency: with_currency,
        transaction_type: TransactionType.commission,
        attached_id: com_id,
        amount: CL.sub(main_qty, gain_qty),
        comment: `Sell Order Commsion For ${currency + with_currency} having Order Id ${c_order_id}`,
        symbol: sym
    });

    return 1;

}


const updateOrderList = async (user_id) => {

    let user = await User.findByPk(user_id, { attributes: ['id', 'referral_code'] });
    if (user) {
        // Send Order Update
        myEvents.emit('SEND_ORDER_UPDATE', user.referral_code, { update: true });
    }
}


const customSellerLoop = async (symbol, sellers_array, order, buyer_qty, index = 0) => {

    let tid = crypto.randomBytes(10).toString("hex");
    let order_pending_qty = 0;

    let length = sellers_array.length;

    if (index == length) {
        return;
    }

    let seller = sellers_array[index];

    // Get First Seller
    let seller_qty = (_.isEqual(parseFloat(seller.pending_qty), 0)) ? seller.quantity : seller.pending_qty;
    // 40 - 20
    // If Seller Qty is greater than buyer 
    if (_.gte(parseFloat(seller_qty), parseFloat(buyer_qty))) {
        order_pending_qty = CL.sub(seller_qty, buyer_qty);

        if (_.isEqual(parseFloat(order_pending_qty), 0))
        // if(order_pending_qty == 0)
        {
            // Complete Buyer Order
            order.current_status = ORDER_STATUS.completed;
            order.pending_qty = '0';
            await order.save();

            // Complete Seller Order
            seller.current_status = ORDER_STATUS.completed;
            seller.pending_qty = '0';
            await seller.save();
        }
        else {
            // Complete Buyer Order
            order.current_status = ORDER_STATUS.completed;
            order.pending_qty = '0';
            await order.save();

            // Seller Partially Completed
            seller.current_status = ORDER_STATUS.partially;
            seller.pending_qty = order_pending_qty;
            await seller.save();
        }

        // Deduct Buyer and Seller Crypto
        await addDeductCryptosBuyer({
            buyer_id: order.user_id,
            match_price: seller.at_price,
            at_price: order.at_price,
            quantity: buyer_qty,
            currency: order.currency,
            with_currency: order.with_currency,
            c_order_id: order.id
        });

        await addDeductCryptoSeller({
            seller_id: seller.user_id,
            match_price: seller.at_price,
            at_price: seller.at_price,
            quantity: buyer_qty,
            currency: seller.currency,
            with_currency: seller.with_currency,
            c_order_id: seller.id
        });

        // Send Order List Update Event
        updateOrderList(order.user_id); // Buyer List Update
        updateOrderList(seller.user_id); // Seller List Update

        myEvents.emit('TRADE_EXECUTED', {
            currency: order.currency,
            with_currency: order.with_currency,
            at_price: seller.at_price,
            quantity: buyer_qty,
            sell_order_id: seller.id,
            buy_order_id: order.id,
            tid
        });

        return false;
    }
    // 20 - 40
    // Else buyer qty is greater than seller
    else {

        order_pending_qty = CL.sub(buyer_qty, seller_qty); //40

        if (_.isEqual(parseFloat(order_pending_qty), 0))
        // if(order_pending_qty == 0)
        {
            // Complete Buyer Order
            order.current_status = ORDER_STATUS.completed;
            order.pending_qty = '0';
            await order.save();

            // Complete Seller Order
            seller.current_status = ORDER_STATUS.completed;
            seller.pending_qty = '0';
            await seller.save();
        }
        else {
            // Partially Buyer Order
            order.current_status = ORDER_STATUS.partially;
            order.pending_qty = order_pending_qty;
            await order.save();

            // Seller Completed
            seller.current_status = ORDER_STATUS.completed;
            seller.pending_qty = '0';
            await seller.save();
        }

        // Deduct Buyer and Seller Crypto
        await addDeductCryptosBuyer({
            buyer_id: order.user_id,
            match_price: seller.at_price,
            at_price: order.at_price,
            quantity: seller_qty,
            currency: order.currency,
            with_currency: order.with_currency,
            c_order_id: order.id
        });



        await addDeductCryptoSeller({
            seller_id: seller.user_id,
            match_price: seller.at_price,
            at_price: seller.at_price,
            quantity: seller_qty, //10
            currency: seller.currency,
            with_currency: seller.with_currency,
            c_order_id: seller.id
        });


        // Send Order List Update Event
        updateOrderList(order.user_id); // Buyer List Update
        updateOrderList(seller.user_id); // Seller List Update

        // Send Live Trade
        // match_price: buyer.at_price
        myEvents.emit('TRADE_EXECUTED', {
            currency: order.currency,
            with_currency: order.with_currency,
            at_price: seller.at_price,
            quantity: seller_qty,
            sell_order_id: seller.id,
            buy_order_id: order.id,
            tid
        });

        if (!(_.isEqual(parseFloat(order_pending_qty), 0))) {
            buyer_qty = order_pending_qty;
            customSellerLoop(symbol, sellers_array, order, buyer_qty, index + 1);
        }

        return false;



    }
}

// console.log(_.gte('0', 0));

const customBuyerLoop = async (symbol, buyers_array, order, seller_qty, index = 0) => {

    let tid = crypto.randomBytes(10).toString("hex");

    let order_pending_qty = 0;

    let length = buyers_array.length;

    if (index == length) {
        return;
    }

    let buyer = buyers_array[index];

    // Get First Seller
    let buyer_qty = (_.isEqual(parseFloat(buyer.pending_qty), 0)) ? buyer.quantity : buyer.pending_qty;
    // 40 - 20
    // If Buyer Qty is greater than Seller 
    //  s = 200  b = 300



    if (_.gte(parseFloat(buyer_qty), parseFloat(seller_qty))) {
        order_pending_qty = CL.sub(buyer_qty, seller_qty);

        if (_.isEqual(parseFloat(order_pending_qty), 0)) {
            // Complete Seller Order
            order.current_status = ORDER_STATUS.completed;
            order.pending_qty = '0';
            await order.save();

            // Complete Buyer Order
            buyer.current_status = ORDER_STATUS.completed;
            buyer.pending_qty = '0';
            await buyer.save();
        }
        else {
            // Complete Seller Order
            order.current_status = ORDER_STATUS.completed;
            order.pending_qty = '0';
            await order.save();

            // Buyer Partially Completed
            buyer.current_status = ORDER_STATUS.partially;
            buyer.pending_qty = order_pending_qty;
            await buyer.save();
        }

        // Deduct Buyer and Seller Crypto
        await addDeductCryptoSeller({
            seller_id: order.user_id,
            match_price: buyer.at_price,
            at_price: order.at_price,
            quantity: seller_qty,
            currency: order.currency,
            with_currency: order.with_currency,
            c_order_id: order.id
        });


        await addDeductCryptosBuyer({
            buyer_id: buyer.user_id,
            match_price: buyer.at_price,
            at_price: buyer.at_price,
            quantity: seller_qty,
            currency: buyer.currency,
            with_currency: buyer.with_currency,
            c_order_id: buyer.id
        });

        // Send Order List Update Event
        updateOrderList(buyer.user_id); // Buyer List Update
        updateOrderList(order.user_id); // Seller List Update


        // Send Live Trade
        // match_price: buyer.at_price
        myEvents.emit('TRADE_EXECUTED', {
            currency: order.currency,
            with_currency: order.with_currency,
            at_price: buyer.at_price,
            quantity: seller_qty,
            sell_order_id: order.id,
            buy_order_id: buyer.id,
            tid
        });

        return false;
    }
    // B - 20 , S- 40
    // Else Seller qty is greater than Buyer
    else {

        order_pending_qty = CL.sub(seller_qty, buyer_qty); //20

        if (_.isEqual(parseFloat(order_pending_qty), 0)) {
            // Complete Seller Order
            order.current_status = ORDER_STATUS.completed;
            order.pending_qty = '0';
            await order.save();

            // Complete Buyer  Order
            buyer.current_status = ORDER_STATUS.completed;
            buyer.pending_qty = '0';
            await buyer.save();
        }
        else {
            // Partially Seller Order
            order.current_status = ORDER_STATUS.partially;
            order.pending_qty = order_pending_qty;
            await order.save();

            // Buyer Completed
            buyer.current_status = ORDER_STATUS.completed;
            buyer.pending_qty = '0';
            await buyer.save();
        }

        // Deduct Buyer and Seller Crypto
        await addDeductCryptoSeller({
            seller_id: order.user_id,
            match_price: buyer.at_price,
            at_price: order.at_price,
            quantity: buyer_qty, //10
            currency: order.currency,
            with_currency: order.with_currency,
            c_order_id: order.id
        });

        await addDeductCryptosBuyer({
            buyer_id: buyer.user_id,
            match_price: buyer.at_price,
            at_price: buyer.at_price,
            quantity: buyer_qty,
            currency: buyer.currency,
            with_currency: buyer.with_currency,
            c_order_id: buyer.id
        });


        // Send Order List Update Event
        updateOrderList(buyer.user_id); // Buyer List Update
        updateOrderList(order.user_id); // Seller List Update

        // Send Live Trade
        // match_price: buyer.at_price
        myEvents.emit('TRADE_EXECUTED', {
            currency: order.currency,
            with_currency: order.with_currency,
            at_price: buyer.at_price,
            quantity: buyer_qty,
            sell_order_id: order.id,
            buy_order_id: buyer.id,
            tid
        });

        if (!(_.isEqual(parseFloat(order_pending_qty), 0)))
        // if(order_pending_qty != 0)
        {
            seller_qty = order_pending_qty;
            customBuyerLoop(symbol, buyers_array, order, seller_qty, index + 1);
        }

        return false;



    }
}

myEvents.on('PLACE_ORDER_2', matchOrder);

export default {
    addDeductCryptosBuyer,
    addDeductCryptoSeller
}