import express from "express";
import CryptoController from "../Controllers/CryptoController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Define Routes Below
router.get("/get_list/:id?",Authenticate, CryptoController.getList)
router.put("/update_status",Authenticate, CryptoController.updateStatus)
router.put("/update",Authenticate, CryptoController.update)

export const CryptoRoutes = router;