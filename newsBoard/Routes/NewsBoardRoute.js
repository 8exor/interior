import express from "express";
import NewBoardController from "../Controllers/NewBoardController.js";
import Authenticate from '../../Middleware/Authenticate.js';
import AuthenticateAdmin from "../../Middleware/AuthenticateAdmin.js"

var router = express.Router();

router.post("/admin/create",AuthenticateAdmin, NewBoardController.create);
router.get('/get', NewBoardController.get);
router.get('/getNews',Authenticate, NewBoardController.getNews);
router.get('/like',Authenticate, NewBoardController.like);
router.get('/disLike',Authenticate, NewBoardController.disLike);
router.get('/getbyId', NewBoardController.getbyId);




export const NewsLetterRoute = router;