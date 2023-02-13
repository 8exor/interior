import { Bank } from "../../Models/Bank.js";
import { UserKyc } from "../../Models/UserKyc.js";



export default {
    bank_status: async (data) => {
        let response = await Bank.findAll({ where: { user_id: data, is_verify : 1 } });
       
        
        if (response.length != 0) {
            return {
                status_code: '1',
                message: 'verified',
                user: response
            }
        }

        return {
            status_code: '0',
            message: 'user bank is not verified',
        }
    },

    kyc_status: async (data) => {
        let response = await UserKyc.findOne({ where: { user_id: data } });
        if(!response){
            return {
                status_code: '0',
                message: 'user KYC is not approved'
            }
        }
        if (response.status == 'completed') {
            return {
                status_code: '1',
                message: 'user KYC is verified',
                user: response
            }
        }

        return {
            status_code: '0',
            message: 'user KYC is not verified'
        }
    }
}

