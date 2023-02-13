import express from "express";
import LiquidityController from "../Controllers/LiquidityController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Define Routes Below
router.post("/create", Authenticate, LiquidityController.create)
router.get("/get/:symbol?", Authenticate, LiquidityController.get)

router.get("/symbol", Authenticate, LiquidityController.liquidity_currency)

router.put("/update", Authenticate, LiquidityController.update)
router.put("/reset", Authenticate, LiquidityController.reset)


export const LiquidityRoutes = router;