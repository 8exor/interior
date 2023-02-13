import { Model , Sequelize } from "../Database/sequelize.js";
import { User } from "./User.js";

export const UserCrypto  = Model.define('user_cryptos', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    user_id:
    { type:Sequelize.STRING,
        allowNull: false,
    },
    currency:
    { 
        type:Sequelize.STRING,
        allowNull: false,
    },
    balance: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    freezed_balance: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
     // Add Custom keys for frontend use
    //  total_bal: {
    //     type: Sequelize.VIRTUAL,
    //     get() {
    //       return CL.add(this.balance , this.freezed_balance);
    //     }
    //   } ,
    
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await UserCrypto.sync();

UserCrypto.belongsTo(User);