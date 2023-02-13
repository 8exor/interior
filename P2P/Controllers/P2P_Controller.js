import { P2P_Order } from "../Models/P2P_Order.js";
import status from "../Traits/Status.js";
import OS from "../Common/Order_Status.js"
import Pagination from "../Common/Pagination.js"
import Validator from 'validatorjs';
import { CL } from "cal-time-stamper";
import { Bank } from "../../Models/Bank.js";
import Sequelize from "sequelize";
import { UPI } from "../../Models/user_upi.js";
import verify from '../Common/verification.js'
const { Op } = Sequelize;
import { Model } from '.././../Database/sequelize.js'
const { QueryTypes } = Model;
import { User } from "../../Models/User.js";
import { P2P_PaymentTypes } from "../Models/P2P_PaymentTypes.js"
import { P2P_Trade } from "../Models/P2P_Trade.js";
import { startOfDay, endOfDay } from 'date-fns';
import event from "../Events/Event.js";
import allEmitter from "../Common/allEmitter.js";
import { P2P_Wallet } from "../Models/P2P_Wallet.js";
import { P2P_Ex_transaction } from "../Models/P2P_Ex_trans.js"
import _ from "lodash";


// validation error function....
function firstError(validation) {
    let first_key = Object.keys(validation.errors.errors)[0];
    return validation.errors.first(first_key);
}

//////////////30days difference function///////////////

let now = new Date();
const backdate = (new Date(now.setDate(now.getDate() - 30))).getTime();
var hours = "0" + (new Date(backdate).getHours());
var min = "0" + (new Date(backdate).getMinutes());
var sec = "0" + (new Date(backdate).getSeconds());
var todate = "0" + (new Date(backdate).getDate());
var tomonth = "0" + (new Date(backdate).getMonth() + 1);
var toyear = new Date(backdate).getFullYear();
var ago_date = `${toyear}-${tomonth.substr(-2)}-${todate.substr(-2)} ${hours.substr(-2)}:${min.substr(-2)}:${sec.substr(-2)}`;

//// user registration diff func ///////

async function getDifferenceInDays(date1, date2) {
    const diffInMs = Math.abs(date2 - date1);
    return diffInMs / (1000 * 60 * 60 * 24);
}

// async function getTime(data) {

//     let date = new Date(data);
//     // Hours part from the timestamp
//     let hours = date.getHours();
//     // Minutes part from the timestamp
//     let minutes = "0" + date.getMinutes();
//     // Seconds part from the timestamp
//     let seconds = "0" + date.getSeconds();

//     // Will display time in 10:30:23 format
//     return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

// }

async function expireOrder() {

    let current_ts = new Date().getTime();
  
    //buyer order  update 
    await P2P_Order.update({ status: OS.ORDER_STATUS.canceled, old_status: OS.ORDER_STATUS.processing }, { where: { expired_at: { [Op.lt]: [current_ts] }, status: OS.ORDER_STATUS.processing, order_type: 'buy' } });

    //buyer trade update 
    await P2P_Trade.update({ status: OS.ORDER_STATUS.canceled }, { where: { expired_at: { [Op.lt]: [current_ts] }, status: OS.ORDER_STATUS.processing } });

    //seller  order update
    // return await Model.query("UPDATE p2p_orders SET status = old_status ,old_status = 'processing' WHERE status='processing' AND order_type='sell' AND expired_at < " + current_ts);

    await P2P_Order.update({ status: OS.ORDER_STATUS.partially_completed}, { where: { expired_at: { [Op.lt]: [current_ts] }, old_status: OS.ORDER_STATUS.partially_completed, order_type: 'sell' } });
    await P2P_Order.update({ status: OS.ORDER_STATUS.placed}, { where: { expired_at: { [Op.lt]: [current_ts] }, old_status: OS.ORDER_STATUS.placed, order_type: 'sell' } });

    return 1; 



}


//////EXPORT FUNCTION /////////////////

function rules(order) {
    let rule = {
        'currency': 'required|in:USDT,INR',
        'with_currency': 'required|in:USDT,INR',
        'at_price': 'required|numeric|min:00000001',
        'min_quantity': 'required|numeric|min:00000001',
        'max_quantity': 'required|numeric|min:00000001',
        'order_type': 'required|in:buy,sell'
    }
    if (order.order_type == "sell") {
        rule.payment_type = 'required'
    }
    return rule;

}
async function create(req, res) {
    try {

        const order = {
            currency: req.body.currency,
            with_currency: req.body.with_currency,
            at_price: req.body.at_price,
            min_quantity: req.body.min_quantity,
            max_quantity: req.body.max_quantity,
            order_type: req.body.order_type,
            pref_xid: req.body.pref_xid,
            payment_type: req.body.payment_type,
            pending_quantity: req.body.max_quantity

        }

        if (parseFloat(order.max_quantity) < parseFloat(order.min_quantity)) {

            return res.send(status.failed("The maximum quantity should be greater than min quantity"))
        }


        order.user_id = req.user.id;
        order.user_xid = req.user.user_xid;
        order.total = order.order_type == "sell" ? CL.mul(order.max_quantity, order.at_price) : CL.div(order.max_quantity, order.at_price);
        order.search_amount = order.order_type == "buy" ? order.min_quantity : CL.mul(order.min_quantity, order.at_price);
        let expired_at = new Date().setMinutes(new Date().getMinutes() + 15);
        order.expired_at = expired_at;


        let validation = new Validator(req.body, rules(order));

        if (validation.fails()) {
            return res.json(status.failed(firstError(validation)));
        }

        if (order.order_type == "sell") {
            //get user wallet...         
            let total_balance = await P2P_Wallet.findOne({
                where: {
                    user_id: req.user.id, currency: order.currency, total_balance: {
                        [Op.gte]: [parseFloat(order.max_quantity)]
                    },
                }
            })

            //check if user have wallet or not.. 
            if (!total_balance) {
                return res.json(status.failed("You have no sufficient balance to sell"));
            }

        }

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
                return res.json(status.failed('you are not eligible'));
            }
        }
        //total orders of the login user...
        let total_orders = await P2P_Order.findAll({ where: { user_id: req.user.id } });

        ////////CHECK FOR USER REGISTRATION TIME///////////
        let user_create = req.user.createdAt;
        var back = new Date(user_create).getTime()
        var date = Date.now();
        var today = new Date(date).getTime();


        let regdays_diff = await getDifferenceInDays(today, back);

        //function invocation for bank and kyc check... 
        const verify_bank = await verify.bank_status(req.user.id);
        const verify_kyc = await verify.kyc_status(req.user.id);

        //returning of function if bank or kyc is not verified...
        if (verify_bank.status_code == 0 || verify_kyc.status_code == 0) {
            return verify_bank.status_code == 0 ? res.json(verify_bank) : res.json(verify_kyc);
        }

        //check the completion rate... 
        let percent = await completion_rate(req.user.id);

        //check for the terms and condition...
        if ((total_orders.length >= parseFloat(20) && verify_kyc.status_code == 1 && percent >= parseFloat(80) && regdays_diff >= parseFloat(30) && verify_bank.status_code == 1) || order.order_type == 'buy' && verify_bank.status_code == 1 && verify_kyc.status_code == 1 || req.user.role == "admin" && verify_bank.status_code == 1) {


            const final_data = await P2P_Order.create(order)
            if (!final_data) {
                return res.json(status.failed('Error while creating order'));
            }
            //check if user have sufficient balance or not... 

            let data = {
                user_id: order.user_id,
                amount: order.max_quantity,
                attached_id: final_data.id
            }
            if (final_data.order_type == "sell") {
                event.emit('freezeWallet', data);

            }

            return res.json(status.success('P2P Order completed Successfully', order));



        } else {
            res.json(status.failed('you are not eligible for ' + order.order_type + ' crypto'));
        }

    } catch (error) {
        console.log(error);
    }
}

// /******************FUNCTION FOR FINDINF COMPLETION RATE PERCENTAGE***********************/o.created_at >= ago_date
async function completion_rate(id) {

    let total_orders = await P2P_Order.findAll({ where: { user_id: id } });

    //total order with in last 30 days..
    let total_order_date = _.filter(total_orders, function (o) { return o.created_at >= ago_date });

    //total completed order of the login user....
    let total_completed_order = _.filter(total_orders, function (o) { return o.status == OS.ORDER_STATUS.completed; });

    //completed order with in last 30 days.. 
    let comp_status = _.filter(total_completed_order, function (o) {
        var agodate = (new Date(o.created_at)).toString();
        return agodate >= ago_date
    });

    //total canceled order of the login user...
    let cancel_status = _.filter(total_orders, function (o) { return o.status == OS.ORDER_STATUS.canceled && o.order_type == 'buy' });

    //canceled order with in last 30 days.. 
    let cancel_status_date = _.filter(cancel_status, function (o) { return o.created_at >= ago_date });

    let percent = (Math.abs(1 - cancel_status_date.length) / comp_status.length) * 100;
    // console.log(percent)
    return percent

}
//////////////////BUY AND SELL  ORDER LIST GET API ONLY PLACED ORDER ONLY ////////////////
async function getOrderList(req, res) {


    try {
        let request = req.query;

        let validation = new Validator(request, {
            'order_type': 'required|in:buy,sell'
        });

        if (validation.fails()) {
            return res.json(status.failed(firstError(validation)));
        }


        let whereCondition = {
            order_type: req.query.order_type == 'sell' ? "buy" : "sell",
            status: {
                [Op.notIn]: [OS.ORDER_STATUS.completed, OS.ORDER_STATUS.canceled, OS.ORDER_STATUS.processing]
            },
        };

        // amount filter ... 
        if (req.query.amount) {
            whereCondition.search_amount = parseFloat(req.query.amount);
        }

        //payment type filter...
        if (req.query.payment_type) {
            whereCondition.payment_type = { [Op.substring]: [req.query.payment_type] }
        }

        //condition for the total count...  
        let x = {
            where: whereCondition, include: [
                { model: User, attributes: ["name", "email"] },

                {
                    model: Bank,
                    where: {
                        is_verify: 1,
                        '$P2pOrder.payment_type$': {
                            [Op.substring]: 'bank_transfer'
                        },
                    },
                    required: false
                },
                {
                    model: UPI,
                    where: {
                        is_verify: 1,
                        '$P2pOrder.payment_type$': {
                            [Op.substring]: 'UPI'
                        },
                    },
                    required: false

                }
            ],
        };

        const pagination = Pagination.getPaginate(req, "id");

        const finalQuery = Object.assign(pagination, x);

        var total_count = await P2P_Order.count(finalQuery);

        let buyorder1 = await P2P_Order.findAll(finalQuery);


        buyorder1 = buyorder1.map(async function (el) {
            var d = await completion_rate(el.user_id)
            el.dataValues.completion_rate = d;
            return el


        })

        let orderList = await Promise.all(buyorder1)

        orderList = Pagination.paginate(
            pagination.page,
            orderList,
            pagination.limit,
            total_count
        );

        // return res.send({total_count})
        if (!orderList) {
            return res.json(status.failed('There is no any order'));

        }
        return res.json(status.success('orders fetched successfully', orderList));

    } catch (error) {
        console.log(error);
    }

}

setInterval( function () {
    expireOrder();
}, 90000)

//////////////////BUY AND SELL  ORDER LIST GET API ONLY ALL ORDER  ////////////////
async function getAllOrderList(req, res) {

    try {

        //cancel the expired order... 
        await expireOrder();

        let request = req.query;

        let validation = new Validator(request, {
            'order_type': 'in:buy,sell',
        });

        if (validation.fails()) {
            return res.json(status.failed(firstError(validation)));
        }

        let condition = {};
        let user_condition = {};

        // if the login user is not an admin... 
        if (req.user.id != 1) {
            condition.user_id = req.user.id;
        }
        /// FILTER ON USER_ID ...
        if (req.user.id == 1 && req.query.user_id) {
            condition.user_id = req.query.user_id;
        }
        /// FILTER ON AMOUNT ....
        if (req.query.amount) {
            condition.min_quantity = parseFloat(req.query.amount);
        }
        /// FILTER ON PAYMENT_TYPE .....
        if (req.query.payment_type) {
            condition.payment_type = { [Op.substring]: [req.query.payment_type] };
        }
        /// FILTER ON ORDER STATUS ...
        if (req.query.status) {
            condition.status = req.query.status;
        }
        /// FILTER ON ORDER currency ...
        if (req.query.currency) {
            condition.currency = req.query.currency;
        }
        ///FILTER ON ORDER TYPE ....
        if (req.query.order_type) {
            condition.order_type = req.query.order_type;
        }
        ///FILTER ON MAX QUANTITY....
        if (req.query.quantity) {
            condition.max_quantity = parseFloat(req.query.quantity);
        }
        ///FILTER ON EMAIL ....
        if (req.query.email) {
            user_condition.email = { [Op.substring]: [req.query.email] }
        }
        //FILTER ON NAME ....
        if (req.query.name) {
            user_condition.name = { [Op.substring]: [req.query.name] }
        }
        //FILTER ON AT PRICE ....
        if (req.query.at_price) {
            condition.at_price = req.query.at_price;
        }
        //FILTER ON TOTAL PRICE ....
        if (req.query.total) {
            condition.total = parseFloat(req.query.total);
        }

        if (req.query.date) {

            let date = new Date(req.query.date);
            condition.created_at = { [Op.between]: [startOfDay(date), endOfDay(date)] }

        }

        // return res.send({condition})

        let x = {
            where: condition, include: [
                { model: User, where: user_condition, attributes: ["name", "email"] },

                {
                    model: Bank,
                    where: {
                        is_verify: 1,
                        '$P2pOrder.payment_type$': {
                            [Op.substring]: 'bank_transfer'
                        },

                    },
                    required: false
                },
                {
                    model: UPI,
                    where: {
                        is_verify: 1,
                        '$P2pOrder.payment_type$': {
                            [Op.substring]: 'UPI'
                        },
                    },
                    required: false
                },
                {
                    model: P2P_Trade,
                    as: 'seller',
                    attributes: ['id', 'seller_order_id', 'buyer_order_id'],
                    order: [['id', 'DESC']],


                },
                {
                    model: P2P_Trade,
                    as: 'buyer',
                    attributes: ['id', 'seller_order_id', 'buyer_order_id'],
                    order: [['id', 'DESC']],


                }
            ],
            order: [
                ['id', 'DESC'],
                [{ model: P2P_Trade, as: 'buyer' }, 'id', 'DESC'],
                [{ model: P2P_Trade, as: 'seller' }, 'id', 'DESC'],

            ],
        };
        var total_count = await P2P_Order.count({ where: condition });

        const pagination = Pagination.getPaginate(req, "id");
        const finalQuery = Object.assign(pagination, x);



        let buyorder1 = await P2P_Order.findAll(finalQuery);

        buyorder1 = buyorder1.map(async function (el) {
            var d = await completion_rate(el.user_id)
            el.dataValues.completion_rate = d;
            return el


        });
		
		

        let orderList = await Promise.all(buyorder1)
		

        orderList = Pagination.paginate(
            pagination.page,
            orderList,
            pagination.limit,
            total_count
        );

        if (!orderList) {
            return res.json(status.failed('There is no any order'));

        }
        return res.json(status.success('orders fetched successfully', orderList));

    } catch (error) {
        console.log(error);
    }

}
//////////////////CANCEL OREDR API////////////////////////////
async function cancelOrder(req, res) {
    const today = new Date();
    let match_id = req.query.match_id;

    let validation = new Validator(req.body, {
        'remark': 'string|max:255'
    });

    if (validation.fails()) {
        return res.json(status.failed(firstError(validation)));
    }


    let match_order = await P2P_Trade.findOne({
        where: {
            id: match_id, created_at: {
                [Op.between]: [startOfDay(today), endOfDay(today)]
            }, status: OS.ORDER_STATUS.processing
        },
        include: [{ model: P2P_Order, as: "seller" }, { model: P2P_Order, as: "buyer" }]
    });

    if (!match_order) {
        return res.json(status.failed('Invalid order'));
    }


    let p2p_order = {
        seller: match_order.seller,
        buyer: match_order.buyer
    }

    if (!p2p_order) {
        return res.json(status.failed('There is issue to get user'));
    }

    if ((p2p_order.seller.status == OS.ORDER_STATUS.completed || p2p_order.seller.status == OS.ORDER_STATUS.partially_completed) && (p2p_order.buyer.status == OS.ORDER_STATUS.completed || p2p_order.buyer.status == OS.ORDER_STATUS.partially_completed)) {
        return res.json(status.success('Order fetched successfully'))
    }

    let newItem = {
        status: p2p_order.seller.old_status,
    }
    let condition = {
        id: p2p_order.seller.id,
        status: {
            [Op.notIn]: [OS.ORDER_STATUS.completed, OS.ORDER_STATUS.partially_completed]
        },
    }
    let newItem1 = {
        status: OS.ORDER_STATUS.canceled,
        remark: req.body.remark
    }
    let condition1 = {
        id: p2p_order.buyer.id,
        user_id: p2p_order.buyer.user_id,
        status: {
            [Op.notIn]: [OS.ORDER_STATUS.completed, OS.ORDER_STATUS.canceled]
        }

    }

    let another_user = await P2P_Order.update(newItem, { where: condition });
    let user = await P2P_Order.update(newItem1, { where: condition1 });
    let trade = await P2P_Trade.update(newItem1, { where: { id: match_id } });

    if (another_user && user && trade) {
        let data = {
            user_id: match_order.seller.user_id,
            currency: match_order.seller.currency,
            attached_id: match_id
        }

        data.amount = match_order.buyer.user_id == match_order.user_id ? match_order.quantity : CL.div(parseFloat(match_order.quantity), parseFloat(match_order.at_price));

        // event.emit("cancelWallet", data);

        return res.json(status.success('your order has cancelled '));
    }
    return res.json(status.failed('Server Issue'));
}

//payment types... 
async function PaymentType(req, res) {
    let user_bank = await Bank.findOne({ where: { user_id: req.user.id, is_verify: 1 } });
    let user_upi = await UPI.findOne({ where: { user_id: req.user.id, is_verify: 1 } });

    if (!user_bank) {
        return res.send(status.failed('There Is No Bank Registered By This User'));
    }


    let data = {
        bank_transfer: user_bank,
        UPI: user_upi

    }

    return res.send(status.success('User Payment Details Fetched Successfully', data));
}

//user P2P wallets...
async function userP2PWallet(req, res) {
    let p2p_wallet = await P2P_Wallet.findOne({ where: { user_id: req.user.id } });
    if (!p2p_wallet) {
        return res.send(status.success("There Is No Wallet Associated To This User"));
    }

    return res.send(status.success("User Wallet Fetched Successfully", p2p_wallet));

}

//P2P get Wallet transaction .... 
async function P2pWalletTransaction(req, res) {
    let p2p_wallet_trans = await P2P_Ex_transaction.findAll({ where: { user_id: req.user.id } });
    if (!p2p_wallet_trans) {
        return res.send(status.success("There Is No Wallet Associated To This User"));
    }
    const pagination = Pagination.getPaginate(req);
    const page = pagination.page
    const limit = pagination.limit

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let result1 = orderList.slice(startIndex, endIndex);
    let total_count = _.size(orderList);


    let result = Pagination.paginate(page, result1, limit, total_count);
    return res.send(status.success("User Wallet Fetched Successfully", result));
}

export default {
    expireOrder,
    create,
    getOrderList,
    cancelOrder,
    getAllOrderList,
    PaymentType,
    userP2PWallet,
    P2pWalletTransaction

}