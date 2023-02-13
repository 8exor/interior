import express from "express";
import TokenController from "../Controllers/TokenController.js";
import customFileUpload from "../../Upload/customFileUpload.js";
import Authenticate from '../../Middleware/Authenticate.js';
import AuthenticateAdmin from '../../Middleware/Authenticate.js';

const UploadImageWithPath = (req, res, next) => {
  req.headers['mypath'] = "launchpad";
  return customFileUpload(req, res, next);
}

const router = express.Router();

router.post("/token_create", TokenController.tokenCreate);
router.post("/create_rounds", TokenController.roundCreate);
router.post("/order_place", Authenticate, TokenController.orderPlace);
// router.get("/fetch_orders", Authenticate, TokenController.orderPlacedDetails);
router.get("/get_tokens", TokenController.AllTokenDetails);
router.get("/get_orders/:t_id", TokenController.GetAllOrders);
router.get("/symbol_get", TokenController.getsymbol);
router.get("/admin/token_get", Authenticate, TokenController.admin_token_fetch);
router.get("/user/token_get", TokenController.UsertokenFetch);
router.put("/update_status/:id/:active_status", TokenController.update_status);

router.get("/order_find", Authenticate, TokenController.orderfind);

router.get("/getone/:id", TokenController.orderFetchone);
router.delete("/del_token/:id", TokenController.deleteToken);
router.put("/update_token/:id", TokenController.updateToken);
router.post("/imageupload", UploadImageWithPath, TokenController.imageupload);

router.post("/transfer-token-by-admin/:order_id", AuthenticateAdmin, TokenController.transferTokenByAdmin);


const TokenRoutes = router;
export default TokenRoutes;