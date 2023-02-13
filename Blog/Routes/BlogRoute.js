import express from "express";
import customFileUpload from "../../Upload/customFileUpload.js";
import BlogController from "../Controllers/BlogController.js";

const UploadImageWithPath = (req, res, next) => {
    req.headers['mypath'] = "blog";
    return customFileUpload(req, res, next);
}

var router = express.Router();

router.post("/create", BlogController.create);
router.post("/imageupload", UploadImageWithPath, BlogController.imageupload);
router.get("/get", BlogController.get);
router.put("/update/:id", BlogController.update);
router.delete("/delete/:id", BlogController.Cdelete);

const BlogRoutes = router;
export default BlogRoutes