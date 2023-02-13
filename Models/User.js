import { Model, Sequelize } from "../Database/sequelize.js";

export const User = Model.define('users', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    name: Sequelize.STRING,
    lname: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING,

    email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true
    },
    mobile: Sequelize.STRING,
    mobile_verified_at: {
        type: Sequelize.DATE,
        allowNull: true
    },
    role: {
        type: Sequelize.STRING,
        defaultValue: 'user'
    }, // role == user , admin , sub_admin
    profile_image: Sequelize.STRING,
    user_verify: {
        type: Sequelize.BOOLEAN,
        defaultValue: 0
    },
    otp_status: {
        type: Sequelize.BOOLEAN,
        defaultValue: 0
    },
    '_2fa':{
        type: Sequelize.BOOLEAN,
        defaultValue: 2,
        comment:" 0 = none , 1 = mobile , 2 = email "
    }, 
    fee_by_lbm: {
        type: Sequelize.BOOLEAN,
        defaultValue: 0
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: 1
    },

    referral_code: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    referral_by: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    no_commission: {
        type: Sequelize.TEXT
    },
    created_by:{
        type: Sequelize.STRING,
        defaultValue: 'SELF',
        comment:"SELF= registered user, ADMIN= created by admin"
    }
    // currency_preference:{
    //     type: Sequelize.STRING,
    //     defaultValue: 'USDT'
    // }
}, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    '_2fa':'_2fa'
});

await User.sync();

