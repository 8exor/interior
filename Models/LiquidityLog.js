import { Model , Sequelize } from "../Database/sequelize.js";

export const LiquidityLog  = Model.define('list_coin_logs', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    currency: Sequelize.STRING,
    pair_with : Sequelize.STRING,
    symbol : Sequelize.STRING,
    liquidity: Sequelize.STRING,
    param:{ 
        type: Sequelize.STRING,
        set(value) {
            // Storing Array in the database is terrible.
            // Encode the value with an appropriate cryptographic Json function is better.
            this.setDataValue('param', JSON.stringify(value));
        },
        get() {
            return JSON.parse(this.param);
        }
    }
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await LiquidityLog.sync();
