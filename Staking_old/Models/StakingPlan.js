import { Model , Sequelize } from "../../Database/sequelize.js";

export const StakingPlan = Model.define('staking_plans', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: Sequelize.STRING,
        defaultValue: ''
    } ,
    description: {
        type: Sequelize.STRING(500),
        defaultValue: ''
    } ,
    image: {
        type: Sequelize.STRING,
        defaultValue: ''
    } ,

    stake_currency: {
        type: Sequelize.STRING,
        allowNull: false
    },
    reward_currency: {
        type: Sequelize.STRING,
        allowNull: false
    },

    plan_type: {
        type: Sequelize.STRING(20),
        allowNull: false
    }, // flexible or fixed
    maturity_days: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    roi_percentage: {
        type: Sequelize.STRING,
        allowNull: false
    },
    roi_interval: {
        type: Sequelize.STRING(10),
        allowNull: false
    }, // D => Daily , M = Monthly , Y => yearly
    min_stake_amount: {
        type: Sequelize.STRING,
        allowNull: false
    },
    max_stake_amount: {
        type: Sequelize.STRING,
        allowNull: false
    },
    pool_limit: {
        type: Sequelize.STRING,
        allowNull: true
    },
    plan_expiry_days: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    plan_start_date: {
        type: Sequelize.STRING,
        allowNull: true
    },
    plan_expiry_date: {
        type: Sequelize.STRING,
        allowNull: true
    },
    is_expired: {
        type: Sequelize.BOOLEAN,
        defaultValue: 0
    },
    activate_status: {
        type: Sequelize.BOOLEAN,
        defaultValue: 0
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

await StakingPlan.sync();


