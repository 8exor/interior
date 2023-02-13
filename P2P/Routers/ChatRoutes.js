const router = express.Router();

import express from 'express';
import ChatController from '../Controllers/P2P_ChatController.js';
import  Authenticate  from '../../Middleware/Authenticate.js'

// router.post('/create', Authenticate, ChatController.create);
router.get('/list', Authenticate, ChatController.list);
router.get('/chat-history', ChatController.get_chat);

export const ChatRoute = router;