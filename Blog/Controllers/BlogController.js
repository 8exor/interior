import Helper from "../../Common/Helper.js";
import reply from "../../Common/reply.js";
import { Blog } from "../Models/Blog.js";
import { Category } from "../Models/Category.js";
import CValidator from "../../Validator/CustomValidation.js";


const imageupload = (req, res) => {

  if (!req.filedata || req?.filedata?.status_code == 0) {
    return res.send(reply.failed(req?.filedata?.message));
  }

  return res.send(reply.success("Image Uploaded Successfully", req?.filedata?.message));
}

const create = async (req, res) => {
  let request = req.body;

  let { status, message } = await CValidator(request, {
    name: "required|max:255|unique:blogs,name",
    publish_at: "required|date",
    description: "required",
    category_id: "required|integer|exists:categories,id",
    image: "required|max:255"
  });

  if (!status) { return res.send(reply.failed(message)); }

  let created = await Blog.create(request);

  return (created) ? res.send(reply.success("Category Created Successfully!!")) : res.send(reply.failed("Unable to create Category!!"));
}

const get = async (req, res) => {

  console.log('here')
  try {
    var condition = { include: { model: Category } };

  if (req.query?.id) {
    let data = await Blog.findByPk(req.query.id, condition);
    return (data == null) ? res.json(reply.failed("Blog Not Found!!", data)) : res.json(reply.success("Blog fetched Successfully!!", data));
  }

  let pagination = Helper.getPaginate(req, 'created_at');

  if (req.query?.cid) {
    condition.where = { category_id: req.query?.cid };
  }

  let total_count = await Blog.count(condition);
  condition = Object.assign(condition, pagination);
  var result = await Blog.findAll(condition);

  result = reply.paginate(
    pagination.page,
    result,
    pagination.limit,
    total_count
  );

  return res.json(reply.success("Category fetched Successfully!!", result));
  } catch (error) {
    console.log(error)
    return res.json(reply.failed("Unable to fetch at this moment"));
  }

  
}

const Cdelete = async (req, res) => {

  var request = req.params;

  let { status, message } = await CValidator(request, { // 2. rule = ruled defined 
    id: "required|integer|exists:blogs,id",
  });

  if (!status) { return res.send(reply.failed(message)); }

  let deleted = await Blog.destroy({ where: { id: request.id } });

  return (deleted)
    ? res.json(reply.success("Blog Deleted Successfully"))
    : res.json(reply.failed("Failed to Delete Category"));
}

const update = async (req, res) => {

  var request = req.body;

  Object.assign(request, req.params);

  let { status, message } = await CValidator(request, { // 2. rule = ruled defined 
    id: "required|integer|exists:blogs,id",
    name: "required|exists-except:blogs,name,id," + req.params?.id,
    publish_at: "date",
    category_id: "integer|exists:categories,id",
    image: "max:255"
  });

  if (!status) { return res.send(reply.failed(message)); }

  let updated = await Blog.update(request, { where: { id: request.id } });

  return (updated) ? res.json(reply.success("Blog updated Successfully!!"))
    : res.json(reply.failed("Unable to Update Category!!"));
}


export default {
  imageupload,
  create,
  get,
  Cdelete,
  update
};
