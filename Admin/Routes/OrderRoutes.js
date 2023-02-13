import express from "express";
import OrderController from "../Controllers/OrderController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Define Routes Below
router.get("/crypto-list", Authenticate, OrderController.cryptoList)
router.get("/get", Authenticate, OrderController.getOrders)

export const OrderRoutes = router;