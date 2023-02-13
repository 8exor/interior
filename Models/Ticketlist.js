import { Model,Sequelize } from "../Database/sequelize.js";
import { User } from "./User.js";
import {TicketCategories} from "../Admin/Models/TicketCategoryModel.js";

export const TicketList = Model.define('ticket', {
    
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    content: {
      type: Sequelize.TEXT('long'),
      allowNull: false

    },
    author_name:{
        type:Sequelize.STRING,
        allowNull:false,
    },
    author_email:{
       type:Sequelize.STRING,
       unique: true,
    },
    priority:{
      type:Sequelize.STRING,
        allowNull:false,
        comment:'high, medium,low'
    },
    status:{
        type:Sequelize.STRING,
          allowNull:false,
          comment:'active,pending,deleted'
     },
 
    //  user_id: {
    //   type: Sequelize.STRING,
    //   allowNull: false
    // },

      category_id: {
      type: Sequelize.STRING,
      allowNull: false

    },
    images:{
      type: Sequelize.STRING,
      allowNull: false
        
    },
    assigned_to:{
      type:Sequelize.STRING,
    },
    created_by:{
       type:Sequelize.STRING,
       allowNull:false,
    }


  }, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

  await TicketList.sync();

  TicketList.belongsTo(User,{foreignKey: 'created_by'});
  TicketList.belongsTo(TicketCategories,{foreignKey: 'category_id'});


