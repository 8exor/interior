import event from '../Events/Event.js'
import { P2P_Wallet } from '../Models/P2P_Wallet.js';
import { P2P_WalletLog } from '../Models/P2P_WalletLog.js';
import { CL } from "cal-time-stamper";



const creditWallet = async (data) => {

    let userWallet = await P2P_Wallet.findOne({
        where: { user_id: data.user_id }  ///added currency filter for new currency adding  by priyanka
    });

    if (!userWallet) {
        userWallet = await P2P_Wallet.create({
            'user_id': data.user_id,
            'currency': data.currency,
            'total_balance': data.amount
        });
    } else {
        await P2P_Wallet.update({
            'total_balance': CL.add(userWallet.total_balance, data.amount),
        }, { where: { 'user_id': data.user_id } });
    }

    P2P_WalletLog.create({
        'wallet_id': userWallet.id,
        'user_id': data.user_id,
        'amount': data.amount,
        'attached_id': data.attached_id,
        'transaction_type': 'credit',
        'type': 'order'
    });

}

const debitWallet = async (data) => {

    let userWallet = await P2P_Wallet.findOne({
        where: { user_id: data.user_id }
    });

    if (!userWallet) {
        userWallet = await P2P_Wallet.create({
            'user_id': data.user_id,
            'currency': data.currency,
        });
    } else {
        await P2P_Wallet.update({
            'total_balance': CL.sub(userWallet.total_balance, data.amount),
        }, { where: { 'user_id': data.user_id } });
    }

    P2P_WalletLog.create({
        'wallet_id': userWallet.id,
        'user_id': data.user_id,
        'amount': data.amount,
        'attached_id': data.attached_id,
        'transaction_type': 'debit',
        'type': 'order'
    });
}

const freezeWallet = async (data) => {
    let userWallet = await P2P_Wallet.findOne({
        where: { user_id: data.user_id }
    });
    if (!userWallet) {
        userWallet = await P2P_Wallet.create({
            'user_id': data.user_id,
            'currency': data.currency
        });
    } else {

        await P2P_Wallet.update({
            'total_balance': CL.sub(userWallet.total_balance, data.amount),
            'freeze_balance': CL.add(userWallet.freeze_balance, data.amount)
        }, { where: { 'user_id': data.user_id } });
    }

    await P2P_WalletLog.create({
        'wallet_id': userWallet.id,
        'user_id': data.user_id,
        'amount': data.amount,
        'attached_id': data.attached_id,
        'transaction_type': 'debit',
        'type': 'order'
    });
}

const unfreezeWallet = async (data) => {

    let userWallet = await P2P_Wallet.findOne({
        where: { user_id: data.user_id }
    });

    if (!userWallet) {
        userWallet = await P2P_Wallet.create({
            'user_id': data.user_id,
            'currency': data.currency
        });
    } else {
        await P2P_Wallet.update({
            'freeze_balance': CL.sub(userWallet.freeze_balance, data.amount)
        }, { where: { 'user_id': data.user_id } });
    }

    P2P_WalletLog.create({
        'wallet_id': userWallet.id,
        'user_id': data.user_id,
        'amount': data.amount,
        'attached_id': data.attached_id,
        'transaction_type': 'credit',
        'type': 'order'
    });
}

const cancelWallet = async (data) => {

    let userWallet = await P2P_Wallet.findOne({
        where: { user_id: data.user_id }
    });

    if (!userWallet) {
        userWallet = await P2P_Wallet.create({
            'user_id': data.user_id,
            'currency': data.currency
        });
    } else {
        await P2P_Wallet.update({
            'total_balance': CL.add(userWallet.total_balance, data.amount),
            'freeze_balance': CL.sub(userWallet.freeze_balance, data.amount)
        }, { where: { 'user_id': data.user_id } });
    }

    P2P_WalletLog.create({
        'wallet_id': userWallet.id,
        'user_id': data.user_id,
        'amount': data.amount,
        'attached_id': data.attached_id,
        'transaction_type': 'credit',
        'type': 'order'
    });
}

event.on('creditWallet', creditWallet)
event.on('debitWallet', debitWallet)
event.on('freezeWallet', freezeWallet)
event.on('unfreezeWallet', unfreezeWallet)
event.on('cancelWallet', cancelWallet)

export default {}