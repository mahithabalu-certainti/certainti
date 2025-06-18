import { initSequelize } from "../config/maindbDataSource";
import { Account, setupAccountSequence } from "./accountModel";
import { Currency } from "./currencyModel";
import { Country } from "./countryModel";
import { DatabaseConnection, setupDbConnectionSequence } from "./dbConnectionModel";
import { Region, setupRegionSequence } from "./regionModel";
import { States, setupStateSequence } from "./stateModel";
import { City } from "./cityModel";
import { AccountFileDropConfig } from "./accountFileDropConfigModel";
import { Industry, setupIndustrySequence} from "./industryModel";
import { ProjectSummary, setupProjectSummarySequence } from "./projectSummary";
import { ColorCodes } from "./colorCodes";
import { Status } from "./status";
import { ResourceStatus } from "./resourceStatus";
import { ResourceType } from "./resourceType";
import { ProjectType } from "./projectType";
import { SkillLevel } from "./skillLevel";

export const models: {
  Account: typeof Account;
  Currency: typeof Currency;
  Country: typeof Country;
  ColorCodes: typeof ColorCodes;
  DatabaseConnection: typeof DatabaseConnection;
  Region: typeof Region;
  States: typeof States;
  City: typeof City;
  Industry: typeof Industry;
  Status: typeof Status;
  ResourceStatus: typeof ResourceStatus;
  ResourceType: typeof ResourceType;
  ProjectType: typeof ProjectType;
  SkillLevel: typeof SkillLevel;
  AccountFileDropConfig: typeof AccountFileDropConfig;
  ProjectSummary: typeof ProjectSummary;
} = {
  Account: Account,
  Currency: Currency,
  Country: Country,
  ColorCodes: ColorCodes,
  DatabaseConnection: DatabaseConnection,
  Region: Region,
  States: States,
  City: City,
  Industry: Industry,
  Status:  Status,
  ResourceStatus:  ResourceStatus,
  ResourceType:  ResourceType,
  ProjectType:  ProjectType,
  SkillLevel:  SkillLevel,
  AccountFileDropConfig: AccountFileDropConfig,
  ProjectSummary: ProjectSummary
};

export async function initModels() {
  try {
    const sequelize = await initSequelize();
    Currency.initialize(sequelize);
    Country.initialize(sequelize);
    Region.initialize(sequelize);
    States.initialize(sequelize);
    ColorCodes.initialize(sequelize);
    City.initialize(sequelize);
    Industry.initialize(sequelize);
    Status.initialize(sequelize);
    SkillLevel.initialize(sequelize);
    ProjectType.initialize(sequelize);
    ResourceType.initialize(sequelize);
    ResourceStatus.initialize(sequelize);
    DatabaseConnection.initialize(sequelize);
    AccountFileDropConfig.initialize(sequelize);
    Account.initialize(sequelize);
    ProjectSummary.initialize(sequelize);
    //await sequelize.sync({ force: false });
    await setupDbConnectionSequence(sequelize);
    await setupRegionSequence(sequelize);
    await setupStateSequence(sequelize);
    await setupIndustrySequence(sequelize);
    await setupAccountSequence(sequelize);
    await setupProjectSummarySequence(sequelize);
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
  Status,
  ResourceStatus,
  ResourceType,
  ProjectType,
  SkillLevel
};