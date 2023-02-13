import reply from "../../Common/reply.js";
import { User } from "../../Models/User.js";
import bcrypt from 'bcrypt';
import jwt from'jsonwebtoken';
import CValidator from "../../Validator/CustomValidation.js";
import fs from 'fs'
import { Token } from "../../Models/Token.js";
import crypto from "crypto"
import { fileURLToPath } from 'url';
import path from 'path'
import Helper from "../../Common/Helper.js";

const saltRounds = 10

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
var privateKey = fs.readFileSync(path.join(__dirname,'../..','keys/private.key'));


async function login(req,res){
    let request = req.body;

    let {status, message} = await CValidator(request, {
        'email'  :  'required|email|exists:users,email',
        'password': 'required'
    });

    if (!status) {
        return res.send(reply.failed(message));
    }

    try {

        let user = await User.findOne({
            where:{
                email:request.email,
                role:'admin',
                status:'1'
            },
            attributes:["id","name", "email","password"]
        });

        if(!user){
            return res.json(reply.failed('Wrong Email'));
        }

        let {id, name, email, password} = user;
        
        let hash = password.replace(/^\$2y(.+)$/i, '$2a$1');
        
        let compare_pwd = await bcrypt.compare(request.password, hash);

        if(!compare_pwd){
            return res.json(reply.failed("Invalid Credentials!!"));
        }

        let t_id = crypto.randomBytes(40).toString('hex');

        await Token.create({
            id: t_id,
            user_id: id,
            client_id:'1',
            name:email
        });

        var token = jwt.sign({jti:t_id}, privateKey, { algorithm: 'RS256'}, { expiresIn: '1d' });

        return res.json(reply.success('Login Success',{id, name, email, token}));
    } catch (error) {
        console.log({error});
        return res.json(reply.failed('Unable to login at this moment!!'));
    }
}

async function changePassword(req,res){
    let request = req.body;
    request.id = req.user.id

    let {status, message} = await CValidator(request, {
        'old_password'  :  'required',
        'new_password': 'required|min:8|max:18|password_regex',
        'confirm_password': 'required|same:new_password',
    });

    if (!status) {
        return res.send(reply.failed(message));
    }

    let user = await User.findOne({where:{role:'admin',id:request.id}});

    //#### If password didn't match with Auth User
    let hash = user.password.replace(/^\$2y(.+)$/i, '$2a$1');
    let compare_pwd = await bcrypt.compare(request.old_password, hash);
    if(!compare_pwd){
        return res.json(reply.failed("Old Password is wrong"));
    }

    //####### If old and new password is same
    let compare_new_pwd = await bcrypt.compare(request.new_password, hash);
    if(compare_new_pwd){
        return res.json(reply.failed("old and new password should not be same!!"));
    }

    //#### Updated New password
    let hash_pwd = await bcrypt.hash(request.new_password, saltRounds);
    let update = await User.update({password: hash_pwd},{where:{id:request.id}})

    //# If password doesn't change with any server issue
    return (update ? res.send(reply.success('Password Changed')): res.send(reply.failed('unable to change password at this time, Please try it later!')))
}

async function adminLogout(req,res){
    let token_id = req.user.id
    try {
        //// Delete Refresh Token
        await Token.destroy({where:{user_id: token_id}})
        // # Generating Logout Activity Log.
        Helper.generateActivityLog(token_id,'logout',req.ip)
        return res.send(reply.success('Logout Successfully'))
    } catch (error) {
        console.log(error)
        return res.failed(reply.success('Unable to Logout'))
    }
   
}
export default {
    login,
    changePassword,
    adminLogout
}