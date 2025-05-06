import { initSequelize } from "../config/dataSource";
import { BusinessTeams } from "./businessTeamModel";
import { Department } from "./departmentModel";
import { Profile } from "./profileModel";
import { FunctionGroup } from "./functionGroupModel";
import { ProfileModuleAccess } from "./profileModuleAccessModel";
import { UserDetails } from "./userDetailsModel";
import { User } from "./userModel";

import { ProfileMenuAccess } from "./profileMenuAccessModel";
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
import { UserApiAccessDenials } from "./userApiAccessDenialsModel";


export const models: {
  BusinessTeams: typeof BusinessTeams;
  Department: typeof Department;
  Profile: typeof Profile;
  FunctionGroup: typeof FunctionGroup;
  ProfileModuleAccess: typeof ProfileModuleAccess;
  UserDetails: typeof UserDetails;
  User: typeof User;
  Menu: typeof Menu;
  MenuModule: typeof MenuModule;
  ModulePermission: typeof ModulePermission;
  PermissionField: typeof PermissionField;
  ProfileMenuAccess: typeof ProfileMenuAccess;
  ProfilePermissionAccess: typeof ProfilePermissionAccess;
  ProfileFieldsAccess: typeof ProfileFieldsAccess;
  UserMenuAccess: typeof UserMenuAccess;
  UserModuleAccess: typeof UserModuleAccess;
  UserPermissionAccess: typeof UserPermissionAccess;
  UserFieldsAccess: typeof UserFieldsAccess;
  UserApiAccessDenials: typeof UserApiAccessDenials;

} = {
  BusinessTeams: BusinessTeams,
  Department: Department,
  Profile: Profile,
  FunctionGroup: FunctionGroup,
  ProfileModuleAccess: ProfileModuleAccess,
  User: User,
  UserDetails: UserDetails,
  Menu: Menu,
  MenuModule: MenuModule,
  ModulePermission: ModulePermission,
  PermissionField: PermissionField,
  ProfileMenuAccess: ProfileMenuAccess,
  ProfilePermissionAccess: ProfilePermissionAccess,
  ProfileFieldsAccess: ProfileFieldsAccess,
  UserMenuAccess: UserMenuAccess,
  UserModuleAccess: UserModuleAccess,
  UserPermissionAccess: UserPermissionAccess,
  UserFieldsAccess: UserFieldsAccess,
  UserApiAccessDenials: UserApiAccessDenials
};

export async function initModels() {
  try {
    const sequelize = await initSequelize();
    BusinessTeams.initialize(sequelize);
    Department.initialize(sequelize);
    Profile.initialize(sequelize);
    FunctionGroup.initialize(sequelize);
    Menu.initialize(sequelize);
    MenuModule.initialize(sequelize);
    ProfileModuleAccess.initialize(sequelize),
    User.initialize(sequelize);    
    UserDetails.initialize(sequelize),
    ModulePermission.initialize(sequelize);
    PermissionField.initialize(sequelize);
    ProfileMenuAccess.initialize(sequelize);
    ProfilePermissionAccess.initialize(sequelize);
    ProfileFieldsAccess.initialize(sequelize);
    UserMenuAccess.initialize(sequelize);
    UserModuleAccess.initialize(sequelize);
    UserPermissionAccess.initialize(sequelize);
    UserFieldsAccess.initialize(sequelize);
    UserApiAccessDenials.initialize(sequelize);
    await sequelize.sync({ force: false });
  } catch (err) {
    console.log("Errr loading models", err);
  }
}
