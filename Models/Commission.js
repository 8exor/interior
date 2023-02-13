import { Model , Sequelize } from "../Database/sequelize.js";
import {Order} from "./Order.js"

export const Commission = Model.define('commissions', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    attached_id:Sequelize.STRING,
    commission_type: Sequelize.STRING,
    commission_currency: Sequelize.STRING,
    commission: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    status:{
        type:Sequelize.STRING,
        defaultValue: 'pending',
        comment: 'completed, rejected, pending'
    }
        
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

Commission.belongsTo(Order,{
    foreignKey: 'attached_id'
})

await Commission.sync();

