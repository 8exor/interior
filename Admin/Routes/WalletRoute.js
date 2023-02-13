import express from "express";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";
import WalletController from "../Controllers/WalletController.js";

var router = express.Router();

router.get("/get", Authenticate, WalletController.get);

export const WalletRoute = router;