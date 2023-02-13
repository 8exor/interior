import express from "express";
import UpiController from "../Controllers/UpiController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Define Routes Below
router.get("/get",Authenticate, UpiController.adminupi_get)
router.post("/create",Authenticate, UpiController.adminupi_create)
router.put("/update/:id",Authenticate, UpiController.adminupi_update)
router.put("/status_update/:id/:status",Authenticate, UpiController.adminupi_status_update)
router.get("/test",Authenticate, UpiController.test)


export const AdminupiRoutes = router;