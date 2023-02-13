import reply from "../Common/reply.js";
import { FavPair } from "../Models/FavPair.js";
import { ListCrypto } from "../Models/ListCrypto.js";
import { ListCoin } from './../Models/ListCoin.js';
import _ from 'lodash'

export default {
    async get(req, res) {
        const excluded_fields = ['active_status', 'address', 'deposit', 'deposit_min', 'deposit_max', 'deposit_commission', 'deposit_commission_type', 'withdraw', 'withdraw_min', 'withdraw_max', 'withdraw_commission', 'withdraw_commission_type', 'buy', 'buy_min', 'buy_max', 'buy_commission', 'buy_commission_type', 'sell', 'sell_min', 'sell_max', 'sell_commission', 'sell_commission_type'];


        var favpair = await FavPair.findAll({
            attributes: ['currency', 'pair_with', 'symbol'],
            where: {
                user_id: req.user.id
            }
        });

        var crypto = await ListCrypto.findAll({
            attributes: {
                exclude: excluded_fields
            }
        });

        var coin = await ListCoin.findAll({
            attributes: {
                exclude: excluded_fields
            }
        });

        var result = crypto.concat(coin);

        result = favpair.map((pair) => {
            return result.find(crypto => crypto.currency == pair.currency && crypto.pair_with == pair.pair_with);
        });

        // Remove Undefined Values from above result array
        result = _.compact(result);

        var fav_symbols = [];

        // Adding Price Key in Resulted Data
        result.forEach(element => {
            let s = element.dataValues['currency'] + element.dataValues['pair_with'];
            console.log(s);
            fav_symbols.push(s);
            element.dataValues['price'] = "0";
            element.dataValues['change'] = "0";
            element.dataValues['high'] = "0";
            element.dataValues['low'] = "0";
            element.dataValues['isFav'] = false;
        });


        return res.json(reply.success('Fav Pairs fetched Successfully', result, { fav_symbols }));
    }
}
