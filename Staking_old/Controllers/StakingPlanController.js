import { StakingPlan } from '../Models/StakingPlan.js';
import Validator from "validatorjs";
import reply from '../../Common/reply.js';
import _ from 'lodash';
import pkg from 'sequelize';
import { Currency } from './../../Models/Currency.js';
import variables from '../../Config/variables.js';
import Helper from '../../Common/Helper.js';



const { Op } = pkg;

function firstError(validation) {
    let first_key = Object.keys(validation.errors.errors)[0];
    return validation.errors.first(first_key);
}

function getDate(days = 0) {
    let d = new Date();
    let r = d.setUTCDate(d.getUTCDate() + days);
    return r;
}

// Create
const create = async (req, res) => {

    var request = req.body;

    let validation = new Validator(request, {
        title: 'string|min:3|max:200',
        description: 'string|min:20|max:500',
        image: '',
        stake_currency: 'required',
        reward_currency: 'required',
        plan_type: 'required|in:fixed,flexible',
        maturity_days: 'required|integer',
        roi_percentage: 'required|numeric',
        roi_interval: 'required|in:D,M,Y',
        min_stake_amount: 'required|numeric',
        max_stake_amount: 'required|numeric',
        pool_limit: 'numeric',
        plan_expiry_days: 'required|numeric',
        plan_start_date: 'date'
    });

    if (validation.fails()) {
        return res.json(reply.failed(firstError(validation)));
    }

    // find if already exists
    let is_exists = await StakingPlan.findOne({
        where: {
            stake_currency: request.stake_currency,
            reward_currency: request.reward_currency,
            plan_type: request.plan_type,
            maturity_days: request.maturity_days,
            plan_expiry_date: {
                [Op.or]: {
                    [Op.gt]: getDate(),
                    [Op.is]: null,
                }
            },
        }
    });

    if (is_exists) {
        return res.json(reply.failed('Same Type of plan already Exists'));
    }



    try {
        let plan = await StakingPlan.create(request);
        return res.json(reply.success('Plan Created Successfully', plan));
    } catch (error) {
        return res.json(reply.failed('Unable To create plan '))
    }

}

// Update
const update = async (req, res) => {

    var request = req.body;

    let validation = new Validator(request, {
        title: 'string|min:3|max:200',
        description: 'string|min:20|max:500',
        image: '',
        stake_currency: 'required',
        reward_currency: 'required',
        plan_type: 'required|in:fixed,flexible',
        maturity_days: 'required|integer',
        roi_percentage: 'required|numeric',
        roi_interval: 'required|in:D,M,Y',
        min_stake_amount: 'required|numeric',
        max_stake_amount: 'required|numeric',
        pool_limit: 'numeric',
        plan_expiry_days: 'required|numeric',
        plan_start_date: 'date'
    });

    if (validation.fails()) {
        return res.json(reply.failed(firstError(validation)));
    }

}

/////////////////

const getAllCurrenciesImages = async () => {
    let all_currency = await Currency.findAll({
        raw: true,
        //  where: {
        //     active_status_enable: 1
        //  },
        attributes: ['image', 'symbol']
    });

    return all_currency.reduce((a, b) => {
        return a[b.symbol] = b.image, a;
    }, {});
}

// Get
const get = async (req, res) => {

    let all_currency = await getAllCurrenciesImages();

    let whereCondition = {
        is_expired: 0,
    };

    if(!req.query?.all){
        whereCondition.activate_status = 1;
    }

    // Filters

    if(req.query?.plan_type && req.query?.plan_type != '' ){
        whereCondition['plan_type'] = req.query.plan_type
    }

    if(req.query?.search && req.query?.search != ""){
        whereCondition['stake_currency'] = {
            [Op.substring] : req.query.search
        }
    }

    let staking_plans = await StakingPlan.findAll({
        raw: true,
        where: whereCondition,
        order: [
            ['id', 'DESC']
        ]
    });

    staking_plans = staking_plans.map(ele => {
        ele['stake_currency_image'] = variables.laravel_url + all_currency[ele.stake_currency];
        ele['reward_currency_image'] = variables.laravel_url + all_currency[ele.reward_currency];
        return ele;
    });

    if (req.query.all) {

        return res.json(reply.success('Staking Plans Fetched Successfully', staking_plans));
    }

    let list = {};

    staking_plans.forEach(ele => {

        let key = `${ele.stake_currency}-${ele.reward_currency}`;

        if (list[key]) {

            let plan_t = list[key]['plan_type'][ele.plan_type];
            if (plan_t) {
                plan_t.push(ele);
            }
            else {
                Object.assign(list[key]['plan_type'], {
                    [ele.plan_type]: [ele]
                })
            }
        }

        else {
            list[key] = {
                stake_currency: ele.stake_currency,
                reward_currency: ele.reward_currency,
                stake_currency_image: ele.stake_currency_image,
                reward_currency_image: ele.reward_currency_image,
                plan_type: {
                    [ele.plan_type]: [ele]
                }
            }
        }
    });

    list = _.values(list);

    list = list.map(el => {
        let plan_types = _.keys(el.plan_type);
        el['selected_plan_type'] = plan_types[0];
        el['a_plan_types'] = plan_types;

        let days_obj = {};
        let other_obj = {};

        plan_types.forEach(plan => {
            let days = el.plan_type[plan].map(pm => {

                let dy = pm.maturity_days;

                other_obj[`${plan}-${dy}`] = pm;
                return dy;
            });
            days_obj[plan] = days;
        });

        el['o_plan_days'] = days_obj;

        el['s_maturity_days'] = days_obj[el['selected_plan_type']][0];

        el['s_data'] = other_obj;

        delete el['plan_type'];

        return el;
    })

    // const SEPERATOR = "-";

    // staking_plans = staking_plans.filter((item) => item.activate_status);
    // staking_plans = _.groupBy(staking_plans,(item)=>`${item.stake_currency}${SEPERATOR}${item.reward_currency}`);

    // staking_plans = _.forEach(staking_plans, (value , key) => {
    //     staking_plans[key] = _.groupBy(value,(item)=> item.plan_type);
    // });

    // paginate resulted array data

    let total_count = list.length;
    let per_page = parseInt(req.query.per_page || 10);
    let page = parseInt(req.query.page || 1);

    list = list.slice(((page - 1) * per_page), per_page * page);

    list = reply.paginate(page, list, per_page, total_count);


    return res.json(reply.success('Staking Plans Fetched Successfully', list));
}

// Remove
const remove = async (req, res) => {
    let plan_id = req.params.plan_id;

    if (isNaN(plan_id)) {
        return res.json(reply.failed('Invalid Plan'));
    }

    let staking_plan = await StakingPlan.findByPk(plan_id);

    if (!staking_plan) {
        return res.json(reply.failed('Invalid Plan'));
    }

    if (staking_plan.activate_status == 1) {
        // check if any user subscribed to that plan yet or not.
        return res.json(reply.failed('Cannot Remove Once Activated.'));
    }

    try {
        await staking_plan.destroy();
        return res.json(reply.success('Plan Removed Successfully'));
    } catch (error) {
        return res.json(reply.failed('Unable to Remove Plan'));
    }
}

// Activate Status
const activate_status = async (req, res) => {

    let request = req.body;

    let validation = new Validator(request, {
        plan_id: 'required|numeric',
        plan_status: 'required|boolean'
    });

    if (validation.fails()) {
        return res.json(reply.failed(firstError(validation)));
    }

    let staking_plan = await StakingPlan.findByPk(request.plan_id);

    if (!staking_plan) {
        return res.json(reply.failed('Invalid Plan'));
    }


    if (!request.plan_status) {
        return res.json(reply.failed('Cannot Use Deactivation.'));
    }

    if (staking_plan.activate_status == 1) {
        // #TODO check if any user subscribed to that plan yet or not.
        return res.json(reply.failed('Cannot Change Active Status Once Activated.'));
    }

    staking_plan.activate_status = 1,
        staking_plan.plan_start_date = getDate(),
        staking_plan.plan_expiry_date = getDate(staking_plan.plan_expiry_days)



    try {
        await staking_plan.save();
        return res.json(reply.success('Plan Activated Successfully'));
    } catch (error) {
        return res.json(reply.failed('Unable to Activate Plan'));
    }


}

export default {
    create,
    update,
    get,
    remove,
    activate_status,
}