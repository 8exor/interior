import {Bank} from "../../Models/Bank.js"
import {AdminBank} from "../Models/AdminBank.js"
import {Op} from "sequelize"
import { User } from "../../Models/User.js"
import Helper from "../../Common/Helper.js"
import reply from "../../Common/reply.js"
import CValidator from "../../Validator/CustomValidation.js";
import _ from "lodash"


async function get(req,res){
    let request = req.query

    //custom validation
    let { status , message} = await CValidator(request, {
        status:"required|in:pending,completed,rejected",
    });
    if (!status) { return res.send(reply.failed(message)); }


    //helper pagination
    const paginate= Helper.getPaginate(req,'id')
  

    //where condition
    let where_condition = {
        where:{
            verify_status: request.status
        },
        include: {model:User,attributes: {exclude: ['password'] }}
        
    }
    let user_filter={where:{}}

    //alias filter
    if(request.alias){
        where_condition.where['alias'] = {
            [Op.substring] : request.alias
        }
    }

    //Email filter
     if(request.email){
         user_filter.where = {
             email:{
                 [Op.substring] : request.email
                }
            }
        }
        
    Object.assign(where_condition.include,user_filter)

    //Account No. filter
    if(request.account_number){
        where_condition.where.account_number = {
            [Op.substring] : request.account_number
        }
    }

    //IFSC Id filter
    if(request.ifsc_code){
        where_condition.where.ifsc_code = {
            [Op.substring] : request.ifsc_code
        }
    }

    //Date Filter
    if(request.created_at){
        where_condition.where.created_at ={
            [Op.substring] : Helper.get_trailing_zero( request.created_at)
        }
    }

    let finalquery= Object.assign(where_condition,paginate)
    const bank_data = await Bank.findAll(finalquery);
    const count= await Bank.count(finalquery)

    //pagination
    let final = reply.paginate(paginate.page,bank_data,paginate.limit,count)
    return res.send(reply.success("User Bank Account Fetched Successfully", final));
  
}

async function verify(req,res){
    let request = req.body
    request.id = req.params?.id || "";
  


    //custom validation
    let { status , message} = await CValidator(request, {
        id:"required|integer|exists:user_bank_accounts,id",
        is_verify: "required|integer",
        remark: "required_if:is_verify,0",
    });
    if (!status) { return res.send(reply.failed(message)); }


    let find_bank = await Bank.findOne({where:{id:request.id}})
    // console.log(find_bank,"fkffk");

    if(find_bank.is_verify == 1 && request.is_verify == 1){
        res.send(reply.success("User Bank is Already Verified")) 
    }

    let up_fields = {
        "is_verify" : request.is_verify,
        "remark"  : (request.is_verify == 0) ? request.remark : '',
        "verify_status" : (request.is_verify == 1) ? 'completed' : 'rejected'
    }

    let status_update = await Bank.update(up_fields,{where:{id:request.id}})
    return (status_update ? res.send(reply.success("User Bank Updated Successfully")) : res.send(reply.failed("Unable to Update at this moment")))
}



async function adminbank_get(req,res){
    let a_banks = await AdminBank.findAll()

    if(!a_banks){
        res.send(reply.failed("Unable to get at this moment"))
    }
    return res.send(reply.success("AdminBank Fetched Successfully", a_banks));
}

async function adminbank_create(req,res){
    let request = req.body
    request.user_id = req.user?.id || ""

    //custom validation
    let {status,message} = await CValidator(request, {
        "account_holder_name":"required",
        "account_number":"required|max:18|unique:admin_banks,account_number",
        "confirm_account_number":"same:account_number",
        "account_type":"required|in:savings,current",
        "bank_name":"required|min:3",
        "ifsc_code":"required|ifsc_regex"
    });

    if (!status) { return res.send(reply.failed(message)); }

    // return res.send({request})

    let bank_create = await AdminBank.create(request)
    return (bank_create ? res.send(reply.success("Admin Bank Created Successfully")) : res.send(reply.failed("Unable to create at this moment")))
}

async function adminbank_update(req,res){
    let request = req.body;
    request.id = req.params?.id || "";

    //custom validation
    let { status , message} = await CValidator(request, {
        id:"required|integer|exists:admin_banks,id",
        account_holder_name:"required",
        account_number:"required|max:18|exists-except:admin_banks,account_number,id,"+request.id,
        confirm_account_number:"same:account_number",
        account_type:"required|in:savings,current",
        bank_name:"required|min:3",
        ifsc_code:"required|ifsc_regex"
    });

    if (!status) { return res.send(reply.failed(message)); }

    let id= request.id;
    let {account_holder_name, account_number, confirm_account_number, account_type, bank_name, ifsc_code } = request;
    _.unset(request,'id')

    let data_update = await AdminBank.update(request,{where:{id}})
    return (data_update ? res.send(reply.success("AdminBank Updated Successfully")) : res.send(reply.failed("Unable to update at this moment")))
    
}

async function adminbank_status_update(req,res){
    let request = {};
    request.id = req.params?.id || "";
    request.bank_status = req.params?.status || "";

    //custom validation
    let { status , message} = await CValidator(request, {
        id:"required|integer|exists:admin_banks,id",
        bank_status:"required|in:0,1",
    });

    if (!status) { return res.send(reply.failed(message)); }

    let status_update = await AdminBank.update({status:request.bank_status},{where:{id:request.id}})
    return (status_update ? res.send(reply.success("Admin Bank status Updated Successfully")) : res.send(reply.failed("Unable to create at this moment")))
    
}


export default{
    get,
    verify,
    adminbank_get,
    adminbank_create,
    adminbank_update,
    adminbank_status_update
}