import { Model , Sequelize } from "../../Database/sequelize.js";

export const AdminUpi = Model.define('admin_upi', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: Sequelize.STRING,      
    },
    upi_id: {
        type: Sequelize.STRING,
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

await AdminUpi.sync();