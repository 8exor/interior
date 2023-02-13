import { Model , Sequelize } from "../../Database/sequelize.js";

export const AdminBank = Model.define('admin_banks', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: Sequelize.STRING,      
    },
    account_number: {
        type: Sequelize.STRING,
    },
    account_holder_name: {
        type: Sequelize.STRING,
    },
    account_type: {
        type: Sequelize.STRING
    },
    ifsc_code: {
        type: Sequelize.STRING
    },
    bank_name: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.STRING,
        defaultValue:0
    },
    remark: {
        type: Sequelize.STRING
    },
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await AdminBank.sync();