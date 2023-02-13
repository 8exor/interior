import status from "../Traits/Status.js";
import myEvents from "../../RunnerEngine/Emitter.js";
import Sequelize from "sequelize";
import { P2P_Wallet } from "../Models/P2P_Wallet.js";
import { P2P_WalletTransaction } from "../Models/P2P_WalletTransaction.js";
import verify from '../Common/verification.js'
import event from "../Events/Event.js";
import { P2P_Order } from '../Models/P2P_Order.js'
import { P2P_WalletLog } from "../Models/P2P_WalletLog.js";
import { CL } from "cal-time-stamper";
import OS from "../Common/Order_Status.js";
import { User } from "../../Models/User.js";
import Pagination from "../Common/Pagination.js";
import axios from 'axios';
import _ from 'lodash';
import dotenv from "dotenv";
import { startOfDay, endOfDay } from "date-fns";
import Validator from 'validatorjs';
import { UserCrypto } from '../../Models/UserCrypto.js';
import { Ledger_Log_Events, TransactionType } from "../../Common/AllEvents.js";
import allEmitter from "../Common/allEmitter.js";



dotenv.config();


const { Op } = Sequelize;

function firstError(validation) {
    let first_key = Object.keys(validation.errors.errors)[0];
    return validation.errors.first(first_key);
}


//////////////////////TOTAL BALANCE IN P2P TRADE FOR ADMIN PANNEL///////////////////////////////////
async function total_balance(req, res) {
    try {
        let balance = await P2P_Wallet.findAll({ where: { currency: 'USDT' } });
        var data = balance.map((el) => {
            var a = CL.add(el.total_balance, el.freeze_balance)
            return a
        })

        const sum = data.reduce((partialSum, a) => partialSum + a, 0);
        console.log(sum);
        return res.json(status.success("total balance fetched", sum));


    } catch (error) {
        console.log(error);
        return res.json(status.failed("there is some error in getting wallet info"))
    }
}

///////////////P2P WALLET TO EXCAHNGE WALLET TRANSFER///////////////////

async function P2p_wallet_trans(req, res) {
    try {
        const reqBody = req.body;
        const user_id = req.user.id;
        const verify_bank = await verify.bank_status(user_id);
        const verify_kyc = await verify.kyc_status(user_id);

        let validation = new Validator(reqBody, {
            'currency': 'required|in:USDT',
            'amount': 'required'
        });

        if (validation.fails()) {
            return res.json(status.failed(firstError(validation)));
        }


        let p2p_wallet = await P2P_Wallet.findOne({ where: { user_id: user_id, total_balance: { [Op.gte]: parseFloat(reqBody.amount) }, currency: reqBody.currency } });
        let exch_wallet = await UserCrypto.findOne({ where: { user_id: user_id, currency: reqBody.currency }, include: [{ model: User, attributes: ['status'] }] });


        if (!p2p_wallet && exch_wallet) {
            return res.send(status.failed('There is problem with user wallet'))
        }


        if (!p2p_wallet || verify_bank.status_code == 0 || verify_kyc.status_code == 0 || exch_wallet.user.status != true) {
            return !p2p_wallet ? res.json(status.failed("your wallet has no such currency or enough balance")) : (verify_bank.status_code == 0 ? res.json(verify_bank) : res.json(verify_kyc));
        }

        let transWallet_id = await P2P_WalletTransaction.create({
            user_id: user_id,
            currency: reqBody.currency,
            amount: reqBody.amount,
            transaction_type: 'withdraw'
        })

        let data = {
            user_id: user_id,
            currency: reqBody.currency,
            transaction_type: 'deposit',
            amount: reqBody.amount,
            symbol: 'USDT',
            attached_id: transWallet_id.id,
            comment: `${reqBody.amount}${reqBody.currency} is credited to your exchange wallet`
        }



        //P2P Amount Debit Event.... 
        let p2p_event = event.emit("debitWallet", data);


        ///Exchange-P2P Credit Event...
        let exch_event = myEvents.emit(Ledger_Log_Events.add_credit, data);

        if (!p2p_event && !exch_event) {
            return res.send(status.failed('There is problem with amount transfer'))

        }
        let user_crypto = await UserCrypto.findOne({ where: { user_id: data.user_id, currency: data.currency } });

        if (!user_crypto) {

            user_crypto = await UserCrypto.Create({ user_id: data.user_id, currency: data.currency, balance: data.amount });
        }

        user_crypto = await UserCrypto.update({ balance: CL.add(exch_wallet.balance, data.amount) }, { where: { user_id: data.user_id, currency: data.currency } });
        let p2p_wallet_trans = await P2P_WalletTransaction.update({ status: OS.ORDER_STATUS.completed }, { where: { id: transWallet_id.id, status: { [Op.notIn]: [OS.ORDER_STATUS.canceled, OS.ORDER_STATUS.completed] } } });    
        return user_crypto ? res.send(status.success('The requested amount transfer successfully')) : res.send(status.failed('There is some problem to transfer the amount'))


    } catch (error) {
        console.log(error);
        res.json(status.failed(error));
    }
}


/////////////////////P2P WALLET CREDIT FROM EXCHANGE WALLET////////////////////////////////

async function P2p_wallet_credit(req, res) {
    try {

        const user_id = req.user.id;
        const reqBody = req.body;
        const verify_bank = await verify.bank_status(user_id);
        const verify_kyc = await verify.kyc_status(user_id);


        let validation = new Validator(reqBody, {
            'currency': 'required|in:USDT',
            'amount': 'required'
        });

        if (validation.fails()) {
            return res.json(status.failed(firstError(validation)));
        }


        if (verify_bank.status_code == 0 || verify_kyc.status_code == 0) {
            return verify_bank.status_code == 0 ? res.json(verify_bank) : res.json(verify_kyc);
        }

        let user_wallet = await UserCrypto.findOne({ where: { user_id: user_id, currency: reqBody.currency }, include: [{ model: User, attributes: ['status'] }] });


        let transWallet_id = await P2P_WalletTransaction.create({
            user_id: user_id,
            currency: reqBody.currency,
            amount: reqBody.amount,
            transaction_type: 'deposit'
        });

        let data = {
            user_id: user_id,
            currency: reqBody.currency,
            transaction_type: 'withddraw',
            amount: reqBody.amount,
            symbol: 'USDT',
            attached_id: transWallet_id.id,
            comment: `${reqBody.amount}${reqBody.currency} is transfered to your P2P wallet`
        }

        //Exchange-P2P Debit Event... 
        let exch_event = myEvents.emit(Ledger_Log_Events.add_debit, data);

        let p2p_event = event.emit("creditWallet", data);

        if (!exch_event && !p2p_event) {
            return res.send(reply.failed('There is some problem to transfer the amount'));
        }

        let user_crypto = await UserCrypto.findOne({ where: { user_id: data.user_id, currency: data.currency } });

        if (!user_crypto) {
            return res.send(status.failed("You have no any wallet to transfer"));
        }
        
        user_crypto = await UserCrypto.update({ balance: CL.sub(user_wallet.balance, data.amount) }, { where: { user_id: data.user_id, currency: data.currency } });

        let p2p_wallet_trans = await P2P_WalletTransaction.update({ status: OS.ORDER_STATUS.completed }, { where: { id: transWallet_id.id, status: { [Op.notIn]: [OS.ORDER_STATUS.canceled, OS.ORDER_STATUS.completed] } } });

        if (user_crypto && p2p_wallet_trans) {
            return res.json(status.success(`${reqBody.amount} ${reqBody.currency} is credited to your P2P wallet`))
        }
        return res.send(reply.failed('There is some problem to transfer the amount'));

    } catch (error) {
        console.log(error);
        return res.json(status.failed('there is some error', error));
    }
}

///////P2P WALLET TO EXCHANGE WALLET TRANSACTION LIST WITH CONDITIONS//////////////// FOR ADMIN PANNEL
async function wall_trans_list(req, res) {

    try {
        const where_cond = {};
        const include_where = {};
        const request = req.query;
        let date = req.query.date;
        let today = new Date(date);

        if (request.transaction_type) {
            where_cond.transaction_type = request.transaction_type
        }

        if (request.amount) {
            where_cond.amount = { [Op.eq]: [request.amount] };

        }

        if (request.date) {
            where_cond.created_at = { [Op.between]: [startOfDay(today), endOfDay(today)] }

        }


        if (request.status) {
            where_cond.status = { [Op.eq]: [request.status] }

        }

        if (request.currency) {
            where_cond.currency = { [Op.eq]: [request.currency] }

        }

        if (request.name) {
            include_where.name = { [Op.substring]: [request.name] }
            // include_Cond.push({ model: User, where: { name: { [Op.eq]: request.name } } });

        }

        if (request.email) {
            include_where.email = { [Op.substring]: [request.email] }


        }

        const pagination = Pagination.getPaginate(req);
        const page = pagination.page
        const limit = pagination.limit

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let list = await P2P_WalletTransaction.findAll({ where: where_cond, include: [{ model: User, attributes: ['name', 'email'], where: include_where }] });
        let result1 = list.slice(startIndex, endIndex);
        let total_count = _.size(list);


        let result = Pagination.paginate(page, result1, limit, total_count);

        if (request.id) {
            return res.json(status.success(`order details fectched successfully`, result));

        }

        return res.json(status.success(`order details fectched successfully`, result));

    } catch (error) {

        console.log(error)
        return res.json(status.failed("there is some error", error));
    }
}


async function order_list(req, res) {

    try {
        const where_cond = {};
        const include_where = {};
        const request = req.query;
        let date = req.query.date;
        let today = new Date(date);

        if (request.order_type) {
            where_cond.order_type = request.order_type
        }

        if (request.max_quantity) {
            where_cond.max_quantity = { [Op.eq]: [request.max_quantity] };

        }

        if (request.status) {
            where_cond.status = { [Op.eq]: [request.status] }

        }
        if (request.created_at) {   
            where_cond.created_at = { [Op.eq]: [request.created_at] }
        }

        if (request.at_price) {
            where_cond.at_price = { [Op.eq]: [request.at_price] }

        }

        if (request.total) {
            where_cond.total = { [Op.eq]: [request.total] }
        }

        if (request.date) {
            where_cond.created_at = { [Op.between]: [startOfDay(today), endOfDay(today)] }

        }

        if (request.name) {
            include_where.name = { [Op.substring]: [request.name] }
        }

        if (request.email) {
            include_where.email = { [Op.substring]: [request.email] }
        }

        const pagination = Pagination.getPaginate(req);
        const page = pagination.page
        const limit = pagination.limit

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let list = await P2P_Order.findAll({ where: where_cond, include: [{ model: User, attributes: ['name', 'email'], where: include_where }] });
        let result1 = list.slice(startIndex, endIndex);
        let total_count = _.size(list);


        let result = Pagination.paginate(page, result1, limit, total_count);

        if (request.id) {
            return res.json(status.success(`orders of id details fectched successfully`, result));
        }


        return res.json(status.success(`order details fectched successfully`, result));
    } catch (error) {

        console.log(error)
        return res.json(status.failed("there is some error", error));
    }

}




export default {
    P2p_wallet_trans,
    P2p_wallet_credit,
    wall_trans_list,
    total_balance,
    order_list
};




