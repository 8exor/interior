import express from "express";
import ReportController from "../Controllers/ReportController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Define Routes Below
router.get("/deposit_wallet_transactions_get", Authenticate, ReportController.deposit_wallet_transactions_get)
router.get("/wallet_transactions_get", Authenticate, ReportController.wallet_transactions_get)

router.get("/trading_fee_report_get", Authenticate, ReportController.trading_fee_report_get)
router.get("/client_report_get", Authenticate, ReportController.client_report_get)




export const ReportRoutes = router;