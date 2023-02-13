import express from 'express';

const router = express.Router();

import transferConroller from '../Controllers/P2P_cryptotransferController.js';
import Authenticate  from '../../Middleware/Authenticate.js'

router.post('/transfer', Authenticate, transferConroller.P2p_wallet_trans);
router.post('/credit', Authenticate, transferConroller.P2p_wallet_credit);
router.get('/transaction-list', transferConroller.wall_trans_list);

router.get('/balance', Authenticate, transferConroller.total_balance);
router.get('/order-list', transferConroller.order_list);




export const cryptoTransfer = router;