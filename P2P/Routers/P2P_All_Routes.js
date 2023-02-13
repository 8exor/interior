import express from "express";
const app = express();

//P2P routes
import { P2PRoutes } from './P2Proutes.js';
app.use('/P2POrder', P2PRoutes);


//chat routes
import { ChatRoute } from './ChatRoutes.js';
app.use('/chat', ChatRoute);

//wallet routes
import { p2pWalletRoutes } from './p2pWalletRoutes.js';
app.use('/wallet', p2pWalletRoutes);


//p2p to exchange wallet transfer
import { cryptoTransfer } from './cryptoTransferRoute.js';
app.use('/cryptotransfer', cryptoTransfer);

//P2PTrade routes
import { P2PTradeRoutes } from './P2PTradeRoutes.js';
app.use('/trade', P2PTradeRoutes);


//P2P REPORT ROUTES/////
import { P2PReportRoutes } from './P2PReportRoutes.js';
app.use('/admin', P2PReportRoutes)

export const P2P_All_Routes = app;