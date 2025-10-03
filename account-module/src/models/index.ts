import { initSequelize } from "../config/maindbDataSource";
import { Account } from "./accountModel";
import { Currency } from "./currencyModel";
import { Country } from "./countryModel";
import { DatabaseConnection } from "./dbConnectionModel";
import { Region } from "./regionModel";
import { States } from "./stateModel";
import { City } from "./cityModel";
import { AccountFileDropConfig } from "./accountFileDropConfigModel";
import { Industry} from "./industryModel";
import { ProjectSummary } from "./projectSummary";
import { ColorCodes } from "./colorCodes";
import { Status } from "./statusModel";
import { ResourceStatus } from "./resourceStatus";
import { ResourceType } from "./resourceType";
import { ProjectType } from "./projectType";
import { SkillLevel } from "./skillLevel";
import { AccountFiscalSummary } from "./accountFiscalSummaryModel";

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
  AccountFiscalSummary: typeof AccountFiscalSummary;
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
  ProjectSummary: ProjectSummary,
  AccountFiscalSummary: AccountFiscalSummary
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
    AccountFiscalSummary.initialize(sequelize); // Initialize before Account
    Account.initialize(sequelize);
    ProjectSummary.initialize(sequelize);
    //await sequelize.sync({ force: false });
    
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
  SkillLevel,
  AccountFiscalSummary
};