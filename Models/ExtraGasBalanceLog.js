import { Model , Sequelize } from "../Database/sequelize.js";

export const ExtraGasBalanceLog  = Model.define('extra_gas_balance_logs', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    amount: Sequelize.STRING,
    user_id : Sequelize.STRING,
    user_wallet_address : Sequelize.STRING,
    chain_type: Sequelize.STRING,  
    status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
    },
 
    
},{
    underscored: true,
});

await ExtraGasBalanceLog.sync();
