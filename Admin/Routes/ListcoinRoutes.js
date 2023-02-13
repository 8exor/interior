import express from "express";
import ListController from "../Controllers/ListController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";
import customFileUpload from "../../Upload/customFileUpload.js";

var router = express.Router();

const UploadImageWithPath = (req, res, next) => {
    req.headers['mypath'] = "listCoin";
    return customFileUpload(req, res, next);
  }

// Define Routes Below
router.post("/create", UploadImageWithPath,Authenticate, ListController.create)
router.put("/update", Authenticate, ListController.update)

router.get("/block-network", Authenticate, ListController.blockNetwork)
router.get("/getPair/:id?", Authenticate, ListController.pairGet)
router.put("/update_status", Authenticate, ListController.updateStatus)



export const ListcoinRoutes = router;