import { Sequelize, DataTypes } from 'sequelize';
import { Model as DB} from '../../Database/sequelize.js';


export const P2P_WalletLog = DB.define('P2pWalletLog', {

    user_id: {
        type: DataTypes.STRING,
        allowNull: false
    },

    wallet_id: {
        type: DataTypes.STRING,
        allowNull: false
    },

    attached_id: {
        type: DataTypes.STRING,
        allowNull: false
    },

    amount: {
        type: DataTypes.STRING,
        defaultValue: 0
    },

    type: {
        type: DataTypes.STRING,
        allowNull: false
    },

    transaction_type: {
        type: DataTypes.STRING,
        allowNull: false
    },


}, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});


await P2P_WalletLog.sync();