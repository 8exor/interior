import express from "express";
import CurrencyController from "../Controllers/CurrencyController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Define Routes Below
router.get("/w_2_w_get",Authenticate, CurrencyController.getAllCurrencies)
router.put("/update_status",Authenticate, CurrencyController.update_status)
router.put("/w_2_w_update",Authenticate, CurrencyController.updateCurrencyData)




export const CurrencyRoutes = router;