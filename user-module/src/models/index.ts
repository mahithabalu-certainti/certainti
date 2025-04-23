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

import { ProfileMenuAccess } from "./profileMenuAccessModel";
import { ProfileMenuModuleAccess } from "./profileMenuModuleAccessModel";
import { ProfilePermissionAccess } from "./profilePermissionAccessModel";
import { ProfileFieldsAccess } from "./profileFieldsAccessModel";
import { Menu } from "./menuModel";
import { MenuModule } from "./menuModuleModel";
import { ModulePermission } from "./modulePermissionModel";
import { PermissionField } from "./permissionFieldModel";
import { UserMenuAccess } from "./userMenuAccessModel";
import { UserModuleAccess } from "./userModuleAccessModel";
import { UserPermissionAccess } from "./userPermissionAccessModel";
import { UserFieldsAccess } from "./userFieldsAccessModel";


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
  Menu: typeof Menu;
  MenuModule: typeof MenuModule;
  ModulePermission: typeof ModulePermission;
  PermissionField: typeof PermissionField;
  ProfileMenuAccess: typeof ProfileMenuAccess;
  ProfileMenuModuleAccess: typeof ProfileMenuModuleAccess;
  ProfilePermissionAccess: typeof ProfilePermissionAccess;
  ProfileFieldsAccess: typeof ProfileFieldsAccess;
  UserMenuAccess: typeof UserMenuAccess;
  UserModuleAccess: typeof UserModuleAccess;
  UserPermissionAccess: typeof UserPermissionAccess;
  UserFieldsAccess: typeof UserFieldsAccess;

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
  Module: Module,
  Menu: Menu,
  MenuModule: MenuModule,
  ModulePermission: ModulePermission,
  PermissionField: PermissionField,
  ProfileMenuAccess: ProfileMenuAccess,
  ProfileMenuModuleAccess: ProfileMenuModuleAccess,
  ProfilePermissionAccess: ProfilePermissionAccess,
  ProfileFieldsAccess: ProfileFieldsAccess,
  UserMenuAccess: UserMenuAccess,
  UserModuleAccess: UserModuleAccess,
  UserPermissionAccess: UserPermissionAccess,
  UserFieldsAccess: UserFieldsAccess,
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
    Menu.initialize(sequelize);
    MenuModule.initialize(sequelize);
    ModulePermission.initialize(sequelize);
    PermissionField.initialize(sequelize);
    ProfileMenuAccess.initialize(sequelize);
    ProfileMenuModuleAccess.initialize(sequelize);
    ProfilePermissionAccess.initialize(sequelize);
    ProfileFieldsAccess.initialize(sequelize);
    UserMenuAccess.initialize(sequelize);
    UserModuleAccess.initialize(sequelize);
    UserPermissionAccess.initialize(sequelize);
    UserFieldsAccess.initialize(sequelize);
    
    await sequelize.sync({ force: false });
  } catch (err) {
    console.log("Errr loading models", err);
  }
}
