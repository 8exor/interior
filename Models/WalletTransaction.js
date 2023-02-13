import { Model, Sequelize } from "../Database/sequelize.js";
import { User } from "../Models/User.js";

export const WalletTransaction = Model.define(
  "wallet_transactions",
  {
    id: {
      type: Sequelize.BIGINT(20),
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: Sequelize.STRING,
    amount: Sequelize.STRING,
    currency: Sequelize.STRING,
    extra: Sequelize.TEXT,
    type: {
      type: Sequelize.STRING,
      comment: "deposit,withdraw",
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "pending",
    },
    transfer_via: {
      type: Sequelize.STRING,
      comment: "bank,crypto",
    },
    transfer_detail: {
      type: Sequelize.JSON,
      get() {
        const details = this.getDataValue("transfer_detail");
        // console.log({details})
        return details != "" && details != null && details != undefined
          ? JSON.parse(details)
          : {};
      },
    },
    to_address: {
      type: Sequelize.STRING,
    },
    remark: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "",
    },
    chain_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  {
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

//relation with user
WalletTransaction.belongsTo(User);

await WalletTransaction.sync();
