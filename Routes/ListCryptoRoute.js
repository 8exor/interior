import express from 'express';
import ListCryptoController from '../Controllers/ListCryptoController.js';

var router = express.Router();

// Define Routes Below
router.get('/get', ListCryptoController.get);

router.get('/top10coin', ListCryptoController.top10coin);

router.get('/market-data/:symbol', ListCryptoController.getMarketData);

router.get('/trade-history/:symbol', ListCryptoController.getTradeHistory);

export const ListCyrptoRoutes = router ;