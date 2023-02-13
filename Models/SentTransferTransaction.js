import { Model , Sequelize } from "../Database/sequelize.js";

export const SentTransferTransaction  = Model.define('sent_transfer_transactions', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    amount: Sequelize.STRING,
    user_id : Sequelize.STRING,
    from_address : Sequelize.STRING,
    to_address : Sequelize.STRING,
    chain_type: Sequelize.STRING,
    token_type: Sequelize.STRING, 
    stt_id: Sequelize.STRING, 
    token_address : Sequelize.STRING, 
    response : Sequelize.STRING, 
    status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
    },
 
   
    
},{
    underscored: true,
});

await SentTransferTransaction.sync();
