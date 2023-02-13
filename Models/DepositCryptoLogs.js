import { Model , Sequelize } from "../Database/sequelize.js";
import {User} from "../Models/User.js"

export const DepositCryptoLogs  = Model.define('deposit_crypto_logs', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    amount: Sequelize.STRING,
    txn_id:{
        type: Sequelize.STRING,
    },
    symbol: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    user_id : Sequelize.STRING,
    user_wallet_address : Sequelize.STRING,
    chain_type: Sequelize.STRING,
    token_type: Sequelize.STRING, 
    token_address : Sequelize.STRING, 
    status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
    },
 
    extra: Sequelize.STRING, 
    remark: {
        type: Sequelize.STRING,
        defaultValue: ''
    }, 
    
},{
    underscored: true,
});

//relation with user
DepositCryptoLogs.belongsTo(User)


await DepositCryptoLogs.sync();