import express from 'express';
import UserCryptoController from '../Controllers/UserCryptoController.js';
import Authenticate from '../Middleware/Authenticate.js';

var router = express.Router();

// Define Routes Below
router.get('/get', Authenticate, UserCryptoController.getNew);

// router.get('/get-new', UserCryptoController.getNew);

router.get('/funds/get', Authenticate, UserCryptoController.getFunds);

router.post('/funds/credit', UserCryptoController.creditFunds);
router.post('/funds/freeze', UserCryptoController.freezeFunds);
router.post('/funds/unfreeze', UserCryptoController.unfreezeFunds);
router.post('/funds/cancel-unfreeze', UserCryptoController.cancelUnfreezeFunds);

export const UserCryptoRoutes = router;