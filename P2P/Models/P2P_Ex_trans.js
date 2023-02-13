import { DataTypes } from "sequelize";
import { Model as DB} from '../../Database/sequelize.js';
import { User } from "../../Models/User.js";

export const P2P_Ex_transaction = DB.define('P2pExTransaction', {
    user_id:
    {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount:
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
    transaction_type: {
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


await P2P_Ex_transaction.sync();
P2P_Ex_transaction.hasOne(User, { sourceKey: 'user_id', foreignKey: 'id' });
