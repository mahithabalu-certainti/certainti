import { initSequelize } from "../config/maindbDataSource";
import { Account, setupAccountSequence } from "./accountModel";
import { Currency } from "./currencyModel";
import { Country, setupCountrySequence } from "./countryModel";
import { DatabaseConnection, setupDbConnectionSequence } from "./dbConnectionModel";
import { Region, setupRegionSequence } from "./regionModel";
import { States, setupStateSequence } from "./stateModel";
import { City } from "./cityModel";
import { AccountFileDropConfig } from "./accountFileDropConfigModel";
import { Industry, setupIndustrySequence} from "./industryModel";
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
    await setupDbConnectionSequence(sequelize);
    await setupCountrySequence(sequelize);
    await setupRegionSequence(sequelize);
    await setupStateSequence(sequelize);
    await setupIndustrySequence(sequelize);
    await setupAccountSequence(sequelize);
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