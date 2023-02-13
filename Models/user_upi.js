import { DataTypes } from "sequelize";
import { Model as DB} from '../Database/sequelize.js';
import { P2P_PaymentTypes } from "../P2P/Models/P2P_PaymentTypes.js";
import { User } from "../Models/User.js";

export const UPI = DB.define(
  "user_upis",
  {
    id: {
      type: DataTypes.BIGINT(20),
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    alias: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    upi_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qr_code: {
      type: DataTypes.JSON, /// type:DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 0,
    },
    is_verify: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 0,
    },
    verify_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    payment_type_id: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '1'
    },
    remark: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
  },
  {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
await UPI.sync();
//relation with User
UPI.belongsTo(User)
//relation with payment types
UPI.belongsTo(P2P_PaymentTypes,{as:"payment_type", foreignKey: 'payment_type_id' });


