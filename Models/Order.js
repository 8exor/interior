import { Model, Sequelize } from "../Database/sequelize.js";
import {User} from "./User.js"
export const Order = Model.define('orders', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    user_id:Sequelize.INTEGER,
    currency: Sequelize.STRING,
    with_currency: Sequelize.STRING,
    at_price: Sequelize.STRING,
    quantity: Sequelize.STRING,
    //pending qty
    total: Sequelize.STRING,
    order_type: Sequelize.STRING,
    type: Sequelize.STRING,
    pending_qty: {
        type: Sequelize.STRING,
        defaultValue:'0'
    },
    stop_price: {
        type: Sequelize.STRING,
        allowNull: true
    },
    current_status: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue:'placed'
    }, 
    commission: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    commission_currency: {
        type: Sequelize.STRING,
        allowNull: true
    },
    b_orderid: {
        type: Sequelize.STRING,
        allowNull: true
    },
    extra: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    new_client_order_id: {
        type: Sequelize.STRING,
        allowNull: true
    },

},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

//Relation With User
Order.belongsTo(User)


await Order.sync();

