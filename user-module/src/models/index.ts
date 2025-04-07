import { initSequelize } from "../config/dataSource";
import { Api } from "./apiModel";
import { BusinessTeams } from "./businessTeamModel";
import { Department } from "./departmentModel";
import { ModuleFields } from "./moduleFieldModel";
import { ProfileApiAccess } from "./profileApiAccess";
import { Profile } from "./profileModel";
import { FunctionGroup } from "./functionGroupModel";
import { ProfileModuleAccess } from "./profileModuleAccessModel";
import { UserDetails } from "./userDetailsModel";
import { User } from "./userModel";
import { Module } from "./moduleModel";

export const models: {
  BusinessTeams: typeof BusinessTeams;
  Department: typeof Department;
  ModuleFields: typeof ModuleFields;
  ProfileApiAccess: typeof ProfileApiAccess;
  Profile: typeof Profile;
  FunctionGroup: typeof FunctionGroup;
  ProfileModuleAccess: typeof ProfileModuleAccess;
  UserDetails: typeof UserDetails;
  User: typeof User;
  Api: typeof Api;
  Module: typeof Module;
} = {
  BusinessTeams: BusinessTeams,
  Department: Department,
  ModuleFields: ModuleFields,
  ProfileApiAccess: ProfileApiAccess,
  Profile: Profile,
  FunctionGroup: FunctionGroup,
  ProfileModuleAccess: ProfileModuleAccess,
  User: User,
  UserDetails: UserDetails,
  Api: Api,
  Module: Module
};

export async function initModels() {
  try {
    const sequelize = await initSequelize();
    BusinessTeams.initialize(sequelize);
    Department.initialize(sequelize);
    Module.initialize(sequelize);
    ModuleFields.initialize(sequelize);
    ProfileApiAccess.initialize(sequelize);
    Profile.initialize(sequelize);
    FunctionGroup.initialize(sequelize);
    ProfileModuleAccess.initialize(sequelize),
    User.initialize(sequelize);    
    UserDetails.initialize(sequelize),
    
    await sequelize.sync({ force: false });
  } catch (err) {
    console.log("Errr loading models", err);
  }
}
