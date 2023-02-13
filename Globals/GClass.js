
const BaseApiUrl = 'https://api.binance.com/api/v3/'; // Add Slash at End Is Important

const Datalake = 'https://datalake.network3.info/'; // Add Slash at End Is Important


export const GClass =  {

    // Default Currency Setup
    default_selected_currency: 'USDT',

    // Fiat Currency Variables
    is_fiat_currency_available: true ,
    selected_fiat_currency: 'INR',
    selected_fiat_currency_pair: 'INR_USD',

    // Const Varibales
    mathConfig: { returnString: true, eMinus: Infinity, ePlus: Infinity  },
    
    
    ////////////////////////////////////////////////////////////////////////////////////
    //                                  API'S URL                                     //
    //////////////////////////////////////////////////////////////////////////////////// 

    all_currency_conversions: 'https://www.binance.com/bapi/asset/v1/public/asset-service/product/currency',

    getDepthApi: (symbol,limit = 10) => `${BaseApiUrl}depth?symbol=${symbol}&limit=${limit}` ,

    getTradeApi: (symbol,limit = 10) => `${BaseApiUrl}trades?symbol=${symbol}&limit=${limit}` ,

    getKlineApi: (symbol, interval = '1m', limit = 1000 ) => `${BaseApiUrl}klines?limit=${limit}&interval=${interval}&symbol=${symbol}`,
    
    get24hrApi: `${BaseApiUrl}ticker/24hr` ,

    getAllSymbolPrice: `${BaseApiUrl}ticker/price`,

    getSingleSymbolPrice: (symbol) => `${BaseApiUrl}ticker/price?symbol=${symbol}`,

    DgetSingleSymbolPrice: (symbol) => `${Datalake}current-price/${symbol}`,


}

