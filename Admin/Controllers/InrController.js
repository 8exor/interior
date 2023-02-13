import { WalletTransaction } from "../../Models/WalletTransaction.js";
import { User } from "../../Models/User.js";
import reply from "../../Common/reply.js";
import CValidator from "../../Validator/CustomValidation.js";
import Helper from "../../Common/Helper.js";
import { Op } from "sequelize";
import InrDeposit from "../Models/AdminInrDeposit.js";


const attributes = ["name", "email", "lname"];

const depositGet = async (req,res) => {
    let request = req.query;

    let {status,name,amount,txn_id,created_at,sortbyname,sortby} = request
    let whereCondition = {};
    let relationCondition = {};
    
    let validation = await CValidator(request, {
        status: "in:pending,completed,rejected"
    });

    if (!validation.status) { return res.send(reply.failed(validation.message)); }

    //status filter
    if(status){
      whereCondition.status = {
          [Op.substring] : status
      }
    }

    //name filter
    if(name){
      relationCondition.name = {
            [Op.substring] : name
        }
    }

     //txn_id filter
     if (txn_id) {
      whereCondition.txn_id = {
          [Op.substring] :  txn_id
      }
    }

      //amount filter
      if(amount){
        whereCondition.amount = {
            [Op.substring] : amount
        }
      }

     //created_at filter
     if (created_at) {
      whereCondition.created_at = {
          [Op.substring] :  Helper.get_trailing_zero( created_at) 
      }
    }

   try {
    //helper pagination
    const paginate= (sortbyname== 'name') ? Helper.getPaginate(req,sortbyname,sortby,User) : Helper.getPaginate(req,sortbyname,sortby)
    let where_condition ={
      where:whereCondition, 
      include:[{model:User,where:relationCondition,attributes: attributes}]
    }
    let finalquery= Object.assign(where_condition,paginate)
    const get_data = await InrDeposit.findAll(finalquery);
    const count= await InrDeposit.count(finalquery)

    //pagination
     let final = reply.paginate(paginate.page,get_data,paginate.limit,count)
     return res.send(reply.success("Data Fetched Successfull", final));
} catch (error) {
    // console.log({error})
    return res.send(reply.failed("Unable to fetch at this moment"));
}
}

const depositUpdate = async (req,res) => {
    let request = req.query

   
   let validation = await CValidator(request,{
        id:"exists:admin_inr_deposits,id",
        status:"string|in:completed,rejected",
        remark: "required_if:status,rejected",
   });

   if (!validation.status) { return res.send(reply.failed(validation.message)); }

   try{
        let exist = await InrDeposit.findOne({where:{id:request.id}});
        // console.log({exist})
        
         if(exist.status==='completed' && request.status==='completed'){
            return res.json(reply.failed("User Inr Deposit is Already Verified."));
         }

         let verfiystatus = request.status === "completed" ? "completed" : "rejected";
         let remark = request.status === "completed" ? " " : request.remark;

         await InrDeposit.update({status:verfiystatus,remark:remark},{where:{id:request.id}})
        return res.json(reply.success("Inr Deposit verified Update Successfully"))
               
      } catch(err){
            // console.log(err,"errr>>>>>>>>>")
            return res.json(reply.failed("Unable to Fetch at this moment"))
     }
}


const withdrawalGet = async (req,res) => {
  let request = req.query;
  // console.log("hello");

  let {status,name,email,amount,wd_ifsc,wd_acc_no,created_at,sortbyname,sortby} = request
  let whereCondition = {currency:'INR'};
  let relationCondition = {};

  //custom validation
  let validation = await CValidator(request, {
    status: "in:pending,completed,rejected",
  });

  if (!validation.status) { 
    return res.send(reply.failed(validation.message));
  }


  //status filter
  if(status){
    whereCondition.status = {
        [Op.substring] : status
    }
  }

  //name filter
  if(name){
    relationCondition.name = {
          [Op.substring] : name
      }
  }

  //email filter
  if(email){
    relationCondition.email = {
          [Op.substring] : email
      }
  }

  //amount filter
  if(amount){
    whereCondition.amount = {
        [Op.substring] : amount
    }
  }

  //wd_acc_no filter
  if (wd_acc_no) {
    whereCondition.transfer_detail = {
      wd_acc_no:{
        [Op.substring] : wd_acc_no
      }
    }
  }

  //wd_ifsc filter
  if (wd_ifsc) {
    whereCondition.transfer_detail = {
      wd_ifsc:{
        [Op.substring] : wd_ifsc
      }
    }
 }

  //wd_ifsc filter
  if (created_at) {
    whereCondition.created_at = {
        [Op.substring] :  Helper.get_trailing_zero(created_at) 
    }
 }


   try {
    //helper pagination
    const paginate= (sortbyname== 'name' || sortbyname== 'email' ) ? Helper.getPaginate(req,sortbyname,sortby,User) : Helper.getPaginate(req,sortbyname,sortby)
    let where_condition ={
      where:whereCondition, 
      include:[{model:User,where:relationCondition,attributes: attributes}]
    }
    let finalquery= Object.assign(where_condition,paginate)
    const get_data = await WalletTransaction.findAll(finalquery);
    const count= await WalletTransaction.count(finalquery)

    //pagination
    let final = reply.paginate(paginate.page,get_data,paginate.limit,count)
    return res.send(reply.success("Data Fetched Successfull", final));
} catch (error) {
    // console.log({error})
    return res.send(reply.failed("Unable to fetch at this moment"));
}

}


const withdrawalUpdate = async (req,res) => {
  let request = req.query;
  // console.log(request,"update is here now");

    //custom validation
    let validation = await CValidator(request, {
      id:"exists:wallet_transactions,id",
      status:"string|in:completed,rejected",
      remark: "required_if:status,rejected",
    });

    if (!validation.status) { 
      return res.send(reply.failed(validation.message));
    }

    let exist = await WalletTransaction.findOne({where: { id: request.id },})

    if (exist.status === "completed") {
        //  console.log("here now");
         return res.json(reply.failed("Wallet Transcation is Already Completed."));
    }


    let verfiystatus =request.status === "completed" ? "completed" : "rejected";
    let remark = request.status === "completed" ? "" : request.remark;


    try {
      await WalletTransaction.update(
        { status: verfiystatus,remark:remark },
        { where: { id: request.id } }
      );
      return res.json( reply.success("Wallet Transaction Verification Update Successfully"));
    } catch (err) {
      // console.log(err, "errrr>>>>>>>>>>>>>>>>");
      return res.json(reply.failed("Unable to Update"));
    }
}


export default{
    depositGet,
    depositUpdate,
    withdrawalGet,
    withdrawalUpdate
}