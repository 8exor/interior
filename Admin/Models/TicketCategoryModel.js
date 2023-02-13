import {Sequelize,Model } from "../../Database/sequelize.js";
import { User } from "../../Models/User.js";
// import ticket_list from "../../Models/Ticketlist.js";

export const TicketCategories = Model.define('ticket_categorie', {
    // Model attributes are defined here
    category_name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    created_by: {
      type: Sequelize.STRING,
    },
   
  }, {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});


TicketCategories.belongsTo(User, {
  foreignKey: 'created_by'
});
  await TicketCategories.sync();

  
