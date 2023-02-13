import { Model, Sequelize } from "../Database/sequelize.js";

export const FavPair = Model.define('fav_pairs', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    user_id: Sequelize.STRING,
    currency: Sequelize.STRING,
    pair_with: Sequelize.STRING,
    // Add Custom keys for frontend use
    symbol: {
        type: Sequelize.VIRTUAL,
        get() {
            return `${this.currency}${this.pair_with}`;
        }
    },
    // extra: {
    //     type: Sequelize.STRING,
    //     defaultValue: ''
    // }


}, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await FavPair.sync();

