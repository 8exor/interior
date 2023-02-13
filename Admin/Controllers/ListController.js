import Helper from "../../Common/Helper.js"
import reply from "../../Common/reply.js"
import CValidator from "../../Validator/CustomValidation.js";
import { ListCoin } from "../../Models/ListCoin.js";
import variables from "../../Config/variables.js";
import sharp from "sharp"
import fs from 'fs';
import { BlockNetwork } from "../../Models/BlockNetwork.js";
import { BlockNetworkType } from "../../Models/BlockNetworkType.js";
import { Op } from "sequelize";
import _ from 'lodash'
import { ListCrypto } from "../../Models/ListCrypto.js";
import { Trade } from "../../Models/Trade.js";
import myEvents from "../../RunnerEngine/Emitter.js";
import { Currency, CurrencyNetwork } from "../../Models/Currency.js";
import { moveMessagePortToContext } from "worker_threads";


 async function set_initial_price(data) {
    var request = data;
    // console.log({initial_price: request})

    let validate = await CValidator(request, {
      at_price: "required|numeric|min:0.0000000001",
      currency: "required",
      with_currency: "required|different:currency",
    });

    // console.log({validate})

    if (!validate.status) {
      return reply.failed(validate.message);
    }

    let initial = await Trade.findOne({
      where: {
        symbol: request.currency + request.with_currency,
      },
      order: [["time", "ASC"]],
    });

    if (initial) {
      return reply.failed("Initial Price Already Set!");
    }

  
    let object = {
      currency: request.currency,
      with_currency: request.with_currency,
      at_price: request.at_price,
      quantity: "1",
      sell_order_id: "1",
      buy_order_id: "1",
    };

    // console.log({object})

    myEvents.emit("INITIAL_TRADE", object);
    return reply.success("Initial Price Set Successfully");   
}



const blockNetwork = async (req,res) => {
    try {
        let block = await BlockNetwork.findAll({
            where:{id:{[Op.ne]:4}},
            include:{model: BlockNetworkType}
        })
        res.send(reply.success('Data Fetched Successfully',block))
    } catch (error) {
        console.log(error)
        res.send(reply.failed('Unable to Fetch at this moment'))
    }
}

const pairGet = async (req,res) => {
    if(req.params.id){
        try{
            const cryptos = await ListCoin.findByPk(req.params.id);
            // console.log({cryptos});
            return res.json(reply.success("Crypto Pairs Fetched Successfully!",cryptos))
                  
        }catch(err){
             console.log(err,"Error");
             return res.json(reply.failed("Unable to Fetch"));
        }
    }else{
        // console.log('params==',req.params)
        try{
            const project = await ListCoin.findAll();
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
    let{id,status,column_name} = request
   
    let validate= await CValidator(request,{
        id: 'required|integer|exists:list_coins,id',
        status: 'required|in:0,1',
        column_name: 'required|in:active_status,sell,buy'
    });

    if (!validate.status) {return res.send(reply.failed(validate.message))}
    
    try{
        await ListCoin.update({[column_name]:status},{where:{id:id}});
        return res.json(reply.success("Currency Status Updated Successfully"))

    }catch(err){
       console.log(err,"errr");
       return res.json(reply.failed("Unable to update at this moment"))

    }
}


const create = async (req,res) => {
    let request = req.body;
    request.image = req?.file?.filename || "";

    //###Custom Validation
    let validation = await CValidator(request, rules());
    if (!validation.status) { return res.json(validation); }

    //###File Dimension check
    if(req.filedata.status_code == 0){
        return res.send(req.filedata)
    }

    if(req.file != undefined || req.file != ''){
        let f_data = await sharp(req.file?.path).metadata();
        if(f_data.width > 84 || f_data.height >84){ 
            fs.unlink(req.file.path, function (err) {
                if (err) throw err;
            });
            return res.send(reply.failed("Image Dimensions should be 84X84"))
        }
    }
    //##################################################
    try {
        request['currency'] = (request.currency).toUpperCase()

        let currencyCheck = _.map(request.pair_with,'currency');

        let available1 =  await ListCrypto.findOne({
            where: {
                pair_with: {[Op.in]:currencyCheck},
                currency: request.currency
            }
        })

        let available2 =  await ListCoin.findOne({
            where: {
                pair_with: {[Op.in]:currencyCheck},
                currency: request.currency
            }
        })

         //# This currency and pair with should not be in List Crypto Table
          if (available1) {
            return res.send(reply.failed(`${available1.currency} / ${available1.pair_with} Pair is already exists in crypto table`))
          }

         // # This currency and pair with should not be in List Coin Table
          if (available2) {
                return res.send(reply.failed(`${available2.currency} / ${available2.pair_with} Pair is already exists in listed coin`))
          }
        
         // # acreate List Coin Table
        let data =  JSON.parse(JSON.stringify(request));
        let data1 = _.omit(data,['pair_with','token']);

        // console.log({data},{request})
        
        for (let i = 0; i < data.pair_with.length; i++) {
            //# Getting pair_with and start_price in loop
            data1['pair_with']      =  data.pair_with[i]['currency'];
            data1['start_price']   = data1['current_price']  = data.pair_with[i]['price'];
            data1['symbol'] = data.currency + data.pair_with[i]['currency']

            //# Creating New Listed Coin with Its Pair
            await ListCoin.create(data1)

            let body  = {"at_price" : data.pair_with[i]['price'], "currency" : data.currency, 'with_currency' : data.pair_with[i]['currency']};
            // # create default trade
            let is_set_price = await set_initial_price(body)
            if(!is_set_price.status_code){
                console.log(is_set_price.message)
            } 
        }
        
        let portfolio = await Currency.findOne({
            where:{symbol:data['currency']}
        });

        // console.log({portfolio})

        if (!portfolio) {
            //# create currency
            let currency = await Currency.create({
                image:data.image,
                name:data.name,
                buy_desc:data.buy_desc,
                sell_desc:data.sell_desc,
                symbol:data.currency,
                default_c_network_id:0
            });
            // console.log({currency})


            if (currency) {
                let currency_network_id = null;
                //# Add Currency Network
                for (let i = 0; i < data.token.length; i++) {
                    currency_network_id = await CurrencyNetwork.create({
                        currency_id: currency.id,
                        network_id: data.token[i]['network_id'],
                        address     : data.token[i]['address'],
                        token_type : data.token[i]['token_type'],
                    });
                }
                // console.log({currency_network_id})
                //#update currency network_id in currency table
                if (currency_network_id) {
                let multiple = data.token.length > 1 ? '1':'0'
                    currency.update({'is_multiple': multiple,'default_c_network_id' :currency_network_id.id});
                }
            }
        }

        
        if (portfolio) {
            // return $request;
            for (i = 0; i < data.token.length; i++) {
                let getCurrNet = await CurrencyNetwork.findOne({
                    where:{currency_id : portfolio.id, network_id : data.token[i]['network_id']}
                })
                let currency_network_id = null;
                
                if (!getCurrNet) {
                    currency_network_id = await CurrencyNetwork.create({
                        currency_id: portfolio.id,
                        network_id: data.token[i]['network_id'],
                        address     : data.token[i]['address'],
                        token_type : data.token[i]['token_type'],
                    });
                }
            }
        }
        return  res.send(reply.success('Currency Added Successfully'))
    } catch (error) {
        console.log('addlistcoin', error)
        return  res.send(reply.failed('unable to create at this moment'))
    }
    
}

const update = async (req,res) => {
    let request = req.body;
    request.id = req.query.id
    console.log({fff:request})

    //###Custom Validation
    let validation = await CValidator(request, updateRules(request));
    if (!validation.status) { return res.json(validation); }

    try {
        let request1 = _.omit(request,['id'] )
        // console.log({request1});
        await ListCoin.update(request1,{where:{id:request.id}})
        // console.log({list_coin_update})
        return  res.send(reply.success('List Coin Updated Successfully.'))
    } catch (error) {
        console.log('listcoinuupdate',error)
        return res.send(reply.failed('Unable to update at this moment.'))
    }

}

function updateRules(request = null){
    let rule = {
        'id'                 :  "required|integer|exists:list_coins,id",
        'buy'                :  "required|in:1,0",
        'buy_min'            :  "required|numeric|min:0.00000001",
        'buy_max'            :  `required|numeric|min:0.00000001|gt:${request.buy_min}`,
        'buy_desc'           :  "required|max:500",
        'buy_commission_type' :  "required|in:percentage,flat",
        'buy_commission'      :  "required|numeric|min:0.01",
        'buy_min_desc'              :  "required|max:500",
        'buy_max_desc'              :  "required|max:500",

        'sell'               :  "required|in:1,0",
        'sell_min'           :  "required|numeric|min:0.00000001",
        'sell_max'           :  `required|numeric|min:0.00000001|gt:${request.sell_min}`,
        'sell_desc'           :  "required|max:500",
        'sell_commission_type' :  "required|in:percentage,flat",
        'sell_commission'     :  "required|numeric|min:0.01|gt:0",
        'sell_min_desc'             :  "required|max:500",
        'sell_max_desc'             :  "required|max:500",

        // 'decimal_currency'          : 'required|integer|min:0|max:18',
        // 'decimal_pair'              : 'required|integer|min:0|max:18',
        // 'image'                     :  'image|mimes:png,jpg|max:1024|dimensions:max_width=84,max_height=84',
    }

    if (request.buy_commission_type == 'percentage') {   // Type == Percentage
        rule['buy_commission'] = 'required|numeric|min:0.01|max:99';
    } else {  // Type == Flat
        rule['buy_commission'] = `required|numeric|min:0.01|lt:${request.buy_min}`;
    }

    if (request.sell_commission_type == 'percentage') {
        rule['sell_commission'] = 'required|numeric|min:0.01|gt:0|max:99';
    } else {  // Type == Flat
        rule['sell_commission'] = `required|numeric|min:0.01|gt:0|lt:${request.sell_min}`;
    }


    return rule
}

function rules(request = null){
    let rule ={
        'name'                      :  'required|max:50|min:2',
        'currency'                  :  'required|string|max:20|min:2',
        'pair_with'                 :  'distinct:currency',
        'pair_with.*.currency'      : 'required|in:' + variables.pairWith ,
        'pair_with.*.price'         : 'required|numeric|min:0.00000001',
        'decimal_currency'          : 'required|integer|min:0|max:18',
        'decimal_pair'              : 'required|integer|min:0|max:18',
        'token'                     :  'distinct:token_type|distinct:network_id',
        'token.*.address'           :  'required|string|min:20|max:100',
        'token.*.token_type'        :  'required|exists:block_network_types,token_type',
        'token.*.network_id'        :  'required|exists:block_networks,id',
        // 'image'                     :  'required|image|mimes:png|max:1024|dimensions:max_width=84,max_height=84',
        'buy_desc'                  :  "required|max:500",
        'sell_desc'                 :  "required|max:500",  
    }

    return rule
}





export default{
    update,
    create,
    pairGet,
    updateStatus,
    blockNetwork
}