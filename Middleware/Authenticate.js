
import JWT from 'jsonwebtoken';
import fs from 'fs';

import reply from "../Common/reply.js";

import { Token } from './../Models/Token.js';
import { User } from './../Models/User.js';


const PUBLIC_KEY = fs.readFileSync('./keys/public.key', 'utf-8');

export default async (req, res, next) => {
   
    
    // Is Token
    var token = req.header('Authorization')?.split(' ')[1];

    if (token == null) {
        return res.status(401).json(reply.unauth());
    }
    
    
    // Verify Token
    const result = JWT.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }, function (err, user) {
        
        if (err) { return 0; }

        return user;
    });

    if (result == 0) {
        return res.status(401).json(reply.unauth());
    }


    // Check Token In Database After Verify
    var is_token = await Token.findByPk(result.jti);
    if (is_token == null) {
        return res.status(401).json(reply.unauth());

    }

    var user = await User.findByPk(is_token.user_id);
    if (user == null) {
        return res.status(401).json(reply.unauth());
    }

    req.user = user;
    next();
}

// Use This When Going Live
// https://obfuscator.io/