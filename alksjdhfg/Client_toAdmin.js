import _ from 'lodash';
import Web3 from "web3";
import myEvents from "../RunnerEngine/Emitter.js";
import WalletUpdater from "./wallet_updater.js"; 
import crypto from 'crypto';
import { GasLog } from '../Models/GasLog.js';
import { ExtraGasBalanceLog } from '../Models/ExtraGasBalanceLog.js';
import { DepositCryptoLogs } from '../Models/DepositCryptoLogs.js'; 

// import myEvents from "./Emitter.js";
import { Ledger_Log_Events, TransactionType } from "../Common/AllEvents.js";

const Admin_Wallets =  async () => { return await  WalletUpdater.getUserWallets(1);}

import variables from "../Config/variables.js"; 

const TRON_GAS = 0.268;
const ETH_GAS = 21000;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitForTransaction = async (tronweb  , trx_id ,response = null) => {

  response =  await tronweb.trx.getTransactionInfo(trx_id);
  console.log(response,"hihihihi");

  if(response == null || _.isEmpty(response) )
  {  
      await sleep(2000); //  wait for 2 seconds
      return await waitForTransaction(tronweb ,trx_id , response);
  }

  return response;
}

import TronWeb from 'tronweb';
import { SentTransferTransaction } from "../Models/SentTransferTransaction.js";
import { UserCrypto } from "../Models/UserCrypto.js";
import { ListCoin } from "../Models/ListCoin.js";
import { CL } from 'cal-time-stamper';
 
const ETH_RPC_URL =  variables.ETH_RPC_URL;
 
const BSC_RPC_URL =  variables.BSC_RPC_URL; 

const fullNode =  variables.fullNode;
const solidityNode = variables.solidityNode;
const eventServer = variables.eventServer;

const getId = () => crypto.randomBytes(10).toString('hex');

let minABI = [
    {
      "constant": false,
      "inputs": [
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "type": "function"
    },
    {
      "constant":true,
      "inputs":[],
      "name":"decimals",
      "outputs":[{"name":"","type":"uint8"}],
      "type":"function"
    },
    {
      "constant":true,
      "inputs":[],
      "name":"symbol",
      "outputs":[{"name":"","type":"string"}],
      "type":"function"
    },
  ];

  // const admin_Binance_wallet = {
  //   "TRON" : "cfvgbhnj",
  //   "ETH": "fvgbhj",
  //   "BTC" : "hnjmkl"
  // }

const transfer_to_admin = async (transfer_tokens , user_private_key , chain_type) => {

    let  admin_wallets = await  Admin_Wallets(); 
    if( chain_type == WalletUpdater.TOKEN_NETWORK.bsc || chain_type == WalletUpdater.TOKEN_NETWORK.eth ){
        const RPC_URL = chain_type == WalletUpdater.TOKEN_NETWORK.eth ? ETH_RPC_URL : BSC_RPC_URL;
      
        let web3 = new Web3(RPC_URL);
        var all_token_response = transfer_tokens.map( async (token , index)=> { 


          const contract_address = token.token_address;
          var listedCoin = await ListCoin.findOne({
            where :{
              "address" : contract_address
            }
          });
      
        //  const to_address = listedCoin ? admin_wallets.ETH : admin_Binance_wallet.TRON
        
         const to_address =  admin_wallets.ETH  ;

           let  stt_id =  getId() ;
            try {
              let token_address =  token.token_address ;
              let transactionData  = {

                amount : token.amount ,
                user_id: token.user_id ,
                from_address : token.user_wallet_address ,
                to_address : to_address,
                chain_type ,
                token_type : chain_type == WalletUpdater.TOKEN_NETWORK.eth ? "ERC20" : "BEP20" ,
                stt_id ,
                token_address,
                response : '' ,
                status : 'pending'
              };

              let sendTransactionRecord = await  SentTransferTransaction.create(transactionData);

              
                let contract = new web3.eth.Contract(minABI, token_address);
               let decimals = await contract.methods.decimals().call();
               let symbol = await contract.methods.symbol().call();
                decimals = 10**decimals ;
                let fromAddress = (token.user_wallet_address).toString(); 

               const token_amount = CL.mul(token.amount, decimals ); 
                const tx = contract.methods.transfer(to_address, token_amount.toString());
                const gas = await tx.estimateGas({from:fromAddress});
             
                const data = tx.encodeABI(); 
                let nonce = await web3.eth.getTransactionCount(fromAddress , 'pending'); 
                
                const signedTx = await web3.eth.accounts.signTransaction( 
                  {
                    to: contract.options.address,
                    data,
                    gas: parseFloat(gas) ,
                    // gas: parseFloat(gas) + ETH_GAS,
                    value: '0x0',
                    nonce: nonce + index
                  },
                  user_private_key
                );
          
                const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

                sendTransactionRecord.status = "completed";
                sendTransactionRecord.response = JSON.stringify(receipt) ;
                sendTransactionRecord.save();

                await updateUserCrypto({symbol , user_id: token.user_id , amount: token.amount , chain_type , token_address})
                return  receipt;
          
              } catch (error) {  

                var existingTransactionRecord = await SentTransferTransaction.findOne({
                  where:{ stt_id  }
               }); 
               if(existingTransactionRecord){
                  existingTransactionRecord.status = "failed";
                  existingTransactionRecord.response = JSON.stringify(error);
                  existingTransactionRecord.save();
               }
                return  (error );
              } 

    });

    let result  = await Promise.all(all_token_response);
    console.log(result , "Final result ERC BEP");
   
    let transferCoinData = await transfer_extra_eth({web3 , fromAddress:transfer_tokens[0].user_wallet_address , user_id : transfer_tokens[0].user_id , toAddress :admin_wallets.ETH , user_private_key , chain_type ,network_symbol:null});
    console.log({transferCoinData});
     
    }

    if( chain_type == WalletUpdater.TOKEN_NETWORK.trx){

    //  console.log("inside trxxxx"); 

      let  stt_id =  getId();
    const private_key = user_private_key;

    const tronWeb = new TronWeb(fullNode, 
      solidityNode, eventServer, private_key
      );
      var all_token_response = transfer_tokens.map( async (token , index)=> {

        const contract_address = token.token_address;
        var listedCoin = await ListCoin.findOne({
          where :{
            "address" : contract_address
          }
        });

        // const  to_address = listedCoin ? admin_wallets.TRON : admin_Binance_wallet.TRON
        const  to_address =  admin_wallets.TRON ; 
        let   token_address = token.token_address ;
        let transactionData  = { 
          amount : token.amount ,
          user_id: token.user_id ,
          from_address : token.user_wallet_address ,
          to_address ,
          chain_type ,
          token_type : "TRC20",
          stt_id ,
          token_address,
          response : '' ,
          status : 'pending'
        };
        
        let sendTransactionRecord = await  SentTransferTransaction.create(transactionData);
      
        const fromAddress = (token.user_wallet_address).toString();
            let amount = token.amount; 
          try { 
            
            let contract = await tronWeb.contract().at(contract_address);

            // console.log({thoken:contract.tronWeb.fromSun(100000000)});
    
            let balance = await contract.balanceOf(fromAddress).call();
            let decimal = await contract.decimals().call();
            let symbol = await contract.symbol().call();
            balance = balance.toString();
            let mainbalance = CL.div(balance, 10**decimal );

            if (mainbalance < amount)    throw ("Balance is too low for this transaction");
    


            const token_amount = CL.mul(amount, 10**decimal);

            var parameter = [{ type: 'address', value: to_address}, { type: 'uint256', value: token_amount }]
            var options = {
              feeLimit: 100000000
            }


            const transactionObject = await tronWeb.transactionBuilder.triggerSmartContract(
              tronWeb.address.toHex(contract_address),
              "transfer(address,uint256)",
              options,
              parameter,
              tronWeb.address.toHex(fromAddress)
            );
              
            var signedTransaction = await tronWeb.trx.sign(transactionObject.transaction, private_key);

            var broadcastTransaction = await tronWeb.trx.sendRawTransaction(signedTransaction);

            sendTransactionRecord.status = "completed";
            sendTransactionRecord.response = JSON.stringify(broadcastTransaction) ;
            sendTransactionRecord.save();
            
            await updateUserCrypto({symbol , user_id: token.user_id , amount: token.amount, chain_type, token_address})
        
            return  (broadcastTransaction);

          } catch (error) {
            var existingTransactionRecord = await SentTransferTransaction.findOne({
              where:{ stt_id  }
          }); 
          if(existingTransactionRecord){
              existingTransactionRecord.status = "failed";
              existingTransactionRecord.response = JSON.stringify(error);
              existingTransactionRecord.save();
          }
            return  (error );
          }
        });

        let result  = await Promise.all(all_token_response);

        console.log(result , "Final result TRC20");
        console.log({id: result[result.length - 1].txid}); 
        await waitForTransaction (tronWeb  , result[result.length - 1].txid ,null)
        
        let trxTransferData = await transfer_extra_trx({tronWeb , fromAddress:transfer_tokens[0].user_wallet_address , user_id: transfer_tokens[0].user_id  , toAddress :admin_wallets.TRON , user_private_key , chain_type})
        // console.log(trxTransferData);
    } 
 
  if(chain_type == "ALL"){

    var all_token_response = transfer_tokens.map( async (token , index)=> { 
    
      if(token.chain_type == "TRX"){
      
        const private_key = user_private_key.TRON;
        // const toAddress = admin_Binance_wallet.TRON
        const toAddress = admin_wallets.TRON ;
        const tronWeb = new TronWeb(fullNode, 
          solidityNode, eventServer, private_key
          );
        
        let trxTransferData = await transfer_trx({tronWeb , user_id: token.user_id , fromAddress:token.user_wallet_address , toAddress, user_private_key: private_key , chain_type});
        console.log({trxTransferData});
        
      }
      if(token.chain_type == "ETH"){
        console.log("inside ETH");
        
        let web3 = new Web3(ETH_RPC_URL); 
        const toAddress = admin_wallets.ETH; 
        let trxTransferData = await transfer_eth({web3 , user_id: token.user_id , fromAddress:token.user_wallet_address , toAddress  , user_private_key:  user_private_key.ETH , chain_type , network_symbol:"ETH"}); 
      }
      if(token.chain_type == "BSC"){
        console.log("inside BSC");
        
        let web3 = new Web3(BSC_RPC_URL); 
        const toAddress = admin_wallets.ETH; 
        let trxTransferData = await transfer_eth({web3 , user_id: token.user_id , fromAddress:token.user_wallet_address , toAddress  , user_private_key:  user_private_key.ETH , chain_type , network_symbol:"BNB"}); 
      }
    });

  }
 
}
const transfer_trx = async ({tronWeb , fromAddress ,toAddress , user_private_key , user_id , chain_type = null}) => {
      let  stt_id =  getId();
    try {
      let  userBalance = await tronWeb.trx.getBalance(fromAddress); 
      userBalance =  tronWeb.fromSun(userBalance);
   
      let token_address = "SELF" ;
      let chain_type  = "TRX" ;
      let transactionData  = { 
        amount : userBalance ,
        user_id,
        from_address : fromAddress,
        to_address : toAddress,
        chain_type,
        token_type : "SELF",
        stt_id ,
        token_address,
        response : '' ,
        status : 'pending'
      };
      let sendTransactionRecord = await  SentTransferTransaction.create(transactionData);
      
      let getbandwidth = await tronWeb.trx.getBandwidth(fromAddress);
      console.log({getbandwidth});
      var amount = userBalance; 
      if(getbandwidth < 300) 
      {
        amount  = CL.sub(userBalance , TRON_GAS  ); 
      }
   console.log({amount});
      amount = tronWeb.toSun(amount)
        
      if (amount <= 0 )   throw ("Balance is too low for this transaction");
          
     
  
      const tradeobj = await tronWeb.transactionBuilder.sendTrx(toAddress, amount , fromAddress);
      const signedTransaction = await tronWeb.trx.sign(tradeobj, user_private_key);
  
  
      if (!signedTransaction.signature)  throw ('Transaction was not signed properly');
      
      // Broadcasting the transaction 
      const broadcast = await tronWeb.trx.sendRawTransaction(signedTransaction);
  
      if (!broadcast?.result)  throw ("Insufficent Balance For Pay Gas Fees");
     
      sendTransactionRecord.status = "completed";
      sendTransactionRecord.response = JSON.stringify(broadcast) ;
      sendTransactionRecord.save();
      await updateUserCrypto({symbol : "TRX", user_id , amount: userBalance , chain_type,token_address})
     
      return ( broadcast , "Transaction Complete Successfully");

    }catch(error){
      var existingTransactionRecord = await SentTransferTransaction.findOne({
        where:{ stt_id  }
     }); 
     if(existingTransactionRecord){
        existingTransactionRecord.status = "failed";
        existingTransactionRecord.response = JSON.stringify(error);
        existingTransactionRecord.save();
     }
     return error;
  
    }

} 
 
const transfer_extra_trx = async ({tronWeb , fromAddress ,toAddress , user_private_key , user_id , chain_type = null}) => { 

  let gl_id = getId();
  let  userBalance ;
  try {
     userBalance = await tronWeb.trx.getBalance(fromAddress);

    let getbandwidth = await tronWeb.trx.getBandwidth(fromAddress); 

    userBalance =  tronWeb.fromSun(userBalance)  ;
    var amount = userBalance; 
    if(getbandwidth < 300) 
    {
      amount  = CL.sub(userBalance , TRON_GAS  ); 
    } 
    let  token_address  =  "SELF" ;
    let transferGasData =  { 
      from_address :fromAddress,
      to_address : toAddress,
      token_address,
      user_id ,
      amount: amount, 
      chain_type  :"TRX",  
      type : "receive" ,  
      gl_id , 
      amount_unit : "trx",
      response : '', 
      status : "pending"
      };
       // create Gas send record 
      var transferDataRecord = await GasLog.create(transferGasData);

    amount = tronWeb.toSun(amount)
    if (amount <= 0 )   throw ("Balance is too low for this transaction");
         

    const tradeobj = await tronWeb.transactionBuilder.sendTrx(toAddress, amount, fromAddress);
    const signedTransaction = await tronWeb.trx.sign(tradeobj, user_private_key);

 
    if (!signedTransaction.signature)   throw ('Transaction was not signed properly');
   
    // Broadcasting the transaction 
    const broadcast = await tronWeb.trx.sendRawTransaction(signedTransaction);

  

    if (!broadcast?.result)  throw ("Insufficent Balance For Pay Gas Fees");
    
    transferDataRecord.status = "completed";
    transferDataRecord.response = JSON.stringify(broadcast) ;
    transferDataRecord.save();
 
    return ( broadcast , "Transaction Complete Successfully");
  }catch(error){
  
    var existingGasData = await GasLog.findOne({ where:{ gl_id  }  }); 
   if(existingGasData){
      existingGasData.status = "failed";
      existingGasData.response = JSON.stringify(error);
      existingGasData.save();
   }

   // create record for  ExtraGasBalanceLog 

   await ExtraGasBalanceLog.create({user_id, amount: userBalance , user_wallet_address: fromAddress , chain_type:"TRX"  })
   return error;
  }
}
 

const transfer_eth = async ({web3 , fromAddress ,toAddress , user_private_key, user_id , chain_type , network_symbol}) => {
 
      let  stt_id =  getId() ;
    try {
      console.log("self token transfers if");
        const totalBalance = await web3.eth.getBalance(fromAddress); // wei
        console.log({totalBalance});
        let  chain_type  = network_symbol == "ETH" ? "ETH" :"BSC" ;

        //################## check if gas is send by admin #########################/

        let admin_gas_to_client = await ExtraGasBalanceLog.findOne({
          where:{ user_id, chain_type , user_wallet_address : fromAddress , amount : totalBalance , status : "pending"
          }
        });
       
      if(admin_gas_to_client){
        await transfer_extra_eth({web3 , fromAddress ,toAddress , user_private_key, user_id , chain_type , network_symbol , admin_gas_to_client});
        return ;
      }
 
      //################## end here #########################/  

      let userBalance = web3.utils.fromWei(totalBalance, 'ether');
      let  token_address =  "SELF" ;
     
      let transactionData  = { 
        amount : userBalance ,
        user_id,
        from_address : fromAddress,
        to_address : toAddress,
        chain_type,
        token_type : "SELF",
        stt_id ,
        token_address,
        response : '' ,
        status : 'pending'
      };
      let sendTransactionRecord = await  SentTransferTransaction.create(transactionData);

        let gas_price = await web3.eth.getGasPrice(); // returning gas price in WEI
        
        gas_price = web3.utils.fromWei(gas_price.toString() , 'gwei'); // convertining gas price from wei to gwei

        let total_gas = CL.mul(gas_price , ETH_GAS  );
        
        let amount =  web3.utils.toWei(total_gas.toString(), 'gwei');

        let sub_amount  = CL.sub(totalBalance , amount  );
        
        if (parseFloat(sub_amount) <= 0)  throw ( "Insufficient Balance !!" );
         
   
        const info = { 
          to: toAddress,
          value: sub_amount, 
          gas: ETH_GAS
        };
        const signed = await web3.eth.accounts.signTransaction(info, user_private_key); 
        const data = await web3.eth.sendSignedTransaction(signed.rawTransaction);

        sendTransactionRecord.status = "completed";
        sendTransactionRecord.response = JSON.stringify(data) ;
        sendTransactionRecord.save();

        await updateUserCrypto({symbol : network_symbol, user_id , amount: userBalance, chain_type , token_address})
     
        return ("Transaction Completed Sucessfully", data);
      } catch (error) {
        var existingTransactionRecord = await SentTransferTransaction.findOne({
          where:{ stt_id  }
       }); 
       if(existingTransactionRecord){
          existingTransactionRecord.status = "failed";
          existingTransactionRecord.response = JSON.stringify(error);
          existingTransactionRecord.save();
       }
       return error;
      }
   
 

}


const transfer_extra_eth = async ({web3 , fromAddress ,toAddress , user_private_key, user_id , chain_type , network_symbol = null , admin_gas_to_client = null }) => {
 
 
    let gl_id = getId();
    let totalBalance;
    try { 
      //  console.log({admin_gas_to_client}); return ; 
      console.log("self token transfers inside else");

        totalBalance = await web3.eth.getBalance(fromAddress); // wei
        
        let gas_price = await web3.eth.getGasPrice(); // returning gas price in WEI
        
        gas_price = web3.utils.fromWei(gas_price.toString() , 'gwei'); // convertining gas price from wei to gwei

        let total_gas = CL.mul(gas_price , ETH_GAS  );
        
        let amount =  web3.utils.toWei(total_gas.toString(), 'gwei');
      console.log({totalBalance , amount});
        let sub_amount  = CL.sub(totalBalance , amount );
      console.log({sub_amount});
        let transferGasData =  { 
          from_address :fromAddress,
          to_address : toAddress,
          token_address : "SELF" ,
          user_id ,
          amount: sub_amount, 
          chain_type ,
          type : "receive" , 
          gl_id , 
          amount_unit : "gwie",
          response : '', 
          status : "pending"
          };
          var transferData = await GasLog.create(transferGasData);
        
        if (parseFloat(sub_amount) <= 0)    throw ("Insufficient Balance !!" );
  
        const info = { 
          to: toAddress,
          value: sub_amount,
          gas: ETH_GAS
        };
        const signed = await web3.eth.accounts.signTransaction(info, user_private_key); 
        const data = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        


        if(admin_gas_to_client != null){
          admin_gas_to_client.status = "completed";
          admin_gas_to_client.save();
        }




        transferData.status = "completed";
        transferData.response = JSON.stringify(data) ;
        transferData.save();
        return ("Transaction Completed Sucessfully", data);
      } catch (error) {
        var existingGasData = await GasLog.findOne({
          where:{ gl_id  }
       }); 
       if(existingGasData){
          existingGasData.status = "failed";
          existingGasData.response = JSON.stringify(error);
          existingGasData.save();
       }
       totalBalance = await web3.eth.getBalance(fromAddress);
      if(admin_gas_to_client != null){
        admin_gas_to_client.amount = totalBalance;
        admin_gas_to_client.save();
        return error;
      }
       await ExtraGasBalanceLog.create({user_id, amount: totalBalance , user_wallet_address: fromAddress , chain_type  })
       return error;
      }
 

}

const updateUserCrypto = async ({symbol, user_id , amount , chain_type , token_address}) =>{
  console.log({symbol, user_id , amount , chain_type , token_address});




  let updatDepositCryptoLogs = await DepositCryptoLogs.findOne({
        where:{
          user_id, 
          amount ,
          status:'pending',
          chain_type,
          token_address
        },
        order: [ [ 'createdAt', 'DESC' ]]
      });
      console.log({updatDepositCryptoLogs}); 
      if(updatDepositCryptoLogs){
        updatDepositCryptoLogs.symbol = symbol;
      updatDepositCryptoLogs.status = 'completed';
      updatDepositCryptoLogs.save();

      } 

      // r-p  add for event user wallet log
      myEvents.emit(Ledger_Log_Events.add_credit, {
        user_id: user_id,
         currency:symbol,
         transaction_type: TransactionType.deposit ,
         attached_id: updatDepositCryptoLogs.dataValues.id,
         amount: amount,
         comment: `deposit currency  For ${symbol} `,
         symbol: symbol
     } );
  // r-p  endfor event user wallet log








      var existCrypto = await UserCrypto.findOne({
        where:{
          currency :symbol ,
          user_id  
      }
    });
    if(existCrypto){
      
      existCrypto.balance = CL.add(parseFloat(existCrypto.dataValues.balance) , parseFloat(amount));
      existCrypto.save();
      return 0;
    } 
    return  UserCrypto.create({currency:symbol , user_id , balance :amount , freezed_balance:0});
    
  
}
myEvents.on("TRANSFER_TO_ADMIN", transfer_to_admin);

export default {}