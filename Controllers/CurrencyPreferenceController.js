import {User} from "../Models/User.js";
import reply from "../Common/reply.js";
import _ from "lodash";
import Validator from "validatorjs";

const CurrencyPreference = [
    "USDT",
    "BTC",
    "INR",
    "BNB",
    "ETH",
    // "DOGE",
    // "SOL",
    // "XRP",
];

function firstError(validation) {
    let first_key = Object.keys(validation.errors.errors)[0];
    return validation.errors.first(first_key);
}
  
const get_Preference = async (req, res) => {

    let user_id = req?.user?.id ?? null;

    if(user_id == null){
        return res.send(reply.failed('Invalid Data!!'));
    }

    
    let active = await User.findOne({ where: {id:user_id}});

    let response = _.map(CurrencyPreference, (v,i) => {
        if(v == active.currency_preference){
            return {
                currency: v,
                status:"1"
            }
        }else{
            return {
                currency: v,
                status:"0"
            }
        }
    });

    return res.send(reply.success("Fetched Successfully !!", response));
}

const update_Preference = async (req, res) => {

    let user_id = req?.user?.id ?? null;

    if(user_id == null){
        return res.send(reply.failed('Invalid Data!!'));
    }

    var request = req.body;

    let validation = new Validator(request, {
        currency: "required|in:BTC,USDT,INR,BNB,ETH,DOGE,SOL,XRP"
    });

    if (validation.fails()) {
        return res.json(reply.failed(firstError(validation)));
    }


    let result = await User.update({ currency_preference: request.currency }, {
        where: {
          id: user_id
        }
    });
      
   return (result) ? res.send(reply.success("Updated Successfully!!")) : res.send(reply.failed('unable to update at this time!!'));

}

export default {
    get_Preference,
    update_Preference
}