import Helper from "../../Common/Helper.js";
import reply from "../../Common/reply.js";
import { TicketCategories } from "../Models/TicketCategoryModel.js";
import { User } from "../../Models/User.js";
import CValidator from "../../Validator/CustomValidation.js";
import _ from "lodash";
import { Op } from "sequelize";
import { TicketList } from "../../Models/Ticketlist.js";
import { TicketComment } from "../../Models/TicketComment.js";

const category_get = async (req, res) => {
  const request = req.query;

  const pagination = Helper.getPaginate(req, "id");

  //filtering of support category data
  let condition = {};

  if (request.category_name) {
    condition.category_name = request.category_name;
  }

  if (request.created_by) {
    condition.created_by = request.created_by;
  }

  if (request.createdAt) {
    condition.createdAt = {
      [Op.substring]: [request.createdAt],
    };
  }
  if (request.updatedAt) {
    condition.updatedAt = {
      [Op.substring]: [request.updatedAt],
    };
  }

  //helper pagination
  try {
    const attributes = ["id", "name", "lname", "email"];
    const paginate = Helper.getPaginate(req);
    let where_condition = { where: condition,include: [{ model: User, attributes: attributes }], };
    let finalquery = Object.assign(where_condition, paginate);
    const get_data = await TicketCategories.findAll(finalquery);
    const count = await TicketCategories.count(finalquery);

    

    //pagination
    let final = reply.paginate(paginate.page, get_data, paginate.limit, count);
    return res.send(
      reply.success("ticket categories fetch data successfully", final)
    );
  } catch (error) {
    console.log(error);
    return res.send(reply.failed("Unable to fetch at this moment"));
  }
};

const category_create = async (req, res) => {
  const request = req.body;
  request.created_by = req.user.id;

  //custom validation
  let { status, message } = await CValidator(request, {
    category_name: "required|unique:ticket_categories,category_name",
  });
  if (!status) {
    return res.send(reply.failed(message));
  }

  try {
    const ticket_cat = await TicketCategories.create(request);
    return res.json(
      reply.success("Ticket Category Created Successfully", ticket_cat)
    );
  } catch (err) {
    return res.json(reply.failed("unable to create ticket categories"));
  }
};

const category_update = async (req, res) => {
  let request = req.body;
  request.id = req.params?.id || "";

  //custom validation
  let { status, message } = await CValidator(request, {
    id: "required|integer|exists:ticket_categories,id",
    category_name:
      "required|exists-except:ticket_categories,category_name,id," + request.id,
  });

  if (!status) {
    return res.send(reply.failed(message));
  }

  try {
    await TicketCategories.update(
      { category_name: request.category_name },
      { where: { id: request.id } }
    );
    return res.send(reply.success("Ticket Category Updated Successfully"));
  } catch (error) {
    console.log(error);
    return res.json(reply.failed("unable to update ticket categorie name"));
  }
};

const category_delete = async (req, res) => {
  let request = req.body;
  request.id = req.params?.id || "";

  //custom validation
  let { status, message } = await CValidator(request, {
    id: "required|integer|exists:ticket_categories,id",
  });

  if (!status) {
    return res.send(reply.failed(message));
  }

  try {
    await TicketCategories.destroy({ where: { id: request.id } });

    return res.json(reply.success("Ticket Category Deleted Successfully"));
  } catch (err) {
    console.log(err);
    return res.json(reply.failed("Unable to delete at this moment"));
  }
};

///////////////////TICKET LIST/////////////////////////////////
//////////////////////////////////////////////////////////////

const attributes = ["id", "name", "lname", "email"];

const get = async (req, res) => {
  const request = req.query;

  const condition = {};

  // filtering of ticketlistcomment
  if (request.title) {
    condition.title = request.title;
  }

  if (request.content) {
    condition.content = request.content;
  }

  if (request.category_name) {
    condition.category_name = request.category_name;
  }

  if (request.createdAt) {
    condition.createdAt = {
      [Op.substring]: [request.createdAt],
    };
  }

  if (request.author_name) {
    condition.author_name = request.author_name;
  }

  if (request.author_email) {
    condition.author_email = request.author_email;
  }

  //helper pagination
  try {
    const paginate = Helper.getPaginate(req);
    let where_condition = {
      where: condition,
      include: [
        { model: User, attributes: attributes },
        { model: TicketCategories },
      ],
    };
    let finalquery = Object.assign(where_condition, paginate);
    const get_data = await TicketList.findAll(finalquery);
    const count = await TicketList.count(finalquery);

    //pagination
    let final = reply.paginate(paginate.page, get_data, paginate.limit, count);
    return res.send(reply.success("Ticket List Fetched Successfully", final));
  } catch (error) {
    console.log(error);
    return res.send(reply.failed("Unable to fetch at this moment"));
  }
};

const update = async (req, res) => {
  let request = req.body;
  request.created_by = req.user.id
  request.id = req.query.id || "";

//   console.log({request});

  //custom validation
  let { status, message } = await CValidator(request, {
    id: "required|integer|exists:tickets,id",
    status: "required|string|in:open,inprogress,close",
    priority: "required|string|in:high,low,medium",
  });

//   console.log({status,message});

  if (!status) {
    return res.send(reply.failed(message));
  }

 

  try {
    let id = request.id;
    _.unset(request, "id");

    // console.log({request});

    await TicketList.update(request, { where: { id: id } });
    return res.json(reply.success("Ticket Updated Successfully"));
  } catch (err) {
    console.log(err);
    return res.json(reply.failed("Unable to update at this moment"));
  }
};

function imageupload(req, res) {
    if (!req.filedata || req?.filedata?.status_code == 0) {
      return res.send(reply.failed(req?.filedata?.message));
    }
    return res.send(reply.success("Image Uploaded Successfully", req?.filedata?.message));
  }

const comment_create = async (req,res) => {
    let request=req.body;
    request.commented_by = req.user.id || ""

    //custom validation
    let { status, message } = await CValidator(request, {
        comment: "required|string",
        ticket_id:"required|integer"
    });

    if (!status) {
        return res.send(reply.failed(message));
    }

    try{   
       request.image=req?.file?.filename  || "";
          const comment = await TicketComment.create(request);
          return res.json(reply.success("Ticket Comment Created Successfully",comment))
                         
    }catch(err){
        console.log(err)
         return res.json(reply.failed("Unable to create Ticket comment"))

    }
}

const comment_get = async (req,res) => {
  let request ={}
  request.ticket_id = req.params.ticket_id
  
  //custom validation
  let { status, message } = await CValidator(request, {
    ticket_id: "required|integer|exists:ticket_comments,ticket_id",
  });

  if (!status) {
    return res.send(reply.failed(message));
  }

  try{ 
    const getComment = await TicketComment.findAll({
     where:{ticket_id:request.ticket_id},
        order: [ [ 'created_at', 'DESC' ]]
    })
    return res.json(reply.success("Ticket Fetched Successfully", getComment))  

  }catch(err){
     console.log(err)
     return res.json(reply.failed("unable to fetch ticket comment data!"))

  }       
}

export default {
  category_get,
  category_create,
  category_update,
  category_delete,

  /////Ticket List///////
  get,
  update,
  comment_create,
  comment_get
};
