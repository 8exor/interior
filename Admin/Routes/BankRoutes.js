import express from "express";
import BankController from "../Controllers/BankController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Define Routes Below
router.get("/get",Authenticate, BankController.get)
router.put("/verify/:id",Authenticate, BankController.verify)



export const BankRoutes = router;