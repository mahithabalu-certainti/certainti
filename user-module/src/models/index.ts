import { initSequelize } from "../config/dataSource";
import { BusinessTeams } from "./businessTeamModel";
import { Department } from "./departmentModel";
import { Profile, setupProfileSequence} from "./profileModel";
import { FunctionGroup } from "./functionGroupModel";
import { ProfileModuleAccess } from "./profileModuleAccessModel";
import { UserDetails } from "./userDetailsModel";
import { User, setupUserSequence } from "./userModel";

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
import { ProfileTimeline } from "./profileTimelineModel";
import {UserExtendedPermissionTimeline } from "./userExtendedPermissionTimelineModel"

import { ProfileMenuAccessHistory } from "./profileMenuAccessHistoryModel";
import { ProfileModuleAccessHistory } from "./profileModuleAccessHistoryModel";
import { ProfilePermissionAccessHistory } from "./profilePermissionAccessHistoryModel";
import { ProfileFieldsAccessHistory } from "./profileFieldsAccessHistoryModel";
import { UserMenuAccessHistory } from "./userMenuAccessHistoryModel";
import { UserModuleAccessHistory } from "./userModuleAccessHistoryModel";
import { UserPermissionAccessHistory } from "./userPermissionAccessHistoryModel";
import { UserFieldsAccessHistory } from "./userFieldsAccessHistoryModel";
import { ProfileHistory } from "./profileHistoryModel";
import { OrganizationLicenses } from "./organisationLicense";


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
  ProfileTimeline: typeof ProfileTimeline;
  ProfileMenuAccessHistory: typeof ProfileMenuAccessHistory;
  ProfileModuleAccessHistory: typeof ProfileModuleAccessHistory;
  ProfilePermissionAccessHistory: typeof ProfilePermissionAccessHistory;
  ProfileFieldsAccessHistory: typeof ProfileFieldsAccessHistory;
  UserMenuAccessHistory: typeof UserMenuAccessHistory;
  UserModuleAccessHistory: typeof UserModuleAccessHistory;
  UserPermissionAccessHistory: typeof UserPermissionAccessHistory;
  UserFieldsAccessHistory: typeof UserFieldsAccessHistory;
  ProfileHistory: typeof ProfileHistory;
  UserExtendedPermissionTimeline: typeof UserExtendedPermissionTimeline;
  OrganizationLicenses:typeof OrganizationLicenses;

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
  UserApiAccessDenials: UserApiAccessDenials,
  ProfileTimeline: ProfileTimeline,
  ProfileMenuAccessHistory: ProfileMenuAccessHistory,
  ProfileModuleAccessHistory: ProfileModuleAccessHistory,
  ProfilePermissionAccessHistory: ProfilePermissionAccessHistory,
  ProfileFieldsAccessHistory: ProfileFieldsAccessHistory,
  UserMenuAccessHistory: UserMenuAccessHistory,
  UserModuleAccessHistory: UserModuleAccessHistory,
  UserPermissionAccessHistory: UserPermissionAccessHistory,
  UserFieldsAccessHistory: UserFieldsAccessHistory,
  ProfileHistory: ProfileHistory,
  UserExtendedPermissionTimeline:UserExtendedPermissionTimeline,
  OrganizationLicenses:OrganizationLicenses
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
    ProfileTimeline.initialize(sequelize);
    ProfileMenuAccessHistory.initialize(sequelize);
    ProfileModuleAccessHistory.initialize(sequelize);
    ProfilePermissionAccessHistory.initialize(sequelize);
    ProfileFieldsAccessHistory.initialize(sequelize);
    UserMenuAccessHistory.initialize(sequelize);
    UserModuleAccessHistory.initialize(sequelize);
    UserPermissionAccessHistory.initialize(sequelize);
    UserFieldsAccessHistory.initialize(sequelize);
    ProfileHistory.initialize(sequelize);
    UserExtendedPermissionTimeline.initialize(sequelize)
    OrganizationLicenses.initialize(sequelize)
    Object.values(models).forEach((model: any) => { 
      if (model.associate) { 
        model.associate(models); 
      } 
    });
    //await sequelize.sync({ force: false });
    //await setupProfileSequence(sequelize);
    ///await setupUserSequence(sequelize);
  } catch (err) {
    console.log("Errr loading models", err);
  }
}
