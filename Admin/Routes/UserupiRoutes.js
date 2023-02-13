import express from "express";
import UpiController from "../Controllers/UpiController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Define Routes Below
router.get("/get",Authenticate, UpiController.get)
router.put("/verify/:id",Authenticate, UpiController.verify)



export const UserupiRoutes = router;