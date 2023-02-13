import { DataTypes } from 'sequelize';

import { Model as DB} from '../../Database/sequelize.js';


export const P2P_Token = DB.define('P2pToken', {

  user_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  jti: {
    type: DataTypes.STRING,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  // Other model options go here
});
await P2P_Token.sync();


