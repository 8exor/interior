import { DataTypes } from 'sequelize';
import { Model as DB} from '../../Database/sequelize.js';
import { P2P_Trade } from './P2P_Trade.js';

export const P2P_ExpiredOrder = DB.define('P2pExpiredOrder', {

    match_id: {
        type: DataTypes.STRING,
        allowNull: false
    },

    comments: {
        type: DataTypes.STRING,
        allowNull: false
    },

    extra: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },


}, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await P2P_ExpiredOrder.sync();
P2P_ExpiredOrder.belongsTo(P2P_Trade,{as:"Trade", foreignKey: 'match_id' });
