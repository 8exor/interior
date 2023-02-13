import variables from "../Config/variables.js";
import { Model , Sequelize } from "../Database/sequelize.js";
import { User } from "../Models/User.js";

const getImgUrl = (path = "") => {
    path = (path == "") ? "/not-found.png" : path; 
    return `${variables.laravel_url}${path.substring(1)}`;
}


export const UserKyc  = Model.define('user_kycs', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    user_id:Sequelize.STRING,
    first_name: Sequelize.STRING,
    middle_name: Sequelize.STRING,
    last_name: Sequelize.STRING,
    date_birth: Sequelize.DATE,
    address: Sequelize.TEXT,
    identity_type: Sequelize.STRING,
    identity_number: Sequelize.STRING,
    identity_front_path:{
        type:Sequelize.STRING,
        get() {
            return getImgUrl(this.getDataValue('identity_front_path'));
          }
    } ,
    identity_back_path: {
        type: Sequelize.STRING,
        get() {
            return getImgUrl(this.getDataValue('identity_back_path'));
          }
    },

    is_identity_verify: {
        type: Sequelize.STRING,
        defaultValue: '0',
       
    }, 
    pan_card_number:  Sequelize.STRING, 
    pan_card_path:  {
        type:Sequelize.STRING,
        get() {
            return getImgUrl(this.getDataValue('pan_card_path'));
          }
    },

    is_pan_verify: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
    },
    status: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    identity_remark:  Sequelize.STRING, 
    pan_card_remark:  Sequelize.STRING, 
    selfie_path: {
        type: Sequelize.STRING,
        defaultValue: '',
        get() {
            return getImgUrl(this.getDataValue('selfie_path'));
          }
    },
    is_selfie_verify: {
        type: Sequelize.STRING,
        defaultValue: '0'
    },
    selfie_remark: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    country: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    state: {
        type: Sequelize.STRING,
        defaultValue: ''
    }
},{
    underscored: true,
});
//relation with User
UserKyc.belongsTo(User)

await UserKyc.sync();

