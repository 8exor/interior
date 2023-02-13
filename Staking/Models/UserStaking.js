import { Model , Sequelize } from "../../Database/sequelize.js";
import { StakingPlan } from './StakingPlan.js';
import { User } from '../../Models/User.js';

export const UserStaking = Model.define('user_stakings', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    
    user_id: Sequelize.STRING,
    staking_plan_id: Sequelize.STRING,
    amount: Sequelize.STRING,

    next_roi_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    
    activation_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    expiry_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    roi_income: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    roi_interval: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    reward_currency: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    plan_type: {
        type: Sequelize.STRING(20),
        allowNull: false
    }, // flexible or fixed
    is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: 1
    },
    unactive_at : {
        type: Sequelize.DATE,
        allowNull: true
    },
    extra: {
        type: Sequelize.STRING,
        defaultValue: ''
    }     
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await UserStaking.sync();

UserStaking.hasOne(StakingPlan, {
    sourceKey: 'staking_plan_id', 
    foreignKey: 'id'     
});

UserStaking.hasOne(User, {
    sourceKey: 'user_id', 
    foreignKey: 'id'
});

