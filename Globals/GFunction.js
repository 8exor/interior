import fetch from 'node-fetch';
import { Order } from '../Models/Order.js';
import { GClass } from  './GClass.js';
import { User } from './../Models/User.js';
import { UserCrypto } from './../Models/UserCrypto.js';

const getConversionRate = async () => {
    let result = await fetch(GClass.all_currency_conversions).then(r => r.json().then(re => re));

    result = result?.data.find(e => e.pair == GClass.selected_fiat_currency_pair);
    return {rate: result.rate};
}

export const GFunction = {
    
    getSymbolPrice : async (symbol , is_in_usdt = false) => {

        if(symbol == GClass.selected_fiat_currency){
            let price = await getConversionRate();
            return {price: price.rate }
        }
       
        symbol = is_in_usdt ? (symbol + 'USDT') : symbol ;
        
        let result = await fetch(GClass.getSingleSymbolPrice(symbol)).then(re => re.json());
        
        return result;
    
    },

    getOrderById : async (order_id) => {
        return await Order.findByPk(order_id);
    },

    getUserById : async (user_id) => {
        return await User.findByPk(user_id);
    },

    getUserCryptoByUserId: async (user_id , currency) => {
        return await UserCrypto.findOne({ where: { user_id: user_id  , currency: currency} });
    },

    getConversionRate
}