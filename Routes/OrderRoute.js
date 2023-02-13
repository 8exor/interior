import express from 'express';
import OrderController from '../Controllers/OrderController.js';
import Authenticate from '../Middleware/Authenticate.js';
import rateLimit from 'express-rate-limit'

var router = express.Router();

const createAccountLimiter = rateLimit({
	windowMs: 5000, //  5 SEC
	max: 1, // Limit each IP to 1 create account requests per `window` (here, 5 SEC)
	message:
		{
			message:'WAIT !!!!! 🖐🖐🖐', status_code:0, status:"failed"
		},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers 
});

// Define Routes Below
router.get('/get', Authenticate, OrderController.get);
// router.get('/get', OrderController.get);

//Get order data by id
router.get('/getOrderDetail', Authenticate, OrderController.getOrderData);


router.get('/getohlc', OrderController.getOHLC);

router.get('/order-book', OrderController.getOldOrderBook);
router.get('/trade-book', OrderController.getTrades);

router.post('/place-order',Authenticate, createAccountLimiter, OrderController.place_Order);

// router.get('/generate_key', OrderController.generate_key);

router.post('/set-initial-price' , OrderController.set_initial_price);

router.post('/admin_order_info' , Authenticate ,OrderController.admin_order_info);


router.post('/bulk_order' , Authenticate ,OrderController.bulk_orders);
 
router.post('/cancel-order/:order_id', Authenticate, createAccountLimiter, OrderController.cancelOrder);





export const OrderRoutes = router ;