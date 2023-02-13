import { Model , Sequelize } from "../../Database/sequelize.js";

export const Banner = Model.define('banner', {
    id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true
    },
    link: Sequelize.STRING,
    image: {
        type:Sequelize.STRING,
        get() {
            const rawValue = this.getDataValue('image');
            return rawValue ? process.env.BASE_URL + "image/banner/" + rawValue: null;
        }
        
    },
    status:{
       type: Sequelize.STRING,
       defaultValue: 1,
       comment:"0= Not Active,1 = Active"
    }
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await Banner.sync({alter:true});