import { Model, Sequelize } from "../../Database/sequelize.js";
import { User } from "../../Models/User.js";
const InrDeposit = Model.define(
  "admin_inr_deposit",
  {
    user_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    amount: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    txn_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    images: {
      type: Sequelize.STRING,
      allowNull: false,
      get() {
        return this.getDataValue("images")
          ? process.env.PORTS + "image/tickets/" + this.getDataValue("images")
          : [];
      },
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "pending",
    },
    remark: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "",
    },
  },
  {
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
await InrDeposit.sync();
export default InrDeposit;
InrDeposit.belongsTo(User, {foreignKey: 'user_id'});
