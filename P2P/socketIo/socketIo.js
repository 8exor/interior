import express from "express";
import { Server } from "socket.io";
import event from "../Events/Event.js";
import { P2P_Chat } from "../Models/P2P_Chat.js";
import { P2P_Order } from "../Models/P2P_Order.js";
import { P2P_Trade } from "../Models/P2P_Trade.js";
import {Op} from "sequelize"; 
import fs from 'fs';
import JWT from 'jsonwebtoken'; 
import { Token } from "../../Models/Token.js";


import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
 
 
const PUBLIC_KEY = fs.readFileSync('./keys/public.key', 'utf8');


export function socketIo(server) {
    const io = new Server(server, {
        maxHttpBufferSize: 1e8,
        cors: {
            origin: "*",
        }
    });

    const p2pOrder = async (data) => {
        io.sockets.emit('p2pOrderUpdate', data)
    }

    const pageReload = async(data) => {
        // console.log({pageReload: data});
        io.in("ChatRoom"+data.id+"_"+data.another_user).emit('pageReload', data)
        console.log({roomid : "ChatRoom"+data.id+"_"+data.another_user});
    }

    io.on('connection', async (socket) => {
        if (socket.handshake.query && socket.handshake.query.token) {
            try {
                // console.log(socket.handshake);
                if(socket.handshake.query.token != null){
                    let  token = socket.handshake.query.token;
                    var jwtRes = JWT.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] } );
                   
                      jwtRes = await Token.findByPk(jwtRes.jti);

                    // console.log({jwtRes});
                }
            } catch (e) {
                // console.log(e);
                return;
            }
          
            socket.on('connectChatRoom', async function(id , receiver_id) {
                // console.log({connectChatRoom: "connectChatRoom",id , receiver_id});
                console.log("ChatRoom"+ id+"_"+receiver_id);
                if (id) {
                    socket.join("ChatRoom"+ id+"_"+receiver_id);
                }
                
            });

            socket.on('sendMessage', async function (data) {
                console.log('sendMessage', data);
                var mathchOrder = await P2P_Trade.findByPk(data.match_id);
                var order = await P2P_Order.findOne({
                    where: {
                        id: {
                            [Op.or]: [mathchOrder.seller_order_id, mathchOrder.buyer_order_id]
                        },
                        user_id: {
                            [Op.ne]: jwtRes.user_id
                        }
                    }
                });
                // console.log({order});

                const receiver_id = order.user_id;

                data.receiver_id = receiver_id;
                data.sender_id = jwtRes.user_id; 
 
 
                if ((data?.files)?.length > 0 ) { 
                
                    try {
                        
                        var files = data.files
                      
                        
                        files.forEach(async(file) => { 
                            console.log('files',file);
                            const type = file.split(';')[0].split('/')[1];
                            console.log("length",files.length);
                            var fileName = Date.now() + '_' + Math.round(Math.random() * 1E9) + '.' + type;
                          
                            let uploadPath = __dirname + '/public/images/' + fileName;
                          
                            // for image type only

                             file = file.replace(/^data:image\/png;base64,/, "");
                             file = file.replace(/^data:image\/jpeg;base64,/, ""); 
                             file = file.replace(/^data:image\/jpg;base64,/, ""); 
                             file = file.replace(/^data:image\/svg;base64,/, ""); 
                             console.log({uploadPath});
                            fs.writeFile(uploadPath , file, 'base64', function(err) {
                                if(err) return console.log("error while upload images",err);
                            }); 
 

                          fileName?  data.image = fileName :'';
                            await P2P_Chat.create(data)

                        });

                    } catch (error) {
                        console.log('error in upload image',error);
                    }
                } else {
					data.message ?  await P2P_Chat.create(data) :''
                }
console.log("ChatRoom"+receiver_id+"_"+data.sender_id);
                socket.to("ChatRoom"+receiver_id+"_"+data.sender_id).emit("getMessage", data);
            });

            socket.on('transferNotified', async function(data) {
                console.log('transferNotified', data);

                socket.to('ChatRoom'+data.seller_id +"_"+data.sender_id).emit('showReceivedButton', data.seller_id)
                const customMsg = {
                    match_id: data.match_id,
                    sender_id: data.sender_id,
                    receiver_id: data.seller_id,
                    message: 'Transfered By Buyer Please Release Fund'
                }

                await P2P_Chat.create(customMsg);
                socket.to("ChatRoom"+data.seller_id+"_"+data.sender_id).emit("getMessage", customMsg);

            });

            socket.on('PaymentReceived', async function(data) {

                const customMsg = {
                    match_id: data.match_id,
                    sender_id: data.sender_id,
                    receiver_id: data.buyer_id,
                    message: 'Payment Received By Seller',
                    api_status_code:data.api_status_code,
                    api_message: data.api_message
                    
                }
                // console.log('PaymentReceived');
                socket.to('ChatRoom'+data.buyer_id+"_"+data.sender_id).emit('showMsg', customMsg)

                await P2P_Chat.create(customMsg);
                socket.to("ChatRoom"+data.seller_id+"_"+data.sender_id).emit("getMessage", customMsg);

            });

            // on cancel order
            socket.on('CancelOrder', async function(data) {

                const customMsg = {
                    match_id: data.match_id,
                    sender_id: data.sender_id,
                    receiver_id: data.receiver_id,
                    api_status_code: 0,
                    api_message: 'Order is cancelled by the buyer'
                    
                    
                }
                console.log('CancleOrder');
                console.log({customMsg});
                socket.to('ChatRoom'+data.receiver_id+"_"+data.sender_id).emit('showMsg', customMsg)

                await P2P_Chat.create(customMsg);
                

            });
            socket.on('disconnect', function(socket) {
                // console.log('disconnect', socket);
            });
        }

    });

    event.on('p2pOrder', p2pOrder)
    event.on('pageReload', pageReload)
}