import _ from 'lodash';
import Web3 from 'web3';
import pkg from 'sequelize';
import axios from 'axios';
const { Sequelize, Op } = pkg;
import { GClass } from "../Globals/GClass.js";


import { CurrencyNetwork } from '../Models/Currency.js';
import { UserWallet } from './../Models/UserWallet.js';

const minABI = [
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{ "name": "", "type": "string" }],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "type": "function"
    }

];

import variables from "../Config/variables.js";
import { CL } from 'cal-time-stamper';

//=========================================================//
//===============   RPC URL AND WEB3    ===================//
//=========================================================//

const ETH_RPC_URL = variables.ETH_RPC_URL;
const BSC_RPC_URL = variables.BSC_RPC_URL;
 

//# WEB3 INSTANCES
var web_eth = new Web3(ETH_RPC_URL);
var web_bsc = new Web3(BSC_RPC_URL);

const TRON_API = variables.TRON_API;




const BTC_SOCHAIN_NETWORK = "BTCTEST";
const BTC_API = `https://sochain.com/api/v2/get_tx_unspent/${BTC_SOCHAIN_NETWORK}/`;
// const BTC_SOCHAIN_NETWORK = "BTC";

//=========================================================//
//===============   GET LATEST BALANCES  ==================//
//=========================================================//

// ETH
const get_main_eth_balance = async (wallet_address) => {

    let bal = 0;
    let is_valid = web_eth.utils.isAddress(wallet_address);
    if(is_valid){
        bal = await web_eth.eth.getBalance(wallet_address)
    }
    return web_eth.utils.fromWei(bal);
}

const get_eth_balance = async (contract_address , wallet_address) => {
    let is_valid = web_eth.utils.isAddress(contract_address);

    if (is_valid) {
        let contract_instance = new web_eth.eth.Contract(minABI, contract_address);
        let bal = await contract_instance.methods.balanceOf(wallet_address).call();
        let token_decimals = await contract_instance.methods.decimals().call();
        token_decimals = 10**token_decimals;
        bal = CL.div(bal, token_decimals);
        // console.log({bal, token_decimals})
        // return bal;
        return { [contract_address]: bal}
    }
    return await new Promise(r => setTimeout(r( { [wallet_address]: 0 }), 5));
}

const get_eth_balances = async (contract_address_array, user_eth_wallet) => {

    return await Promise.all(contract_address_array.map(contract_address => get_eth_balance(contract_address,user_eth_wallet)));
}

// BSC

const get_main_bsc_balance = async (wallet_address) => {

    let bal = 0;
    let is_valid = web_bsc.utils.isAddress(wallet_address);
    if(is_valid){
        bal = await web_bsc.eth.getBalance(wallet_address)
    }
    return web_bsc.utils.fromWei(bal);
}

const get_bsc_balance = async (contract_address , wallet_address) => {
    let is_valid = web_eth.utils.isAddress(contract_address);

    if (is_valid) {
        let contract_instance = new web_bsc.eth.Contract(minABI, contract_address);
        let bal = await contract_instance.methods.balanceOf(wallet_address).call();
        let token_decimals = await contract_instance.methods.decimals().call();
        token_decimals = 10**token_decimals;
         bal = CL.div(bal, token_decimals );
        //  console.log({bal, token_decimals})
        // return bal;
        return { [contract_address]: bal}
    }
    return await new Promise(r => setTimeout(r({ [wallet_address]: 0 }), 10));
}

const get_bsc_balances = async (contract_address_array, user_eth_wallet) => {

    return await Promise.all(contract_address_array.map(contract_address => get_bsc_balance(contract_address,user_eth_wallet)));
}

// TRX

const get_main_trx_balance = async (user_trx_wallet) => {

    let bal = 0 ;
    var res =  await axios.get(TRON_API + user_trx_wallet);

    if(res.data.data){
        let trx_response = res.data.data ;
        let exist_token = trx_response.find(ele=> ele?.token_id == '_');
        bal = exist_token ? exist_token.balance : 0 ;
    }

    return bal;
    
}

const get_trx_Balances = async (contract_address_array,user_trx_wallet) => { 
 
    var res =  await axios.get(TRON_API + user_trx_wallet);

  
    let trx_response = res.data.data || null;

    let result =  contract_address_array.map((contract) =>{

        let bal = 0 ;

        if(trx_response != null)
        {
            var exist_token = trx_response.find(ele=> ele?.token_id == contract);
            bal =  exist_token ? exist_token.balance : 0 ; 
        }
       
        return { [contract] : bal} 
                
    }) 
    return result;
}

// BTC
const get_btc_balance = async(btc_wallet) => {

    let bal = 0 ;

    try {
        
        let result = await axios.get(BTC_API + btc_wallet);

        if(result.status == 'fail')
        {
            return bal;
        }
    
       let trx_array = result.data?.data.txs || null ;
    
        if(trx_array != null) 
        {
            trx_array.forEach(trx => {
                bal = CL.add(bal , trx.value );
            });
        }
        return bal;

    } catch (error) {
        return bal;
    }
   
}


//=========================================================//
//===============     OTHER FUNCTIONS    ==================//
//=========================================================//


const getAllContracts = async () => {
    let all_currency_networks = await CurrencyNetwork.findAll({
        where: {
            token_type: ['ERC20', 'BEP20', 'TRC20']
        },
        attributes: [
            'token_type',
            [Sequelize.fn('GROUP_CONCAT', Sequelize.col('address')), 'addresses']
        ],
        group: ['token_type']
    });

    // MAP On all currency networks for string to array addresses
    all_currency_networks = all_currency_networks.map((e) => {
        e.dataValues.addresses = e.dataValues.addresses.split(',');
        return e;
    });
    return all_currency_networks;
}

const getUserWallets = async (user_id) => {

    let wallets = await UserWallet.findOne({
         where :{ user_id },
         attributes: [ 
          'user_id',
          [Sequelize.fn('GROUP_CONCAT', Sequelize.col('address')), 'addresses'], 
          [Sequelize.fn('GROUP_CONCAT', Sequelize.col('type')), 'types']
        ]
     });

    if(wallets.user_id == null)
    {
        return false ; 
    }
   
    return _.zipObject(_.split(wallets.dataValues.types , ',') , _.split(wallets.dataValues.addresses , ','));
}

const getUserWalletBalances = async (user_id) => {

    let user_wallets = await getUserWallets(user_id);
    
    if(!user_wallets)
    {
        return false ;
    }

    let { ETH , BTC , TRON } = user_wallets ;

    let d = await getAllContracts();
    
    let eth_token = d.find(tt => tt.token_type == 'ERC20');
    let bsc_token = d.find(tt => tt.token_type == 'BEP20');
    let trx_token = d.find(tt => tt.token_type == 'TRC20');

    // let eth = await WalletUpdater.get_main_eth_balance('0x216a9cC0fba7d9fb24429BB13f5fDdB95B726842');
    // let bsc = await WalletUpdater.get_main_bsc_balance('0x216a9cC0fba7d9fb24429BB13f5fDdB95B726842');
    // let trx = await WalletUpdater.get_main_trx_balance('TBTCe4FbXKRLSXBZc1yRkQsFmb8gYThgV9');
    // let btc = await WalletUpdater.get_btc_balance('mxagvahuR6WNDXbHAmEurPzFQ4zNvAo5D4');
   
    // let eth_tokens = await WalletUpdater.get_eth_balances(eth_token.dataValues.addresses , '0x216a9cC0fba7d9fb24429BB13f5fDdB95B726842');
    // let bsc_tokens = await WalletUpdater.get_bsc_balances(bsc_token.dataValues.addresses , '0x216a9cC0fba7d9fb24429BB13f5fDdB95B726842');
    // let trx_tokens = await WalletUpdater.get_trx_Balances(trx_token.dataValues.addresses , 'TBxTg48Y9ZRajLQpe9WDY9jYBWTANWSpps');
  
    try {
        
        let [ eth , bsc , trx , btc , eth_tokens , bsc_tokens , trx_tokens ]  = await Promise.all([
            get_main_eth_balance(ETH),
            get_main_bsc_balance(ETH),
            get_main_trx_balance(TRON),
            get_btc_balance(BTC),
            eth_token ? get_eth_balances(eth_token.dataValues.addresses , ETH ) : [],
            bsc_token ? get_bsc_balances(bsc_token.dataValues.addresses , ETH ) : [],
            trx_token ? get_trx_Balances(trx_token.dataValues.addresses , TRON ) : []
        ]);
        return { eth,bsc ,trx , btc ,eth_tokens,bsc_tokens, trx_tokens };

    } catch (error) {
        console.log('Wallet Updater 299 line',error);
        return false ;
    }
   
}

const TOKEN_TYPE = {
    erc20 : "ERC20",
    bep20 : "BEP20",
    trc20 : "TRC20",
}


const TOKEN_NETWORK = {
    eth : "ETH",
    bsc : "BSC",
    trx : "TRX",
}


// EXPORT OBJECT
const WalletUpdater = {
    getAllContracts,
    get_eth_balances,
    get_bsc_balances,
    get_trx_Balances,
    get_main_eth_balance,
    get_main_bsc_balance,
    get_main_trx_balance,
    get_btc_balance,
    getUserWallets,
    getUserWalletBalances,
    TOKEN_TYPE,
TOKEN_NETWORK
}

export default WalletUpdater;



// POINTS
// API HIT FROM USER PANNEL
// GET USER ADDRESSES FROM USER WALLETS USING USER ID COMING FROM TOKEN

// GET ERC TOKEN BALANCES
// GET BEP TOKEN BALANCES
// GET TRC TOKEN BALANCES

// SAVE In DATABASE AND UPDATE VIRTUALLY
