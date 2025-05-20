import { initSequelize } from "../config/maindbDataSource";
import { Account } from "./accountModel";
import { Currency } from "./currencyModel";
import { Country } from "./countryModel";
import { DatabaseConnection } from "./dbConnectionModel";
import { Region } from "./regionModel";
import { States } from "./stateModel";
import { City } from "./cityModel";
import { Industry } from "./industryModel";
import { AccountFileDropConfig } from "./accountFileDropConfigModel";
export const models: {
  Account: typeof Account;
  Currency: typeof Currency;
  Country: typeof Country;
  DatabaseConnection: typeof DatabaseConnection;
  Region: typeof Region;
  States: typeof States;
  City: typeof City;
  Industry: typeof Industry;
  AccountFileDropConfig: typeof AccountFileDropConfig;
} = {
  Account: Account,
  Currency: Currency,
  Country: Country,
  DatabaseConnection: DatabaseConnection,
  Region: Region,
  States: States,
  City: City,
  Industry: Industry,
  AccountFileDropConfig: AccountFileDropConfig,
};

export async function initModels() {
  try {
    const sequelize = await initSequelize();
    Currency.initialize(sequelize);
    Country.initialize(sequelize);
    Region.initialize(sequelize);
    States.initialize(sequelize);
    City.initialize(sequelize);
    Industry.initialize(sequelize);
    DatabaseConnection.initialize(sequelize);
    AccountFileDropConfig.initialize(sequelize);
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
  Industry,
};