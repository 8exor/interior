import { Model , Sequelize } from "../../Database/sequelize.js";
import {User} from '../../Models/User.js'



// "user_id":"1",
// "currency":"WIN",
// "comment":"UnSubscribed to Staking Plan 2",
// "created_at":"2022-10-06T12:38:09.000Z",


export const StakingWithdrawRequest = Model.define('staking_withdraw_requests',{
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    
    user_id: Sequelize.STRING,
    withdraw_request: Sequelize.STRING,

    comment: {
        type: Sequelize.STRING,
        defaultValue: ''
    },

    currency: {
        type: Sequelize.STRING,
        defaultValue: ''
    },

    withdraw_request_date:{
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },

    withdraw_release_date:{
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    extra: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    status: {
        type: Sequelize.STRING,
        defaultValue: '0'
    }       
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await StakingWithdrawRequest.sync();


StakingWithdrawRequest.hasOne(User, {
    sourceKey: 'user_id', 
    foreignKey: 'id'     
});
