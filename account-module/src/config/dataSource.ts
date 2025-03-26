import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.PG_DATABASE_NAME as string,
  process.env.PG_USER as string,
  process.env.PG_PASSWORD as string,
  {
    host: process.env.PG_HOST,
    dialect: 'postgres',
    port: process.env.PG_DB_PORT ? parseInt(process.env.PG_DB_PORT) : 5432,
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      freezeTableName: true,
      timestamps: false,
    },
  }
);

export default sequelize;
