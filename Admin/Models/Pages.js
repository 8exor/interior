import { Model , Sequelize } from "../../Database/sequelize.js";

export const Page = Model.define('page',{

 id: {
    type: Sequelize.BIGINT(20),
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
    type:Sequelize.STRING,
    sub_type: Sequelize.STRING,
    slug: Sequelize.STRING,
    extra:Sequelize.STRING,
    content:{
        type: Sequelize.TEXT("long")
    },
    status:{
        type:Sequelize.STRING,
        defaultValue:0,
        comment:'1=Active, 0=Not Active'
    }
},
{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'

})
await Page.sync();