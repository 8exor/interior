import reply from "../Common/reply.js";
import fetch from 'node-fetch';
import { ListCrypto } from './../Models/ListCrypto.js';
import { ListCoin } from './../Models/ListCoin.js';
import { UserCrypto } from "../Models/UserCrypto.js";
import { WalletTransaction } from "../Models/WalletTransaction.js";
import { Commission } from './../Models/Commission.js';
import { GClass } from '../Globals/GClass.js';
import Sequelize from "sequelize";
import _ from "lodash";
import { CL } from "cal-time-stamper";
import myCache from "../Node-cache/cache.js";

const { Op } = Sequelize;

const convertData = (array) => {

    return array.map(r => {
        return [
            r[0], r[4]
        ]
    });
}

const pairs_needed = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'BNBUSDT', 'MATICUSDT', 'WRXUSDT', 'TRXUSDT', 'DOGEUSDT'];


export default {

    async getSliderCurrencyData(req, res) {

        // let c_rate = await getConversionRate(); 
        let c_rate = myCache.get('getConversionRate');

        // let symbols_current_price = await fetch(GClass.get24hrApi).then(r => r.json().then(result => result));

        let symbols_current_price = myCache.get('get24hrApi');


        // Filter Data According To oUr Need
        let resulted_data = symbols_current_price.filter(currency => pairs_needed.includes(currency.symbol)).map(f_result => {
            return {
                symbol: f_result.symbol,
                change: f_result.priceChangePercent,
                lastPrice: f_result.lastPrice,
                convert_price: CL.mul(f_result.lastPrice, c_rate.rate)
            }
        });

        let tickers = pairs_needed.map((e) => e.toLowerCase() + '@ticker');

        return res.json(reply.success('Sliders Fetched', resulted_data, { tickers, c_rate }));

    },

    async getAllCryptoSymbols(req, res) {
        let all = await ListCrypto.findAll({
            attributes: ['pair_with', 'currency', 'symbol']
        });

        let list_coins = await ListCoin.findAll({
            attributes: ['pair_with', 'currency', 'symbol']
        });

        all = all.concat(list_coins);

        all = all.map(e => e.symbol);
        return res.json(reply.success('All Symbols Fetched', all));
    },

    // Get Dashboard Market Chart Data
    async getMarketChart(req, res) {

        if (myCache.has('getMarketChart')) {
            var resultt = myCache.get('getMarketChart');
            return res.json(reply.success('Fetched Success', resultt));
        }

        let url = 'https://api.binance.com/api/v3/klines?interval=1d&limit=100&symbol=';

        var BTCUSDT, ETHUSDT, TRXUSDT, XRPUSDT;

        [BTCUSDT, ETHUSDT, TRXUSDT, XRPUSDT] = await Promise.all([
            fetch(url + 'BTCUSDT').then(e => e.json().then(re => re)),
            fetch(url + 'ETHUSDT').then(e => e.json().then(re => re)),
            fetch(url + 'TRXUSDT').then(e => e.json().then(re => re)),
            fetch(url + 'XRPUSDT').then(e => e.json().then(re => re)),
        ]);

        let result = {
            BTCUSDT: convertData(BTCUSDT),
            ETHUSDT: convertData(ETHUSDT),
            TRXUSDT: convertData(TRXUSDT),
            XRPUSDT: convertData(XRPUSDT),
        }

        myCache.set('getMarketChart', result);

        return res.json(reply.success('Fetched Success', result));

    },

    // GET TOP GAINER AND LOSERS

    async getMarketGainers(req, res) {

        // Get All Listed Cryptos

        // var all_distinct_cryptos = await ListCrypto.findAll({
        //     attributes: [
        //         [Sequelize.fn('DISTINCT', Sequelize.col('currency')), 'currency'],
        //     ],
        //     // where: {
        //     //     pair_with:"USDT"
        //     // }
        // });

        // let all_currency_array = all_distinct_cryptos.map((e) => {
        //     return e.currency + 'USDT'
        // });

        if (myCache.has('getMarketGainers')) {
            let Final_result = myCache.get('getMarketGainers');
            return res.json(reply.success('Gainers Fetched Succesffuly', Final_result));
        }

        let core_assets_array = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'TRXUSDT', 'SHIBUSDT', 'XRPUSDT'];

      //  let url = GClass.get24hrApi;

       // let ress = await fetch(url).then(e => e.json());

       let ress = myCache.get('get24hrApi');

        ress = ress.filter((e) => e.symbol.includes('USDT'));

        let core_data = ress.filter((e) => core_assets_array.includes(e.symbol));

        // SORT DATA
        ress = ress.sort((a, b) => parseFloat(CL.sub(a['priceChangePercent'], b['priceChangePercent'])))

        let losers = ress.slice(0, 5);

        let gainers = ress.reverse().slice(0, 5);

        let resulted = [];
        resulted = resulted.concat(core_data, losers, gainers);

        let tickers = resulted.map((e) => e.symbol.toLowerCase() + '@ticker');

        let Final_result = {
            core_data, losers, gainers, tickers
        }

        myCache.set('getMarketGainers', Final_result);

        return res.json(reply.success('Gainers Fetched Succesffuly', Final_result));
    },

    async getDashboardRepot(req, res) {

        let currency = req.params.symbol;
        // let currency = "FNX";
        let whereCondition = {
            user_id: {
                [Op.ne]: 1
            }
        }
        if (currency) {
            whereCondition = {
                user_id: {
                    [Op.ne]: 1
                }, currency
            }
        }
        const totalCurrencyAmount = await UserCrypto.findAll({
            where: whereCondition,
            attributes: [
                'currency',
                // add balance and freedge balance
                [Sequelize.fn('sum', Sequelize.col('balance')), 'total_amount'],
            ],
            group: ['currency'],
        });


        var x = totalCurrencyAmount.map(async (o, index) => { return await getCurrencyReport(o.currency, o.dataValues.total_amount) });

        let result = await Promise.all(x);
        let total_exchange_holding = 0;
        let total_commission = 0;
        let total_withdraw = 0;
        let total_currency_amount = 0;
        if (result.length > 0) {
            total_exchange_holding = _.sumBy(result, function (o) { return parseFloat(o.total_exchange_holding); });
            total_commission = _.sumBy(result, function (o) { return parseFloat(o.total_commission); });
            total_withdraw = _.sumBy(result, function (o) { return parseFloat(o.total_withdraw); });
            total_currency_amount = _.sumBy(result, function (o) { return parseFloat(o.amount); });
            //  
            // console.log({ total_exchange_holding });

        }
        return res.json(reply.success('currencies Fetched Succesffuly', {
            currency,
            total_exchange_holding,
            total_commission,
            total_withdraw,
            total_currency_amount
        }));

    }
}

async function getConversionRate() {

    if (myCache.has('getConversionRate')) {
        let rr = myCache.get('getConversionRate');
        return rr;
    }

    try {
        var result = await fetch(GClass.all_currency_conversions).then(r => r.json().then(re => re));
    } catch (error) {
        return { rate: 82 };
    }

    result = result?.data.find(e => e.pair == GClass.selected_fiat_currency_pair);

    myCache.set('getConversionRate', { rate: result.rate }, 60);

    return { rate: result.rate };
}

async function getCurrencyReport(currency, amount) {

    currency = currency.toUpperCase();

    let current_price = currency == "USDT" ? 1 : 0;

    // list coin 
    let list_coin = await ListCoin.findOne({
        where: { currency },
    })
    if (list_coin) {
        current_price = list_coin.current_price;
    }

    // list crypro 
    let list_crypto = await ListCrypto.findOne({
        where: { currency },
    })
    if (list_crypto) {

        let symbol = currency + "USDT";
        let symbolPrice = await fetch(GClass.getSingleSymbolPrice(symbol)).then(r => r.json().then(result => result));
        current_price = symbolPrice.price
    }
    var data = {};
    data.currency = currency;
    data.amount = amount;
    data.total_exchange_holding = CL.mul(amount, current_price);


    const totalCurrencyCommission = await Commission.findAll({
        where: { commission_currency: currency },
        attributes: [
            [Sequelize.fn('sum', Sequelize.col('commission')), 'total_commission'],
        ]
    });
    let commission_total = totalCurrencyCommission[0]?.dataValues.total_commission;
    data.total_commission = commission_total ? CL.mul(commission_total, current_price) : 0;

    const totalWithdraw = await WalletTransaction.findAll({
        where: {
            status: "completed",
            currency
        },
        attributes: [
            [Sequelize.fn('sum', Sequelize.col('amount')), 'total_withdraw'],
        ]
    })
    let withdraw_total = totalWithdraw[0]?.dataValues.total_withdraw;
    data.total_withdraw = withdraw_total ? CL.mul(withdraw_total, current_price) : 0;


    return data;

}
