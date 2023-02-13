import express from "express";
import KycController from "../Controllers/KycController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Define Routes Below
router.get("/get",Authenticate, KycController.get)
router.put("/verify/:id",Authenticate, KycController.verify)



export const KycRoutes = router;