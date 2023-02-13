import express from "express";
import TicketController from "../Controllers/TicketController.js";
import Authenticate from "../../Middleware/AuthenticateAdmin.js";
import customFileUpload from "../../Upload/customFileUpload.js";

const UploadImageWithPath = (req, res, next) => {
    req.headers['mypath'] = "tickets";
    

    return customFileUpload(req, res, next);
}

var router = express.Router();


// Ticket Category Routes Below
router.get("/category_get", Authenticate, TicketController.category_get)
router.post("/category_create", Authenticate, TicketController.category_create)
router.put("/category_update/:id", Authenticate, TicketController.category_update)
router.delete("/category_delete/:id", Authenticate, TicketController.category_delete)

// Ticket Routes Below
router.get("/get", Authenticate, TicketController.get)
router.put("/update", Authenticate, TicketController.update)

router.post("/comment_create", UploadImageWithPath, Authenticate,TicketController.comment_create)
router.get("/comment_get/:ticket_id", Authenticate,TicketController.comment_get)


export const TicketRoutes = router;