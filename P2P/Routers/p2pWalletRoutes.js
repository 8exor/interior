const router = express.Router();

import express from 'express';
// import p2pWalletController from '../controllers/P2pWalletContoller.js';
import P2PController from '../Controllers/P2P_Controller.js';

import Authenticate  from '../../Middleware/Authenticate.js';

router.post('/create', Authenticate, P2PController.create);

export const p2pWalletRoutes = router;