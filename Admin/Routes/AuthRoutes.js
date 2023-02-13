import express from "express";
import Authenticate from "../../Middleware/Authenticate.js";
import AuthController from "../Controllers/AuthController.js";

var router = express.Router();

// Define Routes Below
router.post("/login", AuthController.login);
router.post("/change_password", Authenticate, AuthController.changePassword);
router.delete("/logout", Authenticate, AuthController.adminLogout);

export const AuthRoutes = router;
