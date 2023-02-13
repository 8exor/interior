import express from "express";
import InrController from "../Controllers/InrController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Deposit Routes Below
router.get("/deposit_get",Authenticate, InrController.depositGet)
router.put("/deposit_update",Authenticate, InrController.depositUpdate)

// Withdrawal Routes Below
router.get("/withdrawal_get",Authenticate, InrController.withdrawalGet)
router.put("/withdrawal_update",Authenticate, InrController.withdrawalUpdate)


export const InrRoutes = router;