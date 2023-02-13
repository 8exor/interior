import { Model , Sequelize } from "../Database/sequelize.js";

export const UserWalletLedger  = Model.define('user_wallet_ledgers', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    user_id : Sequelize.STRING,
    currency : Sequelize.STRING,
    transaction_type: Sequelize.STRING, // order, deposit , withdraw , commission , referral 
    attached_id: Sequelize.STRING, 
    credit_amount: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    debit_amount: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    balance : {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    freezed_balance : {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    main_balance : {
        type: Sequelize.STRING,
        defaultValue: '0'
    },    // =  balance + freezed_balance 
     
    comment: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    extra : {
        type: Sequelize.STRING,
        defaultValue: ''
    } 
    
},{
    underscored: true,
});

await UserWalletLedger.sync();
