import { Model, Sequelize } from "../Database/sequelize.js";
import { User } from "./User.js";

export const ReferralCommission = Model.define('referral_commission', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    referral_code: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    attached_id: Sequelize.STRING,
    commission_type: Sequelize.STRING,
    commission_currency: Sequelize.STRING,
    commission: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    status: {
        type: Sequelize.STRING,
        defaultValue: 'pending',
        comment: 'completed, rejected, pending'
    }

}, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// ReferralCommission.belongsTo(User, { targetKey: "referral_code", foreignKey: "referral_by", as: "referalIncome" });

await ReferralCommission.sync();

