import express from "express";
import Authenticate from "../../Middleware/Authenticate.js";
import DashboardController from "../Controllers/DashboardController.js";
import TotalDbController from "../Controllers/TotalDbController.js";



var router = express.Router();
// Define Routes Below
router.get("/total",Authenticate, TotalDbController.total)
router.get("/top10Coin/:duration",Authenticate, DashboardController.top10Coin)



export const DashboardRoutes = router;