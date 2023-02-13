import Helper from "../../Common/Helper.js";
import reply from "../../Common/reply.js";
import { Currency } from "../../Models/Currency.js";
import { CurrencyNetwork } from "../../Models/Currency.js";
import { BlockNetwork } from "../../Models/BlockNetwork.js";
import CValidator from "../../Validator/CustomValidation.js";
import _ from "lodash";

const getAllCurrencies = async (req, res) => {
  try {
        let data = await Currency.findAll({include: {model: CurrencyNetwork, include: {model: BlockNetwork } }});
        return res.send(reply.success("Currency Fetched Successfully", data));
    } catch (error) {
        console.log(error)
        return res.send(reply.failed("Unable to fetch at this moment"));
  }
};

const update_status = async (req,res) => {

    let request = req.body; // ?status=1&id=2&column=withdraw_enable

    let { status, message } = await CValidator(request, {
        status:"required|in:1,0",
        id:"required|exists:currencies,id",
        column:"required|in:deposit_enable,withdraw_enable"
    });
    

    if(!status){
       return res.send(reply.failed(message));
    }

    try {
        await Currency.update({ [request.column] : request.status }, {where: {id: request.id}}); 
        return res.send(reply.success('Currency Status Updated Successfully.'))
    } catch (error) {
        // console.log(error)
        return res.send(reply.failed("Unable to Update at this moment"));
    }
   
}

const updateCurrencyData = async (req,res) => {
    let request = req.body
    // console.log({request})

    let validation = await CValidator(request,await rules(request));
    if (!validation.status) {
        return res.json(validation);
    }

    if(request.type == 'flat' && (parseFloat(request['withdraw_commission'] )> parseFloat(request['withdraw_min']))) {
        return res.json(reply.failed(`The withdraw_commission must be less than ${request['withdraw_min']}.`)) 
    }

    let request1 =  _.omit(request,['target_id'])
    // console.log(request1,">>>>>>>>>>");

    let updated = await CurrencyNetwork.update(request1,{
        where: {
            id: request.target_id
          }
    });
    return (updated) ? res.send(reply.success("Currency Updated Successfully")) : res.send(reply.failed("Unable to update at this moment"));
}

async function rules(request=null){         
    let rule =  {
        "target_id"             : 'required|numeric|exists:currency_networks,id',
        'deposit_enable'        : 'required|in:0,1',
        'deposit_desc'          : 'required|max:100',
        'withdraw_enable'       : 'required|in:0,1',
        'withdraw_desc'         : 'required|max:100',
        'withdraw_min'          : 'required|numeric|min:0.00000001',
        'withdraw_max'          : 'required|numeric|min:0.00000001',
        'type'                  : 'required|in:percentage,flat',
        'withdraw_commission'   : 'required|numeric|min:0.01' 
    }; 

    if (request.type == 'percentage') {  
        rule['withdraw_commission'] = 'required|numeric|min:0.01|max:99';
    } else {  
        rule['withdraw_commission'] = 'required|numeric|min:0.01';
    }

return rule;
}



export default {
  getAllCurrencies,
  update_status,
  updateCurrencyData
};
