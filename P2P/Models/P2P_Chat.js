import { Sequelize, DataTypes } from 'sequelize';
import variables from '../../Config/variables.js';
import { Model as DB} from '../../Database/sequelize.js';
import { User } from '../../Models/User.js';


const queryInterface = DB.getQueryInterface();

export const P2P_Chat = DB.define('P2pChat', {

    match_id: {
        type: DataTypes.STRING,
        allowNull: false
    },

    sender_id: {
        type: DataTypes.STRING,
        allowNull: false
    },

    receiver_id: {
        type: DataTypes.STRING,
        allowNull: false
    },

    message: {
        type: DataTypes.STRING,
        allowNull: true
    },

    image: {
        type: DataTypes.STRING,
        allowNull: true,
        // get() {
        //     return variables.node_url + "chatImages/" + this.getDataValue('image')
        // }
    },


}, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});


await P2P_Chat.sync();
P2P_Chat.hasOne(User, { sourceKey: 'sender_id', foreignKey: 'id' });



