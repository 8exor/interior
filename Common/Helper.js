import Sequelize from 'sequelize';
import { Activitylog } from '../Models/ActivityLog.js';

export default {
    getPaginate: (req, order_by = 'id' , order_in = 'desc', model1=null,model2=null) =>  {

        // console.log({order_by,order_in})
        const page     = req.query.page ? parseInt(req.query.page) : 1;
        const per_page = req.query.per_page ? parseInt(req.query.per_page) : 10;
        const offset =   ( page - 1 ) * per_page ;
        order_by=(order_by !='')? order_by :'id'
        order_in=(order_in!='')? order_in:'desc'
    
        var data = { offset: offset,limit: per_page , page: page}

        if(order_by != null)
        {
            data['order'] = [
                [ order_by , order_in]
            ];

            if(order_by == 'amount' || order_by == 'quantity' || order_by == 'at_price' || order_by == 'total' ){
                data['order']= [[Sequelize.cast(Sequelize.col(order_by), 'INTEGER'), order_in]] 
            }
           
        }
        if(model1!= null){
            data['order'] =[
                [model1,order_by,order_in]
            ]
        }
        if(model1!= null && model2!= null){
            data['order'] =[
                [model1,model2,order_by,order_in]
            ]
        }

        // console.log({data:data.order})


        return data;
    } ,

    getMax: (array , key ) => {
        return Math.max(...array.map(e => e[key]));
    } ,

    getMaxFromArray: (array , key ) => {
        return array.reduce((a,b)=> a[key] > b[key] ? a : b);
    } ,

    getMin: (array , key) => {
        return Math.min(...array.map(e => e[key]));
    },

    getMinFromArray: (array , key) => {
        return array.reduce((a,b)=> a[key] < b[key] ? a : b);
    },

     //date modification function
    get_trailing_zero: (date)=>{
        let [y,m,d]= date.split('-')
        d= (d<10)? '0'+d : d;
        m= (m<10)? '0'+m : m;
        return y+"-"+m+"-"+d;
    },

   /// #commom login activity
    generateActivityLog : async(user_id, type, ip) =>
    {

        let messageLog = {
            'login' : 'Login Success',
            'loginError' : 'Login Attempt',
            'logout' : 'Logout Success',
            'hardlogout' : 'ALL Device Logout Success',
            '_2faUpdate' : 'Changed 2FA Success',
            '_2faError' : '2FA Attempt'
        }
       let  message = messageLog[type];
      
        try {
            await Activitylog.create({user_id:user_id,type:type,ip:ip,message:message})
        } catch (error) {
            console.log('activityerr',error)
        }
    }
}