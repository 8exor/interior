import { ListCoin } from "../../Models/ListCoin.js"
import { ListCrypto } from "../../Models/ListCrypto.js"

import Sequelize, { Op } from 'sequelize';
import reply from "../../Common/reply.js";
import _ from "lodash";
import { Order } from "../../Models/Order.js";
import { Currency } from "../../Models/Currency.js";
import { User } from "../../Models/User.js";
import Helper from "../../Common/Helper.js";

const getValues = (data = []) => {
    let d = [];
    _.map(data, (v, i) => {
        let value = _.startCase(_.replace(v, '_', ' '));
        d.push({ key: v, value });
    })
    return d;
  };

//   const cryptoList = async (req, res) => {
//     let status =getValues(variables.ORDER_STATUS);

//     let request = req.query;

//     const crypto = await Currency.findAll({where: request.symbol, attributes: ['image', 'symbol']});

//     try {
//       return res.json(reply.success("Currency Status Updated Successfully.", {crypto, status}));
//     } catch (err) {
//       return res.json(reply.failed("No Data Found"));
//     }
//   },

const cryptoList = async (req,res) => {
    let X1 = await ListCrypto.findAll({attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('currency')), 'currency'],'image','listed']})
    let X2 = await ListCoin.findAll({attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('currency')), 'currency'],'image','listed']})
    let crypto =  X1.concat(X2)

    let o_status = await Order.findAll({attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('current_status')), 'current_status']]})
    o_status = _.map(o_status,'current_status')

    let ORDER_STATUS =getValues(o_status)
 return (crypto ? res.send(reply.success('List Crypto Fetched Successfully',{crypto,ORDER_STATUS})) : res.send(reply.failed('Can not Fetch at this moment')) )
}

const getOrders = async (req,res) => {
    let request = req.query;
    let { name, order_type,currency, quantity, at_price, total, current_status, created_at,sortbyname,sortby } = request;

    let filter_data ={}
    let user_filter = {};

    if (name) {
        user_filter.name = name
    }

    if (order_type) {
        filter_data.order_type= {
            [Op.substring] : order_type
        }
    }
    if (currency) {
        filter_data.currency= {
            [Op.substring] : currency
        }
    }
    if (quantity) {
        filter_data.quantity=  quantity
    }
    if (at_price) {
        filter_data.at_price=  at_price
    }
    if (total) {
        filter_data.total=  total
    }
    if (current_status) {
        filter_data.current_status= {
            [Op.substring] : current_status
        }
    }
    if (created_at) {
        filter_data.created_at= {
            [Op.substring] : Helper.get_trailing_zero(created_at)
        }
    }

       //helper pagination
        try {
            const paginate= (sortbyname== 'name') ? Helper.getPaginate(req,sortbyname,sortby,User):Helper.getPaginate(req,sortbyname,sortby)
            let where_condition= { where:filter_data,
                include: [{
                    model: User, attributes: ["name", "email", "profile_image"], where: user_filter
                    }]
               }
            let finalquery= Object.assign(where_condition,paginate)

            // console.log({finalquery})
            const get_data = await Order.findAll(finalquery);
            const count= await Order.count(finalquery)
        
            //pagination
            let final = reply.paginate(paginate.page,get_data,paginate.limit,count)
            return res.json(reply.success("Orders Fetched Successfully", final));
        } catch (error) {
            console.log(error)
            return res.send(reply.failed("Unable to fetch at this moment"));
        }


    
}

export default{
    cryptoList,
    getOrders
}