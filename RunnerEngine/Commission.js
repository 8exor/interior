import { UserCrypto } from "./../Models/UserCrypto.js";
import { ListCoin } from "./../Models/ListCoin.js";
import { ListCrypto } from "./../Models/ListCrypto.js";

import { User } from "./../Models/User.js";
import { Commission } from './../Models/Commission.js';
import { GClass } from "../Globals/GClass.js";
import { CL } from "cal-time-stamper";
import { ReferralCommission } from "../Models/ReferralCommission.js";


const CalculateCommission = async ({ currency, with_currency, order_type, at_price, quantity, c_order_id, customer_id }) => {

    // Calculate And Deduct Commission HERE

    //  get Order_id

    let attached_id = c_order_id;
    let total = CL.mul(at_price, quantity);
    let is_buy = order_type == "buy" ? true : false; // 2500
    let gain_qty = is_buy ? quantity : total; // 2500 
    // For List Crypto 
    let ListCrypto_commission_currency = await ListCrypto.findOne({
        where: {
            currency: currency,
            pair_with: with_currency
        }
    });
    // For List Coin 
    let ListCoin_commission_currency = await ListCoin.findOne({
        where: {
            currency: currency,
            pair_with: with_currency
        }
    });

    let commission_currency = is_buy ? currency : with_currency;
    let commission_type = 'order';
    let com_id = 0;
    if (ListCrypto_commission_currency) {
        let order_according_commision_value = is_buy ? ListCrypto_commission_currency.buy_commission : ListCrypto_commission_currency.sell_commission;
        let order_according_commision_type = is_buy ? ListCrypto_commission_currency.buy_commission_type : ListCrypto_commission_currency.sell_commission_type;
        let commission = await calculateCommission2(order_according_commision_type, order_according_commision_value, gain_qty);
        gain_qty = CL.sub(gain_qty, commission);

        com_id = await addCommisionToAdmin({ commission_currency, commission_type, commission, attached_id, customer_id }); // Raman s

    }
    if (ListCoin_commission_currency) {
        let order_according_commision_value = is_buy ? ListCoin_commission_currency.buy_commission : ListCoin_commission_currency.sell_commission;
        let order_according_commision_type = is_buy ? ListCoin_commission_currency.buy_commission_type : ListCoin_commission_currency.sell_commission_type;
        let commission = await calculateCommission2(order_according_commision_type, order_according_commision_value, gain_qty);
        gain_qty = CL.sub(gain_qty, commission);
        com_id = await addCommisionToAdmin({ commission_currency, commission_type, commission, attached_id, customer_id }); // Raman s
    }
    return { gain_qty, com_id };
    // End commision code here 

}


// Commission for admin and sponser

const addCommisionToAdmin = async ({ commission_currency, commission_type, commission, attached_id, customer_id }) => {


    var AdminCommission = commission;

    // let Customer = await User.findOne({ where: { id: customer_id } });

    // var SponserCommission = "";

    // if (Customer.referral_by !== "") {

    //     let commission_percentage = CL.mul(commission, 60);
    //     AdminCommission = CL.div(commission_percentage, 100);  // admin percentage 60%

    //     SponserCommission = CL.sub(commission, AdminCommission); // sponser percentage 40%

    //     console.log({ AdminCommission, SponserCommission, actualcommisioin: commission });
    //     let Sponser = await User.findOne({ where: { referral_code: Customer.referral_by, status: `1` } });

    //     if (Sponser) {
    //         // sponsor commission section
    //         await ReferralCommission.create({
    //             referral_code: Sponser?.referral_code,
    //             attached_id,
    //             commission_currency,
    //             commission_type,
    //             commission: SponserCommission,
    //             status: 'completed'
    //         });

    //         let existing_sponser_currency = await UserCrypto.findOne({
    //             where: {
    //                 currency: commission_currency,
    //                 user_id: Sponser?.id
    //             }
    //         });

    //         if (existing_sponser_currency) {
    //             existing_sponser_currency.balance = CL.add(existing_sponser_currency.balance, SponserCommission);
    //             await existing_sponser_currency.save();
    //             return 0;
    //         }
    //         else {
    //             await UserCrypto.create({ user_id: Sponser?.id, currency: commission_currency, balance: SponserCommission, freezed_balance: 0 });
    //         }
    //     }

    //     if (!Sponser) {
    //         AdminCommission = commission;
    //     }
    // }

    // Raman S
    let com = await Commission.create({
        attached_id,
        commission_currency,
        commission_type,
        commission: AdminCommission,
        status: 'completed'
    });

    let existing_admin_currency = await UserCrypto.findOne({
        where: {
            currency: commission_currency,
            user_id: 1
        }
    });

    if (existing_admin_currency) {
        existing_admin_currency.balance = CL.add(existing_admin_currency.balance, AdminCommission);
        await existing_admin_currency.save();
        return 0;
    }
    else {
        let data = { user_id: 1, currency: commission_currency, balance: AdminCommission, freezed_balance: 0 };
        await UserCrypto.create(data);
    }

    return com.id; // Raman S 
}
// calculate Commission 

const calculateCommission2 = async (commision_type, commision_value = 0, gain_qty) => {
    if (commision_type == "percentage") {
        let val = CL.mul(commision_value, gain_qty);
        return CL.div(val, 100);
    }
    return commision_value;

}
export default { CalculateCommission };
