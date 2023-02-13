import { Model , Sequelize } from "../../Database/sequelize.js";

const NewsBoard = Model.define('news_boards', {
    title:Sequelize.STRING,
    miniDescription:Sequelize.STRING,
    isLiked:{
      type:Sequelize.BOOLEAN,
      defaultValue:false
    },
    description: Sequelize.TEXT('long'),
    total_likes:{
      type:Sequelize.STRING,
      defaultValue:"0"
    },
    likedBy:{
      type:Sequelize.STRING,
      set(value) {
        this.setDataValue('likedBy', JSON.stringify(value));
      },
      get() {
        const rawValue = this.getDataValue('likedBy');
        return rawValue ? JSON.parse(rawValue) : [];
      }
    },
    social:{
      type:Sequelize.STRING,
      set(value) {
        this.setDataValue('social', JSON.stringify(value));
      },
      get() {
        const rawValue = this.getDataValue('social');
        return rawValue ? JSON.parse(rawValue) : [];
      }
    },
  });

 await NewsBoard.sync({alter:true});
 
  
  export default NewsBoard;