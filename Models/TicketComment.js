import { Model,Sequelize } from "../Database/sequelize.js";
export const TicketComment = Model.define('ticket_comment',{

    ticket_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    comment: {
      type: Sequelize.TEXT('long'),
      allowNull: false

    },
    commented_by:{
        type:Sequelize.STRING,
        allowNull:false,
    },
    image:{
      type: Sequelize.STRING,
      allowNull: false,
      get() {
        return (this.getDataValue('image') ? process.env.BASE_URL+'image/tickets/' + this.getDataValue('image'):[]);
      }
    },

    
  }, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

  await TicketComment.sync();
