import _ from "lodash";
import { Op } from "sequelize";
import Helper from "../../Common/Helper.js";
import reply from "../../Common/reply.js";
import Cvalidate from "../../Validator/CustomValidation.js";
import { Page } from "../Models/Pages.js";


const pageCreate = async (req, res) => {
  let request = req.body;

  let { status, message } = await Cvalidate(request, {
    type: "required|string",
    sub_type: "required|string",
    slug: "required|string",
    content: "required|string",
    extra: "string",
  });

  if (!status) {
    return res.send(reply.failed(message));
  }
  try {
    const p_data = await Page.create(request);
    return res.json(
      reply.success("Page Create Successfully!", { page_create: p_data })
    );
  } catch (err) {
    //  console.log(err,"errrrrrrrrrr>>>");
    return res.json(reply.failed("Unable to Create Page."));
  }
};

const statusUpdate = async (req, res) => {
  let request = req.query;

  let { id, status } = request;

  let validate = await Cvalidate(request, {
    id: "required|integer|exists:pages,id",
    status: "required|in:0,1",
  });

  if (!validate.status) {
    return res.send(reply.failed(validate.message));
  }

  try {
    await Page.update({ status: status }, { where: { id: id } });
    return res.json(reply.success("Page Status Update Successfully!"));
  } catch (err) {
    // console.log(err,"errr>>>>>>>>>>>");
    return res.json(reply.failed("Unable to Update at this moment"));
  }
};

const pageUpdate = async (req, res) => {
  let request = req.body;
  request.id = req.query?.id || "";

  let { status, message } = await Cvalidate(request, {
    id: "integer|exists:pages,id",
    type: "string",
    sub_type: "string",
    slug: "string",
    content: "string",
    extra: "string",
  });

  if (!status) {
    return res.send(reply.failed(message));
  }

  let request1 = _.omit(request, ["id"]);
  try {
    await Page.update(request1, { where: { id: request?.id } });
    return res.json(reply.success("Page Update Successfully!"));
  } catch (err) {
    console.log(err, "errrr>>>>>>>>>>>>>.");
    res.json(reply.failed("Unable to Update"));
  }
};

const pageDelete = async (req, res) => {
  let request = req.query;

  let { status, message } = await Cvalidate(request, {
    id: "required|integer|exists:pages,id",
  });

  if (!status) {
    return res.send(reply.failed(message));
  }

  try {
    await Page.destroy({
      where: {
        id: request?.id,
      },
    });
    return res.json(reply.success("Page Deleted Successfully!"));
  } catch (err) {
    console.log(err, "errr>>>>>>>>>>>");
    return res.json(reply.failed("Unable to delete"));
  }
};

const pagesGet = async (req, res) => {
    let request = req.query;
    let { type, sub_type, slug, sortbyname, sortby } = request;

    let filterData = {};
    filterData.where = {};
  
    // filter for type
    if (type) {
      filterData.where.type = {
        [Op.substring]: type,
      };
    }

    // filter for sub_type
    if (sub_type) {
      filterData.where.sub_type = {
        [Op.substring]: sub_type,
      };
    }
  
    // filter for slug
    if (slug) {
      filterData.where.slug = {
        [Op.substring]: slug,
      };
    }
  
    try {
    const paginate=  Helper.getPaginate(req,sortbyname,sortby)
    let finalquery= Object.assign(filterData,paginate)
    const get_data = await Page.findAll(finalquery);
    const count= await Page.count(finalquery)
 
     //pagination
     let final = reply.paginate(paginate.page,get_data,paginate.limit,count)
     return res.send(reply.success("Pages Fetched Successfull", final));
    } catch (err) {
      console.log(err, "errrr>>>>>>>>>>>>>");
      res.json(reply.failed("Unable to fetch"));
    }

  };
export default {
  pagesGet,
  pageCreate,
  statusUpdate,
  pageUpdate,
  pageDelete,
};
