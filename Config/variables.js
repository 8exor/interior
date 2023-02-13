export default {
  // laravel_url: "http://demo.charlieexchange.io/backend/public/",
  // node_url: "http://node.charlieexchange.io/",
  laravel_url: "http://192.168.11.45:8000/",
  node_url: "http://192.168.11.45:5055/",

  // laravel_url: "https://bitqix.io/backend/public/",


  // ================================================= //
  //                TESTNET URLS                       // 
  // ================================================= //

  // TRON_API: "https://shastapi.tronscan.org/api/account/wallet?address=", 
  // ETH_RPC_URL: "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  // BSC_RPC_URL: "https://data-seed-prebsc-1-s1.binance.org:8545",
  // fullNode: "https://api.shasta.trongrid.io",
  // solidityNode: "https://api.shasta.trongrid.io",
  // eventServer: "https://api.shasta.trongrid.io",

  // ================================================= //
  //                MAINNET URLS                       // 
  // ================================================= //

  TRON_API: "https://api.tronscan.org/api/account/wallet?address=",
  ETH_RPC_URL: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  BSC_RPC_URL: "https://bsc-dataseed.binance.org/",
  fullNode: "https://api.trongrid.io",
  solidityNode: "https://api.trongrid.io",
  eventServer: "https://api.trongrid.io",

  allowed_pair_with: ["ETH", "BTC", "TRX", "SDT"], // USDT == SDT

  pairWith :'USDT,BTC,TRX,ETH' , // liquidity controller--create

  

  
  templateSendTypes : ['email', 'sms'],  //===========  Template Send Types

  templateTypes : ['welcome', 'login', 'register', 'forgot', 'order_placed', 'order_completed'], //=============    Template Types

  // currency : ["XRP", "ETH", "BNB", "SOL", "DOGE", "MATIC", "SHIB", "BTC", "DOT", "ADA"],

};
