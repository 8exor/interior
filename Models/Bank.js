import { DataTypes } from 'sequelize';
import { Model as DB} from '../Database/sequelize.js';
import { P2P_PaymentTypes } from '../P2P/Models/P2P_PaymentTypes.js';
import { User } from '../Models/User.js';



export const Bank = DB.define('user_bank_accounts', {
  user_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alias: {
    type: DataTypes.STRING,
    allowNull: false

  },
  account_number: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  ifsc_code: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''

  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''

  },
  account_type: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'current, saving',
    defaultValue: ''
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "0",
    comment: '0, 1'
  },
  is_verify: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  verify_status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  branch: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  payment_type_id: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '1'
  }


}, {
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
await Bank.sync();
//relation with user
Bank.belongsTo(User)

//relation with payment types
Bank.belongsTo(P2P_PaymentTypes,{as:"payment_type", foreignKey: 'payment_type_id' });




// export default Bank