import express from "express";
const app = express();

//Auth Routes
import {AuthRoutes} from "./AuthRoutes.js"
app.use(AuthRoutes)

//Dashboard Routes
import {DashboardRoutes} from "./DashboardRoutes.js"
app.use("/dashboard",DashboardRoutes)

// User Routes
import {UserRoutes} from "./UserRoutes.js"
app.use("/users",UserRoutes)

//Upi Routes
import{UserupiRoutes} from "./UserupiRoutes.js"
app.use("/userupi",UserupiRoutes)

//Admin upi routes
import {AdminupiRoutes} from "./AdminupiRoutes.js"
app.use("/adminupis",AdminupiRoutes)

//Bank Routes
import {BankRoutes} from "./BankRoutes.js"
app.use("/userbanks",BankRoutes)

//Admin Banks routes
import {AdminbankRoute} from "./AdminbankRoute.js"
app.use("/adminbanks",AdminbankRoute)

//Kyc Routes
import {KycRoutes} from "./KycRoutes.js"
app.use("/userkyc",KycRoutes)

//Report Routes
import {ReportRoutes} from "./ReportRoutes.js"
app.use("/usersReport",ReportRoutes)

//Ticket Routes
import {TicketRoutes} from "./TicketRoutes.js"
app.use("/ticket",TicketRoutes)

//Liquidity Routes
import { LiquidityRoutes } from "./LiquidityRoutes.js";
app.use("/liquidity",LiquidityRoutes)


//Banner Routes
import { BannerRoutes } from "./BannerRoute.js";
app.use("/banner",BannerRoutes)

//CurrencyRoutes
import { CurrencyRoutes } from "./CurrencyRoutes.js";
app.use("/currency",CurrencyRoutes)


//TemplateRoutes
import { TemplateRoutes } from "./TemplateRoutes.js";
app.use("/template",TemplateRoutes)

//InrRoutes
import { InrRoutes } from "./InrRoutes.js";
app.use("/Inr",InrRoutes)

import { WalletRoute } from "./WalletRoute.js";
app.use("/wallet",WalletRoute);

//List Coin Route
import { ListcoinRoutes } from "./ListcoinRoutes.js";
app.use("/list-coins",ListcoinRoutes);


//Crypto Route
import { CryptoRoutes } from "./CryptoRoutes.js";
app.use("/crypto",CryptoRoutes);

//Pages Routes
import { PagesRoutes } from "./PagesRoutes.js";
app.use("/pages",PagesRoutes);


//Order Routes
import { OrderRoutes } from "./OrderRoutes.js";
app.use("/orders",OrderRoutes);


export const AdminRoutes = app;
