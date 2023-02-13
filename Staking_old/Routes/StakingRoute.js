import express from 'express';
import Authenticate from '../../Middleware/Authenticate.js';
import AuthenticateAdmin from '../../Middleware/AuthenticateAdmin.js';
import IncomeController from '../Controllers/IncomeController.js';
import StakingPlanController from '../Controllers/StakingPlanController.js';
import UserStakingController from '../Controllers/UserStakingController.js';


var router = express.Router();

// Define Routes Below
// router.get('/get', Authenticate , FavpairController.get);
router.get('/get', StakingPlanController.get);
router.post('/create', StakingPlanController.create);
router.put('/activation', StakingPlanController.activate_status); 

// User Staking Routes
router.post('/subscribe' , Authenticate, UserStakingController.subscribe);
router.put('/unsubscribe' ,Authenticate, UserStakingController.unsubscribe);
router.get('/myplans' , Authenticate ,UserStakingController.get);
router.post('/portfolio-transfer' ,Authenticate, UserStakingController.transferToPortfolio);
router.post('/portfolio-transfer-by-admin/:withdraw_id' ,Authenticate, UserStakingController.transferToPortfolioByAdmin);

// =============== ADMIN ROUTES ========================
router.get('/get-withdraw-request-admin' ,AuthenticateAdmin, UserStakingController.getWithdrawRequestByAdmin);
router.get('/get-withdraw-request' ,AuthenticateAdmin, UserStakingController.getWithdrawRequest);



router.get('/get-total-staking' ,Authenticate, UserStakingController.getTotalStaking);

router.get('/stake-wallet' , Authenticate, UserStakingController.getWallet);

router.get('/wallet-transactions', Authenticate, UserStakingController.getWalletLogs);
router.get('/getuser_stakelist', Authenticate, UserStakingController.getUserStakelist);
router.get('/adminget_stakelist', UserStakingController.AdminUserStakelist);

//Generate Incomes
router.get('/generate-incomes', IncomeController.generateIncomes);



export const StakingRoutes = router ;