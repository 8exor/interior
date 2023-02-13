import express from 'express';
import Authenticate from '../../Middleware/Authenticate.js';
import IncomeController from '../Controllers/IncomeController.js';
import StakingPlanController from '../Controllers/StakingPlanController.js';
import UserStakingController from '../Controllers/UserStakingController.js';

var router = express.Router();

// Define Routes Below
// router.get('/get', Authenticate , FavpairController.get);
router.get('/getcurrencies', StakingPlanController.getlist);
router.get('/get', StakingPlanController.get);
router.post('/create', StakingPlanController.create);
router.put('/activation', StakingPlanController.activate_status); 

// User Staking Routes
router.post('/subscribe' , Authenticate, UserStakingController.subscribe);
router.put('/unsubscribe' ,Authenticate, UserStakingController.unsubscribe);
router.get('/myplans' , Authenticate ,UserStakingController.get);
router.post('/portfolio-transfer' ,Authenticate, UserStakingController.transferToPortfolio);

router.get('/stake-wallet' , Authenticate, UserStakingController.getWallet);

router.get('/wallet-transactions', Authenticate, UserStakingController.getWalletLogs);

//Generate Incomes
router.get('/generate-incomes', IncomeController.generateIncomes);

router.get('/adminget_stakelist', UserStakingController.AdminUserStakelist);


export const StakingRoutes = router ;