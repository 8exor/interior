import { Model , Sequelize } from "../Database/sequelize.js";

export const UserWallet  = Model.define('user_wallets', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    user_id:Sequelize.STRING,
    private_key:Sequelize.TEXT,
    balance: {
        type: Sequelize.STRING,
        defaultValue: '0'
    }, 
    address: Sequelize.STRING, 
    hex_address: Sequelize.STRING, 
    type: Sequelize.STRING, 
    api_response: Sequelize.STRING,    
    extra:  Sequelize.STRING,  
    
},{
    underscored: true,
});

await UserWallet.sync();

