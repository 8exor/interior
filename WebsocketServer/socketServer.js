import { WebSocket, WebSocketServer } from 'ws';
import myEvents from './../RunnerEngine/Emitter.js';

console.log('==========  WEBSERVER STARTED LISTENING TO WEBSOCKETS  =========');

export function Webserver(server) {
    //initialize the WebSocket server instance
    const wss = new WebSocketServer({ server });

    //===============================================================================//
    //=======================   WEBSOCKET_CLIENTS FUNCTIONS    ======================//
    //===============================================================================//

    var ALL_SOCKETS = {};

    var WEBSOCKET_CLIENTS = [];
    // [
    //     {
    //         "client_id" : client_id,
    //         "ticker" : [],
    //         "trade"  : [],
    //         "depth"  : [],
    //         "kline"  : [],
    //         "ws"     : {}
    //     }
    // ]

    var ORDER_CLIENTS = [];
    // [
    //     {
    //         "client_id" : client_id,
    //         "match_id"  : match_id
    //         "ws"    : {}
    //     }
    // ]


    const sendData = (type, symbol, data = null) => {

        type = type.toLowerCase();
        symbol = symbol.toLowerCase();

        let filtered = WEBSOCKET_CLIENTS.filter(client => client[type]?.find(sym => sym == symbol));

        if (filtered?.length != 0) {
            filtered.forEach(cli => cli.ws.send(JSON.stringify(data)));
        }
    }

    const sendOrderUpdate = (user_match_id, data = null) => {

        let filtered_2 = ORDER_CLIENTS.filter(client => client['match_id'] == user_match_id);

        if (filtered_2?.length != 0) {
            filtered_2.forEach(cli => cli.ws.send(JSON.stringify(data)));
        }
    }

    const updateOrderClient = ({ id, user_match_id, ws }) => {
        ORDER_CLIENTS.push({
            client_id: id,
            match_id: user_match_id,
            ws: ws
        });
        return 1;
    }

    const toLower = (str_or_arr) => {
        return Array.isArray(str_or_arr) ? str_or_arr.map(name => name.toLowerCase()) : str_or_arr.toLowerCase();
    }

    const updateOrAddClient = ({ is_add = true, id, ticker = [], trade = [], depth = [], kline = [], ws = null }) => {

        let is_exists = WEBSOCKET_CLIENTS.find(c => c.client_id == id);

        if (!is_exists && is_add) {
            WEBSOCKET_CLIENTS.push({
                client_id: id,
                ticker: toLower(ticker),
                trade: toLower(trade),
                depth: toLower(depth),
                kline: toLower(kline),
                ws: ws
            });

            return 1;
        }

        if (is_exists && is_add) {
            ticker.forEach(element => {
                is_exists['ticker'].includes(toLower(element)) ? '' : is_exists['ticker'].push(toLower(element));
            });

            trade.forEach(element => {
                is_exists['trade'].includes(toLower(element)) ? '' : is_exists['trade'].push(toLower(element));
            });

            depth.forEach(element => {
                is_exists['depth'].includes(toLower(element)) ? '' : is_exists['depth'].push(toLower(element));
            });

            kline.forEach(element => {
                is_exists['kline'].includes(toLower(element)) ? '' : is_exists['kline'].push(toLower(element));
            });

            return 2;
        }

        if (is_exists && !is_add) {
            let index;
            ticker.forEach(element => {
                index = is_exists['ticker'].findIndex(t => t == toLower(element));
                index != -1 ? is_exists['ticker'].splice(index, 1) : '';
            });

            trade.forEach(element => {
                index = is_exists['trade'].findIndex(tr => tr == toLower(element));
                index != -1 ? is_exists['trade'].splice(index, 1) : '';
            });

            depth.forEach(element => {
                index = is_exists['depth'].findIndex(t => t == toLower(element));
                index != -1 ? is_exists['depth'].splice(index, 1) : '';
            });

            kline.forEach(element => {
                index = is_exists['kline'].findIndex(t => t == toLower(element));
                index != -1 ? is_exists['kline'].splice(index, 1) : '';
            });

            return 3;
        }
        return 0;
        // find if client already there
        // filter if  ticker , trade , depth not already there
    }

    const removeClient = (id) => {
        let is_exist = WEBSOCKET_CLIENTS.findIndex(c => c.client_id == id);
        let is_exist_order = ORDER_CLIENTS.findIndex(c => c.client_id == id);
        if (is_exist != -1) {
            WEBSOCKET_CLIENTS.splice(is_exist, 1);
        }
        if (is_exist_order != -1) {
            ORDER_CLIENTS.splice(is_exist_order, 1);
        }
    }

    //===============================================================================//
    //======================   WEBSOCKET_CLIENTS FUNCTIONS END  =====================//
    //===============================================================================//

    const avl_param = ['ticker', 'trade', 'depth', 'kline'];


    const isEmpty = (data) => {
        for (var i in data) return false;
        return true;
    }


    wss.getUniqueID = function () {

        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return Date.now() + '-' + s4();
    };


    const wsMessage = (ws, status, msg, data = null) => {
        let err = {
            status_code: status.toString(),
            msg: msg
        };
        if (data != null) {
            Object.assign(err, data);
        }
        err = JSON.stringify(err);
        return ws.send(err);
    }


    wss.on('connection', (ws, req) => {

        // const ip = req.socket.remoteAddress;
        // console.log(ip);

        ws.id = wss.getUniqueID();


        ALL_SOCKETS[ws.id] = ws ;




        // ws.id =  Date.now();
        //connection is up, let's add a simple event
        ws.on('message', (message) => {

            let err = ""; // Define Error Varibale
            var input = message.toString();

            // CHECK JSON FORMAT
            try {
                input = JSON.parse(input);
            } catch (error) {

                return wsMessage(ws, 0, 'INVALID FORMAT');
            }

            if (isEmpty(input)) {
                return wsMessage(ws, 0, 'INVALID DATA');
            }

            // ===========  VALIDATE KEYS OF INPUTS ====================//

            if (!('method' in input) || (input['method'] != 'ADD' && input['method'] != 'SUB' && input['method'] != 'ORDER')) {
                return wsMessage(ws, 0, 'INVALID METHOD');
            }

            if (!('params' in input) || !Array.isArray(input['params']) || (Array.isArray(input['params']) && input['params']?.length == 0)) {
                return wsMessage(ws, 0, 'INVALID PARAMS');
            }

            // ===========  VALIDATE KEYS OF INPUTS END ====================//

            // ========   DIFFERENTIATE ACCORDING TO METHOD VALUE =================

            if (input['method'] != 'ORDER') {

                let n = input['params'].find(r => !r.includes('@'));

                if (n) {
                    return wsMessage(ws, 0, 'INVALID DATA IN PARAMS');
                }

                // console.time("myCode");
                let base_d =
                {
                    ticker: [],
                    trade: [],
                    depth: [],
                    kline: [],
                    ws: ws // Adding Websocket Client to Data
                };

                input['params'].forEach((e) => {
                    let [pair, action] = e.split('@');
                    let vl = avl_param.find(p => p == action);
                    if (vl) {
                        base_d[vl].push(pair);
                    }
                });

                // Add Client Id
                base_d['id'] = ws.id;

                base_d['is_add'] = (input['method'] == 'ADD') ? true : false;

                // UPDATE CLIENT
                let result = updateOrAddClient(base_d); // console.log(result);
            }
            else {
                updateOrderClient({
                    id: ws.id,
                    user_match_id: input['params'][0],
                    ws: ws
                });
            }


            // Log the received message and send it back to the client
            // console.log('received: %s', message);
            // return ws.send(message.toString());
            return wsMessage(ws, 1, 'Subscribed Successfully', { c_id: ws.id });
        });

        ws.on('close', () => {
            // console.log(ws.id);
            delete ALL_SOCKETS[ws.id];
            removeClient(ws.id);
            console.log('Connection closed By => ' + ws.id);
        })

        //send immediatly a feedback to the incoming connection    
        return wsMessage(ws, 1, 'Connected Successfully', { c_id: ws.id })
    });


    //===============================================================================//
    //=========================   MY EVENT HANDLER JS    ============================//
    //===============================================================================//


    myEvents.on('SEND_DATA' , sendData);
    myEvents.on('SEND_ORDER_UPDATE', sendOrderUpdate);
    myEvents.on('UNDER_MAINTENANCE' , (data) => {
        // console.log({data})
        for (let wid in ALL_SOCKETS) {
            ALL_SOCKETS[wid].send(JSON.stringify(data));
        }
    });

    return { wss, WEBSOCKET_CLIENTS, ORDER_CLIENTS, sendData, sendOrderUpdate }
}
