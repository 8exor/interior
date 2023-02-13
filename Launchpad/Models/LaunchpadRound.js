import { Model, Sequelize } from "../../Database/sequelize.js";
import LaunchToken from './LaunchToken.js';
import _ from "lodash";

const LaunchpadRound = Model.define("launchpad_round", {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    currency: Sequelize.STRING,
    name: Sequelize.STRING,
    symbol: Sequelize.STRING,
    rounds: {
        type: Sequelize.TEXT,
        allowNull: false,
        set(value) {
            this.setDataValue('rounds', JSON.stringify(value));
        },
        get() {
            let d = (this.getDataValue('rounds') != []) ? JSON.parse(this.getDataValue('rounds')) : [];
            if (d.length > 0) {
                let today = new Date().toISOString().slice(0, 10);
                d.filter((v) => { v.status = (_.gte(today, v.started_at) && _.lte(today, v.expired_at)); });
                return d;
            }
        }
    }
});



LaunchToken.hasMany(LaunchpadRound, { foreignKey: "launch_token_id" });
LaunchpadRound.belongsTo(LaunchToken, { foreignKey: "launch_token_id" });

await LaunchpadRound.sync();
export default LaunchpadRound;