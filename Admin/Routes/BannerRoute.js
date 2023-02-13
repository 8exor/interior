import express from "express";
import BannerController from "../Controllers/BannerController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";
import customFileUpload from "../../Upload/customFileUpload.js";

var router = express.Router();

const UploadImageWithPath = (req, res, next) => {
    req.headers['mypath'] = "banner";
    return customFileUpload(req, res, next);
  }

// Define Routes Below
router.post("/create",UploadImageWithPath, Authenticate, BannerController.create)
router.get("/get",UploadImageWithPath, Authenticate, BannerController.get)
router.put("/update",UploadImageWithPath, Authenticate, BannerController.update)

export const BannerRoutes = router;