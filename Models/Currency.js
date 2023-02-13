import { Model , Sequelize } from "../Database/sequelize.js";

import variables from "../Config/variables.js";
import { BlockNetwork } from "./BlockNetwork.js";

const imagePath = variables.laravel_url ;

export const Currency = Model.define('currencies', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    // image:Sequelize.STRING,
    image: {
        type: Sequelize.STRING,
        get() {
            const rawValue = this.getDataValue('image');
            return rawValue ? imagePath + rawValue : '';
          }
    }, 
    name: Sequelize.STRING,
    symbol: Sequelize.STRING,
    is_multiple: Sequelize.BOOLEAN,
    currency_type: {
        type: Sequelize.STRING,
        defaultValue: 'crypto'
    },
    default_c_network_id: Sequelize.STRING,
    active_status_enable: Sequelize.BOOLEAN,
    deposit_enable: Sequelize.BOOLEAN,
    deposit_desc: {
        type: Sequelize.TEXT,
        defaultValue: 'Wallet Maintenance, Deposit Suspended'
    },
    withdraw_enable: Sequelize.BOOLEAN,
    withdraw_desc: {
        type: Sequelize.TEXT,
        defaultValue: 'Wallet Maintenance, Withdrawal Suspended'
    },
    // extra: Sequelize.TEXT,
   
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});


export const CurrencyNetwork = Model.define('currency_networks', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    currency_id:Sequelize.STRING,
    network_id:Sequelize.STRING,
    address: Sequelize.STRING,
    token_type: Sequelize.STRING,
    deposit_min: Sequelize.STRING,
    deposit_enable: Sequelize.BOOLEAN,
    deposit_desc: {
        type: Sequelize.TEXT,
        defaultValue: 'Wallet Maintenance, Deposit Suspended'
    },
    withdraw_enable: Sequelize.BOOLEAN,
    withdraw_desc: {
        type: Sequelize.TEXT,
        defaultValue: 'Wallet Maintenance, Withdrawal Suspended'
    },

    withdraw_min: Sequelize.STRING,
    withdraw_max: Sequelize.STRING,
    withdraw_commission: Sequelize.STRING,

    type:{
        type: Sequelize.STRING,
        defaultValue: 'percentage'
    },
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});


await Currency.sync();
await CurrencyNetwork.sync();

Currency.hasMany(CurrencyNetwork); // A HasOne B
// CurrencyNetwork.belongsTo(Currency);
CurrencyNetwork.belongsTo(BlockNetwork, { foreignKey: 'network_id' });




