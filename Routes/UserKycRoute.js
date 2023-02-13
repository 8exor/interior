import express from 'express';
import UserKycController from '../Controllers/UserKycController.js';
import Authenticate from '../Middleware/Authenticate.js';

var router = express.Router();

// Define Routes Below
router.get('/get', Authenticate, UserKycController.get);
// router.get('/get', UserController.get);

export const UserKycRoutes = router ;