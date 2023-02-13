import { Model , Sequelize } from "../Database/sequelize.js";
import _ from 'lodash';

export const BinanceTrade = Model.define('binance_trades', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
 
    currency:Sequelize.STRING,
    with_currency: Sequelize.STRING,
    order_id: Sequelize.STRING,
    order_type: Sequelize.STRING,
    symbol:Sequelize.STRING,
    at_price: Sequelize.STRING,
    quantity:Sequelize.STRING,
    tid: Sequelize.STRING,
    time:Sequelize.BIGINT(20).UNSIGNED,  
    
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await BinanceTrade.sync();

