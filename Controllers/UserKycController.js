import reply from "../Common/reply.js";

import _ from "lodash"
import { UserKyc } from './../Models/UserKyc.js';

export default {
    async get(req, res) {


        

        let user = await UserKyc.findOne({
            attributes: ['status', 'identity_remark', 'pan_card_remark', 'selfie_remark', 'country', 'is_identity_verify', 'is_pan_verify', 'is_selfie_verify'],
            where: {
                user_id: req.user.id
            }
        });

        let status = user?.status || 'new';

        var response = {};

        response.user_kyc_status = status;

        if(status == "new"){

            response.user_kyc_status_message = {};

            return res.json(reply.success('User Kyc Status fetched Successfully', response));
        }

        if(user?.country == "India"){


            response.user_kyc_status_message =  response.user_kyc_status == "rejected" ? {
                "pan":  (user?.is_pan_verify == '0') ? user?.pan_card_remark : "",
                "identity" : (user?.is_identity_verify == '0') ? user?.identity_remark : "",
                "selfie" : (user?.is_selfie_verify == '0') ? user?.selfie_remark : "",
            } : {};

            return res.json(reply.success('User Kyc Status fetched Successfully', response));
        }


        response.user_kyc_status_message =  response.user_kyc_status == "rejected" ? {
            "identity" : (user?.is_identity_verify == '0') ? user?.identity_remark : "",
            "selfie" : (user?.is_selfie_verify == '0') ? user?.selfie_remark : "",
        } : {};
       

        return res.json(reply.success('User Kyc Status fetched Successfully', response));

    }
}
