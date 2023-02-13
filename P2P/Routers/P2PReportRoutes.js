import express from 'express';

const router = express.Router();

import P2PReportController from '../Controllers/P2P_ReportController.js';

import Authenticate  from '../../Middleware/Authenticate.js'


router.get('/getorderlist', Authenticate, P2PReportController.getP2p_Report);

export const P2PReportRoutes = router;