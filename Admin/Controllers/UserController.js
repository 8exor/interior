import CValidator from "../../Validator/CustomValidation.js";
import reply from "../../Common/reply.js";
import { User } from "../../Models/User.js";
import{UserCrypto} from "../../Models/UserCrypto.js"
import { Op } from "sequelize";
import Helper from "../../Common/Helper.js";
import bcrypt from 'bcrypt';
import crypto from "crypto"
import _ from "lodash";

async function get(req,res){  
    //helper pagination
    const paginate= Helper.getPaginate(req,'id');

    let request = req.query;

    let where_condition = {
        where:{
            role:{
                [Op.ne]:'admin'
            }
        },
        attributes: ["id","name", "email","created_at","status"]
    }

    //Name Filter
    if(request.name){
        where_condition.where.name = {
            [Op.substring] : request.name
        }
    }

    //Email Filter
    if(request.email){
        where_condition.where.email = {
            [Op.substring] : request.email
        }
    }

    //Date Filter
    if(request.date){
        where_condition.where.created_at ={
            [Op.substring] :Helper.get_trailing_zero( request.date)
        }
    }

    //Status user_verify Filter
    if(request.status){
        let status = (request.status == 'verified') ? 1 : 0;
        where_condition.where.status ={
            [Op.eq] : status
        }
    }

    // console.log(where_condition);
   
    let finalquery= Object.assign(where_condition,paginate)
    const all_users = await User.findAll(finalquery);
    const count= await User.count(finalquery)

    //pagination
    let final = reply.paginate(paginate.page,all_users,paginate.limit,count)
    return res.send(reply.success("Users Fetched Successfully",final));
   
}

async function create(req,res){
    var request = req.body;
    
    //custom validation
    let {status,message} = await CValidator(request, {
        name: "required|min:3|max:20",
        email: "required|email|max:30|unique:users,email",
        password: "required|min:8|max:18|password_regex",
        confirm_password:"same:password",
        referral:"min:10|max:10|exists:users,referral_by",
        role:"in:subadmin,user"
    });
    
    if (!status) { return res.send(reply.failed(message)); }
    
    // Getting User refferal By code
    let referral_by  = request.referral ?? "";

    // Generate refferal code
    let referral_code  = `${process.env.REFERRAL_PREFIX}${crypto.randomBytes(3).toString('hex')}`;

    //Hash password
    let password = await bcrypt.hash(request.password, 10);

    // Create a new user
    let userdata = {
        'name' : request.name,
        'email' : request.email,
        'password' : password,
        'otp_status' :  1,
        'user_verify' :  1,
        'email_verified_at' : new Date(),
        'status' : '1',
        'referral_code' : referral_code,
        'referral_by' : referral_by,
        'role'      : request.role,
        'created_by'    : 'ADMIN'
    }
    try {
        let new_user = await User.create(userdata);
        await UserCrypto.create({"user_id":new_user.id,"currency":process.env.DEFAULT_CURRENCY,'balance': 0})
        return  res.send(reply.success("Users Created Successfully"))

    } catch (error) {
        return res.send(reply.failed("Unable to Create Users"))
    } 
}

async function update_status(req,res){
    let request = {};
    request.id = req.params?.id || "";
    request.user_status = req.params?.status || "";

     //custom validation
     let { status , message} = await CValidator(request, {
        id:"required|integer|exists:users,id",
        user_status:"required|in:0,1",
    });

    if (!status) { return res.send(reply.failed(message)); }

    let status_update = await User.update({status:request.user_status},{where:{id:request.id}})
    return (status_update ? res.send(reply.success("User Status Updated Successfully")) : res.send(reply.failed("Unable to Update at this moment")))

}



export default{
    get,
    create,
    update_status
}