import _ from 'lodash';
import myEvents from '../RunnerEngine/Emitter.js';
import { ListCoin } from './../Models/ListCoin.js';
import { ListCrypto } from './../Models/ListCrypto.js';
import { POINTER_EVENTS } from './AllEvents.js';

let all_data;
let symbol_list = {};

const attributes = ['currency', 'pair_with', 'decimal_currency', 'decimal_pair'];

const setData = async () => {
    let list_coin = await ListCoin.findAll({
        raw: true,
        attributes
    });

    let list_cryptos = await ListCrypto.findAll({
        raw: true,
        attributes
    });

    all_data = list_coin.concat(list_cryptos);
    // Add Symbol in all
    all_data = all_data.map((el) => {
        el['symbol'] = el.currency + el.pair_with;
        symbol_list[el.currency + el.pair_with] = el.decimal_currency;   // add In List
        return el;
    })

}

// Initialise All DATA
setData();

// Bind Event Listener for Update
myEvents.on(POINTER_EVENTS.update_pointer, setData);

const default_decimal = 8;
// Prototype Function
function convertCrypto(symbol) {
    let decimal = symbol_list[symbol] == 0 ? default_decimal : symbol_list[symbol];
    return _.floor(parseFloat(this), (decimal || default_decimal));
}

// Prototype
String.prototype.toCrypto = Number.prototype.toCrypto = convertCrypto;

export default {}