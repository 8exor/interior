import dotenv from  'dotenv';
dotenv.config();
import express from "express";
// import https from 'https';
import http from "http";
import fs from "fs";
import { fileURLToPath } from 'url';
import path from 'path';
import { createLogger, transports, format } from 'winston';
const { combine, timestamp, prettyPrint, colorize, errors,  } = format;

const userLogger = createLogger();

import { Webserver } from "./WebsocketServer/socketServer.js";

// import compression from 'compression';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

// app.use(compression());

const PORT = 5055;

// LIVE PORT
// const PORT = 3000;

// Node Sheduler //Jcode
import myCache from './Node-cache/cache.js';
// import scheduler from "./Node-scheduler/scheduler.js";

// import WalletUpdater from './alksjdhfg/wallet_updater.js';
import WalletDbSaver from "./alksjdhfg/wallet_db_saver.js";
import Client_toAdmin from "./alksjdhfg/Client_toAdmin.js";
// Raman S
import Pointer from "./Common/Pointer.js";
//  ========================================================================//
//  ==========================    GLOBALS    ===============================//
//  ========================================================================//

import { GClass } from "./Globals/GClass.js";
global.GClass = GClass;

//  ========================================================================//
//  ==========================    IMPORTS    ===============================//
//  ========================================================================//

import fetch from "node-fetch";
import reply from "./Common/reply.js";
import cors from "./Config/cors.js";
import helmet from "helmet";

// ======================================================

app.use(helmet());
// Cors Setup
app.use(cors);



import process from "process";

process.on("uncaughtException", (err, origin) => {
  console.log("Err => ", err);
  console.log("origin => ", origin);
});

/*********************** For Local Logger ***********************/

process.on("uncaughtException", (err, origin) => {


  userLogger.add(new transports.File({
    filename: `Logger/${new Date().toJSON().slice(0,10)}-error.log`,
    // filename: `Logger/${Date.now()}-error.log`,
    // filename: `Logger/error.log`,
    level: 'error',
    format: combine(
      colorize(),
      timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      prettyPrint()
    ),

}));

  userLogger.log('error',{err: err.message , stack: err.stack , name: err.name});

  console.log("Err => ", err);
  console.log("origin => ", origin);
})

//  ========================================================================//
//  ==========================    ROUTES     ===============================//
//  ========================================================================//


//====== ADMIN login Route =========
// import {AuthRoutes} from "./Admin/Routes/AuthRoutes.js"
// app.use("/admin",AuthRoutes)

//Admin All routes
import {AdminRoutes} from "./Admin/Routes/AdminRoutes.js"
app.use("/admin",AdminRoutes)


// ====== List Cryptos Route =========

import { ListCyrptoRoutes } from "./Routes/ListCryptoRoute.js";
app.use("/list-crypto", ListCyrptoRoutes);

// ====== Orders Route =========

import { OrderRoutes } from "./Routes/OrderRoute.js";
app.use("/orders", OrderRoutes);

// ====== Fav Pair Route =========

import { FavpairRoutes } from "./Routes/FavpairRoute.js";
app.use("/favpair", FavpairRoutes);

// ====== User Crypto Route =========

import { UserCryptoRoutes } from "./Routes/UserCryptoRoute.js";
app.use("/user-crypto", UserCryptoRoutes);

// ====== User Route =========

import { UserRoutes } from "./Routes/UserRoute.js";
app.use("/user", UserRoutes);

// ====== User KYC Route =========

import { UserKycRoutes } from "./Routes/UserKycRoute.js";
app.use("/user-kyc", UserKycRoutes);


// ====== DASHBOARD Route =========

import { DashboardRoutes } from "./Routes/DashboardRoute.js";
app.use("/dashboard", DashboardRoutes);

// ======= BLOG CATEGORY ROUTE =======
import CategoryRoutes from "./Blog/Routes/CategoryRoute.js";
app.use('/category', CategoryRoutes);

// ======= BLOG ROUTE =======
import BlogRoutes from "./Blog/Routes/BlogRoute.js";
app.use('/blog', BlogRoutes);

// ======= LAUNCHPAD ROUTE =======
import TokenRoutes from './Launchpad/Routes/TokenRoutes.js';
app.use('/launchpad', TokenRoutes);

// ====== STAKING Route start =========
import { StakingRoutes } from "./Staking/Routes/StakingRoute.js";
app.use("/staking", StakingRoutes);

import { CurrencyPreferenceRoutes } from './Routes/CurrencyPreferenceRoute.js';
app.use("/preference", CurrencyPreferenceRoutes);

// import { TradeRoutes } from './Routes/TradeRoute.js';
// app.use('/trades' , TradeRoutes);

import worker from "./RunnerEngine/worker.js";
// worker.setOneMinuteInterval();
// worker.setOneSecondInterval();

import LIVE_PRICES from "./RunnerEngine/LivePrices.js";
import ORDER_MATCHING from "./RunnerEngine/OrderMatching.js";
import TRADE_ENGINE from "./RunnerEngine/TradeEngine.js";
import NOHLC from "./RunnerEngine/Nohlc.js";
import LiquidityEngine from "./RunnerEngine/LiquidityEngine.js";
import LedgerLogs from "./Common/LedgerLogs.js";

// console.log(get_1m_TimeStamp());
//  ========================================================================//
//  ==========================   ROUTES  END  ==============================//
//  ========================================================================//

app.get("/", (req, res) => {
  res.json({ status: "Working" });
});

app.get("/image/:type/:path", (req, res) => {
  res.sendFile(__dirname + '/assets/' + req.params.type + '/' + req.params.path);
});

app.get("/test", (req, res) => {
  res.send("hhehehe");
});

// Get Live Chart Data
app.get("/chart", async (req, res) => {

  const Symbol = req.query.symbol ?? "BTCUSDT";
  const Interval = req.query.interval ?? "1m";
  const startTime = req.query.start_time ?? "";
  const endTime = req.query.end_time ?? "";

  let key = Symbol + '-' + Interval ;

  var Url = GClass.getKlineApi(Symbol, Interval);
  if (startTime != "") {
    Url = Url + "&startTime=" + startTime;
  }
  if (endTime != "") {
    Url = Url + "&endTime=" + endTime;
  }

  if (endTime == "" && startTime == "") {
      let result = myCache.get(key);
      if(result != undefined)
      {
        return res.json(result);
      }
  }

  const response = await fetch(Url);
  const data = await response.json();

  if (endTime == "" && startTime == "") {
    myCache.set(key , data , 60);
  }

  return res.json(data);
});

app.get("/get-currency-price", async (req, res) => {
  
  if(myCache.has('get-currency-price')){
    let dd = myCache.get('get-currency-price');
    return res.json(dd);
  }

  try {
    let result = await fetch(GClass.all_currency_conversions).then((r) =>
    r.json().then((re) => re)
  );

  result = result?.data.find(
    (e) => e.pair == GClass.selected_fiat_currency_pair
  );
  myCache.set('get-currency-price' , { rate: result.rate } , 60);
  return res.json({ rate: result.rate });
  } catch (error) {
    return res.json({ rate: 82 });
  }
});

//  ========================================================================//
//  ==========================    ROUTES P2P    ===============================//
//  ========================================================================//

import fileUpload from 'express-fileupload';
import { socketIo } from "./P2P/socketIo/socketIo.js";
app.use(fileUpload());


app.get("/chatImages/:path", (req, res) => {
  res.sendFile(__dirname + '/P2P/socketIo/public/images/' + req.params.path);
});

import { P2P_All_Routes } from "./P2P/Routers/P2P_All_Routes.js"

app.use("/P2P", P2P_All_Routes); 


// News Board Integration //
import {NewsLetterRoute} from './newsBoard/Routes/NewsBoardRoute.js'
app.use("/news",NewsLetterRoute);









// Note: Make Sure this route is always in end
// 404 NOT FOUND
app.get("*", function (req, res) {
  res.status(404).json(reply.notfound());
});

// const httpsOptions = {
//     key: fs.readFileSync('./keys/ssl/cert.key'),
//     cert: fs.readFileSync('./keys/ssl/cert.pem')
// };

// var server = https.createServer(httpsOptions, app);
var server = http.createServer({}, app);

// INITIALIZING WEBSOCKET WEBSERVER
Webserver(server);

socketIo(server);

server.listen(PORT, () => {
  console.log(`App is listening at http://localhost:${PORT}`);
});
