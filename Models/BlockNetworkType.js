import { Model , Sequelize } from "../Database/sequelize.js";
// import { BlockNetwork } from "./BlockNetwork.js";

export const BlockNetworkType  = Model.define('block_network_types', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    block_id: Sequelize.STRING, 
    token_type: Sequelize.STRING,
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});


await BlockNetworkType.sync();

// BlockNetworkType.belongsTo(BlockNetwork, { sourceKey: 'block_id', foreignKey: 'id' });






