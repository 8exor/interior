import express from "express";
import UserController from "../Controllers/UserController.js";
import Authenticate from "../Middleware/Authenticate.js";

var router = express.Router();

// Define Routes Below
router.get("/get", Authenticate, UserController.get);

//Get Authority
router.get("/get/authority", UserController.getAuthority);

// Get Refer Income
router.get("/get/referincome", Authenticate, UserController.getReferIncome);

//Set Authority
router.post("/set/authority", Authenticate, UserController.setAuthority);

export const UserRoutes = router;
