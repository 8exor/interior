import { Category } from "../Models/Category.js";
import CValidator from "../../Validator/CustomValidation.js";
import reply from "../../Common/reply.js";
import Helper from "../../Common/Helper.js";

const create = async (req, res) => {
  var request = req.body;

  let { status, message } = await CValidator(request, { // 2. rule = ruled defined 
    name: "required|unique:categories,name"
  });

  if (!status) { return res.send(reply.failed(message)); }

  let created = await Category.create(request);

  return (created) ? res.send(reply.success("Category Created Successfully!!")) : res.send(reply.failed("Unable to create Category!!"));
}

const get = async (req, res) => {

  if (req.query?.id) {
    let data = await Category.findByPk(req.query.id);
    return (data == null) ? res.json(reply.failed("Category Not Found!!", data)) : res.json(reply.success("Category fetched Successfully!!", data));
  }

  try {
    // let pagination = Helper.getPaginate(req, 'created_at');
    // let total_count = await Category.count();
    var result = await Category.findAll(
      // pagination
      );
  
    // result = reply.paginate(
    //   pagination.page,
    //   result,
    //   pagination.limit,
    //   total_count
    // );
  
    return res.json(reply.success("Category fetched Successfully!!", result));
  } catch (error) {
    console.log(error)
  }

 
}

const update = async (req, res) => {

  var request = req.body;

  Object.assign(request, req.params);

  let { status, message } = await CValidator(request, { // 2. rule = ruled defined 
    id: "required|integer|exists:categories,id",
    name: "required|exists-except:categories,name,id," + req.params?.id
  });

  if (!status) { return res.send(reply.failed(message)); }

  let updated = await Category.update(request, { where: { id: request.id } });

  return (updated) ? res.json(reply.success("Category updated Successfully!!"))
    : res.json(reply.failed("Unable to Update Category!!"));
}

const Cdelete = async (req, res) => {

  var request = req.params;

  let { status, message } = await CValidator(request, { // 2. rule = ruled defined 
    id: "required|integer|exists:categories,id",
  });

  if (!status) { return res.send(reply.failed(message)); }

  let deleted = await Category.destroy({ where: { id: request.id } });

  return (deleted)
    ? res.json(reply.success("Category Deleted Successfully"))
    : res.json(reply.failed("Failed to Delete Category"));
}



export default {
  create,
  get,
  update,
  Cdelete
};
