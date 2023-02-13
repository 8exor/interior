import { Model , Sequelize } from "../Database/sequelize.js";
import { BlockNetworkType } from "./BlockNetworkType.js";

export const BlockNetwork  = Model.define('block_networks', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    network_name: Sequelize.STRING,
    currency_symbol : Sequelize.STRING,
    rpc_url : Sequelize.STRING,
    token_type: Sequelize.STRING,
    chain_id: Sequelize.STRING, 
    explorer_url : Sequelize.STRING, 
    active_status: {
        type: Sequelize.TINYINT,
        defaultValue: 0 
    }, 
    extra: {
        type: Sequelize.TEXT,
        defaultValue: ''
    }
    
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await BlockNetwork.sync();

BlockNetwork.hasOne(BlockNetworkType, { sourceKey: 'id', foreignKey: 'block_id' });
// BlockNetworkType.hasMany(BlockNetwork, { sourceKey: 'block_id', foreignKey: 'id' });






