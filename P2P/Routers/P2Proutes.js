import express from 'express';

const router = express.Router();

import P2PController from '../Controllers/P2P_Controller.js';
import Authenticate from '../../Middleware/Authenticate.js';

router.get('/allorderlist',Authenticate,P2PController.getAllOrderList);
router.get('/orderlist',P2PController.getOrderList);
router.post('/create',Authenticate, P2PController.create); 
router.post('/cancelorder',Authenticate,P2PController.cancelOrder); 
router.get('/paymenttype', Authenticate, P2PController.PaymentType); 
router.get('/P2PWallet', Authenticate, P2PController.userP2PWallet); 


export const P2PRoutes = router;