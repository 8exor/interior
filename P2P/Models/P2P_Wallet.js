import { Sequelize, DataTypes } from 'sequelize';
import { Model as DB} from '../../Database/sequelize.js';


export const P2P_Wallet = DB.define('P2pWallet', {

    user_id: {
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
    total_balance: {
        type: DataTypes.STRING,
        defaultValue: 0
    },

    freeze_balance: {
        type: DataTypes.STRING,
        defaultValue: 0
    },

}, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});


await P2P_Wallet.sync();