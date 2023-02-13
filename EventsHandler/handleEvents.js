const generateListenKey =  async (client,callback , cb_listen_key) => {
    
    client
        .createListenKey()
        .then((response) => {
            let listen_key = response.data.listenKey;
            cb_listen_key(listen_key);
            checkOrderStatus(client,listen_key,callback);
            return listen_key;
        })
        .catch((error) => {
            console.log('Binanace Listner Key Error',error);
            setTimeout(generateListenKey(client,callback),1000);
        });
}

const checkOrderStatus = (client,listenKey,callback) => {
    console.log('Listening To Binance Events',listenKey,callback);
    client.userData(listenKey, { message: callback });
}

export default {
    generateListenKey
}