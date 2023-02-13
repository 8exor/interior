import { Model , Sequelize } from "../Database/sequelize.js";

export const Liquidity  = Model.define('list_coin_liquidities', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    currency: Sequelize.STRING,
    pair_with : Sequelize.STRING,
    symbol : Sequelize.STRING,
    total: Sequelize.STRING,
    provided: Sequelize.STRING, 
    calculated : Sequelize.STRING, 
    available : Sequelize.STRING, 
    remaining : Sequelize.STRING, 
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await Liquidity.sync();
