import { DataTypes } from 'sequelize';
import { Model as DB} from '../../Database/sequelize.js';



export const P2P_OrderBook = DB.define('P2pOrderBook', {

  at_price: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.STRING,
    allowNull: false,
    
    
  },
  currency:{
    type: DataTypes.STRING,
    allowNull: false
  },
  with_currency:{
    type:DataTypes.STRING,
    allowNull:false,
  
    
  },
  order_type:{
    type:DataTypes.STRING,
    allowNull:false,
    comment: 'buy, sell'
  }
}, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});


await P2P_OrderBook.sync();



