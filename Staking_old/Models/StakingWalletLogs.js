import { Model , Sequelize } from "../../Database/sequelize.js";

export const StakingWalletLogs = Model.define('staking_wallet_logs', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    
    user_id: Sequelize.STRING,
    user_stake_id: Sequelize.STRING,
    currency: Sequelize.STRING,
    transaction_type: Sequelize.STRING,
    previous_balance: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    debit: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    credit: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    
    balance: Sequelize.STRING,
    comment: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    withdrawable: {
        type: Sequelize.STRING,
        defaultValue: '0'
    }      
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});


await StakingWalletLogs.sync();