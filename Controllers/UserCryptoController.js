import reply from "../Common/reply.js";
import { ListCrypto } from "../Models/ListCrypto.js";
import { UserCrypto } from "../Models/UserCrypto.js";
import { UserWallet } from "../Models/UserWallet.js";

import fetch from 'node-fetch';
import Sequelize from 'sequelize';
import _ from 'lodash';
import variables from "../Config/variables.js";
import { Currency, CurrencyNetwork } from './../Models/Currency.js';
import { GClass } from './../Globals/GClass.js';
import { ListCoin } from './../Models/ListCoin.js';
import myEvents from "../RunnerEngine/Emitter.js";
import myCache from "../Node-cache/cache.js";

import { Ledger_Log_Events, TransactionType } from "../Common/AllEvents.js";


const [NODE_FUND_API_KEY, LARAVEL_FUND_API_KEY] = ["Yp3s6v9y$BLE)H@McQfTjWmZq4t7w!z%C*F-JaNdRgUkXp2r5u8x/A?D(GBKbPeSM", "3t6w9z$CLF)J@NcRfUjWnZr4u7x!ABD*G-KaPdSgVkYp2s5v8y/B?E(HLMbQeThW"];


import WalletUpdater from '../alksjdhfg/wallet_updater.js';
import { CL } from "cal-time-stamper";
import { User } from "../Models/User.js";

const getPercentage = (obtained, total) => {
    return CL.round(parseFloat(CL.mul(parseFloat(CL.div(obtained, total)), 100)), -3);
}

const verify = (request) => {

    if (request.NODE_FUND_API_KEY == NODE_FUND_API_KEY && request.LARAVEL_FUND_API_KEY == LARAVEL_FUND_API_KEY) return true;
    return false;
}


export default {
    async get(req, res) {

        var all_distinct_cryptos = await ListCrypto.findAll({
            attributes: [
                [Sequelize.fn('DISTINCT', Sequelize.col('currency')), 'currency'],
            ]
        });

        var all_cryptos = await ListCrypto.findAll();

        const response = await fetch('https://api.binance.com/api/v3/ticker/price');
        const result2 = await response.json();

        var user_crypto = await UserCrypto.findAll({
            attributes: [
                'currency',
                'balance',
                'freezed_balance'
            ],
            where: {
                user_id: req.user.id
            }

        });

        var final_result = [];
        var total_usdt = '0';
       

        // Add USDT
        let default_curreny = user_crypto.find(c => c.currency == "USDT");
        let base_crypto = {
            'image': all_cryptos.find(c => c.currency == 'USDT')?.image || variables.laravel_url + 'currency_images/tether.png',
            'name': 'USDT',
            'currency': "USDT",
            'quantity': default_curreny?.balance || '0',
            'c_price': default_curreny?.balance || '1',
            'c_bal': CL.round(default_curreny?.balance || '0', -3),
            'freezed_balance': user_crypto.find(c => c.currency == "USDT")?.freezed_balance || '0',
            'portfolio_share': "0", // Calculate IT
            'address': 'TBxTg48Y9ZRajLQpe9WDY9jYBWTANWSpps',
            'withdraw': true,
            'deposit': true,
            'decimal_length': 3,
        };

        // Add Default Usdt balance
        total_usdt = CL.add(total_usdt, (default_curreny?.balance || '0'));

       


        all_distinct_cryptos.forEach(crypto => {

            let in_user_crypto = user_crypto.find(c => c.currency == crypto.currency);
            let in_all_crypto = all_cryptos.find(c => c.currency == crypto.currency);

            let result = {
                'image': in_all_crypto?.image || '',
                'name': in_all_crypto?.name || '',
                'currency': in_all_crypto?.currency || '',
                'quantity': in_user_crypto?.balance || '0',
                'c_price': result2.find(c => c.symbol == (in_all_crypto?.currency + 'USDT'))?.price || '0',
                'freezed_balance': in_user_crypto?.freezed_balance || '0',
                'portfolio_share': "0", // Calculate IT
                'address': in_all_crypto?.address || '',
                'withdraw': in_all_crypto?.withdraw || false,
                'desposit': in_all_crypto?.deposit || false,
                'decimal_length': in_all_crypto?.decimal_length || 8
            }

            let c_balance = CL.mul(result.quantity, result.c_price);
            result['c_bal'] = CL.round(c_balance, -3);

            total_usdt = CL.add(total_usdt, c_balance);

                      


            final_result.push(result)
        });

        total_usdt = CL.round(total_usdt, -3);

        // ADD PORTFOLIO SHARE IN EVERY CURRENCY
        final_result.forEach(dta => {

            if (!(_.isEqual(parseFloat(dta.c_bal), 0))) {
                dta['portfolio_share'] = getPercentage(dta.c_bal, total_usdt);
            }
        });

        // ADD PORTFOLIO SHARE IN BASE CRYPTO
        base_crypto.portfolio_share = getPercentage(base_crypto.c_bal, total_usdt == '0' ? 1 : total_usdt);
        // base_crypto.portfolio_share = getPercentage(base_crypto.c_bal , total_usdt)

        return res.json(reply.success('Cryptos fetched successfully', final_result, { main: base_crypto, total: total_usdt }));
    },

    async getNew(req, res) {

        // var request = req.query;

        // let validation = new Validator(request, {
        //     currency: "required|in:BTC,USDT,INR,BNB,ETH"
        // });

        // if (validation.fails()) {
        //     return res.json(reply.failed(firstError(validation)));
        // }

        let user_id = req?.user?.id ?? null;

        if(user_id == null){
            return res.send(reply.failed('Invalid Data!!'));
        }

        let active = await User.findOne({ where: {id:user_id}});


        var inr_rate= myCache.get('getConversionRate');
        inr_rate = inr_rate?.rate || 0 ;

        let currencies = await Currency.findAll({
            include: CurrencyNetwork,
            where: {
                active_status_enable: 1
            }
        });

        let listedCoins = await ListCoin.findAll();

        // Current market Price
        // const current_mp = await fetch(GClass.getAllSymbolPrice).then(re => re.json());


        var current_mp = myCache.get('getAllSymbolPrice');

        // return res.send(JSON.stringify(current_mp));

        // console.log(current_mp);

        var user_crypto = await UserCrypto.findAll({
            attributes: [
                'currency',
                'balance',
                'freezed_balance'
            ],
            where: {
                user_id: req.user.id
            }

        });


        let user_wallets = await WalletUpdater.getUserWallets(req.user.id);

        var total_usdt = '0';
        var total_freezed = '0';
        // Loop Over all Currencies

        var _pricePerferCurrency = 0;

        currencies.forEach((e) => {

            // Setting Wallet Address In Currency Networks

            e.dataValues.currency_networks = e.dataValues.currency_networks.map(c_net => {


                if (c_net.dataValues.token_type == 'ERC20' || c_net.dataValues.token_type == 'BEP20') {
                    c_net['dataValues']['wallet_address'] = user_wallets.ETH || '';
                }

                if (c_net.token_type == 'TRC20') {
                    c_net['dataValues']['wallet_address'] = user_wallets.TRON || '';
                }

                if (c_net.token_type == 'SELF') {
                    c_net['dataValues']['wallet_address'] = user_wallets[e.symbol == 'TRX' ? 'TRON' : e.symbol] || '';
                }
                return c_net;
            });


            let user_crypto_fin = user_crypto.find(c => c.currency == e.symbol);
            let addData = {
                'quantity': user_crypto_fin?.balance || '0',
                'freezed_balance': user_crypto_fin?.freezed_balance || '0',
                'c_price': '0',
                'portfolio_share': "0", // Calculate IT
            }

            // console.log(e.dataValues);

          

            if (e.currency_type == 'crypto') {
                let c_price = current_mp.find((c) => {

                    // console.log({csym: c.symbol, esym: e.symbol , asym: active.currency_preference });

                   
                    if(active.currency_preference == "BTC" && c.symbol == "BTCUSDT" && e.symbol == "BTC"){
                        _pricePerferCurrency = c?.price || 0;
                        return c || '0';
                    }

                    if(active.currency_preference == "ETH" && c.symbol == "ETHUSDT"  && e.symbol == "ETH"){
                        _pricePerferCurrency = c?.price || 0;
                        return c || '0';
                    }

                    if(active.currency_preference == "BNB" && c.symbol == "BNBUSDT"  && e.symbol == "BNB"){
                        _pricePerferCurrency = c?.price || 0;
                        return c || '0';
                    }

                    if(active.currency_preference == "INR" && c.symbol == (e.symbol + "USDT")){
                        
                        return c || '0';
                    }

                    if(c.symbol == (e.symbol + active.currency_preference)){
                        
                        return c || '0';
                    }


                   

                    // c.symbol == (e.symbol + active.currency_preference))?.price || '0'
                });


                addData['c_price'] = c_price?.price || 0;


               

                let is_listed = listedCoins.find(c => c.symbol == (e.symbol + 'USDT'));
                
                if (is_listed) {
                    addData['c_price'] = is_listed?.current_price || '0';
                }

                if (e.symbol == "USDT") {
                    addData['c_price'] = '1';
                }

            }

            if( e.currency_type == "fiat"){
                addData["c_price"] = CL.div(1 , inr_rate);//(1/inr_rate).toFixed(4);
                addData["c_price"] = parseFloat(addData["c_price"]).toFixed(4);
            }

            var c_balance = CL.mul(addData.quantity, addData.c_price);

            
            addData['c_bal'] = (e.symbol != 'USDT') ? CL.round(c_balance, -3) : CL.round(addData.quantity, -3);


            let fc_balance = CL.mul(addData.freezed_balance, addData.c_price);

            addData['fc_bal'] = (e.symbol != 'USDT') ? CL.round(fc_balance, -3) : CL.round(addData.freezed_balance, -3);


            if (!(e.is_multiple)) {
                e.dataValues.currency_networks = e.currency_networks.filter(cn => cn.id == e.default_c_network_id);
            }

            Object.assign(e.dataValues, addData);

            total_usdt = CL.add(total_usdt, addData.c_bal);

            //Add base freezed balance
            total_freezed = CL.add(total_freezed, addData.fc_bal);
        });

        // Update Portfolio Share
        // currencies.filter(cr => !(_.isEqual(parseFloat(cr.dataValues.c_bal), 0))).map(da => da.dataValues.portfolio_share = getPercentage(da.dataValues.c_bal, (total_usdt == '0' ? 1 : total_usdt)));

        // Sort By portfolio share
        currencies = _.orderBy(currencies, [o => parseFloat(o.dataValues.c_bal)], ['desc']);

        // EMIT FOR UPDATE WALLET BLANCES FROm BLOCKCHAIN
        myEvents.emit('UPDATE_WALLET_BALANCES', req.user.id);


        let img_url =  active.currency_preference == "USDT" ? variables.laravel_url + 'currency_images/tether.png' : variables.laravel_url + 'currency_images/' + active.currency_preference.toLowerCase() + ".png";

        let total_portfolio = (active.currency_preference == "USDT" || active.currency_preference == "INR") ? total_usdt  : CL.round(CL.div(total_usdt, _pricePerferCurrency), - 5);


        let c_p = {currency_preference: active.currency_preference, currency_preference_price : _pricePerferCurrency, currency_preference_image: img_url};

        return res.json(reply.success('Cryptos fetched successfully', currencies, { mainTotal: total_portfolio, freezedTotal: total_freezed, c_p }));

    },


    async getFunds(req, res) {

        var all_distinct_cryptos = await Currency.findAll({
            where: {
                active_status_enable: 1
            }
        });


        var user_crypto = await UserCrypto.findAll({
            attributes: [
                'currency',
                'balance',
                'freezed_balance'
            ],
            where: {
                user_id: req.user.id
            }

        });

        var final_result = [];

        all_distinct_cryptos.forEach(crypto => {

            let in_user_crypto = user_crypto.find(c => c.currency == crypto.symbol);

            const result = {
                'currency': crypto?.symbol || '',
                'balance': in_user_crypto?.balance || '0',
                'freezed_balance': in_user_crypto?.freezed_balance || '0',
            }
            final_result.push(result)
        });

        // To Fixed
        final_result.forEach(e => parseFloat(e.balance).toFixed(8));

        return res.json(reply.success('Funds fetched successfully', final_result));

    },


    // for user_wallet _ladgers

    async creditFunds(req, res) {

        let request = req.body;

        var authenticate = verify(request);

        if (!authenticate) return res.json(reply.failed('unadtherized'));

        myEvents.emit(Ledger_Log_Events.add_credit, request);

        return res.json(reply.success('Logs Updated successfully'));
    },
    async freezeFunds(req, res) {

        let request = req.body;

        var authenticate = verify(request);

        if (!authenticate) return res.json(reply.failed('unadtherized'));

        myEvents.emit(Ledger_Log_Events.freeze_balance, request);

        return res.json(reply.success('Logs Updated successfully'));
    },
    async unfreezeFunds(req, res) {

        let request = req.body;

        var authenticate = verify(request);

        if (!authenticate) return res.json(reply.failed('unadtherized'));

        myEvents.emit(Ledger_Log_Events.un_freeze_balance, request);


        return res.json(reply.success('Logs Updated successfully'));
    },
    async cancelUnfreezeFunds(req, res) {

        let request = req.body;

        var authenticate = verify(request);

        if (!authenticate) return res.json(reply.failed('unadtherized'));

        myEvents.emit(Ledger_Log_Events.cancel_freeze_balance, request);

        return res.json(reply.success('Logs Updated successfully'));
    },


}

