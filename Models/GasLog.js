import { Model , Sequelize } from "../Database/sequelize.js";

export const GasLog  = Model.define('gas_logs', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    }, 
    from_address: Sequelize.STRING,
    to_address : Sequelize.STRING,
    token_address : Sequelize.STRING,
    user_id: Sequelize.STRING,
    amount: Sequelize.STRING, 
    chain_type : Sequelize.STRING,
    type: Sequelize.STRING,
    gl_id: Sequelize.STRING, 
    amount_unit : Sequelize.STRING,
    response: Sequelize.STRING, 
    status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
    },
  
    
},{
    underscored: true,
});

await GasLog.sync();