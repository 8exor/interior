import { DataTypes } from 'sequelize';
import { Model as DB } from '../../Database/sequelize.js';
import { Bank } from '../../Models/Bank.js';
import { User } from '../../Models/User.js';
import { UPI } from '../../Models/user_upi.js';
// import { P2P_Trade } from './P2P_Trade.js';



export const P2P_Order = DB.define('P2pOrder', {
    user_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_xid: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },
    pref_xid: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },
    at_price: {
        type: DataTypes.STRING,
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
            this.setDataValue('currency', value.toUpperCase());
        }
    },
    with_currency: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
            this.setDataValue('with_currency', value.toUpperCase());
        }
    },
    order_type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'buy, sell'
    },
    min_quantity: {
        type: DataTypes.STRING,
        allowNull: false
    },
    max_quantity: {
        type: DataTypes.STRING,
        allowNull: false
    },

    total: {
        type: DataTypes.STRING,
        allowNull: false

    },
    search_amount: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '0'


    },
    status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'placed'

    },
    old_status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'placed'

    },
    remark: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''

    },
    pending_quantity: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },
    expired_at: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },
    payment_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
},
    {
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);


await P2P_Order.sync();


P2P_Order.hasOne(Bank, { sourceKey: 'user_id', foreignKey: 'user_id' });

P2P_Order.hasOne(UPI, { sourceKey: 'user_id', foreignKey: 'user_id' });

P2P_Order.hasOne(User, { sourceKey: 'user_id', foreignKey: 'id' });






