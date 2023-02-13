
import schedule from 'node-schedule';
import { UserStaking } from '../Models/UserStaking.js';
import pkg from 'sequelize';
import { StakingPlan } from '../Models/StakingPlan.js';
import fs from 'fs';
import createWalletLog from '../Helpers/CreateLogs.js';

const { Op } = pkg;

//////////////////////
// SCHEDULER  START //
//////////////////////

const rule = new schedule.RecurrenceRule();
// console.log(rule,"asss");

rule.hour = 0 ;
rule.minute = 5;
// rule.tz = 'Asia/Kolkata' ;

const Cron_Executed = () => {
        console.log('Generating Incomes');
        generateIncomes();
        activatePlan();
}

// Run After Every 10 Seconds
const job = schedule.scheduleJob(rule, Cron_Executed);

///////////////////////
//   SCHEDULER  END  //
///////////////////////





const generateIncomes = async (req, res) => {
        
        let today_date = new Date();

        var daily_roi_date = today_date.setDate(today_date.getDate() - 2);

        daily_roi_date = new Date(daily_roi_date).toISOString().slice(0, 10);

        //get data according to date
        let data = await UserStaking.findAll({
                where: {
                        next_roi_date: { [Op.substring]: daily_roi_date },
                        is_active: 1
                },
                include: [{ model: StakingPlan }]
        });

        

        data.forEach(async (el) => {
                

                let roi_date = new Date(daily_roi_date).getTime();
                let plan_expiry = new Date(el.expiry_date).getTime();

                if (roi_date <= plan_expiry) {

                        let next_roi_date = getNextRoi(el.next_roi_date , el.roi_interval);

                        let raw_data = {
                                user_id: el.user_id,
                                currency: el.reward_currency,
                                user_stake_id: el.id,
                                transaction_type: 'roi-income',
                                credit: el.roi_income,
                                comment: 'Roi Income From Staking Plan',
                                withdraw_credit: el.roi_income
                        }

                        // Create Wallet Logs In Database
                        await createWalletLog(raw_data);
                        
                        el.next_roi_date = next_roi_date;
                        await el.save();

                        let append_data = '\n'+ ' next-roi => '+ next_roi_date + ' => ' + JSON.stringify(raw_data);

                        updateLogsFile(append_data);
                }

        });
        if(res) {
                return res.json({ status: "Done" })
        }
}

async function activatePlan(){
        let today_date = new Date().getTime();
        
       try {
        let data = await StakingPlan.update({activate_status:1},{
                where: {
                        plan_start_date: { [Op.lte] :today_date},is_expired :0,activate_status:0,plan_expiry_date:{[Op.gte]:today_date}
                },
        });
        if (data) {
                console.log("plan activated successfully");
        }
       } catch (error) {
        console.log(error);
       }
        //get data according to date
        

}




const updateLogsFile = (data) => {

        let d = new Date().toISOString().slice(0, 10);

        fs.appendFile(`./Staking/Logs/${d}-logs.txt`, data, function (err) {
                if (err) throw err;
                console.log('Saved!');
        });
}



function getNextRoi(old_roi_date , roi_interval){
        let dd = new Date(old_roi_date);

        if(roi_interval == 'D'){
                dd.setDate(dd.getDate() + 1);
        }

        if(roi_interval == 'M'){
                dd.setMonth(dd.getMonth() + 1);
        }

        if(roi_interval == 'Y'){
                dd.setFullYear(dd.getFullYear() + 1);
        }
        
        return dd.getTime();
}

export default {
        generateIncomes
}

