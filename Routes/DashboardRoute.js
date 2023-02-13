import express from 'express';
import DashboardController from '../Controllers/DashboardController.js';

var router = express.Router();

// Define Routes Below
router.get('/market-chart', DashboardController.getMarketChart);
router.get('/market-gainers', DashboardController.getMarketGainers);
router.get('/all-symbols', DashboardController.getAllCryptoSymbols);

router.get('/slider-data', DashboardController.getSliderCurrencyData);
router.get('/get-dashboard-repot/:symbol?', DashboardController.getDashboardRepot);
export const DashboardRoutes = router;