import { Model , Sequelize } from "../Database/sequelize.js";
import variables from "../Config/variables.js";

const imagePath = variables.laravel_url ;

export const ListCoin = Model.define('list_coins', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    name:Sequelize.STRING,
    currency:Sequelize.STRING,
    pair_with: Sequelize.STRING,
    start_price: Sequelize.STRING,
    current_price: Sequelize.STRING,
    address: {
        type: Sequelize.STRING,
        defaultValue: ''
    },    
    decimal_currency: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },    
    decimal_pair: {
        type: Sequelize.STRING,
        defaultValue: '0'
    }, 
    image: {
        type: Sequelize.STRING,
        get() {
            const rawValue = this.getDataValue('image');
            return rawValue ? imagePath + rawValue : '';
          }
    }, 
    active_status: {
        type: Sequelize.BOOLEAN,
        defaultValue: '1'
    },
    buy: {
        type: Sequelize.BOOLEAN(4),
        defaultValue: '1'
    },   
    buy_min: Sequelize.STRING,
    buy_min_desc: Sequelize.STRING,
    buy_max: Sequelize.STRING,
    buy_max_desc: Sequelize.STRING,
    buy_commission: Sequelize.STRING,
    buy_desc: Sequelize.STRING,
    buy_commission_type: {
        type: Sequelize.STRING,
        defaultValue: 'percentage'
    },
    sell: {
        type: Sequelize.BOOLEAN(4),
        defaultValue: '1'
    },   
    sell_min: Sequelize.STRING,
    sell_min_desc: Sequelize.STRING,
    sell_max: Sequelize.STRING,
    sell_max_desc: Sequelize.STRING,
    sell_commission: Sequelize.STRING,
    sell_desc: Sequelize.STRING,
    sell_commission_type: {
        type: Sequelize.STRING,
        defaultValue: 'percentage'
    },
    

    // Add Custom keys for frontend use
    symbol: {
        type: Sequelize.STRING,
        get() {
          return `${this.currency}${this.pair_with}`;
        }
      } ,
    
    flag: {
        type: Sequelize.VIRTUAL,
        get() {
          return '0';
        }
      },
      listed: {
        type: Sequelize.VIRTUAL,
        get() {
          return true;
        }
      },
    // change: {
    //     type: Sequelize.VIRTUAL,
    //     get() {
    //       return '0';
    //     }
    //   }  
    // extra: {
    //     type: Sequelize.STRING,
    //     defaultValue: ''
    // }
         
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await ListCoin.sync();

