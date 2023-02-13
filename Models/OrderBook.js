import { Model , Sequelize } from "../Database/sequelize.js";

export const OrderBook = Model.define('order_book', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    at_price: Sequelize.STRING,
    quantity: Sequelize.STRING,
    order_type: Sequelize.STRING,
    symbol: Sequelize.STRING,
    extra: {
        type: Sequelize.STRING,
        defaultValue: ''
    }     
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await OrderBook.sync();

