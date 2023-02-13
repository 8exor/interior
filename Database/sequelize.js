import Sequelize from 'sequelize';

import { config } from '../Config/config.js';

const Model = new Sequelize(
  config.database,
  config.username,
  config.password, {
  host: config.host,
  dialect: 'mysql',
  logging: false,
    // logging: (t) => {
  //   console.log(t);
  // },
});

try {
  await Model.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

export { Sequelize, Model }