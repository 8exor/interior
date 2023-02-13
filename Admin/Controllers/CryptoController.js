import Helper from "../../Common/Helper.js"
import reply from "../../Common/reply.js"
import CValidator from "../../Validator/CustomValidation.js";
import { ListCrypto } from "../../Models/ListCrypto.js";

const getList = async (req,res) => {
    if(req.params.id){
        try{
            const cryptos = await ListCrypto.findByPk(req.params.id);
            // console.log({cryptos});
            return res.json(reply.success("Crypto Pairs Fetched Successfully!",cryptos))
                  
        }catch(err){
             console.log(err,"Error");
             return res.json(reply.failed("Unable to Fetch"));
        }
    }else{
        // console.log('params==',req.params)
        try{
            const project = await ListCrypto.findAll();
             let pairWithData = reply.groupBy('pair_with', project);
              return res.json(reply.success("Crypto Pairs Fetched Successfully!",pairWithData))
                  
        }catch(err){
             console.log(err,"Error");
             return res.json(reply.failed("Unable to Fetch"));
        }
    }
   
}

const updateStatus = async (req,res) => {
    let request=req.query;
    // console.log({request})
    let{id,status,column_name} = request
   
    let validate= await CValidator(request,{
        id: 'required|integer|exists:list_cryptos,id',
        status: 'required|in:0,1',
        column_name: 'required|in:active_status,sell,buy'
    });

    if (!validate.status) {return res.send(reply.failed(validate.message))}
    
    try{
        await ListCrypto.update({[column_name]:status},{where:{id:id}});
        return res.json(reply.success("Currency Status Updated Successfully"))

    }catch(err){
       console.log(err,"errr");
       return res.json(reply.failed("Unable to update at this moment"))

    }
}

const update = async (req,res) => {
    let request = req.body;

    //  const messages = {
    //     decimal_currency:' The Currency Length must not be greater than 18.',
    //     decimal_pair: ' The Pair Length must not be greater than 18.'
    //  };

    let rules = {
      id: "required|integer|exists:list_cryptos,id",
      buy: "required|in:1,0",
      buy_min: "required|numeric|min:0.00000001",
      buy_max: `required|numeric|min:0.00000001|gt:${request.buy_min}`,
      buy_desc: "required|max:500",
      buy_commission_type: "required|in:percentage,flat", 
      // buy_commission: "required|numeric|min:0.01",
      sell: "required|in:1,0",
      sell_min: "required|numeric|min:0.00000001",
      sell_max: `required|numeric|min:0.00000001|gt:${request.sell_min}`,
      sell_desc: "required|max:500",
      sell_commission_type: "required|in:percentage,flat",
      // sell_commission: "required|numeric|min:0.01|gt:0",
      buy_min_desc: "required|max:500",
      buy_max_desc: "required|max:500",
      sell_min_desc: "required|max:500",
      sell_max_desc: "required|max:500",
    };

    if (request.buy_commission_type === "percentage") {
      // Type == Percentage
      rules.buy_commission = "required|numeric|min:0.01|max:99";
    } else {
      // Type == Flat
      rules.buy_commission = "required|numeric|min:0.01";
    }

    if (request.sell_commission_type === "percentage") {
      rules.sell_commission = "required|numeric|min:0.01|max:99";
    } else {
      // Type == Flat
      rules.sell_commission = "required|numeric|min:0.01";
    }

    let { status, message } = await CValidator(request, rules);

    if (!status) {
      return res.send(reply.failed(message));
    }
    
    try {
      await ListCrypto.update(request, {
        where: {
          id: request?.id,
        },
      });

      return res.json(reply.success("List Crypto Updated Successfully"));
    } catch (err) {
      console.log(err, "show error");
      return res.json(reply.failed("Unable to update at this moment"));
    }
}

export default{
    getList,
    updateStatus,
    update
}