import {UPI} from "../../Models/user_upi.js"
import{AdminUpi} from "../Models/AdminUpi.js"
import {Op} from "sequelize"
import { User } from "../../Models/User.js"
import Helper from "../../Common/Helper.js"
import reply from "../../Common/reply.js"
import CValidator from "../../Validator/CustomValidation.js";
import _ from 'lodash'    

const test = async (req, res) => {
    
    const allowed_filter = ["user_id", "email", "status"];

    let filters = _.pick(req.query , allowed_filter);

    // let response  = await User.findAll({where: filters});

    // return res.send(reply.success('testing', response));

    return res.send(reply.success('testing', filters));
}

let attributes = ['id','name','lname','email']


async function get(req,res){
    let request = req.query

    let {status,alias,email,upi_id,created_at,sortbyname,sortby} = request
    let whereCondition = {};
    let relationCondition = {};

    //custom validation
    let valid = await CValidator(request, {
        status:"in:pending,completed,rejected",
    });
    if (!valid.status) { return res.send(reply.failed(valid.message)); }


     //status filter
     if(status){
        whereCondition.verify_status = {
            [Op.substring] : status
        }
    }

    //alias filter
    if(alias){
        whereCondition.alias = {
            [Op.substring] : alias
        }
    }

   //Email filter
   if(email){
    relationCondition.country = {
        [Op.substring] : country
    }
}

    //UPI Id filter
    if(upi_id){
        whereCondition.upi_id = {
            [Op.substring] : upi_id
        }
    }

    //Date Filter
    if(created_at){
        whereCondition.created_at ={
            [Op.substring] : Helper.get_trailing_zero( created_at)
        }
    }

    try {
        //helper pagination
        const paginate= ((sortbyname == 'name') ||(sortbyname == 'email') ) ? Helper.getPaginate(req,sortbyname,sortby,User):Helper.getPaginate(req,sortbyname,sortby)
        let where_condition ={where:whereCondition, include:[{model:User,where:relationCondition,attributes: attributes}]}
        let finalquery= Object.assign(where_condition,paginate)
        const get_data = await UPI.findAll(finalquery);
        const count= await UPI.count(finalquery)

        //pagination
        let final = reply.paginate(paginate.page,get_data,paginate.limit,count)
        return res.send(reply.success("UPI's Fetched Successfully", final));
    } catch (error) {
        console.log({error})
        return res.send(reply.failed("Unable to fetch at this moment"));
    }
    
  
}

async function verify(req,res){
    let request = req.body
    request.id = req.params?.id || "";

    //custom validation
    let { status , message} = await CValidator(request, {
        id:"required|integer|exists:user_upis,id",
    });
    if (!status) { return res.send(reply.failed(message)); }


    let find_upi = await UPI.findOne({where:{id:request.id}})

    if(find_upi.is_verify == 1 && request.is_verify == 1){
        res.send(reply.success("User Upi is Already Verified")) 
    }

    let up_fields = {
        "is_verify" : request.is_verify,
        "remark"  : (request.is_verify == 0) ? request.remark : '',
        "verify_status" : (request.is_verify == 1) ? 'completed' : 'rejected'
    }
    let status_update = await UPI.update(up_fields,{where:{id:request.id}})
    return (status_update ? res.send(reply.success("User Upi Updated Successfully")) : res.send(reply.failed("Unable to Update at this moment")))
}

async function adminupi_get(req,res){
    let a_upis = await AdminUpi.findAll()

    if(!a_upis){
        res.send(reply.failed("Unable to get at this moment"))
    }
    return res.send(reply.success("Upi's Fetched Successfully", a_upis));
}

async function adminupi_create(req,res){
    let request = req.body
    let user = req.user

    //custom validation
    let {status,message} = await CValidator(request, {
        upi_id: "required|upi_regex|unique:admin_upis,upi_id"
    });

    if (!status) { return res.send(reply.failed(message)); }


    // Create a new upi id
    let upidata = {
        'upi_id' : request.upi_id,
        'user_id' : user.id,
    }

    let upi_create = await AdminUpi.create(upidata)
    return (upi_create ? res.send(reply.success("Admin Upi Created Successfully")) : res.send(reply.failed("Unable to create at this moment")))
}

async function adminupi_update(req,res){
    let request = req.body;
    request.id = req.params?.id || "";

    //custom validation
    let { status , message} = await CValidator(request, {
        id:"required|integer|exists:admin_upis,id",
        upi_id: "required|upi_regex|exists-except:admin_upis,upi_id,id,"+request.id
    });

    if (!status) { return res.send(reply.failed(message)); }

    let data_update = await AdminUpi.update({upi_id:request.upi_id},{where:{id:request.id}})
    return (data_update ? res.send(reply.success("Admin Upi Updated Successfully")) : res.send(reply.failed("Unable to update at this moment")))
    
}

async function adminupi_status_update(req,res){

    let request = {};
    request.id = req.params?.id || "";
    request.upi_status = req.params?.status || "";

    //custom validation
    let { status , message} = await CValidator(request, {
        id:"required|integer|exists:admin_upis,id",
        upi_status:"required|in:0,1",
    });

    if (!status) { return res.send(reply.failed(message)); }

    let status_update = await AdminUpi.update({status:request.upi_status},{where:{id:request.id}})
    return (status_update ? res.send(reply.success("Admin Upi status Updated Successfully")) : res.send(reply.failed("Unable to create at this moment")))
    
}


export default{
    get,
    verify,
    adminupi_get,
    adminupi_create,
    adminupi_update,
    adminupi_status_update,
    test
}