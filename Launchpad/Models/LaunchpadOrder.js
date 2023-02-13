import { Model, Sequelize } from "../../Database/sequelize.js";
import LaunchToken from './LaunchToken.js';
import LaunchpadRound from './LaunchpadRound.js';
import { User } from "../../Models/User.js";

const LaunchpadOrder = Model.define("launchpad_order", {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    launch_round_id: Sequelize.STRING,
    user_id:Sequelize.STRING,
    name: Sequelize.STRING,
    amount: Sequelize.INTEGER,
    price: Sequelize.INTEGER,
    total: Sequelize.INTEGER,
    currency: Sequelize.STRING,
    status: {
        type: Sequelize.STRING,
        defaultValue: 'pending',
        comment: "pending, completed"
    },
});

LaunchToken.hasMany(LaunchpadOrder, { foreignKey: "launch_token_id" });
LaunchpadOrder.belongsTo(LaunchToken, { foreignKey: "launch_token_id" });

LaunchpadOrder.hasOne(User, {
    sourceKey: 'user_id', 
    foreignKey: 'id'     
});

await LaunchpadOrder.sync();
export default LaunchpadOrder;