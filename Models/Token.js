import { Model , Sequelize } from "../Database/sequelize.js";

export const Token = Model.define('oauth_access_tokens', {
    id: {
        type: Sequelize.STRING(100),
        primaryKey: true
    },
    user_id: Sequelize.BIGINT(20).UNSIGNED ,
    client_id: Sequelize.BIGINT(20).UNSIGNED ,
    name: Sequelize.STRING,
    scopes:Sequelize.TEXT,
    revoked: Sequelize.BOOLEAN,
    expires_at: Sequelize.DATE
},{
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

await Token.sync();