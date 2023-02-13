import express from "express";
import UserController from "../Controllers/UserController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Define Routes Below
router.get("/get", Authenticate, UserController.get)
router.post("/create", Authenticate, UserController.create)
router.put("/update_status/:id/:status", Authenticate, UserController.update_status)




export const UserRoutes = router;