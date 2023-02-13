import { Liquidity } from "../Models/Liquidity.js";
import myEvents from "./Emitter.js";
import _ from "lodash";
import { GClass } from "../Globals/GClass.js";
import { GFunction } from "../Globals/GFunction.js";
import { CL } from "cal-time-stamper";


// This Function is using for Add Liquidity
const addLiquidity = async ({ symbol, amount }) => {
     
    let liquidity = await Liquidity.findOne({
        where: {
            symbol: symbol
        },
    });

    if(liquidity){
        liquidity.available = CL.add(liquidity.available, amount);
        await liquidity.save();
    }

    return 1;
}

myEvents.on("CANCEL_ORDER", async({at_price, quantity, currency, with_currency, order_type, order_id}) => {
    
    let cancel_order = await GFunction.getOrderById(order_id);

    if(cancel_order)
    {
        if(cancel_order.user_id == 1){

            let symbol = (order_type == "sell") ? currency + "SELF" : currency + with_currency;
            let amount = (order_type == "sell") ? quantity : CL.mul(at_price, quantity );

            await addLiquidity({ symbol , amount});
        }
    }

});

myEvents.on("TRADE_EXECUTED", async ({currency , with_currency , at_price, quantity,  sell_order_id, buy_order_id }) => {
   

    let is_seller = await GFunction.getOrderById(sell_order_id);
    let is_buyer = await GFunction.getOrderById(buy_order_id);
  
    if(is_seller)
    {
        if(is_seller.user_id == 1){
            let addition = CL.mul(at_price, quantity );
            await addLiquidity({ symbol : currency + with_currency , amount: addition});
        }
    }

    if(is_buyer)
    {
        if(is_buyer.user_id == 1){
            await addLiquidity({ symbol : currency + "SELF" , amount: quantity});
        }
    }
});

export default {}
