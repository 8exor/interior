import { Model , Sequelize } from "../Database/sequelize.js";

export const Authority = Model.define('authority', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
     type: {
        type: Sequelize.STRING(100),       
    },
    status: {
        type: Sequelize.STRING(4),
        defaultValue: 'off'
    },
       message: {
        type: Sequelize.STRING(255),
        defaultValue: 'Currently Server Is Busy.'
    },
},{
    underscored: true,
});

await Authority.sync();


// Finding specified Type is available or not
await Authority.findOrCreate({
    where: { type:"maintenance" },
    defaults: {
        status: "off",
    },
});