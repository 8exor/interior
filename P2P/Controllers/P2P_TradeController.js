import { P2P_Trade } from "../Models/P2P_Trade.js";
import { P2P_Order } from "../Models/P2P_Order.js";
import status from "../Traits/Status.js";
import Mail from "../Traits/Mail.js";
import { CL } from "cal-time-stamper";
import Validator from 'validatorjs';
import _ from "lodash";
import Sequelize from "sequelize";
import OS from "../Common/Order_Status.js"
import { startOfDay, endOfDay } from 'date-fns';
import { User } from "../../Models/User.js";
import { Bank } from "../../Models/Bank.js";
import { UPI } from "../../Models/user_upi.js";
import event from "../Events/Event.js";
import allEmitter from "../Common/allEmitter.js";
import { P2P_Wallet } from "../Models/P2P_Wallet.js";
import { P2P_ExpiredOrder } from "../Models/P2P_ExpiredOrder.js";
import { P2P_RevertQuantity } from "../Models/P2P_RevertQuantity.js";
import verify from '../Common/verification.js'


const { Op } = Sequelize;

function firstError(validation) {
    let first_key = Object.keys(validation.errors.errors)[0];
    return validation.errors.first(first_key);
}

async function getTime(data) {

    let date = new Date(data);
    // Hours part from the timestamp
    let hours = date.getHours();
    // Minutes part from the timestamp
    let minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    let seconds = "0" + date.getSeconds();

    // Will display time in 10:30:23 format
    return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

}

function rules(order) {
    let rule = {
        'order_id': 'required|numeric',
        'quantity': 'required|numeric',
        'order_type': 'required|in:buy,sell',
        'currency': 'required|in:USDT,INR',
        'with_currency': 'required|in:USDT,INR',
    }
    if (order.order_type == "sell") {
        rule.payment_type = 'required'
    }
    return rule;

}

async function confirmUpdation(p2p_order, match_order, today) {

    let request_quantity = 0;


    request_quantity = (p2p_order.user_id == match_order.user_id && p2p_order.order_type == "buy") ? CL.mul(parseFloat(match_order.quantity), parseFloat(match_order.at_price)) : CL.div(parseFloat(match_order.quantity), parseFloat(match_order.at_price));


    //if user is  not login user and order type is buy or sell....
    if (p2p_order.user_id != match_order.user_id && (p2p_order.order_type == "buy" || p2p_order.order_type == "sell")) {

        request_quantity = parseFloat(match_order.quantity);

    }

    let pending_quantity = CL.sub(parseFloat(p2p_order.pending_quantity), parseFloat(request_quantity));

    //if pending quantity is some value greater than min value of the order.. 
    let newItem = {
        old_status: p2p_order.status,
        pending_quantity: pending_quantity,
        seller_confirmation: 1
    }

    let condition = {
        id: p2p_order.id
    }


    //if pending quantity is less than minimum quantity... 
    if (parseFloat(pending_quantity) < parseFloat(p2p_order.min_quantity)) {

        newItem.status = OS.ORDER_STATUS.completed;

        if (p2p_order.order_type == "sell") {
            let data = {
                user_id: p2p_order.user_id,
                attached_id: p2p_order.id,
                amount: pending_quantity,
                currency: p2p_order.currency
            }
            event.emit("cancelWallet", data);

            newItem.pending_quantity = CL.sub(parseFloat(pending_quantity), parseFloat(data.amount));

            let revert = await P2P_RevertQuantity.create({ user_id: data.user_id, order_id: data.attached_id, refund_amount: data.amount });

            if (!revert) {
                return status.failed('There is problem with Order confirmation');
            }

        }

    }
    else {
        newItem.status = OS.ORDER_STATUS.partially_completed;
    }

    let p2p = await P2P_Order.update(newItem, { where: condition });
    let trade = await P2P_Trade.update(newItem, { where: { id: match_order.id } });

    if (!p2p && !trade) {
        return status.failed('There is problem with Order confirmation');
    }

    let data = {
        user_id: p2p_order.user_id,
        attached_id: p2p_order.id,

    }

    if (p2p_order.user_id == match_order.user_id && p2p_order.order_type == "buy") {
        data.amount = match_order.quantity;
        data.currency = p2p_order.with_currency;
        event.emit("creditWallet", data);

    }
    if (p2p_order.user_id == match_order.user_id && p2p_order.order_type == "sell") {
        data.amount = CL.div(parseFloat(match_order.quantity), parseFloat(match_order.at_price));
        data.currency = p2p_order.currency;
        event.emit("unfreezeWallet", data);

    }
    if (p2p_order.user_id != match_order.user_id && p2p_order.order_type == "buy") {
        data.amount = CL.div(parseFloat(match_order.quantity), parseFloat(match_order.at_price));
        data.currency = p2p_order.with_currency;
        event.emit("creditWallet", data);
    }
    if (p2p_order.user_id != match_order.user_id && p2p_order.order_type == "sell") {
        data.amount = match_order.quantity;
        data.currency = p2p_order.currency;
        event.emit("unfreezeWallet", data);
    }


    return status.success('Order has confirmed', match_order);

}

export default {
    async create(req, res) {

        var request = req.body;
        let validation = new Validator(request, rules(request));
        if (validation.fails()) {
            return res.json(status.failed(firstError(validation)));
        }

        //user existamce.... 
        if (req.user.id != 1) {
            let user_existance = await P2P_Order.findAll({
                where: {
                    user_id: req.user.id,
                    status: {
                        [Op.notIn]: [OS.ORDER_STATUS.canceled, OS.ORDER_STATUS.completed]
                    },

                }
            });

            if (user_existance.length != 0) {
                return res.json(status.failed('You are not eligible please complete your previous order'));
            }
        }
        // function invocation for bank and kyc check... 
        const verify_bank = await verify.bank_status(req.user.id);
        

        // upi://pay?pa=

        const verify_kyc = await verify.kyc_status(req.user.id);

        //returning of function if bank or kyc is not verified...
        if (verify_bank.status_code == 0 || verify_kyc.status_code == 0) {
            return verify_bank.status_code == 0 ? res.json(verify_bank) : res.json(verify_kyc);
        }
    if (request.order_type == 'sell') {

             //get user wallet...         
             let total_balance = await P2P_Wallet.findOne({
                where: {
                    user_id: req.user.id, currency: request.currency, total_balance: {
                        [Op.gte]: [request.quantity]
                    },
                }
            })

            //check if user have wallet or not.. 
            if (!total_balance) {
                return res.json(status.failed("You have no sufficient balance to sell"));
            }
        }
        const where = {
            id: request.order_id,
            currency: request.with_currency,
            with_currency: request.currency,
            status: {
                [Op.notIn]: [OS.ORDER_STATUS.canceled, OS.ORDER_STATUS.completed, OS.ORDER_STATUS.processing]
            },
            order_type: request.order_type == "buy" ? "sell" : "buy",
            user_id: {
                [Op.ne]: req.user.id
            },
        }

        const order_data = await P2P_Order.findOne({ where });


        if (!order_data) {
            return res.json(status.failed('The Order is already in  processing'))
        }

        const old_status_update = order_data.status;
        order_data.status = OS.ORDER_STATUS.processing;
        await order_data.save();

        try {

            var at_price = order_data.at_price;
            var min_quantity = parseFloat(order_data.min_quantity);
            var max_quantity = parseFloat(order_data.pending_quantity);
            var quantity = parseFloat(request.quantity);

            var min_quantity_new = "";
            var max_quantity_new = "";
            var get_quantity = "";
            var symbol = "";


            if (request.order_type == "buy") {
                min_quantity_new = CL.mul(min_quantity, at_price);
                max_quantity_new = CL.mul(max_quantity, at_price);
                get_quantity = CL.div(quantity, at_price);
                symbol = "₹";



            }
            else {
                min_quantity_new = CL.div(min_quantity, at_price);
                max_quantity_new = CL.div(max_quantity, at_price);
                get_quantity = CL.mul(quantity, at_price);
                symbol = "$";


            }

            //quantity check.... 
            if (quantity < min_quantity_new) {
                throw res.json(status.failed('Please enter the quantity greater than ' + symbol + min_quantity_new));
            }
            if (quantity > max_quantity_new) {
                throw res.json(status.failed('Please enter the quantity less than ' + symbol + max_quantity_new));
            }



            var order = {

                min_quantity: quantity,
                max_quantity: quantity,
                pending_quantity: quantity,
                at_price: at_price,
                user_id: req.user.id,
                user_xid: req.user.user_xid,
                currency: request.currency,
                with_currency: request.with_currency,
                order_type: request.order_type

            }

            order.total = request.order_type == "sell" ? CL.mul(parseFloat(order.at_price), parseFloat(order.max_quantity)) : CL.div(parseFloat(order.max_quantity), parseFloat(order.at_price));

    

            let p2p_order = await P2P_Order.create(order);
            if (!p2p_order) {
                throw res.json(status.failed('Error while creating order'));
            }
            if(  request.order_type == "sell"){
                let data = {
                    user_id: req.user.id,
                    currency: request.currency,
                    attached_id: p2p_order.id,
                    amount: quantity
                }  
        
                event.emit("freezeWallet", data);
            }

            order.buyer_order_id = request.order_type == "buy" ? p2p_order.id : order_data.id;
            order.seller_order_id = request.order_type == "sell" ? p2p_order.id : order_data.id;
            order.quantity = get_quantity;
            order.status = OS.ORDER_STATUS.processing;

            let expired_at = new Date().setMinutes(new Date().getMinutes() + 15);

            order.expired_at = expired_at;


            //create order in P2P trade... 

            let Trade = await P2P_Trade.create(order);
            if (!Trade) {
                throw res.json(status.failed('Error while creating order'));

            }
            //get old status of the order... 
            let old_status = await P2P_Order.findAll({ where: { id: { [Op.in]: [order.seller_order_id, order.buyer_order_id] } }, attributes: ['status', 'id', 'user_id'] });

            //update old status of the order... 
            old_status.forEach(async (element) => {
                let newItem = {
                    old_status: Trade.user_id != element.user_id ? old_status_update : element.status
                }
                let condition = {
                    id: element.id
                }
                await P2P_Order.update(newItem, { where: condition });
            });

            //update current status of the orders..
            let newItem = {
                status: OS.ORDER_STATUS.processing,
                expired_at: expired_at
            }
            let condition = {
                id: {
                    [Op.in]: [order.seller_order_id, order.buyer_order_id]
                },
            }
            let final_data = {
                match_order_id: Trade.id,
                order: p2p_order
            }

            await P2P_Order.update(newItem, { where: condition });



            let other_user = _.find(old_status, function (o) { return o.user_id != Trade.user_id });

            event.emit('pageReload', { id: other_user.user_id, match_id: Trade.id });
            event.emit('p2pOrder', { update: true });

           
            
            return res.json(status.success('your order has sucessfully placed', final_data));
        } catch (error) {
            order_data.status = old_status_update;
            await order_data.save();
            return error;

        }

    },
    //get order details.... 
    async getOrderDetails(req, res) {

        let current_ts = new Date().getTime();
        const today = new Date();
        let request = req.query;
        let match_id = request.match_id;
        let validation = new Validator(request, {
            'match_id': 'required|numeric',
        });

        if (validation.fails()) {
            return res.json(status.failed(firstError(validation)));
        }

        //return the matching order... 
        let p2p_trade = await P2P_Trade.findOne({
            where: { id: match_id,status: { [Op.in]: [OS.ORDER_STATUS.processing, OS.ORDER_STATUS.completed]} }, include: [{ model: P2P_Order,  as: "seller" }, { model: P2P_Order,  as: "buyer" }]
        });
		
	

        // Check If P2P is Empty.... 
        if (_.isEmpty(p2p_trade)) {
            return res.json(status.failed('Error while getting p2p_trade'));
        }

        let p2p_order = {
            seller: p2p_trade.seller,
            buyer: p2p_trade.buyer
        }

        // console.log(p2p_order);

        let sell_bank_details = await Bank.findOne({ where: { user_id: p2p_order?.seller.user_id } });
        let sell_upi_details = await UPI.findOne({ where: { user_id: p2p_order?.seller.user_id } });


        let other_user = _.find(p2p_order, function (o) { return o.user_id != p2p_trade.user_id });

        // Check Expired Date Of The Order...
        if (parseFloat(current_ts) > parseFloat(p2p_trade.expired_at)) {
            let newItem = {
                status: other_user.old_status,
            }
            let condition = {
                id: other_user.id
            }
            let newItem1 = {
                status: OS.ORDER_STATUS.canceled,
            }
            let condition1 = {
                user_id: p2p_trade.user_id,
                status: { [Op.notIn]: [OS.ORDER_STATUS.completed, OS.ORDER_STATUS.canceled] },
                created_at: { [Op.between]: [startOfDay(today), endOfDay(today)] }
            }

            let expired_order = await P2P_ExpiredOrder.create({ match_id: match_id, comments: "This order is cancelled due to expired time" });
            let another_user = await P2P_Order.update(newItem, { where: condition });
            let users = await P2P_Order.update(newItem1, { where: condition1 });
            let trade = await P2P_Trade.update(newItem1, { where: { id: match_id } });



            if (another_user && users && trade && expired_order) {

                let data = {
                    user_id: p2p_trade.seller.user_id,
                    currency: p2p_trade.seller.currency,
                    attached_id: match_id
                }

                data.amount = p2p_order.user_id == p2p_trade.user_id && p2p_order.order_type == "buy" ? p2p_trade.quantity : CL.div(parseFloat(p2p_trade.quantity), parseFloat(p2p_trade.at_price));
                
                event.emit("cancelWallet", data);

                return res.json(status.success('your order has expired', p2p_trade));
            }
            return res.json(status.failed('There is problem with order'));
        }



        //return the user details... 
        let receiver = _.find(p2p_order, function (o) { return o.user_id != req.user.id });

        let receiver_user = await User.findOne({
            where: { id: receiver.user_id }
        });

        let user = await User.findOne({
            where: { id: p2p_trade.user_id }
        })

        if (_.isEmpty(user)) {
            return res.json(status.failed('Error while getting user detail'));
        }


        let data = {
            order: p2p_trade,
            payment_type: other_user.payment_type,
            user: user,
            receiver_user: receiver_user,
            sell_bank_details: sell_bank_details,
            sell_upi_details: sell_upi_details

        }

        return res.json(status.success('Order Fetched Successfully', data));



    },

    //send mail to the user to confirm the order.... 
    async sendMail(req, res) {
        let current_ts = new Date().getTime();
        let current_time = await getTime(current_ts);

        const today = new Date();
        let match_id = req.query.match_id;

        //the order we want to complete... 
        let match_order = await P2P_Trade.findOne({ where: { id: match_id, created_at: { [Op.between]: [startOfDay(today), endOfDay(today)] }, status: OS.ORDER_STATUS.processing }, include: [{ model: P2P_Order, as: "seller" }, { model: P2P_Order, as: "buyer" }] });


        if (!match_order) {
            return res.json(status.failed('Invalid order'));
        }

        if (parseFloat(current_ts) > parseFloat(match_order.expired_at)) {
            return res.json(status.failed('This order is expired'));
        }


        let p2p_order = {
            seller: match_order.seller,
            buyer: match_order.buyer
        }

        if (!p2p_order) {
            return res.json(status.failed('No order found'));
        }


        let other_one = _.find(p2p_order, function (o) { return o.user_id != match_order.user_id });


        //receiver email... 
        let user_email = await User.findOne({ where: { id: other_one.user_id }, attributes: ['email'] });

        if (!user_email) {
            return res.json(status.failed('No user found '));
        }

        //updating buyer_confirmation... 
        let buyer_confirm = await P2P_Trade.update({ buyer_confirmation: 1 }, { where: { id: match_id } });

        if (!buyer_confirm) {
            return res.send(status.failed("There is issue to notify the seller"));
        }

        //sending mail... 
        let mail = Mail.send(user_email.email, "please confirm the order");

        return mail ? res.json(status.success('Mail has successfully sent')) : res.json(status.success('Mail has successfully sent'));


    },

    //order completion function... 
    async confirmOrder(req, res) {
        let current_ts = new Date().getTime();
        // let current_time = await getTime(current_ts);
        const today = new Date();
        let match_id = req.query.match_id;

        //the order we want to complete... 
        let match_order = await P2P_Trade.findOne({
            where: {
                id: match_id, created_at: { [Op.between]: [startOfDay(today), endOfDay(today)] },
                status: OS.ORDER_STATUS.processing
            },
            include: [{
                model: P2P_Order, as: "seller"
            },
            { model: P2P_Order, as: "buyer" }
            ]
        });


        if (!match_order) {
            return res.json(status.failed('Invalid order'));
        }

        if (current_ts > match_order.expired_at) {
            return res.json(status.failed('This order is expired'));
        }

        if (match_order.seller.user_id != req.user.id) {
            return res.json(status.failed("You are not authorized to confirm the order"))
        }

        let order1 = await confirmUpdation(match_order.seller, match_order, today);
        if (order1) {
            return res.json(await confirmUpdation(match_order.buyer, match_order, today));
        }

        return res.json(status.failed("There is problem with order confirmation"));

    },

    async testing(req, res) {

        //   let array= [1,2,3,1,2,3];
        //   var unique= Array.from(new Set(array));
        //   return res.send({unique});

        var data = ["X_row7", "X_row4", "X_row6", "X_row10", "X_row8", "X_row9", "X_row11", "X_row7", "X_row4", "X_row6", "X_row10", "X_row8", "X_row9", "X_row11", "X_row7", "X_row4", "X_row6", "X_row10", "X_row8", "X_row9", "X_row11", "X_row7", "X_row4", "X_row6", "X_row10", "X_row8", "X_row9", "X_row11", "X_row7", "X_row4", "X_row6", "X_row10", "X_row8", "X_row9", "X_row11", "X_row7", "X_row4", "X_row6", "X_row10", "X_row8", "X_row9", "X_row11"],
            unique = data.filter(function (a) {
                return !this[a] && (this[a] = true);
            }, Object.create(null));

        return res.send({ unique });

    }






}