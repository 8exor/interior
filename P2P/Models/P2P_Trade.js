import { Sequelize, DataTypes } from 'sequelize';
import { Model as DB } from '../../Database/sequelize.js';
import { P2P_Order } from "./P2P_Order.js";


export const P2P_Trade = DB.define('P2pTrade', {

    user_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    seller_order_id: {
        type: DataTypes.STRING,
        allowNull: false
    },

    buyer_order_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    at_price: {
        type: DataTypes.STRING,
        defaultValue: 0
    },
    quantity: {
        type: DataTypes.STRING,
        defaultValue: 0
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 0,
       
    },
    buyer_confirmation: {
        type: DataTypes.STRING,
        defaultValue: 0,
        comment: "0,1"
    },
    seller_confirmation: {
        type: DataTypes.STRING,
        defaultValue: 0,
        comment: "0,1"
    },

    expired_at: {
        type: DataTypes.STRING,
        allowNull: false
    }


}, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await P2P_Trade.sync();

P2P_Order.hasMany(P2P_Trade, { as: "seller", sourceKey: 'id', foreignKey: 'seller_order_id' });

P2P_Order.hasMany(P2P_Trade, { as: "buyer", sourceKey: 'id', foreignKey: 'buyer_order_id' });

//relation with seller_order_id... 
P2P_Trade.belongsTo(P2P_Order, { as: "seller", foreignKey: 'seller_order_id'});

//relation with buyer_order_id..
P2P_Trade.belongsTo(P2P_Order, { as: "buyer", foreignKey: 'buyer_order_id'});
