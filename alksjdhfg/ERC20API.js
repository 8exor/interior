import Accounts from 'web3-eth-accounts';
var accounts = new Accounts('ws://localhost:8546');
import Web3 from 'web3'
import Message from './Message.js';

import  dotenv from 'dotenv';
import { CL } from 'cal-time-stamper';
dotenv.config();
const ETH_RPC_URL = process.env.ETH_RPC_URL;
 var web3 = new Web3(ETH_RPC_URL);
 
export default {

  /**************** For Create  ETH Wallet  *********************/
  create(req, res) {

    try {
      let data = accounts.create()

      return Message.success("Address Created Sucessfully", data);
    } catch (error) {

      return Message.failed(error.message,{});
    }


  },

  /**************** For Withdrawal ETH Coin  *********************/
  // async transferCoin(req, res) {

  //   const privateKey = req.privateKey;
  //   let amount = req.amount;
  //   const fromAddress = req.fromAddress;
  //   const toAddress = req.toAddress; 
  //   let totalBalance = 0;
  //   let signed ;
  //   let data;
  //   try {
  //    totalBalance = await web3.eth.getBalance(fromAddress);
  //   } catch (e) {
  //     return ({ 'status_code': "0", 'msg': "Invalid Reciever Address  Please Try Again!!" });
  //   }
  //   try {
  //      await web3.eth.getBalance(toAddress);
  //   } catch (e) {
  //     return ({ 'status_code': "0", 'msg': "Invalid Source Address Please Try Again!!" });
  //   }

  //   amount = web3.utils.toWei(amount, 'ether') 
  //   if(parseFloat(totalBalance) < parseFloat(amount)){
  //     return ({'status_code':"0", 'msg':"Insufficient Balance !!"});
  //   }

  //   var info  = {
  //      to: toAddress,
  //      value: amount,
  //      gas: 2000000
  //    } 

  //    try{
  //      signed = await web3.eth.accounts.signTransaction(info, privateKey)
  //    } catch (e){
  //     return ({'status_code':"0", 'msg':"Invalid privateKey !"});
  //    }
  //    try{
  //     data = await web3.eth.sendSignedTransaction(signed.rawTransaction);
  //     return ({'status_code':"1", 'data':data , 'msg':"ETH Withdrawal Successfully"});
  //   } catch (e){
  //    return ({'status_code':"0", 'msg':"Transaction Failed !"});
  //   } 
  // },
  async transferCoin(req, res) {
    var web3 = new Web3(req.rpc_url);
    const privateKey = req.privateKey;
    let amount = req.amount;
    const fromAddress = req.fromAddress;
    const toAddress = req.toAddress;

    try {
      const totalBalance = await web3.eth.getBalance(fromAddress);
       await web3.eth.getBalance(toAddress);
      amount = web3.utils.toWei(amount); 
      if (parseFloat(totalBalance) < parseFloat(amount)) {
        return ({ 'status_code': "0", 'message': "Insufficient Balance !!" });
      }

      const info = {
        to: toAddress,
        value: amount,
        gas: 21000
      };
      const signed = await web3.eth.accounts.signTransaction(info, privateKey); 
      const data = await web3.eth.sendSignedTransaction(signed.rawTransaction);
   
      return Message.success("Transaction Completed Sucessfully", data);
    } catch (error) {
      return Message.failed(error.message,{});
    }
  },

  /**************** For Withdrawal ERC20 && BEP20 Token  *********************/

  async transferToken(req, res) {
    var web3 = new Web3(req.rpc_url);
    const contract_address = req.contract_address;
    const source_address = req.fromAddress;
    const to_address = req.toAddress;
    const private_key = req.privateKey;
   
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
      }
    ];
    try {
      let contract = new web3.eth.Contract(minABI, contract_address);
     let decimals = await contract.methods.decimals().call();
      decimals = 10**decimals ;
     const token_amount = CL.mul(req.amount, decimals); 
      const tx = contract.methods.transfer(to_address, token_amount.toString());
      const gas = 21000;
      const data = tx.encodeABI();

      const signedTx = await web3.eth.accounts.signTransaction(
        {
          to: contract.options.address,
          data,
          gas: gas,
          value: '0x0',
        },
        private_key
      );

      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
     
      return Message.success("Transaction Complete Successfully", receipt);

    } catch (error) {  
      return Message.failed(error.message, {} );
    }



  },

  async fromAddressInfo(req,res){

    /********************** For ETH Address Validation  ******************/
    const fromAddress = req.fromAddress;
    const toAddress = req.toAddress; 

    var web3 = new Web3(req.rpc_url); 
    if(req.token_type == "SELF" || req.currency == "BNB"){
      
      try{

      // await web3.eth.getBalance(toAddress); 
      let totalBalance = await web3.eth.getBalance(fromAddress);
      
      totalBalance = web3.utils.fromWei(totalBalance, 'ether');
      return Message.success("Success", totalBalance);
      }catch(error){
        
        return Message.failed("Invalid  Address", {} );
      }
  }
    

   
  try{
    let minABI = [
      {
        "constant":true,
        "inputs":[{"name":"_owner","type":"address"}],
        "name":"balanceOf",
        "outputs":[{"name":"balance","type":"uint256"}],
        "type":"function"
      },
      {
        "constant":true,
        "inputs":[],
        "name":"decimals",
        "outputs":[{"name":"","type":"uint8"}],
        "type":"function"
      }
    ];  
    
      let contract = new web3.eth.Contract(minABI, req.contract_address); 
     
      var  balance = await contract.methods.balanceOf(fromAddress).call();
      var  decimals = await contract.methods.decimals().call();
      balance = CL.div(balance, 10**decimals)
      // console.log("balance", balance);
      // console.log("decimal", await contract.methods.decimals().call());
      
      return Message.success("balance",balance );
     
  }catch(error){
      return Message.failed("invalid address", {} );
  }

 
    
  }
 

}  