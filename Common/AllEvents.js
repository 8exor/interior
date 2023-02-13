export const ALL_EVENTS = {
    order_place: "ORDER_PLACED",
    order_cancel: "ORDER_CANCELED",
    order_complete: "ORDER_COMPLETED",
    trade_done: "TRADE_EXECUTED",
}

export const Ledger_Log_Events = {
    freeze_balance: "FREEZE_BALANCE",
    cancel_freeze_balance: "CANCEL_FREEZE_BALANCE",
    un_freeze_balance: "UNFREEZE_BALANCE",
    add_credit: "ADD_CREDIT",
    add_debit: "ADD_DEBIT"
}

export const ORDER_STATUS = {
    placed: 'placed',
    completed: 'completed',
    partially: 'partially_completed',
    canceled: 'canceled'
}

export const TransactionType = {
    order: "order",
    deposit: "deposit",
    withdraw: "withdraw",
    commission: "commission",
    referral: "referral",
    user: "user",
    default: "default"
}

export const POINTER_EVENTS = {
    update_pointer: 'UPDATE_POINTER'
}
