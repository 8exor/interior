import express from "express";
import PageController from "../Controllers/PageController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";

var router = express.Router();

// Define Routes Below
router.post("/create", Authenticate, PageController.pageCreate)
router.get("/get", Authenticate, PageController.pagesGet)
router.put("/status_update", Authenticate, PageController.statusUpdate)
router.put("/update", Authenticate, PageController.pageUpdate)
router.delete("/delete", Authenticate, PageController.pageDelete)

export const PagesRoutes = router;