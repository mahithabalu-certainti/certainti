import { initSequelize } from "../config/maindbDataSource";
import { Account } from "./accountModel";
import { Currency } from "./currencyModel";
import { Country } from "./countryModel";
import { DatabaseConnection } from "./dbConnectionModel";
import { Region } from "./regionModel";
import { States } from "./stateModel";
import { City } from "./cityModel";

export const models: {
  Account: typeof Account;
  Currency: typeof Currency;
  Country: typeof Country;
  DatabaseConnection: typeof DatabaseConnection;
  Region: typeof Region;
  States: typeof States;
  City: typeof City;
} = {
  Account: Account,
  Currency: Currency,
  Country: Country,
  DatabaseConnection: DatabaseConnection,
  Region: Region,
  States: States,
  City: City,
};

export async function initModels() {
  try {
    const sequelize = await initSequelize();
    Currency.initialize(sequelize);
    Country.initialize(sequelize);
    Region.initialize(sequelize);
    States.initialize(sequelize);
    City.initialize(sequelize);
    DatabaseConnection.initialize(sequelize);
    Account.initialize(sequelize);
    await sequelize.sync({ force: false });
  } catch (err) {
    console.log("Errr loading models", err);
  }
}

export const modelExports = {
  Account,
  Currency,
  Country,
  DatabaseConnection,
  Region,
  States,
  City,
};