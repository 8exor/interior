import express from "express";
import TemplateController from "../Controllers/TemplateController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();


// Template Routes Below
router.get("/types", Authenticate, TemplateController.category_get)
router.post("/create", Authenticate, TemplateController.createTemplate)
router.get("/get", Authenticate, TemplateController.getTemplate)
router.put("/update", Authenticate, TemplateController.updateTemplate)
router.delete("/delete", Authenticate, TemplateController.delTemplate)


export const TemplateRoutes = router;