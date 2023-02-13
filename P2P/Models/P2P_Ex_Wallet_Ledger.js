import { DataTypes } from "sequelize";
import { Model as DB } from '../../Database/sequelize.js';


export const P2P_Ex_Wallet_Ledger = DB.define('P2pExWalletLedger', {
  user_id:
  {
    type: DataTypes.STRING,

  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      this.setDataValue('currency', value.toUpperCase());
    }
  },
  transaction_type:
  {
    type: DataTypes.STRING,

  },
  attached_id:
  {
    type: DataTypes.STRING
  },
  credit_amount:
  {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  debit_amount:
  {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  balance:
  {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  freezed_balance:
  {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  main_balance:
  {
    type: DataTypes.STRING,
    defaultValue: '0'

  },
  comment:
  {
    type: DataTypes.STRING,
    defaultValue: ''

  },
  extra: {
    type: DataTypes.STRING,
    defaultValue: ''
  }

}, {
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

await P2P_Ex_Wallet_Ledger.sync();