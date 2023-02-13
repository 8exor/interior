import { Liquidity } from "../../Models/Liquidity.js";
import Helper from "../../Common/Helper.js";
import reply from "../../Common/reply.js";
import CValidator from "../../Validator/CustomValidation.js";
import { ListCoin } from "../../Models/ListCoin.js";
import variables from "../../Config/variables.js";
import { UserCrypto } from "../../Models/UserCrypto.js";
import { CL } from "cal-time-stamper";
import { LiquidityLog } from "../../Models/LiquidityLog.js";
import Sequelize from 'sequelize';
import _ from "lodash";


async function getPercentage(provided, total) {
    var available;

    available = CL.div(provided, 100);
    available = CL.mul(available, total);
    return available;
}

const create = async (req,res) => {
    let request = req.body
    //custom validation
    let { status , message} = await CValidator(request, {
        currency:"required|string|max:20|min:2|exists:list_coins,currency",
        pair_with: 'required|in:' + variables.pairWith + ',SELF',
        total:"required|numeric|min:0.00000001",
        provided:"required|numeric|min:0|max:100",
    });

    if (!status) { return res.send(reply.failed(message)); }

    //  Check Currency with pair is exists or not.
    let exists = await ListCoin.findOne({ where: { currency: request.currency, pair_with: request.pair_with } })

    if (!exists && request.pair_with != 'SELF') {
        return res.json(reply.failed("This Pair is not available."));
    }

    let liquidity = await Liquidity.findOne({ where: { currency: request.currency, pair_with: request.pair_with } })
    request['symbol'] = request.currency + '' + request.pair_with;

    if(liquidity){
        return res.send(reply.failed("Liquidity is already exists."));
    }

  
    // ################ START CODE ADD ADMIN CRYPTO WHILE ADDING LIQUIDITY ###############

    // # update user crypto
    let crypto_currency = (request.pair_with == 'SELF') ? request.currency : request.pair_with;
    // let crypto_decimal = (request.pair_with == 'SELF') ? 2 : exists.decimal_pair;

    // # IF Admin have this currency in user crypto table
    let last_crypto = await UserCrypto.findOne({ where: { currency: crypto_currency,user_id: 1 } })
    
    request['total'] = CL.add(0,request['total']);
    request['available'] = await getPercentage(request.provided ,  request.total);

    if (last_crypto) {
        last_crypto.balance = CL.add(last_crypto.balance, request['available']);
        // console.log(last_crypto.balance,"`jhj`")
        last_crypto.save();
    } else {
        let balance_add = CL.add(0, request['available']);
        // console.log(balance_add,"CFGFCTG")
        await UserCrypto.create({ currency: crypto_currency, user_id: "1", balance: balance_add });
    }

    // ################ END CODE ADD ADMIN CRYPTO WHILE ADDING LIQUIDITY ###############
    
    request['calculated'] = request['available'];
    request['remaining'] = CL.sub(request.total, request['available']);

    await Liquidity.create(request);
    await LiquidityLog.create({ 'currency': request.currency, 'pair_with': request.pair_with, 'symbol' :request.symbol,'liquidity': request.provided, 'param': request });
    
    return res.send(reply.success("Liquidity added"));
   
}

const get = async (req,res) => {
   let symbol = req.params.symbol

    try {
        if(symbol){
            const result = await Liquidity.findAll({ attributes: ['currency','pair_with'],where:{symbol} });
            return res.send(reply.success("Crypto Pairs Fetched Successfully", result))
        }

        const dataa = await Liquidity.findAll();
        let result = reply.groupBy('pair_with', dataa);
        return res.send(reply.success("Crypto Pairs Fetched Successfully", result))
    }
    catch (error) {
        console.log("errror", error)
        res.send(reply.failed("failed", results))
    }
}

const update = async (req,res) => {
    var request = req.body;

    //custom validation
    let { status , message} = await CValidator(request, {
        currency:"required|string|max:20|min:2|exists:list_coins,currency",
        pair_with: 'required|in:' + variables.pairWith + ',SELF',
        total:"required|numeric|min:0.00000001",
        provided:"required|numeric|min:0|max:100",
    });

    if (!status) { return res.send(reply.failed(message)); }


    // # Check Currency with pair is exists or not.
    let exists = await ListCoin.findOne({ where: { currency: request.currency, pair_with: request.pair_with } })
    if (!exists && request.pair_with != 'SELF') {
        return res.send(reply.failed("This Pair is not available."));
    }
    
    // # update user crypto
    let crypto_currency = (request.pair_with == 'SELF') ? request.currency : request.pair_with;
    // let crypto_decimal = (request.pair_with == 'SELF') ? 2 : exists.decimal_pair;

    // # Validate liquidity
    let liquidity = await Liquidity.findOne({ where: { currency: request.currency, pair_with: request.pair_with } })
    request['symbol'] = request.currency + '' + request.pair_with;

    // # Case 1 If Liquidity is not exists
        if (!liquidity) {
            return  res.send(reply.failed("Liquidity is not added yet."));
        }
    
        // # Case When remaining liquidity is equal to 0
        if ((liquidity.remaining == 0 || request.provided > 100) && (request.total == liquidity.total)) {
            return  res.send(reply.failed(request.currency + " don't have any liquidity."));
        }

        // # Case If provided value & total value is same
        if ((liquidity.provided == request.provided || request.provided < liquidity.provided) && (request.total == liquidity.total)) {
            return res.send(reply.failed("liquidity should be greater than " + liquidity.provided));
        }

        // # Case Increasing total liquidity value
        if (request.total != liquidity.total) {
            // console.log(liquidity.calculated,"<<<<<<<<<<<<<<<<<<<<<<<<")
            let actualProvided = CL.div(liquidity.calculated, request.total);
            actualProvided = CL.mul(actualProvided, 100);
            // console.log(actualProvided,">>>>>>>>>>");
            if (request.provided <= actualProvided) {
                return res.send(reply.failed('The provide value should be greater than ' + actualProvided +' percent.'));
            }
        }


        // ################ START CODE ADD ADMIN CRYPTO WHILE ADDING LIQUIDITY ###############


        // # Case 2 If Liquidity Already Exists
        request['available'] = await getPercentage(request.provided,  request.total);
        request['calcultaed'] = request['available'];
        request['remaining'] = CL.sub(request.total, request['available']);


        // # IF Admin have this currency in user crypto table
        let last_crypto = await UserCrypto.findOne({ where: { currency: crypto_currency,user_id: 1 } })
        let crypto_balance = CL.sub(request['available'] , liquidity.calculated);

        // # Add Crypto
        if (last_crypto) {
            last_crypto.balance  = CL.add(last_crypto.balance, crypto_balance);
            last_crypto.save();
        } else {
            balance_add  = CL.add(0, crypto_balance);
            await UserCrypto.create({ currency: crypto_currency, user_id: "1", balance: balance_add });

        }

        // ################ END CODE ADD ADMIN CRYPTO WHILE ADDING LIQUIDITY ###############

        request['available'] =  CL.add(crypto_balance , liquidity.available);

         await LiquidityLog.create({ 'currency': request.currency, 'pair_with': request.pair_with, 'symbol' :request.symbol,'liquidity': request.provided, 'param': request });
         let updated = liquidity.update(request);

        return (updated) ? res.send(reply.success('Liquidity Updated Successfully.')) : res.send(reply.failed('Unable to create at this moment.'));
}

const reset = async (req,res) => {
    var request = req.body;
    
     //custom validation
     let { status , message} = await CValidator(request, {
        "id" : "required|exists:list_coin_liquidities,id"
    });

    if (!status) { return res.send(reply.failed(message)); }

    let updated_liquidity = {
        'total'     : '0',
        'provided'  : '0',
        'calculated': '0',
        'available' : '0',
        'remaining' : '0' ,
      }

      let response = await Liquidity.update(updated_liquidity, {
        where: {
            id:request.id
        }
    });
      return (response) ? res.send(reply.success('Liquidity Reset Successfully.')) : res.send(reply.failed('Unable to reset at this moment.'));
}

const liquidity_currency = async (req,res) => {
    // $data = ListCoin::distinct('currency')->pluck('currency')->toArray() ?? [];
    //     return $this->success('Crypto Pairs Fetched Successfully', $data);

       let data =  await ListCoin.findAll({
            attributes: [
              [Sequelize.fn('DISTINCT', Sequelize.col('currency')), 'currency'],
            ]
        })
        let result = _.map(data, 'currency');

        return (data) ? res.send(reply.success('Currency Fetch Successfully.',result)) : res.send(reply.failed('Unable to reset at this moment.')); 
}

export default{
    create,
    get,
    update,
    reset,
    liquidity_currency
}