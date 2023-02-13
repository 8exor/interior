import {UserKyc} from "../../Models/UserKyc.js"
import {Op} from "sequelize"
import { User } from "../../Models/User.js"
import Helper from "../../Common/Helper.js"
import reply from "../../Common/reply.js"
import CValidator from "../../Validator/CustomValidation.js";

let attributes = ['id','name','lname','email']
async function get(req,res){
    let request = req.query

    let {status,first_name,middle_name,last_name,date_birth,address,country,email,sortbyname,sortby} = request
    let whereCondition = {};
    let relationCondition = {};

    //custom validation
    let valid = await CValidator(request, {
        status:"in:pending,completed,rejected",
    });
    if (!valid.status) { return res.send(reply.failed(valid.message)); }

    //status filter
    if(status){
        whereCondition.status = {
            [Op.substring] : status
        }
    }


    //first_name filter
    if(first_name){
        whereCondition.first_name = {
            [Op.substring] : first_name
        }
    }

    //middle_name filter
    if(middle_name){
        whereCondition.middle_name = {
            [Op.substring] : middle_name
        }
    }

    //last_name filter
    if(last_name){
        whereCondition.last_name = {
            [Op.substring] : last_name
        }
    }

     //date_birth Filter
     if(date_birth){
        whereCondition.date_birth ={
            [Op.substring] : Helper.get_trailing_zero( date_birth)
        }
    }

    //address filter
    if(address){
        whereCondition.address = {
            [Op.substring] : address
        }
    }

    //country filter
    if(country){
        whereCondition.country = {
            [Op.substring] : country
        }
    }

    //Email filter
     if(email){
        relationCondition.country = {
            [Op.substring] : country
        }
    }

        try {
            //helper pagination
            const paginate= Helper.getPaginate(req,sortbyname,sortby)
            let where_condition ={where:whereCondition, include:[{model:User,where:relationCondition,attributes: attributes}]}
            let finalquery= Object.assign(where_condition,paginate)
            const get_data = await UserKyc.findAll(finalquery);
            const count= await UserKyc.count(finalquery)

            //pagination
            let final = reply.paginate(paginate.page,get_data,paginate.limit,count)
            return res.send(reply.success("User Kyc Fetched Successfull", final));
        } catch (error) {
            // console.log({error})
            return res.send(reply.failed("Unable to fetch at this moment"));
        }
        
  
}

async function verify(req,res){
    let request = req.body
    request.id = req.params?.id || "";

    //custom validation
    let { status , message} = await CValidator(request, {
        id:"required|integer|exists:user_kycs,id",
        user_id: 'required|integer|exists:users,id',
        nationality: 'required',
        selfie_status: 'required|in:0,1',
        idenity_status: 'required|in:0,1',
        pancard_status: 'required_if:nationality,India|in:0,1',
        identity_remark: 'required_if:idenity_status,0',
        pan_card_remark: 'required_if:pancard_status,0',
        selfie_remark: 'required_if:selfie_status,0',
    });
    if (!status) { return res.send(reply.failed(message)); }


    var _pancard_status = 0;
    var _pan_card_remark = "";
    var _status = "rejected";

    let { id,nationality, pancard_status, pan_card_remark, idenity_status, identity_remark, selfie_status, user_id, selfie_remark } = request;

        if (nationality == "India") {
            _pancard_status = pancard_status;
            _pan_card_remark = (pancard_status == 0) ? pan_card_remark : '';
            _status = (idenity_status == 1 && pancard_status == 1 && selfie_status == 1) ? 'completed' : 'rejected';
        } else {
            _status = (idenity_status == 1 && selfie_status == 1) ? 'completed' : 'rejected';
        }

        let updated_params = {
            "is_identity_verify": idenity_status,
            "is_selfie_verify": selfie_status,
            "is_pan_verify": _pancard_status,
            "identity_remark": (idenity_status == 0) ? identity_remark : '',
            "pan_card_remark": _pan_card_remark,
            'selfie_remark': (selfie_status == 0) ? selfie_remark : '',
            'status': _status
        };


        let response = await UserKyc.update(updated_params, {
            where: {
                id
            }
        });

        return (response) ? res.send(reply.success('KYC Report Submitted Successfully.')) : res.send(reply.failed('Unable to save at this moment.'));

}
export default{
    get,
    verify
}