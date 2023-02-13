import Validator from 'validatorjs';
import { Model, Sequelize } from '../Database/sequelize.js';
import _ from "lodash";

const hasDuplicates = (arr) => arr.some((e, i, arr) => arr.indexOf(e) !== i);

Validator.registerAsync('distinct', function (columnValue, attribute, req, passes) {
    // console.log({columnValue, attribute, req})
    let grp = _.map(columnValue, attribute);

    // console.log({grp})
    if(hasDuplicates(grp)){
        return passes(false, `${req} ${attribute} should be unique`);
    }
    return passes(); 
});


Validator.registerAsync('unique', function (columnValue, attribute, req, passes) {
    const attr = attribute.split(",");  // 0 = tablename , 1 = columnname
    Model.query(`SELECT * FROM ${attr[0]} Where ${attr[1]} = "${columnValue}" LIMIT 1`).then(([results]) => {
        return (results.length == 0) ? passes() : passes(false, `The ${req} has already been taken.`);
    }).catch((error) => {
        return passes(false, error.message)
    });
});

Validator.registerAsync('exists', function (columnValue, attribute, req, passes) {
    //   console.log({columnValue, attribute, req})
    const attr = attribute.split(",");  // 0 = tablename , 1 = columnname
   
    Model.query(`SELECT * FROM ${attr[0]} Where ${attr[1]} = "${columnValue}" LIMIT 1`).then(([results]) => {
        //console.log(results)
        return (results.length == 0) ? passes(false, `The ${req} is not Exists.`) : passes();
    }).catch((error) => {
        return passes(false, error.message)
    });
});

Validator.registerAsync('exists-except', function (columnValue, attribute, req, passes) {
    // console.log({columnValue, attribute, req})
    const attr = attribute.split(",");  // 0 = tablename , 1 = columnname, 2 = expect column, 3 = expect column value
    // console.log({attr})
    Model.query(`SELECT * FROM ${attr[0]} Where ${attr[1]} = "${columnValue}" AND ${attr[2]} != ${attr[3]} LIMIT 1`).then(([results]) => {
        // console.log(results)
        return (results.length > 0) ? passes(false, `The ${req} is Already Exists.`) : passes();
    }).catch((error) => {
        return passes(false, error.message)
    });
});

Validator.registerAsync('gt', function (columnValue, attribute, req, passes) {
    // console.log({columnValue,attribute,req})
    if(parseFloat(attribute) >= parseFloat(columnValue)){
        return passes(false, `The ${req} should be greater than ${attribute}`);
    }else{
       return passes();
    } 
});

Validator.registerAsync('lt', function (columnValue, attribute, req, passes) {
    // console.log({columnValue,attribute,req})
    if(parseFloat(columnValue) > parseFloat(attribute)){
        return passes(false, `The ${req} should be less than ${attribute}`);
    }else{
       return passes();
    } 
});


// const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]/;

const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/;
Validator.register('password_regex', value => passwordRegex.test(value), "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character");

const upiRegex = /^[\w.-]+@[\w.-]+$/;
Validator.register('upi_regex', value => upiRegex.test(value), "UPI ID Format is Invalid");

const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
Validator.register('ifsc_regex', value => ifscRegex.test(value), "IFSC Code Format is Invalid");

const firstError = (validation) => {
    const firstkey = Object.keys(validation.errors.errors)[0];
    return validation.errors.first(firstkey);
}


function validate(request, rules, messages = {}) {
    // console.log({request,rules})

    if (typeof request != 'object' || typeof rules != 'object' || typeof messages != 'object') {
        return {
            status: 0,
            message: 'Invalid Params'
        }
    }

    let validation = new Validator(request, rules, messages);

    return new Promise((resolve, reject) => {
        validation.checkAsync(() => resolve({ status: 1, message: "" }), () => reject({ status: 0, message: firstError(validation) }))
    }).then(r => r).catch(err => err);

}

export default validate;