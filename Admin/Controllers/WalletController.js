import reply from "../../Common/reply.js";
import { User } from "../../Models/User.js"
import _ from "lodash";
import {UserWallet} from "../../Models/UserWallet.js";
import variables from "../../Config/variables.js";


const get = async (req,res) => {
    let {id} = req.user;

    let data = {};

    data.user = _.pick(req.user, 'id','name', 'email') ?? {};
    
    let wallet = await UserWallet.findAll({
        where:{user_id:id}, 
        attributes:['address','type'],
        raw:true
    }) ?? [];

    data.wallet = _.map(wallet, (v,i) => {
        let img = (v.type == "TRON") ? "trx" : v.type.toLowerCase();
        v.image = variables.laravel_url + `currency_images/${img}.png`;
        return v;
    });
    
    return res.send(reply.success('Wallet Fetched Successfully!!',data));
}


export default {
    get
}