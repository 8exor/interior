import { Model , Sequelize } from "../Database/sequelize.js";
import _ from 'lodash';

export const Trade = Model.define('trades', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    
    start_time:Sequelize.BIGINT(20).UNSIGNED,
    end_time:Sequelize.BIGINT(20).UNSIGNED,

    currency:Sequelize.STRING,
    with_currency:Sequelize.STRING,
    symbol:Sequelize.STRING,
    at_price:Sequelize.STRING,
    quantity:Sequelize.STRING,
    tid: Sequelize.STRING,
    time:Sequelize.BIGINT(20).UNSIGNED,
    sell_order_id:Sequelize.STRING,
    buy_order_id:Sequelize.STRING,

    e: {
        type: Sequelize.VIRTUAL,
        get: () => 'trade'
    } ,

    //store by kline
    o: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    h: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    l: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    c: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    v: {
        type: Sequelize.STRING,
        defaultValue: ''
    },

    // for ticker

    last_price: Sequelize.STRING,
    current_price: Sequelize.STRING,

    do: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    dh: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    dl: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    dc: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    dv: {
        type: Sequelize.STRING,
        defaultValue: ''
    },

    //
    ld_cp: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    P_ch: {
        type: Sequelize.STRING,
        defaultValue: '0'
    }, // price_change
    pr_c: {
        type: Sequelize.STRING,
        defaultValue: '0'
    }, // percentage_change

    p: {
        type: Sequelize.VIRTUAL,
        get() {
             return this.at_price;
          }
    } ,

    m: {
        type: Sequelize.VIRTUAL,
        get() {
            // return this.order_type == 'sell' ? true : false ;
            return _.gte(parseFloat(this.at_price) , parseFloat(this.last_price)) ? false : true ;
          }
    } ,
    
    
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await Trade.sync();

