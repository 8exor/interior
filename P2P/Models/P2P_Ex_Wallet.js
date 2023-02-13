import { DataTypes } from "sequelize";
import { Model as DB} from '../../Database/sequelize.js';
import { User } from "../../Models/User.js";

export const P2P_Ex_Wallet = DB.define('P2pExWallet', {
    user_id:
    {
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
        allowNull: false
    },
    freeze_balance: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status:
    {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    },


}, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})


await P2P_Ex_Wallet.sync();
P2P_Ex_Wallet.hasOne(User, { sourceKey: 'user_id', foreignKey: 'id' });
