import express from "express";
import BankController from "../Controllers/BankController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Define Routes Below
router.get("/get",Authenticate, BankController.adminbank_get)
router.post("/create",Authenticate, BankController.adminbank_create)
router.put("/update/:id",Authenticate, BankController.adminbank_update)
router.put("/account_status/:id/:status",Authenticate, BankController.adminbank_status_update)


export const AdminbankRoute = router;