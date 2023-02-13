import { StakingPlan } from "../Models/StakingPlan.js";
import Validator from "validatorjs";
import reply from "../../Common/reply.js";
import _ from "lodash";
import pkg from "sequelize";
import { CL } from "cal-time-stamper";
import { UserStaking } from "./../Models/UserStaking.js";
import { UserCrypto } from "../../Models/UserCrypto.js";
import { StakingWalletLogs } from "../Models/StakingWalletLogs.js";
import { Model } from "../../Database/sequelize.js";
import { User } from "../../Models/User.js";

import { UserWalletLedger } from "./../../Models/UserWalletLedger.js";
import { Currency } from "./../../Models/Currency.js";
import variables from "../../Config/variables.js";
import Helper from "../../Common/Helper.js";
import createWalletLog from "./../Helpers/CreateLogs.js";

const { Op, QueryTypes } = pkg;

const mathConfig = { returnString: true, eMinus: Infinity, ePlus: Infinity };

function firstError(validation) {
  let first_key = Object.keys(validation.errors.errors)[0];
  return validation.errors.first(first_key);
}

function getDate(days = 0) {
  let d = new Date();
  let r = d.setUTCDate(d.getUTCDate() + days);
  return r;
}

function addInDate(roi_interval) {
  let obj = {};
  switch (roi_interval) {
    case "D":
      obj = { days: 1 };
      break;
    case "W":
      obj = { days: 7 };
      break;
    case "M":
      obj = { months: 1 };
      break;
    case "Y":
      obj = { years: 1 };
  }

  return obj;
}
// object = { date,days,months,years }
function getCustomDate(object) {
  let now = Date.now();

  var D = new Date(now);
  var n_date;

  if (object?.date) {
    D = new Date(object?.date);
  }

  if (object?.days) {
    n_date = D.setUTCDate(D.getUTCDate() + object?.days);
  }
  if (object?.months) {
    n_date = D.setUTCMonth(D.getUTCMonth() + object?.months);
  }
  if (object?.years) {
    n_date = D.setUTCFullYear(D.getUTCFullYear() + object?.years);
  }

  return n_date ?? D;
}

function calculateRoiIncome(amount = 0, roi_percentage = 0) {
  return CL.div(
    CL.mul(amount, roi_percentage),
    100
  );
}

const UserWalletLogs = async ({
  user_id,
  currency,
  attached_id = null,
  debit_amount = 0,
  credit_amount = 0,
  balance,
  freezed_balance,
  comment,
}) => {
  let re = await UserWalletLedger.create({
    user_id,
    currency,
    transaction_type: "staking",
    attached_id,
    debit_amount,
    credit_amount,
    balance,
    freezed_balance,
    main_balance: CL.add(balance, freezed_balance),
    comment,
  });

  return re;
};

//------------------------------------------------//
//              STAKING WALLET LOGS               //
//------------------------------------------------//

const transferToPortfolio = async (req, res) => {
  // req.user = { id: 1 }

  let request = req.body;

  let validation = new Validator(request, {
    currency: "required",
    amount: "required|numeric",
  });

  if (validation.fails()) {
    return res.json(reply.failed(firstError(validation)));
  }

  if (parseFloat(request.amount) <= 0) {
    return res.json(reply.failed("Amount is too low"));
  }

  let user_stake_bal = await StakingWalletLogs.findOne({
    where: {
      user_id: req.user.id,
      currency: request.currency,
    },
    order: [["id", "DESC"]],
    // limit: 1
  });

  if (!user_stake_bal) {
    return res.json(reply.failed("Insufficient Balance"));
  }

  if (parseFloat(user_stake_bal.withdrawable) < parseFloat(request.amount)) {
    return res.json(reply.failed("Insufficient Balance"));
  }

  try {
    // # Debit In User Staking Wallet ----

    let { rows, fields } = await createWalletLog({
      user_id: req.user.id,
      currency: request.currency,
      transaction_type: "portfolio-transfer",
      debit: request.amount,
      withdraw_debit: request.amount,
      comment: `${parseFloat(request.amount)} transfered To Portfolio Wallet`,
    });

    // console.log({ rows, fields });

    // # Add Amount in User Crypto ----
    var user_crypto = await UserCrypto.findOne({
      where: {
        user_id: req.user.id,
        currency: request.currency,
      },
    });

    if (user_crypto) {
      user_crypto.balance = CL.add(
        user_crypto.balance,
        request.amount
      );
      await user_crypto.save();
    } else {
      // Create New Crypto
      user_crypto = await UserCrypto.create({
        user_id: req.user.id,
        currency: request.currency,
        balance: request.amount,
        freezed_balance: "0",
      });
    }

    let user_wallet_log = await UserWalletLogs({
      user_id: req.user.id,
      currency: request.currency,
      // attached_id: wallet_log.id,
      credit_amount: request.amount,
      balance: user_crypto.balance,
      freezed_balance: user_crypto.freezed_balance,
      comment: `${parseFloat(request.amount)} transfered from Portfolio Wallet`,
    });

    return res.json(reply.success("Successfully Transfered To Portfolio"));
  } catch (error) {
    return res.json(reply.failed("Unable to transfer at this moment"));
  }
};

//------------------------------------------------//
//              USER STAKING FUNCTIONS            //
//------------------------------------------------//

// Subscribe

const subscribe = async (req, res) => {
  // req.user = { id: 1 }

  let request = req.body;

  let validation = new Validator(request, {
    staking_plan_id: "required|numeric",
    amount: "required|numeric",
  });

  if (validation.fails()) {
    return res.json(reply.failed(firstError(validation)));
  }

  // Check if plan Exists
  let staking_plan = await StakingPlan.findByPk(request.staking_plan_id);

  if (!staking_plan) {
    return res.json(reply.failed("Invalid Staking Plan"));
  }
  // Check If Plan is Expired
  if (staking_plan.is_expired == 1) {
    return res.json(reply.failed("Staking Plan Already Expired"));
  }

  if (parseInt(staking_plan.plan_expiry_date) < getDate()) {
    staking_plan.is_expired = 1;
    await staking_plan.save();
    return res.json(reply.failed("Staking Plan Already Expired"));
  }

  // Check If Plan is activated yet or not
  if (staking_plan.activate_status == 0) {
    return res.json(reply.failed("Staking Plan Not Yet Activated"));
  }

  // Check plan min and plan max amount 
  if((parseFloat(staking_plan.min_stake_amount) > parseFloat(request.amount)) || (parseFloat(staking_plan.max_stake_amount) < parseFloat(request.amount)) ){
    return res.json(reply.failed(`Staking amount should be between ${staking_plan.min_stake_amount} to ${staking_plan.max_stake_amount}`));
  }

  // User has Balance ??
  let user_crypto = await UserCrypto.findOne({
    where: {
      user_id: req.user.id,
      currency: staking_plan.stake_currency,
    },
  });

  if (!user_crypto) {
    return res.json(reply.failed("Insufficient Balance"));
  }
  if (parseFloat(user_crypto.balance) < parseFloat(request.amount)) {
    return res.json(reply.failed("Insufficient Balance"));
  }

  if (parseFloat(staking_plan.remaining_pool_limit) >= parseFloat(request.amount)) {
    let new_pool_limit = CL.sub(
      staking_plan.remaining_pool_limit,
      request.amount
    );
    staking_plan.remaining_pool_limit = new_pool_limit;
  } else {
    return res.json(reply.failed("Not enough remaining Pool balance."));
  }

  let current_date = getCustomDate();
  let next_roi_date = getCustomDate(
    Object.assign({ date: current_date }, addInDate(staking_plan.roi_interval))
  );

  let create_obj = {
    user_id: req.user.id,
    staking_plan_id: request.staking_plan_id,
    amount: request.amount,
    next_roi_date: next_roi_date,
    activation_date: current_date,
    expiry_date: getCustomDate({
      date: current_date,
      days: staking_plan.maturity_days,
    }),
    roi_income: calculateRoiIncome(request.amount, staking_plan.roi_percentage),
    roi_interval: staking_plan.roi_interval,
    reward_currency: staking_plan.reward_currency,
    plan_type: staking_plan.plan_type,
  };

  try {
    // ########################################## update pool limit##################################### //
    let deduct_pool = await staking_plan.save();
    // Deduct amount from portfolio

    user_crypto.balance = CL.sub(
      user_crypto.balance,
      request.amount
    );
    let deduct_bal = await user_crypto.save();

    let user_stake = await UserStaking.create(create_obj);

    let user_wallet_log = await UserWalletLogs({
      user_id: req.user.id,
      currency: staking_plan.stake_currency,
      attached_id: user_stake.id,
      debit_amount: request.amount,
      balance: user_crypto.balance,
      freezed_balance: user_crypto.freezed_balance,
      comment: `Subscribed to Staking Plan ${request.staking_plan_id}`,
    });

    // Add Credit amount in Staking Wallet Logs

    let { rows, fields } = createWalletLog({
      user_id: req.user.id,
      user_stake_id: user_stake.id,
      transaction_type: "subscribed",
      currency: staking_plan.stake_currency,
      credit: request.amount,
      comment: `Subscribed to Staking Plan ${request.staking_plan_id}`,
    });

    return res.json(reply.success("Staking Subscribed Successfully"));
  } catch (error) {
    console.log(error);
    return res.json(reply.failed("Unable to Stake at this moment"));
  }
};

// UnSubscribe
const unsubscribe = async (req, res) => {
  // req.user = { id: 1 }

  let request = req.body;

  let validation = new Validator(request, {
    user_stake_id: "required|numeric",
  });

  if (validation.fails()) {
    return res.json(reply.failed(firstError(validation)));
  }

  // Check if plan Exists
  let user_staking = await UserStaking.findByPk(request.user_stake_id);

  if (!user_staking) {
    return res.json(reply.failed("Invalid Staking Plan"));
  }

  if (user_staking.is_active == 0) {
    return res.json(reply.failed("Plan Already UnSubscribed"));
  }

  if (user_staking.plan_type == "fixed") {
    return res.json(reply.failed("Cannot Unsubscibe from Fixed plan"));
  }

  user_staking.is_active = 0;
  user_staking.unactive_at = getCustomDate();

  // Check if plan Exists
  let staking_plan = await StakingPlan.findByPk(user_staking.staking_plan_id);
  let new_pool_limit = CL.add(
    staking_plan.remaining_pool_limit,
    user_staking.amount
  );
  staking_plan.remaining_pool_limit = new_pool_limit;

  if (!staking_plan) {
    return res.json(reply.failed("Invalid Staking Plan"));
  }

  try {
    let unsubscribe = await user_staking.save();
    await staking_plan.save();
    // Add Debit amount in Staking Wallet Logs

    await createWalletLog({
      user_id: req.user.id,
      user_stake_id: request.user_stake_id,
      transaction_type: "unsubscribed",
      currency: staking_plan.stake_currency,
      comment: `UnSubscribed to Staking Plan ${user_staking.staking_plan_id}`,
      withdraw_credit: user_staking.amount,
    });

    return res.json(reply.success("Staking UnSubscribed Successfully"));
  } catch (error) {
    return res.json(reply.failed("Unable to Unsubscribe at this moment"));
  }
};

const getAllCurrenciesImages = async () => {
  let all_currency = await Currency.findAll({
    raw: true,
    //  where: {
    //     active_status_enable: 1
    //  },
    attributes: ["image", "symbol"],
  });

  return all_currency.reduce((a, b) => {
    return (a[b.symbol] = variables.laravel_url + b.image), a;
  }, {});
};

// Get My Plans
const get = async (req, res) => {
  let all_currency = await getAllCurrenciesImages();
  let myplans = await UserStaking.findAll({
    // raw: true,
    where: {
      user_id: req.user.id, //1
    },
    include: [
      {
        model: StakingPlan,
        attributes: [
          "id",
          "stake_currency",
          "reward_currency",
          "maturity_days",
          "roi_percentage",
          "min_stake_amount",
          "max_stake_amount",
        ],
      },
    ],
    order: [["id", "DESC"]],
  });

  myplans = _.groupBy(
    myplans,
    (e) => `${e.staking_plan.stake_currency}-${e.staking_plan.reward_currency}`
  );

  let keys = _.keys(myplans);

  let resulted_array = [];

  keys.forEach((el) => {
    let [stake_currency, reward_currency] = el.split("-");
    let grouped_data = myplans[el];
    let result_data = {
      stake_currency,
      reward_currency,
      pair_data: grouped_data,
      stake_currency_image: all_currency[stake_currency],
      reward_currency_image: all_currency[reward_currency],
      total_active: _.sumBy(grouped_data, (o) => (o.is_active ? 1 : 0)),
      total_liquidity: _.sumBy(grouped_data, (o) =>
        o.is_active ? parseFloat(o.amount) : 0
      ),
    };
    resulted_array.push(result_data); // adding data in resulted array
  });

  // paginate resulted array data

  let total_count = resulted_array.length;
  let per_page = parseInt(req.query.per_page || 10);
  let page = parseInt(req.query.page || 1);

  resulted_array = resulted_array.slice((page - 1) * per_page, per_page * page);

  resulted_array = reply.paginate(page, resulted_array, per_page, total_count);

  return res.json(
    reply.success("My Staking fetched Successfully", resulted_array)
  );
};

// Get My Wallet
const getWallet = async (req, res) => {
  // req.user = {id: 1}

  let all_currency = await getAllCurrenciesImages();

  let raw_query = `select user_id,currency,balance,withdrawable
    from (
      select *, 
      row_number() over (
           partition by currency 
           order by id desc
        ) as RN 
      From staking_wallet_logs where user_id = ${req.user.id}
    ) X where RN = 1 ;`;

  let stake_wallet = await Model.query(raw_query, { type: QueryTypes.SELECT });

  stake_wallet = stake_wallet.map((el) => {
    el["currency_image"] = all_currency[el.currency];
    return el;
  });
  return res.json(
    reply.success("Staking Wallet Fetched Successfully", stake_wallet)
  );

  // const pagination = Helper.getPaginate(req, "id");

  // // Serach Queries
  // let query = `
  // select user_id,currency,balance,withdrawable
  // from (
  //   select *,
  //   row_number() over (
  //        partition by currency

  //        order by id desc
  //     ) as RN
  //   From staking_wallet_logs where user_id = ${req.user.id}
  // ) X where RN = 1
  // LIMIT ${pagination.offset}, ${pagination.limit}

  // ;`
  // let query1 = `
  // select user_id,currency,balance,withdrawable
  // from (
  //   select *,
  //   row_number() over (
  //        partition by currency

  //        order by id desc
  //     ) as RN
  //   From staking_wallet_logs where user_id = ${req.user.id}
  // ) X where RN = 1
  // ;`

  // // const finalQuery = Object.assign(query, pagination);
  // const finalQuery = await Model.query(query, { type: QueryTypes.SELECT  } );

  //  let result = finalQuery.map(el => {
  //     el['currency_image'] = all_currency[el.currency];
  //     return el;
  // });

  // var total_count = await Model.query(query1);
  // total_count = total_count.length;

  // result = reply.paginate(pagination.page, result, pagination.limit, total_count)
  // return res.json(reply.success('Staking Wallet Fetched Successfully', result));
};

/// Get Wllet Logs
const getWalletLogs = async (req, res) => {
  let all_currency = await getAllCurrenciesImages();

  const pagination = Helper.getPaginate(req, "id");

  // Serach Queries
  const query = {
    raw: true,
    where: {
      user_id: req.user.id,
    },
  };

  const finalQuery = Object.assign(query, pagination);

  var total_count = await StakingWalletLogs.count(query);

  var result = await StakingWalletLogs.findAll(finalQuery);

  result = result.map((el) => {
    el["currency_image"] = all_currency[el.currency];
    return el;
  });

  result = reply.paginate(
    pagination.page,
    result,
    pagination.limit,
    total_count
  );

  return res.json(reply.success("Transaction(s) fetched Successfully", result));
};


const AdminUserStakelist = async (req, res) => {



  var condition = {
    include: [
      { model: StakingPlan },
      { model: User }
    ],

  };


  var condition = { include: [{ model: StakingPlan }, { model: User }] };


  if (req.query.name ) {
    // console.log(req.query.name)
    condition['include'][1]['where'] = { name: {
      [Op.substring]: req.query?.name,  
    } 
  }
  }

  if (req.query?.stake_currency) {
    condition['include'][0]['where'] = { stake_currency: {
      [Op.substring]: req.query?.stake_currency,  
    } }
  }
  if (req.query?.reward_currency ) {
    condition['include'][0]['where'] = { reward_currency: {
      [Op.substring]: req.query?.reward_currency,  
    } }
  }


  let pagination = Helper.getPaginate(req, "created_at");
  let total_count = await UserStaking.count(condition);
  condition = Object.assign(condition, pagination);
  let result = await UserStaking.findAll(condition);
  result = reply.paginate(
    pagination.page,
    result,
    pagination.limit,
    total_count
  );
  try {
   
    return res.json(
      reply.success("All User Stake list fetched Successfully!!", result)
    );
  } catch (error) {
    return res.json(reply.failed("Unable to fetch list!!."));
  }
};

const getUserStakelist = async (req, res) => {
  let all_currency = await getAllCurrenciesImages();
  // console.log({all_currency});
  var condition = { include: [{ model: StakingPlan }, { model: User }] };
  let pagination = Helper.getPaginate(req, "created_at");
  let total_count = await UserStaking.count(condition);
  condition = Object.assign(condition, pagination);
  let result = await UserStaking.findAll(condition, {
    where: { user_id: req.user.id },
  });
  result = result.map((el) => {
    el.staking_plan["image"] = all_currency[el.staking_plan.stake_currency];

    return el;
  });
  result = reply.paginate(
    pagination.page,
    result,
    pagination.limit,
    total_count
  );
  try {
    return res.json(
      reply.success("User Stake list fetched Successfully!!", result)
    );
  } catch (error) {
    return res.json(reply.failed("Unable to fetch list!!."));
  }
};

// async function tt() {

//     let credit = 500;

//     try {
//         await Model.transaction(async function (transaction) {

//             let old_bal = await UserWalletLedger.findOne({
//                 where: {
//                     user_id: 1,
//                     currency: 'USDT'
//                 },
//                 order: [
//                     ['id', 'DESC']
//                 ],
//             }, { transaction });

//             let re = await UserWalletLedger.create({
//                 user_id: 1,
//                 currency: 'USDT',
//                 transaction_type: 'testing query',
//                 attached_id: null,
//                 debit_amount: 0,
//                 credit_amount: credit,
//                 balance: CL.add(credit, (old_bal?.balance || 0)),
//                 freezed_balance: 0,
//                 main_balance: 1000,
//                 comment: "The"
//             },{ transaction });

//             return old_bal;
//         });
//         console.log('success');
//     } catch (error) {
//         console.log('error');
//     }
// }

// // // test
// async function looper() {
//     let req = {
//         body: {
//             staking_plan_id: 22,
//             amount: "20"
//         }
//     }

//     let res = {
//         json: (r) => console.log(r)
//     }

//     let arr = [];
//     for (let index = 0; index < 5; index++) {
//         arr.push(index);
//     }

//     let query = "INSERT INTO `staking_wallet_logs`( `user_id`, `user_stake_id`, `currency`, `transaction_type`, `debit`, `credit`, `balance`, `comment`, `withdrawable` ) VALUES( '2', '1', 'USDT', 'Testing Query', '0', '500',( COALESCE((SELECT * FROM (SELECT balance FROM `staking_wallet_logs` where `user_id` = 2 ORDER BY `id` DESC LIMIT 1) AS balance),0) + (`credit`) - (`debit`) ), 'hi', '0' )";
//     let promises = arr.map(async () => {
//         await Model.query(query)
//     });

//     let results = await Promise.all(promises);
//     return results.length;
// }

// let d = await looper();
// console.log({ d });

export default {
  subscribe,
  unsubscribe,
  get,
  transferToPortfolio,
  getWallet,
  getWalletLogs,
  AdminUserStakelist,
  getUserStakelist
};
