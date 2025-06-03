import dayjs from 'dayjs';
import { User } from '../admin/types/admin-user-detail';
import { Privilege } from '../admin/types';

export interface CommonApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
}
export interface CommonProfileApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: createProfileData;
}
export interface createProfileData {
  profile_id: string;
  profile_number: string;
  profile_name: string;
  source_profile_id: string;
  privileges: Privilege[];
}
export interface UpdateExtendedPermission {
  profile_id?: string;
  user_id: string;
  profile_name?: string;
  privileges: Privilege[];
}
export interface GetAllCountriesApiResponse extends CommonApiResponse {
  data: {
    country: Country[];
  };
}

export interface GetCurrentUserRoleApiResponse extends CommonApiResponse {
  data: {
    rid: string;
    user_role: UserRoles;
    user_id: string;
    permissions: Permissions[];
  };
}

export interface Permissions {
  rid: string;
  type: PermissionsMenus;
  name: string;
  desc: string;
  is_enabled?: boolean;
  menu_id?: string;
  module_id?: string;
  permission_id?: string;
  is_field_available?: boolean;
  field_id?: string;
  read?: boolean;
  edit?: boolean;
  fields?: Permissions[];
}

export enum PermissionsMenus {
  MENU = 'menu',
  MODULE = 'module',
  PERMISSION = 'permission',
  FIELD = 'field',
}

export enum AllModules {
  ACCOUNTS = 'accounts',
  USER_MANAGEMENT = 'user_management',
  PROFILE_MANAGEMENT = 'profile_management',
  FINANCIAL_HIGHLIGHTS = 'financial_highlights',
  DETAILS = 'details',
  PROJECTS = 'projects',
  INTRACTION = 'interaction',
  CASES = 'cases',
  ACTIVITIES = 'activities',
  NOTES = 'notes',
  ATTACHMENTS = 'attachments',
  CHECKLISTS = 'checklists',
  TIMESHEETS = 'timesheets',
  IMPORTS = 'imports',
  RESOURCES = 'resources',
  PROJECT_FINANCIAL_HIGHLIGHTS = 'project_financial_highlights',
  PROJECT_DETAILS = 'project_details',
  PROJECT_RESOURCES = 'project_resources',
  PROJECT_TASK = 'project_task',
  PROJECT_INTERACTIONS = 'project_interactions',
  PROJECT_TECHNICAL_SUMMARY = 'project_technical_summary',
  PROJECT_CASES = 'project_cases',
  PROJECT_ACTIVITIES = 'project_activities',
  PROJECT_NOTES = 'project_notes',
  PROJECT_ATTACHMENTS = 'project_attachments',
  PROJECT_CHECKLISTS = 'project_checklists'
}

export enum AllPermissions {
  ACCOUNT_CREATE = 'accounts_create',
  ACCOUNT_EDIT = 'accounts_edit_update',
  ACCOUNT_DELETE = 'accounts_delete',
  ACCOUNT_VIEW_ALL = 'accounts_view_all',
  ACCOUNT_DETAILS_VIEW = 'account_details_view',
  ACCOUNT_DETAILS_DOWNLOAD = 'account_details_download',
  ACCOUNT_DETAILS_OVERVIEW = 'account_details_overview',
  ACCOUNT_DETAILS_TIMELINE = 'account_details_timeline',
  ACCOUNT_EXPORT = 'accounts_export',
  RESOURCES_DOWNLOAD = 'account_resources_download',
  RESOURCES_OVERVIEW = 'account_resources_view_overview',
  RESOURCE_VIEW_TIMELINE = 'account_resources_view_timeline',
  RESOURCE_VIEW_ALL = 'account_resources_view_all',
  RESOURCE_VIEW = 'account_resources_resource_view',
  RESOURCE_CREATE = 'account_resources_create',
  RESOURCE_DELETE = 'account_resources_delete',
  RESOURCE_EDIT = 'account_resources_edit_update',
  RESOURCE_COST_CREATE = 'account_resources_cost_create',
  RESOURCE_COST_VIEW = 'account_resources_resource_cost_view',
  RESOURCE_COST_EDIT = 'account_resources_resource_cost_edit_update',
  RESOURCE_COST_DELETE = 'account_resources_resource_cost_delete',
  RESOURCE_COST_DOWNLOAD = 'account_resources_cost_download',
  RESOURCE_SKILL_CREATE = 'account_resources_skill_create',
  RESOURCE_SKILL_VIEW = 'account_resources_resource_skill_view',
  RESOURCE_SKILL_EDIT = 'account_resources_resource_skill_edit_update',
  RESOURCE_SKILL_DELETE = 'account_resources_resource_skill_delete',
  RESOURCE_SKILL_DOWNLOAD = 'account_resources_skill_download',
  USER_EXPORT = 'user_export',
  USER_VIEW_ALL = 'user_view_all',
  USER_VIEW_PERMISSION = 'user_view_permission',
  USER_VIEW = 'user_view',
  USER_CREATE = 'user_create',
  USER_EDIT_UPDATE = 'user_edit_update',
  USER_SUSPEND = 'user_suspend',
  USER_ACTIVATE = 'user_activate',
  USER_RESET_PASSWORD = 'user_reset_password',
  USER_DELETE = 'user_delete',
  USER_ASSIGN_PERMISSION = 'user_assign_permission',
  PROFILE_VIEW = 'profile_view',
  PROFILE_CREATE = 'profile_create',
  PROFILE_EXPORT = 'profile_export',
  PROFILE_EDIT = 'profile_edit_update',
  PROFILE_DELETE = 'profile_delete',
  PROFILE_VIEW_ALL = 'profile_view_all',
  ACCOUNT_PROJECTS_OVERVIEW = 'account_projects_view_overview',
  ACCOUNT_PROJECTS_TIMELINE = 'account_projects_view_timeline',
  ACCOUNT_PROJECTS_VIEW_ALL = 'account_projects_view_all',
  ACCOUNT_PROJECTS_CREATE = 'account_projects_create',
  ACCOUNT_PROJECTS_DOWNLOAD = 'account_projects_download',
  ACCOUNT_PROJECTS_EDIT = 'account_projects_edit_update',
  ACCOUNT_PROJECTS_DELETE = 'account_projects_delete',
  PROJECT_PROJECTS_DOWNLOAD = 'projects_projects_download',
  PROJECT_PROJECTS_EXPORT = 'projects_projects_export',
  PROJECT_PROJECTS_EDIT = 'projects_projects_edit',
  PROJECT_PROJECTS_DELETE = 'projects_projects_delete',
  PROJECT_DETAILS_OVERVIEW = 'project_details_overview',
  PROJECT_DETAILS_TIMELINE = 'project_details_timeline',
}

export interface Country {
  rid: string;
  country_name: string;
}

export type FieldTypes = string | string[] | dayjs.Dayjs | null;

export interface OnChange {
  fieldName: string;
  fieldValue: FieldTypes;
}

export enum UserRoles {
  Admin = 'Super Admin',
  AccountAdministration = 'Account Administration',
  ProjectAdministration = 'Project Administration',
  CaseAdministration = 'Case Administration',
  ProjectFinancialAdministration = 'Project Financial Administration',
  ProjectFinancialReview = 'Project Financial Review',
  ProjectTechnicalReview = 'Project Technical Review',
}

export enum MenuOption {
  ACCOUNTS = 'accounts',
  DASHBOARD = 'dashboard',
  PROJECTS = 'projects',
  TIMESHEET = 'timesheet',
  CASES = 'cases',
  SURVEY = 'survey',
  NOTES = 'notes',
  ATTACHMENTS = 'attachments',
  HELP = 'help',
  SETTINGS = 'settings',
  LOGOUT = 'logout',
  MANAGE_PROFILE = 'manage_profile',
  MANAGE_USER_GROUP = 'manage_user_group',
  MANAGE_USER_ACCESS = 'manage_user_access',
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_GEO_BASED_RULE = 'manage_geo-based_rule',
  IMPORT_TEMPLATE = 'import_template',
  INTERACTION_TEMPLATE = 'interaction_template',
  EMAIL_TEMPLATE = 'email_template',
  SURVEY_TEMPLATE = 'survey_template',
  TASK_TEMPLATE = 'task_template',
  CHECKLIST_TEMPLATE = 'checklist_template',
  MANAGE_USER = 'manage_user',
}

export type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

export interface CheckError {
  isError: boolean;
}

export interface AxiosErrorMsg {
  message?: string;
  response?: {
    data?: {
      statusMessage?: string;
      message?: string;
    };
  };
}

export interface UserDetail {
  data?: User;
  loading: boolean;
}

export interface UploadImportPayload {
  entity_type: string;
  file: File;
  fiscal_year: string;
  account_rid: string;
  related_to: string;
  related_to_rid: string;
  uploaded_by_user_rid: string;
  account_r_number: string;
}

export enum Layout {
  TYPE_1 = 1,
}
