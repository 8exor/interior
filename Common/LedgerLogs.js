import _ from 'lodash';
import myEvents from '../RunnerEngine/Emitter.js';
import { AdminWalletLedger } from '../Models/AdminWalletLedger.js';
import { UserWalletLedger } from '../Models/UserWalletLedger.js';
import Sequelize from "sequelize";
import { Model } from '../Database/sequelize.js';
import { Ledger_Log_Events, TransactionType } from './AllEvents.js';
import { CL } from 'cal-time-stamper';
const { Op, QueryTypes } = Sequelize;


// DONE
const getUserBalance = async (user_id, currency = null) => {

    if (currency != null) {
        return await UserWalletLedger.findOne({
            raw: true,
            order: [['id', 'DESC']],
            where: {
                user_id,
                currency
            }
        });
    }

    return await Model.query('SELECT * FROM user_wallet_ledgers where id in (SELECT max(id) FROM user_wallet_ledgers WHERE user_id = ? GROUP BY currency ) And user_id = 1 order by id desc', {
        replacements: [user_id],
        type: QueryTypes.SELECT
    });

}

// let r = await getUserBalance(1);

////////////////////////////////////////////////
//         TO ADD IN FREEZED AMOUNT           //
////////////////////////////////////////////////

const freezeBalance = async ({ user_id, currency, transaction_type, attached_id, amount, comment, symbol }) => {
    // amount == debit_amount

    let user_balance = await getUserBalance(user_id, currency);

    if (!_.isEmpty(user_balance)) {

        let balance = CL.sub(user_balance.balance, amount);
        let freezed_balance = CL.add(user_balance.freezed_balance, amount);

        let re = await UserWalletLedger.create({
            user_id,
            currency,
            transaction_type,
            attached_id,
            debit_amount: amount.toCrypto(symbol),
            balance: balance.toCrypto(symbol),
            freezed_balance: freezed_balance.toCrypto(symbol),
            main_balance: CL.add(balance, freezed_balance).toCrypto(symbol),
            comment
        });

        return re;
    }
}

// let d = await freezeBalance({user_id: 4 , currency: 'USDT' , transaction_type: TransactionType.order , attached_id: "4" , amount: "50" , comment: "Order Placed"});
// console.log({d});

////////////////////////////////////////////////
//         TO CANCEL FREEZED AMOUNT           //
////////////////////////////////////////////////

const cancelFreezeBalance = async ({ user_id, currency, transaction_type, attached_id, amount, comment, symbol }) => {

    let user_balance = await getUserBalance(user_id, currency);

    if (!_.isEmpty(user_balance)) {

        let balance = CL.add(user_balance.balance, amount);
        let freezed_balance = CL.sub(user_balance.freezed_balance, amount);

        let re = await UserWalletLedger.create({
            user_id,
            currency,
            transaction_type,
            attached_id,
            credit_amount: amount.toCrypto(symbol),
            balance: balance.toCrypto(symbol),
            freezed_balance: freezed_balance.toCrypto(symbol),
            main_balance: CL.add(balance, freezed_balance).toCrypto(symbol),
            comment
        });

        return re;
    }
}

// let d = await cancelFreezeBalance({user_id: 4 , currency: 'USDT' , transaction_type: TransactionType.order , attached_id: "4" , amount: "100" , comment: "Order Canceled"});
// console.log({d});

////////////////////////////////////////////////
//         TO DEDUCT FREEZED AMOUNT           //
////////////////////////////////////////////////

const unFreezeBalance = async ({ user_id, currency, transaction_type, attached_id, amount, comment, symbol }) => {

    let user_balance = await getUserBalance(user_id, currency);

    if (!_.isEmpty(user_balance)) {

        let balance = user_balance.balance;
        let freezed_balance = CL.sub(user_balance.freezed_balance, amount);

        let re = await UserWalletLedger.create({
            user_id,
            currency,
            transaction_type,
            attached_id,
            debit_amount: amount.toCrypto(symbol),
            balance: balance.toCrypto(symbol),
            freezed_balance: freezed_balance.toCrypto(symbol),
            main_balance: CL.add(balance, freezed_balance).toCrypto(symbol),
            comment
        });

        return re;
    }
}

// let d = await unFreezeBalance({user_id: 4 , currency: 'USDT' , transaction_type: TransactionType.order , attached_id: "5" , amount: "50" , comment: "Order Executed"});
// console.log({d});

////////////////////////////////////////////////
//               TO ADD AMOUNT                //
////////////////////////////////////////////////

const addCredit = async ({ user_id, currency, transaction_type, attached_id, amount, comment, symbol }) => {
    // amount == debit_amount

    let user_balance = await getUserBalance(user_id, currency);

    let balance = amount;
    let freezed_balance = 0;

    if (!_.isEmpty(user_balance)) {

        balance = CL.add(user_balance.balance, amount);
        freezed_balance = user_balance.freezed_balance;
    }

    let re = await UserWalletLedger.create({
        user_id,
        currency,
        transaction_type,
        attached_id,
        credit_amount: amount.toCrypto(symbol),
        balance: balance.toCrypto(symbol),
        freezed_balance: freezed_balance.toCrypto(symbol),
        main_balance: CL.add(balance, freezed_balance).toCrypto(symbol),
        comment
    });

    return re;

}

// let d = await addCredit({user_id: 4 , currency: 'BTC' , transaction_type: TransactionType.order , attached_id: "1" , amount: "5" , comment: "Order"});
// console.log({d});

////////////////////////////////////////////////
//              TO DEDUCT AMOUNT              //
////////////////////////////////////////////////
const addDebit = async ({ user_id, currency, transaction_type, attached_id, amount, comment, symbol }) => {

    let user_balance = await getUserBalance(user_id, currency);

    let balance = -amount;
    let freezed_balance = 0;

    if (!_.isEmpty(user_balance)) {

        balance = CL.sub(user_balance.balance, amount);
        freezed_balance = user_balance.freezed_balance;
    }

    let re = await UserWalletLedger.create({
        user_id,
        currency,
        transaction_type,
        attached_id,
        debit_amount: amount.toCrypto(symbol),
        balance: balance.toCrypto(symbol),
        freezed_balance: freezed_balance.toCrypto(symbol),
        main_balance: CL.add(balance, freezed_balance).toCrypto(symbol),
        comment
    });

    return re;

}

// let d = await addDebit({user_id: 4 , currency: 'BTC' , transaction_type: TransactionType.commission , attached_id: "1" , amount: "0.2" , comment: "commission"});
// console.log({d});



////////////////////////////////////////
//           EVENT BINDING            //
////////////////////////////////////////

myEvents.on(Ledger_Log_Events.freeze_balance, freezeBalance);
myEvents.on(Ledger_Log_Events.un_freeze_balance, unFreezeBalance);
myEvents.on(Ledger_Log_Events.add_credit, addCredit);
myEvents.on(Ledger_Log_Events.add_debit, addDebit);
myEvents.on(Ledger_Log_Events.cancel_freeze_balance, cancelFreezeBalance);


// BTC - USDT ( 10 - 50 )
// BAL - USDT = 100
// freeze // Debit -> move to freeze balance (with currency - USDT) 50   
// unfreeze // Debit -> sub currency (with currency - USDT) 50
// credit // Credit -> add Crypto (currency - BTC) 10
// commssion // Debit -> sub currency ( currency - BTC) 0.002

// Order Cancel
// freeze // Debit -> move to freeze balance (with currency - USDT) 50   
// cancel_freeze // Credit -> move from freeze bal (with - currency -USDT ) 50


// user_id
// currency
// transaction_type
// attached_id
// credit_amount
// debit_amount
// balance
// freezed_balance
// main_balance
// comment
// extra

export default {}
