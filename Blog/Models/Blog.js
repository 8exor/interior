import { Model, Sequelize } from "../../Database/sequelize.js";
import { Category } from "./Category.js";

export const Blog = Model.define('blog', {
    name: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    publish_at: {
        type: Sequelize.DATE,
    },
    description: {
        type: Sequelize.TEXT,
    },
    category_id: {
        type: Sequelize.INTEGER,
    },
    image: {
        type: Sequelize.STRING,
        get() {
            return process.env.BASE_URL + "image/blog/" + this.getDataValue('image')
        }
    }
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await Blog.sync();

Blog.belongsTo(Category, {
    foreignKey: {
        name: 'category_id'
    }
})