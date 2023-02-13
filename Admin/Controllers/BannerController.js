import Helper from "../../Common/Helper.js"
import reply from "../../Common/reply.js"
import { Banner } from "../Models/Banner.js"
import CValidator from "../../Validator/CustomValidation.js";
import sharp from "sharp"
import fs from 'fs';


const create = async (req,res) => {
    let request = req.body;
    request.image = req?.file?.filename || "";

    // console.log('fffffff', req.file)
    if(req.file != undefined || req.file == ''){
        let f_data = await sharp(req.file?.path).metadata();
        if(f_data.width > 350 || f_data.height >250){
            fs.unlink(req.file.path, function (err) {
                if (err) throw err;
                // console.log('File deleted!');
            });
            return res.send(reply.failed("Image Dimensions should be 350x250 "))
        }
    }

    if(req.filedata.status_code == 0){
        return res.send(req.filedata)
    }

    //custom validation
    let { status , message} = await CValidator(request, {
        image:"string",
        url:"url"
    });

    if (!status) { return res.send(reply.failed(message)); }
    
    try {
        const banner_data = await Banner.create(request);
        return res.json(reply.success("Banner Created Successfully."))
      } catch (err) {
        return res.json(reply.failed("unable to fetch banner data"));
      }
}

const get = async (req,res) => {
    try {
        let data = await Banner.findAll();
        return res.json(reply.success("banner data fetched successfully", data));
  
      } catch (err) {
        console.log(err);
        return res.json(reply.failed("unable to fetch banner data"));
      }
}

const update = async (req,res) => {
    let request = req.body;

    let { status, message } = await CValidator(request, {
      id: 'required|integer|exists:banners,id',
      status: 'required|in:0,1',

    });

    if (!status) {
      return res.send(reply.failed(message));
    }

    try {
    await Banner.update(request, {
        where: {
            id: request?.id
        }
        });
        return res.json(reply.success('Banner Updated Successfully.'));

    } catch (err) {
        console.log(err)
        return res.json(reply.failed('Unable to update at this moment.'));
    }

   
}

export default{
    create,
    get,
    update
}