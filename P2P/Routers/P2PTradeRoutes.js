import express from 'express'; 

const router  = express.Router(); 

import  P2PTradeController from '../Controllers/P2P_TradeController.js'; 
import  Authenticate from  '../../Middleware/Authenticate.js';

router.post('/create', Authenticate,P2PTradeController.create); 
router.post('/send_mail',Authenticate, P2PTradeController.sendMail); 
router.post('/confirmOrder',Authenticate, P2PTradeController.confirmOrder); 
router.get('/getorder',Authenticate, P2PTradeController.getOrderDetails); 
router.get('/test', P2PTradeController.testing); 





export const P2PTradeRoutes = router ;