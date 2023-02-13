import { DataTypes } from 'sequelize';
import { Model as DB} from '../../Database/sequelize.js';


export const P2P_PaymentTypes = DB.define('P2pPaymentTypes', {


  type: {
    type: DataTypes.STRING,
    allowNull: false

  },
}, {
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});



await P2P_PaymentTypes.sync();
