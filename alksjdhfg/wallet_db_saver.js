import _ from 'lodash';
import { BlockchainTransfer } from '../Models/BlockchainTransfer.js';
import myEvents from '../RunnerEngine/Emitter.js';
import WalletUpdater from './wallet_updater.js';
import { UserCrypto } from './../Models/UserCrypto.js';
import { Currency, CurrencyNetwork } from '../Models/Currency.js';
import crypto from 'crypto';

const DECRIPTION_API_KEY = "JaNdRgUkXp2r5u8x/A?D(GBKbPeShVmYq3t6v9y$BLE)H@McQfTjWnZr4u7x!z%C"
const DECRIPTION_SECRET_API_KEY = "JaNdRgUkXp2r5u8x/A?D(GBKbPeShVmYq3t6v9y$BLE)H@McQfTjWnZr4u7x!z%C"

import Web3 from 'web3'
import TronWeb from 'tronweb';
import axios from 'axios'
import { GClass } from '../Globals/GClass.js';
import { DepositCryptoLogs } from '../Models/DepositCryptoLogs.js';
import { GasLog } from '../Models/GasLog.js';
import variables from "../Config/variables.js";
import { CL } from 'cal-time-stamper';

const TOKEN_TYPE = {
    erc20: "ERC20",
    bep20: "BEP20",
    trc20: "TRC20",
}

const TRON_GAS = 0.268;

const TOKEN_NETWORK = {
    eth: "ETH",
    bsc: "BSC",
    trx: "TRX",
}
const ETH_GAS = 21000;

let minABI = [
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
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "type": "function"
    }
];
const Admin_Wallets = async () => { return await WalletUpdater.getUserWallets(1); }

const ETH_RPC_URL = variables.ETH_RPC_URL;
const BSC_RPC_URL = variables.BSC_RPC_URL;



const fullNode = variables.fullNode;
const solidityNode = variables.solidityNode;
const eventServer = variables.eventServer;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitForTransaction = async (tronweb, trx_id, response = null) => {

    response = await tronweb.trx.getTransactionInfo(trx_id);
    console.log(response, "hihihihi");

    if (response == null || _.isEmpty(response)) {
        await sleep(2000); //  wait for 2 seconds
        return await waitForTransaction(tronweb, trx_id, response);
    }

    return response;
}
let PRIVATE_KEYS = {};

// Api limit = {
//     "user_id" : "last_hit_time"
// }
const getId = () => crypto.randomBytes(10).toString('hex');
let API_LIMIT = {}

const Api_limit_time = 300000; // In Ms

// const mathConfig = { returnString: true, eMinus: Infinity }

const filterUserBalance = async (user_id) => {

    // Limitation
    if (user_id == 1) return;
    let can_proceed = API_LIMIT[user_id] || null;
    if (can_proceed != null) {
        // check time differnce
        let diff = new Date().getTime() - can_proceed;
        if (diff < Api_limit_time) {
            return 'Wait';
        }
    }

    API_LIMIT[user_id] = new Date().getTime();


    let user_wallets = await WalletUpdater.getUserWallets(user_id);
    let result = await WalletUpdater.getUserWalletBalances(user_id);
    let min_deposit_check = await getAllTokensMinimumBalances();



    let eth_tokens = _.map(result.eth_tokens, (o) => {


        let token_address = Object.keys(o)[0] || '';

        let amount = _.values(o)[0] || 0;
        let min_deposit = min_deposit_check[token_address];
        // console.log({ token_address,  min_deposit , amount}); return ;
        if ((parseFloat(amount)) > 0 && (parseFloat(amount)) >= (parseFloat(min_deposit))) {
            return {
                amount: parseFloat(amount),
                user_id,
                user_wallet_address: user_wallets['ETH'] || '',
                chain_type: 'ETH',
                token_type: 'ERC20',
                token_address
            }
        }
    });

    let bsc_tokens = _.map(result.bsc_tokens, (o) => {

        let token_address = Object.keys(o)[0] || '';
        let amount = _.values(o)[0] || 0;
        let min_deposit = min_deposit_check[token_address];
        // console.log({ token_address,  min_deposit , amount}); return ;
        if ((parseFloat(amount)) > 0 && (parseFloat(amount)) >= (parseFloat(min_deposit))) {
            return {
                amount: parseFloat(amount),
                user_id,
                user_wallet_address: user_wallets['ETH'] || '',
                chain_type: 'BSC',
                token_type: 'BEP20',
                token_address
            }
        }
    });
    let trx_tokens = _.map(result.trx_tokens, (o) => {

        let token_address = Object.keys(o)[0] || '';
        let amount = _.values(o)[0] || 0;

        let min_deposit = min_deposit_check[token_address];

        // console.log({ token_address,  min_deposit , amount}); return ;

        if ((parseFloat(amount)) > 0 && (parseFloat(amount)) >= (parseFloat(min_deposit))) {
            return {
                amount: parseFloat(amount),
                user_id,
                user_wallet_address: user_wallets['TRON'] || '',
                chain_type: 'TRX',
                token_type: 'TRC20',
                token_address
            }
        }
    });

    // Concat All
    let all_tokens = eth_tokens.concat(bsc_tokens, trx_tokens);

    // Filter All Token and removed undefined values
    all_tokens = all_tokens.filter(un => un != undefined);

    // console.log({all_tokens});

    let mainWalletJson = (chain_type, wallet) => {
        return {
            amount: parseFloat(result[chain_type.toLowerCase()]) || 0,
            user_id,
            user_wallet_address: user_wallets[wallet] || '',
            chain_type: chain_type,
            token_type: 'SELF',
            token_address: 'SELF'
        }
    }

    // let [main_eth , main_bsc , main_trx , main_btc] = [mainWalletJson('ETH' , 'ETH'),mainWalletJson('BSC' , 'ETH'), mainWalletJson('TRX' , 'TRON'), mainWalletJson('BTC' , 'BTC')];
    let main_eth = mainWalletJson('ETH', 'ETH');
    let main_bsc = mainWalletJson('BSC', 'ETH');
    let main_trx = mainWalletJson('TRX', 'TRON');
    let main_btc = mainWalletJson('BTC', 'BTC');
    let all_mains = [main_eth, main_bsc, main_trx, main_btc];

    // FIlter Mains
    all_mains = all_mains.filter(main => (parseFloat(main.amount) || 0) > 0);

    // Merge All Tokens And Main balances

    let all_final_data = all_tokens.concat(all_mains);


    // get admin and user wallets private keys

    PRIVATE_KEYS = await getAllWalletsKey(user_id);

    // console.log(PRIVATE_KEYS);

    if (PRIVATE_KEYS == 0) return;


    return;

    const grouped_data = _.groupBy(all_final_data, 'token_type');
    console.log({ grouped_data, all_final_data });
    // return;
    let BEP20Tokens = grouped_data.BEP20;
    let ERC20Tokens = grouped_data.ERC20;
    let TRC20Tokens = grouped_data.TRC20;
    let SELF_Tokens = grouped_data.SELF;


    if (SELF_Tokens) {
        console.log({ SELF_Tokens });
        await saveDepositCryptoLog(SELF_Tokens)
        let chain_type = "ALL";
        myEvents.emit('TRANSFER_TO_ADMIN', SELF_Tokens, PRIVATE_KEYS.user_wallets, chain_type);
    }
    if (BEP20Tokens) {
        console.log({ BEP20Tokens });
        await saveDepositCryptoLog(BEP20Tokens)
        let total_gas = await calculate_BEP20_ERC20_Token_gasFee(BEP20Tokens, TOKEN_TYPE.bep20);

        var existing_token = _.find(SELF_Tokens, function (t) { return t.chain_type == TOKEN_NETWORK.bsc; });

        total_gas = existing_token ? CL.add(parseFloat(total_gas), parseFloat(ETH_GAS)) : total_gas;
        send_Gas_To_Client({ chain_type: TOKEN_NETWORK.bsc, total_gas, user_wallets: user_wallets.ETH, tokens: BEP20Tokens });


    }
    if (ERC20Tokens) {
        await saveDepositCryptoLog(ERC20Tokens)
        let total_gas = await calculate_BEP20_ERC20_Token_gasFee(ERC20Tokens, TOKEN_TYPE.erc20);
        var existing_token = _.find(SELF_Tokens, function (t) { return t.chain_type == TOKEN_NETWORK.eth; });

        total_gas = existing_token ? CL.add(parseFloat(total_gas), parseFloat(ETH_GAS)) : total_gas;
        send_Gas_To_Client({ chain_type: TOKEN_NETWORK.eth, total_gas, user_wallets: user_wallets.ETH, tokens: ERC20Tokens });

    }
    if (TRC20Tokens) {
        console.log({ TRC20Tokens });
        await saveDepositCryptoLog(TRC20Tokens)
        let total_gas = TRC20Tokens.length * 10;
        send_Gas_To_Client({ chain_type: TOKEN_NETWORK.trx, total_gas, user_wallets: user_wallets.TRON, tokens: TRC20Tokens });

    }



}

const saveDepositCryptoLog = async (tokens) => {

    DepositCryptoLogs.bulkCreate(tokens);
}


const calculate_BEP20_ERC20_Token_gasFee = async (Tokens, token_type) => {


    let admin_wallets = await Admin_Wallets();
    const RPC_URL = token_type == TOKEN_TYPE.erc20 ? ETH_RPC_URL : BSC_RPC_URL;
    var web3 = new Web3(RPC_URL);

    let g = Tokens.map(async (token) => {

        let contract = new web3.eth.Contract(minABI, token.token_address);
        let decimals = await contract.methods.decimals().call();
        decimals = 10 ** decimals;
        const token_amount = CL.mul(token.amount, decimals);

        let estimated_gas = await contract.methods.transfer(admin_wallets.ETH, token_amount.toString()).estimateGas({ from: token.user_wallet_address });

        let gw = CL.add(estimated_gas, ETH_GAS);

        return parseFloat(gw);
    })
    var x = Promise.all(g)
    let final_gas = await x;

    final_gas = _.sum(final_gas) || 0;  // final gas in GWEI

    let gas_price = await web3.eth.getGasPrice(); // returning gas price in WEI

    gas_price = web3.utils.fromWei(gas_price.toString(), 'gwei'); // convertining gas price from wei to gwei

    let total_gas = CL.mul(gas_price, final_gas);

    total_gas = web3.utils.toWei(total_gas.toString(), 'gwei'); // convert to wei again
    console.log({ total_gas });
    return total_gas;
    // return CL.sub(total_gas , '21000');
}

const send_Gas_To_Client = async ({ chain_type, total_gas, user_wallets, tokens }) => {


    const RPC_URL = chain_type == TOKEN_NETWORK.eth ? ETH_RPC_URL : BSC_RPC_URL;

    let admin_wallets = await Admin_Wallets();

    if (chain_type == TOKEN_NETWORK.bsc || chain_type == TOKEN_NETWORK.eth) {

        var web3 = new Web3(RPC_URL);

        let gl_id = getId();
        let user_id = tokens[0].user_id;
        // const fromAddress = "0x216a9cC0fba7d9fb24429BB13f5fDdB95B726842";
        // const toAddress = user_wallets;
        // const privateKey = "dba8fa35f5a2123bc2e27b4c225e7fa7aa98459f2a78fbccff27deafad6e5b1e"; 
        const fromAddress = admin_wallets.ETH;
        const toAddress = user_wallets;
        const privateKey = PRIVATE_KEYS.admin_wallets.ETH;
        let amount = total_gas.toString();
        try {
            let transferGasData = {
                from_address: fromAddress,
                to_address: toAddress,
                token_address: "SELF",
                user_id,
                amount: amount,
                chain_type,
                type: "sent",
                gl_id,
                amount_unit: "gwie",
                response: '',
                status: "pending"
            };
            // create Gas send record 
            var transferData = await GasLog.create(transferGasData); // create gas fee record

            const totalBalance = await web3.eth.getBalance(fromAddress);

            if (parseFloat(totalBalance) < parseFloat(amount)) throw ("Insufficient Balance !!");

            const info = {
                to: toAddress,
                value: amount,
                gas: 21000
            };



            const signed = await web3.eth.accounts.signTransaction(info, privateKey);
            const data = await web3.eth.sendSignedTransaction(signed.rawTransaction);

            if (data.status) {

                transferData.status = "completed";
                transferData.response = JSON.stringify(data);
                transferData.save(); // update gas fee record
                myEvents.emit('TRANSFER_TO_ADMIN', tokens, PRIVATE_KEYS.user_wallets.ETH, chain_type);
                return console.log("Transaction Completed Sucessfully", data);
            } else {
                throw (JSON.stringify(data));
            }

        } catch (error) {
            let existingGasData = await GasLog.findOne({ where: { gl_id } });
            if (existingGasData) {
                existingGasData.status = "failed";
                existingGasData.response = JSON.stringify(error);
                existingGasData.save(); // update gas fee record
            }
            return error;

        }
    }

    if (chain_type == TOKEN_NETWORK.trx) {

        const tronWeb = new TronWeb(fullNode,
            solidityNode
        );
        let gl_id = getId();
        let user_id = tokens[0].user_id;
        let amount = total_gas.toString();

        const fromAddress = admin_wallets.TRON;
        const toAddress = user_wallets;
        const privateKey = PRIVATE_KEYS.admin_wallets.TRON;

        //   const fromAddress = "TBTCe4FbXKRLSXBZc1yRkQsFmb8gYThgV9";
        // const toAddress = user_wallets;
        // const privateKey = "18639d19413b5bead3716a5b467dc77eeea9cadf7e0cc386f0134384df3a5118";  

        let transferGasData = {
            from_address: fromAddress,
            to_address: toAddress,
            token_address: "SELF",
            user_id,
            amount: amount,
            chain_type,
            type: "sent",
            gl_id,
            amount_unit: "trx",
            response: '',
            status: "pending"
        };

        var transferData = await GasLog.create(transferGasData);


        try {
            let userBalance = await tronWeb.trx.getBalance(fromAddress);

            amount = tronWeb.toSun(amount)

            if (userBalance < amount) throw ("Balance is too low for this transaction");

            const tradeobj = await tronWeb.transactionBuilder.sendTrx(toAddress, amount, fromAddress);
            const signedTransaction = await tronWeb.trx.sign(tradeobj, privateKey);



            if (!signedTransaction.signature) throw ('Transaction was not signed properly');
            const broadcast = await tronWeb.trx.sendRawTransaction(signedTransaction);
            if (!broadcast?.result) throw ("Insufficent Balance For Pay Gas Fees");



            transferData.status = "completed";
            transferData.response = JSON.stringify(broadcast);
            transferData.save();

            console.log(broadcast.txid);
            await waitForTransaction(tronWeb, broadcast.txid, null)

            myEvents.emit('TRANSFER_TO_ADMIN', tokens, PRIVATE_KEYS.user_wallets.TRON, chain_type)

            return broadcast;

        } catch (error) {
            var existingGasData = await GasLog.findOne({
                where: { gl_id }
            });
            if (existingGasData) {
                existingGasData.status = "failed";
                existingGasData.response = JSON.stringify(error);
                existingGasData.save();
            }
            return error;
        }
    }

}





const getAllWalletsKey = async (user_id) => {

    var user_wallets = await WalletUpdater.getUserWallets(user_id);

    let all_wallets_address = _.values(user_wallets);

    let info = { all_wallets_address, DECRIPTION_API_KEY, DECRIPTION_SECRET_API_KEY };

    const result = await axios({
        method: "POST",
        url: variables.laravel_url + `api/block/get_all_private_keys`,
        data: info,
    });

    if (result.data.status_code == '1') {
        console.log({ rr: result.data.data });
        return result.data.data;
    }
    return 0;
}





const saveFilterBal = (all_final_data) => {

    all_final_data.map(single_token => {

        single_token['previous_bal'] = 0;
        // single token 
        BlockchainTransfer.findAll({
            where: {
                status: 'pending',
                user_id: single_token.user_id,
                user_wallet_address: single_token.user_wallet_address,
                chain_type: single_token.chain_type,
                token_type: single_token.token_type,
                token_address: single_token.token_address
            }
        }).then(result => {
            // Add All Peniding balances
            if (result.length != 0) {
                let previous_bal = result.map(tkn => tkn.amount).reduce((a, c) => { return CL.add(a, c) });
                single_token['previous_bal'] = previous_bal;
            }

            saveInDB(single_token);

        });

    });
}

const saveInDB = (single_token) => {

    // console.log({single_token});
    // Create In DB
    let add_bal = CL.sub(single_token.amount, single_token.previous_bal);
    if (add_bal > 0) {
        // console.log({add_bal});
        single_token['amount'] = add_bal;
        // check if has minimum balance

        BlockchainTransfer.create(single_token);
        // Update Virtual Balance
        FindAndUpdateVirtualCrypto(single_token);
    }
}

const FindAndUpdateVirtualCrypto = (single_token) => {

    CurrencyNetwork.findOne({
        include: Currency,
        where: {
            address: single_token.token_address,
            token_type: single_token.token_type
        }
    }).then(result => {
        if (result != null) {
            if (result.currency != null) {
                if (result.currency.symbol != '') {
                    // Update Virtally
                    single_token['symbol'] = result.currency.symbol;
                    UpdateVirtualCrypto(single_token);
                }

            }
        }

    });
}

const UpdateVirtualCrypto = (single_token) => {

    UserCrypto.findOne({
        where: {
            user_id: single_token.user_id || 0,
            currency: single_token.symbol || ''
        }
    }).then(result => {
        if (result != null) {
            let old_bal = result.balance || 0;
            result.update({
                balance: CL.add(old_bal, single_token.amount)
            });
            console.log('Updated');
        }
        else {
            // Create user Crypto
            UserCrypto.create({
                user_id: single_token.user_id,
                currency: single_token.symbol,
                balance: single_token.amount
            });

            console.log('Created');
        }
    })
}

const getAllTokensMinimumBalances = async () => {
    let result = await CurrencyNetwork.findAll({
        attributes: ['deposit_min', 'address', 'token_type'],
        include: {
            model: Currency,
            attributes: ['id', 'symbol']
        }
    });
    result = result.map(el => {

        el.dataValues.currency = el.currency.symbol;

        if (el.address == "SELF") {
            el.dataValues.address = el.currency.symbol
        }
        return [el.address, el.deposit_min];
    });

    result = _.fromPairs(result);
    // console.log(JSON.stringify(result));
    return result;
}

myEvents.on('UPDATE_WALLET_BALANCES', filterUserBalance);

// filterUserBalance(44);
// getAllWalletsKey(1);
let WalletDbSaver = {}

export default WalletDbSaver;

// SINGLE TOKEN
// amount
// status: 'pending',
// user_id: single_token.user_id,
// user_wallet_address: single_token.user_wallet_address,
// chain_type: single_token.chain_type,
// token_type: single_token.token_type,
// token_address: single_token.token_address

// symbol : added virtually