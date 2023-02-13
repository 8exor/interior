import { Model , Sequelize } from "../Database/sequelize.js";

export const BlockchainTransfer  = Model.define('blockchain_transfers', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    amount: Sequelize.STRING,
    user_id : Sequelize.STRING,
    user_wallet_address : Sequelize.STRING,
    chain_type: Sequelize.STRING,
    token_type: Sequelize.STRING, 
    token_address : Sequelize.STRING, 
    status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
    }, 
    min_valid: {
        type: Sequelize.BOOLEAN,
        defaultValue: 0
    }
    
},{
    underscored: true,
});

await BlockchainTransfer.sync();
