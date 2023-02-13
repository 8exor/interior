import express from 'express';
import FavpairController from '../Controllers/FavpairController.js';
import Authenticate from '../Middleware/Authenticate.js';

var router = express.Router();

// Define Routes Below
router.get('/get', Authenticate , FavpairController.get);

export const FavpairRoutes = router ;