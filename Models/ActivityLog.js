import { Model, Sequelize } from "../Database/sequelize.js";

export const Activitylog = Model.define('activity_logs', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    user_id: Sequelize.STRING,
    type: Sequelize.STRING,
    ip: Sequelize.STRING,
    message: Sequelize.STRING,
}, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    '_2fa':'_2fa'
});

await Activitylog.sync();

