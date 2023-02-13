import _ from "lodash";
import Helper from "../../Common/Helper.js";
import reply from "../../Common/reply.js"
import variables from "../../Config/variables.js"
import Cvalidate from "../../Validator/CustomValidation.js";
import { Template } from "../Models/Template.js"

const getKeyValue = (data = []) => {
    let d = [];
    _.map(data, (v, i) => {
        let value = _.startCase(_.replace(v, '_', ' '));
        d.push({ key: v, value });
    })
    return d;
};

const category_get = async (req,res) => {
    let sendtype = getKeyValue(variables.templateSendTypes);
    let temptype = getKeyValue(variables.templateTypes);

    try {
        return res.json(reply.success("Template Types Fecthed Successfully.", { sendtype, temptype }));
    } catch (err) {
        return res.json(reply.failed("No Data Found"));
    }
}

const createTemplate = async (req,res) => {
    let request = req.body;
    request.admin_id = req.user.id
    let validation = await Cvalidate(request, {
        'type': 'required|string|in:' + variables.templateSendTypes,
        'temp_type': 'required|string|in:' + variables.templateTypes,
        'content': 'required|string',
    });

    if (!validation.status) {
        return res.json(validation);
    }

    try {
        await Template.create(request);
        return res.json(reply.success("Template Created Successfully."))
    } catch (err) {
        return res.json(reply.failed("Unable to create at"))
    }
}

const getTemplate = async (req,res) => {
    let request = req.query;

    let validation = await Cvalidate(request, {
        'type': 'in:' + variables.templateSendTypes,
        'temp_type': 'in:' + variables.templateTypes,
        'status': 'in:1,0',
    });

    if (!validation.status) {
        return res.json(validation);
    }

    let { type, temp_type, status } = request;

    let filter_data = {};

    //symbol Filter

 
    if(type){  
        filter_data.type =  type
    }

    if(temp_type){  
        filter_data.temp_type =  temp_type
    }

    if(status){  
        filter_data.status =  status
    }

    try {
        const paginate=  Helper.getPaginate(req,'id')
        let where_condition = {where:filter_data}
        let finalquery= Object.assign(where_condition,paginate)
        const get_data = await Template.findAll(finalquery);
        const count= await Template.count(finalquery)

        //pagination
        let final = reply.paginate(paginate.page,get_data,paginate.limit,count)
        return res.json(reply.success("Template Fetched Successfully", final));

    } catch (err) {
        console.log(err)
        return res.json(reply.failed("Unable to Fetch at this moment"));
    }
}

const updateTemplate = async (req,res) => {
    let request = req.query;

    let validation = await Cvalidate(request, {
        id: 'required|integer|exists:templates,id',
        status: 'required|in:0,1',
    });

    if (!validation.status) {
        return res.send(reply.failed(validation.message));
    }

    try {
        await Template.update(request, {
            where: {
                id: request?.id
            }
        });
        return res.json(reply.success('Template Updated Successfully.'));

    } catch (err) {
        return res.json(reply.failed('Unable to update at this moment.'));
    }
}

const delTemplate = async (req,res) => {
    let request = req.query;

    //custom validation
    let validation = await Cvalidate(request, {
        id: 'required|integer|exists:templates,id'
    });

    if (!validation.status) {
        return res.send(reply.failed(validation.message));
    }
    try {
        await Template.destroy({where: { id: request.id }});
        return res.json(reply.success('Template Deleted Successfully'));
    } catch (err) {
        return res.json(reply.failed('Unable to delete at this moment.'));
    }
}

export default{
    category_get,
    createTemplate,
    getTemplate,
    updateTemplate,
    delTemplate
}