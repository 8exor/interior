import LaunchToken from "../Models/LaunchToken.js";
import LaunchpadRound from "../Models/LaunchpadRound.js";
import LaunchpadOrder from "../Models/LaunchpadOrder.js";
import Helper from "../../Common/Helper.js";
// import OrdersDetail from "../Models/OrdersDetail.js";
import { TokenCreateRule, RoundCreateRule, OrderPlaceRule, UpdateTokenRule } from "../Rules/TokenRule.js"
import { UserCrypto } from "../../Models/UserCrypto.js";
import { User } from "../../Models/User.js";
import { UserWalletLedger } from './../../Models/UserWalletLedger.js';

import crypto from "crypto";
import _ from "lodash";
import Validator from "validatorjs";
import reply from "../../Common/reply.js";
import { fn, col, json } from 'sequelize';
import { CL } from "cal-time-stamper";

function firstError(validator) {
    let first_key = Object.keys(validator.errors.errors)[0];
    return validator.errors.first(first_key);
}

const UserWalletLogs = async ({ user_id, currency, attached_id = null, debit_amount = 0, credit_amount = 0, balance, freezed_balance, comment }) => {

    let re = await UserWalletLedger.create({
        user_id,
        currency,
        transaction_type: 'staking',
        attached_id,
        debit_amount,
        credit_amount,
        balance,
        freezed_balance,
        main_balance: CL.add(balance, freezed_balance),
        comment
    });

    return re;

}

const imageupload = (req, res) => {
    if (!req.filedata || req?.filedata?.status_code == 0) {
        return res.send(reply.failed(req?.filedata?.message));
    }
    return res.send(reply.success("File uploaded successfully!!", req?.filedata?.message));
}

const tokenCreate = async (req, res) => {
    var request = req.body;

    let validator = new Validator(request, TokenCreateRule);
    if (validator.fails()) { return res.json(reply.failed(firstError(validator))); }
    const Is_token_available = await LaunchToken.findOne({
        raw: true,
        where: { symbol: request.symbol }
    });
    if (Is_token_available) { return res.json(reply.failed("Token already exists.!!.")); }

    let total_token_allocation = _.values(request.token_allocation).reduce(function (pv, cv) { return parseFloat(pv) + parseFloat(cv); }, 0);

    let total_use_of_funds = _.values(request.use_of_funds).reduce(function (pv, cv) { return parseFloat(pv) + parseFloat(cv); }, 0);

    if (parseFloat(total_token_allocation) > 100) {
        return res.send(reply.failed(`Total token_allocation provided is ${parseFloat(total_token_allocation)}% must not be greater than 100%.`));
    }
    if (parseFloat(total_use_of_funds) > 100) {
        return res.send(reply.failed(`Total use_of_funds provided is ${parseFloat(total_use_of_funds)}% must not be greater than 100%.`));
    }
    try {
        request.symbol = (request.symbol).toUpperCase();
        request.name = `${(request.name).toUpperCase()}(${request.symbol})`;
        const created = await LaunchToken.create(request);
        return res.json(reply.success("Token created successfully!!.", created));
        // return res.json(reply.success("Token created successfully!!.", request));

    } catch (err) {
        console.log("err", err)
        return res.json(reply.failed("Unable to create token!!"));
    }

}

const roundCreate = async (req, res) => {
    var request = req.body;

    let validator = new Validator(request, RoundCreateRule);
    if (validator.fails()) { return res.json(reply.failed(firstError(validator))); }

    const token_data = await LaunchToken.findOne({
        attributes: ['started_at', 'expired_at', 'name', 'symbol', 'total_limits'],
        where: { id: request.launch_token_id }
    });
    if (!token_data) { return res.json(reply.failed("Invalid token!.")); }

    const Is_round_Available = await LaunchpadRound.findOne({
        where: { launch_token_id: request.launch_token_id }
    });
    if (Is_round_Available) { return res.json(reply.failed("Round already created!!.")); }

    let startAt = token_data.started_at;
    let expireAt = token_data.expired_at;
    let total_limits = token_data.total_limits;
    request.name = token_data.name;
    request.symbol = token_data.symbol;

    let x = _.map(request.rounds, 'started_at'); // starting date should be greater than or equal to
    let y = _.map(request.rounds, 'expired_at'); // ending date should be less than or equal to  
    let z = x.concat(y); // merge two fields
    let merge_rounds = z.map((value) => {
        if (startAt > value) { return "not"; }
        if (expireAt < value) { return "not"; }
        if (startAt < value && expireAt > value) { return "working"; }
        if (startAt == value || expireAt == value) { return "exact"; }
    });
    if (merge_rounds.indexOf("not") > -1) { return res.json(reply.failed(`started_at and expired_at date should be between  ${startAt} to ${expireAt}`)) }

    var total_round_limit = 0;
    var error_list = [];
    request.rounds.filter((element, index) => {
        element.t_id = crypto.randomBytes(5).toString('hex');

        if (_.gt(parseFloat(element.total_limits), parseFloat(total_limits))) {
            let error = `Round ${index + 1} total limit should not be greater than ${total_limits}`;
            error_list.push(error);
        }
        total_round_limit = CL.add(total_round_limit, element.total_limits);
    });

    if (error_list.length > 0) {
        return res.json(reply.failed(error_list.toString()));
    }

    if (_.gt(parseFloat(total_round_limit), parseFloat(total_limits))) {
        return res.json(reply.failed(`Total limit must be less than ${total_limits}`));
    }

    try {
        const data = await LaunchpadRound.create(request);
        return res.json(reply.success("Round created successfully!!.", data));
    } catch (err) {
        return res.json(reply.failed("Unable to create round!!."))
    }
}

const getsymbol = async (req, res) => {
    try {
        const token_data = await LaunchToken.findAll({
            attributes: ['id', 'name', 'symbol', 'started_at', 'expired_at']
        });
        if (!token_data) { return res.json(reply.failed("Invalid token!.")) }
        return (res.json(reply.success("Tokens symbol fetched successfully!!", token_data)))
    } catch (err) {
        console.log({ err: err });
        return (res.json(reply.failed("Unable to fetch symbol.")))
    }
}

const orderPlace = async (req, res) => {
    var request = req.body;

    let validator = new Validator(request, OrderPlaceRule);
    if (validator.fails()) { return res.json(reply.failed(firstError(validator))); }

    const hasRound = await LaunchpadRound.findOne({
        attributes: ['rounds', 'name'],
        where: { launch_token_id: request.launch_token_id }
    });

    if (hasRound == null) { return res.send(reply.failed("Round is not available.")); }

    let round_detail = hasRound.rounds.find((e) => e.t_id == request.launch_round_id);

    if (!round_detail) { return res.send(reply.failed("Round is not exists")); }

    if (!round_detail.status) { return res.send(reply.failed("Round is not active")); }

    if (_.gte(parseFloat(round_detail.min_amt), parseFloat(request.amount))) {
        return res.send(reply.failed(`Amount must be greater than ${parseFloat(round_detail.min_amt)}`));
    }
    if (_.lte(parseFloat(round_detail.max_amt), parseFloat(request.amount))) {
        return res.send(reply.failed(`Amount must be less than ${parseFloat(round_detail.max_amt)}`));
    }

    let already_placed = await LaunchpadOrder.findAll({
        attributes: [
            [fn('SUM', col('amount')), 'n_amount'] // To add the aggregation...
        ],
        where: { launch_round_id: request.launch_round_id }
    });

    var total_placed_order = (already_placed?.n_amount == null) ? 0 : already_placed?.n_amount;

    if (total_placed_order > round_detail.total_limits) {
        return res.send(reply.failed(`Only ${(total_placed_order - round_detail.total_limits)} token left in this round!!`));
    }

    var total = CL.mul(request.amount, round_detail.price);

    const user_crypto = await UserCrypto.findOne({
        attributes: ['id', 'currency', 'balance', 'freezed_balance'],
        where: { user_id: req.user?.id, currency: request.currency }
    });

    if (!user_crypto) { return res.json(reply.failed("Insufficent balance.")) }

    let c_bal = user_crypto?.balance ?? 0;

    if (parseFloat(c_bal) < parseFloat(total)) {
        return res.json(reply.failed("Insufficent balance."))
    }

    user_crypto.balance = CL.sub(c_bal, total);
    await user_crypto.save();

    try {
        const data = await LaunchpadOrder.create({
            name: hasRound.name,
            user_id: req.user.id,
            amount: request.amount,
            price: round_detail.price,
            total: total,
            currency: request.currency,
            launch_token_id: request.launch_token_id,
            launch_round_id: request.launch_round_id
        });
        return res.json(reply.success("Order placed successfully!!", data))
    } catch (err) {
        console.log("err", err);
        return res.json(reply.failed("Unable to placed orders!!"))
    }
}

// const orderPlacedDetails = async (req, res) => {
//     try {
//         const data = await LaunchToken.findOne({
//             attributes: { exclude: ['team'] },
//             // group: ['status'],
//             where: { id: req.user.id },
//             include:
//                 [{ model: LaunchpadRound, attributes: ['rounds'] }, { model: LaunchpadOrder }]
//         });
//         if (!data) { return res.json(reply.failed("Data not found.")) }
//         const result = data;
//         if (result?.launchpad_rounds) {
//             result.launchpad_rounds = result.launchpad_rounds.map((e) => {
//                 console.log(e.rounds);
//                 e.rounds = e.rounds?.map((value) => {
//                     console.log(value.status);
//                     let d = [];
//                     if (value.status == true) {
//                         d.push(value);
//                     }
//                     return d;
//                 });
//                 return e;
//             });
//         }
//         return (res.json(reply.success("Fetch All Tokens details successfully.", result)))
//     } catch (err) {
//         console.log({ err: err });
//         return (res.json(reply.failed("Data not found.")))
//     }

// }

const AllTokenDetails = async (req, res) => {
    try {
        const data = await LaunchToken.findAll({
            attributes: ['id', 'name', 'symbol', 'status'],
            include: [{ model: LaunchpadRound }]
        });
        if (!data) { return res.json(reply.failed("Invalid token!.")) }

        let result = reply.groupBy('status', data) ?? []; // Group by status field
        return (res.json(reply.success("Tokens fetched successfully!!.", result.ongoing)))
    } catch (err) {
        console.log({ err: err });
        return (res.json(reply.failed("Unable to fetch tokens!!.")))
    }

}

const GetAllOrders = async (req, res) => {


    // Tottal Round coin
    // Total user --
    // Total sell coin -- 
    // Total pending coin

    var round_id = req.params.t_id;
    var query = {
        where: { launch_round_id: round_id },
        include: { model: User }
    }
    try {
        var order_data = await LaunchpadOrder.findAll(query);

        let stat = await LaunchpadOrder.findAll({
            where: { launch_round_id: round_id },
            attributes: [
              [fn('sum', col('amount')), 'total_sell_coin'],
              [fn('count', fn('DISTINCT', col('user_id'))), 'total_user']
            ],
            raw:true
        });

        // console.log(stat[0]);

        var portfolio = {
            total_sell_coin: (stat[0].total_sell_coin != null) ? stat[0].total_sell_coin : 0,
            total_user: stat[0].total_user,
            total_round_coins:"",
            total_pending_coins:""
        }


        if(order_data.length > 0){
            let Token = await LaunchpadRound.findOne({where: { launch_token_id: order_data[0].launch_token_id }})
            let t_round = Token.rounds.find((v) => v.t_id == round_id);
            portfolio.total_round_coins = t_round.total_limits;
            portfolio.total_pending_coins = CL.sub(t_round.total_limits, portfolio.total_sell_coin);
        }

        if (!order_data) { return res.json(reply.failed("Invalid orders")); }

        let pagination = Helper.getPaginate(req, 'created_at');
        if (req.query?.page) { order_data.where = { page: req.query?.page } }

        let total_count = await LaunchpadOrder.count(query);
        order_data = Object.assign(query, pagination);
        var result = await LaunchpadOrder.findAll(order_data);

        result = reply.paginate(
            pagination.page,
            result,
            pagination.limit,
            total_count
        );

        return res.json(reply.success("Orders fetched Successfully!!", result, {portfolio}));
    } catch (err) {
        console.log({ err: err });
        return (res.json(reply.failed("Unable to fetch orders!!.")))
    }

}

const admin_token_fetch = async (req, res) => {
    // if(req.user.role != "admin") { return res.json(reply.failed("Not authorized to access token.")) }
    try {
        const data = await LaunchToken.findAll({
            group: ['status', 'id'],
            include:
                [{ model: LaunchpadRound }]
        });
        if (!data) { return res.json(reply.failed("Invalid token!.")) }
        let result = reply.groupBy('status', data) ?? []; // Group by status field
        return (res.json(reply.success("Tokens fetched Successfully!!", result)))
    } catch (err) {
        console.log({ err: err });
        return (res.json(reply.failed("Unable to fetch tokens!!.")))
    }
}

const UsertokenFetch = async (req, res) => {
    try {
        const data = await LaunchToken.findAll({
            attributes: { exclude: ['team'] },
            group: ['status', 'id'],
            include:
                [{ model: LaunchpadRound }]
        });
        if (!data) { return res.json(reply.failed("Invalid token!.")) }
        let filter_by_status = data.filter((e) => {
            return e.active_status == 1;
        });
        let result = reply.groupBy('status', filter_by_status) ?? []; // Group by status field
        return (res.json(reply.success("Tokens fetched Successfully!!", result)))
    } catch (err) {
        console.log({ err: err });
        return (res.json(reply.failed("Unable to fetch tokens!!.")))
    }
}

const update_status = async (req, res) => {
    var token_id = req.params?.id;
    var status = req.params?.active_status;
    if (status == 'true' || status == 'false') {
        status = status == 'true' ? 1 : 0;
    }
    const token_data = await LaunchToken.findByPk(token_id);
    if (!token_data) { return res.json(reply.failed("Invalid Data.")); }

    try {
        token_data.active_status = status;

        token_data.save();
        return res.json(reply.success("Token status updated successfully!!."));
    } catch (err) {
        console.log({ err: err });
        return res.json(reply.failed("Unable to update at this moment."));
    }
}

const orderFetchone = async (req, res) => {
    var token_id = req.params?.id;
    try {
        const data = await LaunchToken.findByPk(token_id, {
            include: [{ model: LaunchpadRound }]
        });
        if (data === null) {
            return res.json(reply.failed("Invalid token!."))
        }
        return res.json(reply.success("Token details fetched Successfully!!", data))
    } catch (err) {
        console.log({ err: err });
        return res.json(reply.failed("Unable to fetched token!!."))
    }
}

const deleteToken = async (req, res) => {
    var token_id = req.params?.id;
    const data_id = await LaunchToken.findByPk(token_id)
    if (data_id === null) {
        return res.json(reply.failed("Invalid token!."))
    }
    try {
        const token_delete = await LaunchToken.destroy({ where: { id: data_id.id } });
        return res.json(reply.success("Token deleted successfully!!.", token_delete));
    } catch (err) {
        console.log({ err: err });
        return res.json(reply.failed("Unable to delete token!!."));
    }
}

const updateToken = async (req, res) => {
    var request = req.body;
    var token_id = req.params?.id;
    const data_id = await LaunchToken.findByPk(token_id);
    if (data_id === null) { return res.json(reply.failed("Invalid token ID.")) }
    request.id = data_id.id
    let validator = new Validator(request, UpdateTokenRule);
    if (validator.fails()) { return res.json(reply.failed(firstError(validator))); }

    let total_token_allocation = _.values(request.token_allocation).reduce(function (pv, cv) { return parseFloat(pv) + parseFloat(cv); }, 0);

    let total_use_of_funds = _.values(request.use_of_funds).reduce(function (pv, cv) { return parseFloat(pv) + parseFloat(cv); }, 0);

    if (parseFloat(total_token_allocation) > 100) {
        return res.send(reply.failed(`Total token_allocation provided is ${parseFloat(total_token_allocation)}% must not be greater than 100%.`));
    }
    if (parseFloat(total_use_of_funds) > 100) {
        return res.send(reply.failed(`Total use_of_funds provided is ${parseFloat(total_use_of_funds)}% must not be greater than 100%.`));
    }

    try {
        request.symbol = (request.symbol).toUpperCase();
        request.name = `${(request.name).toUpperCase()}`;
        await LaunchToken.update(request, { where: { id: data_id.id } });
        return res.json(reply.success("Token updated successfully!!."));
    } catch (err) {
        console.log({ err: err });
        return res.json(reply.failed("Data not found."));
    }
}

const orderfind = async (req, res) => {
    var condition = { include: { model: LaunchToken } };
    let pagination = Helper.getPaginate(req, 'createdAt');
    condition.where = { user_id: req.user.id };
    let total_count = await LaunchpadOrder.count(condition);
    condition = Object.assign(condition, pagination);
    let result = await LaunchpadOrder.findAll(condition);
    result = reply.paginate(
        pagination.page,
        result,
        pagination.limit,
        total_count
    )
    try {
        return res.json(reply.success("Orders fetched Successfully!!", result));
    } catch (error) {
        return (res.json(reply.failed("Unable to fetch orders!!.")));
    }

}

const transferTokenByAdmin = async (req, res) => {

    // req.user = { id: 1 }

    let request = req.params;

    let validation = new Validator(request, {
        order_id:'required'
    });

    // currency: 'required',
    // amount: 'required|numeric',
        

    if (validation.fails()) {
        return res.json(reply.failed(firstError(validation)));
    }

    let OrderDetail = await LaunchpadOrder.findOne({where:
        {
            id:request.order_id,
            status: 'pending'
        },
        include: { model:LaunchToken}
    });

    if(!OrderDetail){
        return res.json(reply.failed('Invalid Data!!'));
    }

    if(OrderDetail?.launch_token?.symbol == ""){
        return res.json(reply.failed('Invalid Data!!'));
    }

    var wD =  {
       'user_id' : OrderDetail.user_id,
       'currency' : OrderDetail.launch_token.symbol,
       'amount': OrderDetail.amount
    }

    // console.log(wD);

    try {

        // # Add Amount in User Crypto ----
        var user_crypto = await UserCrypto.findOne({
            where: {
                user_id: wD.user_id,
                currency: wD.currency
            }
        });

        

        if (user_crypto) {
            user_crypto.balance = CL.add(user_crypto.balance, wD.amount);
            await user_crypto.save();
        }
        else {
            // Create New Crypto
            user_crypto = await UserCrypto.create({
                user_id: wD.user_id,
                currency: wD.currency,
                balance: wD.amount,
                freezed_balance: "0"
            });
        }

        // console.log(user_crypto);

        let user_wallet_log = await UserWalletLogs({
            user_id: wD.user_id,
            currency: wD.currency,
            // attached_id: wallet_log.id,
            credit_amount: wD.currency,
            balance: user_crypto.balance,
            freezed_balance: user_crypto.freezed_balance,
            comment: `${wD.currency} transfered from Lauchpad`
        });

        OrderDetail.status = "completed";
        await OrderDetail.save();

        return res.json(reply.success('Successfully Transfered To Portfolio'));
    } catch (error) {
        return res.json(reply.failed('Unable to transfer at this moment'));
    }

}

export default {
    orderfind,
    imageupload,
    tokenCreate,
    roundCreate,
    getsymbol,
    orderPlace,
    // orderPlacedDetails,
    AllTokenDetails,
    GetAllOrders,
    admin_token_fetch,
    UsertokenFetch,
    update_status,
    orderFetchone,
    deleteToken,
    updateToken,
    transferTokenByAdmin
}

