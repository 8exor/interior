import { Sequelize, DataTypes } from "sequelize";
import { Model as DB } from '../../Database/sequelize.js';
import { User } from "../../Models/User.js";

const queryInterface = DB.getQueryInterface();

export const P2P_WalletTransaction = DB.define(
  "P2pWalletTransaction",
  {
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        this.setDataValue('currency', value.toUpperCase());
      }
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transaction_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
  },
  {
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

await P2P_WalletTransaction.sync();

P2P_WalletTransaction.hasOne(User, { sourceKey: 'user_id', foreignKey: 'id' });


