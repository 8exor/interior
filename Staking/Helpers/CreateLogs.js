import { Model } from "../../Database/sequelize.js";

async function createWalletLog({
    user_id,
    currency,
    user_stake_id = null,
    transaction_type = '',
    debit = 0,
    credit = 0,
    comment = '',
    withdraw_credit = 0,
    withdraw_debit = 0,
}){

    let withdawable = `COALESCE((SELECT * FROM (SELECT withdrawable FROM staking_wallet_logs where user_id = ${user_id} AND currency = '${currency}' ORDER BY id DESC LIMIT 1) AS old_withdawable),0) + ${withdraw_credit} - ${withdraw_debit}`;

    let query = `INSERT INTO staking_wallet_logs (id, user_id, user_stake_id, currency, transaction_type,previous_balance, debit, credit, balance, comment, withdrawable, created_at, updated_at) VALUES (NULL, '${user_id}', '${user_stake_id}', '${currency}', '${transaction_type}', COALESCE((SELECT * FROM (SELECT balance FROM staking_wallet_logs where user_id = ${user_id} AND currency = '${currency}' ORDER BY id DESC LIMIT 1) AS previous_balance),0), '${debit}', '${credit}', previous_balance + credit - debit, '${comment}', ${withdawable}, now(), now());`

    let [rows , fields] = await Model.query(query);
    return {rows , fields}
}


export default createWalletLog ;