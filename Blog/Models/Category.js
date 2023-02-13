import { Model, Sequelize } from "../../Database/sequelize.js";

export const Category = Model.define('categories', {
    name: Sequelize.STRING
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})
await Category.sync();
