import { DataTypes } from 'sequelize';
import { Model as DB} from '../../Database/sequelize.js';


export const P2P_RevertQuantity = DB.define('P2pRevertQuantity', {


  user_id: {
    type: DataTypes.STRING,
    allowNull: false

  },
  order_id: {
    type: DataTypes.STRING,
    allowNull: false

  },
  refund_amount: {
    type: DataTypes.STRING,
    allowNull: false

  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'The amount is refunded due to lesser than minimum quantity'

  },
}, {
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});



await P2P_RevertQuantity.sync();
