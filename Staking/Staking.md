## Copy and paste the staking folder in the node file of your project 
## Now follow these steps :-


1) Place the staking main folder in your project.
2) First of all check for the "UserWalletLedger" model in your project If not present then copy the  "UserWalletLedger.js" ( present  in staking main folder )in models in root models directory.
3) Run this command :-   "npm i node-schedule"  <!-- for node schedule  installation  -->
4) copy and paste the following snippet in your main server file:-
 
 <!--  Staking routes start here  -->
  // ====== STAKING Route start =========
import { StakingRoutes } from "./Staking/Routes/StakingRoute.js";
app.use("/staking", StakingRoutes);
 <!--  Staking routes ends here  -->


5) Now serve the project and check for the new tables in your database.


