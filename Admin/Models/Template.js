import { Model, Sequelize } from "../../Database/sequelize.js";

export const Template = Model.define('templates', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    admin_id: Sequelize.STRING,
    type: Sequelize.STRING,
    temp_type: Sequelize.STRING,
    content: Sequelize.STRING,
    status: {
       type: Sequelize.STRING,
       defaultValue:'0',
       comment:"1=Active,0=Inactive"
    }
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});
await Template.sync();
