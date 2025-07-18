import dayjs from 'dayjs';
import { User } from '../admin/types/admin-user-detail';

export interface CommonApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
}
export interface ProfileApiResponse extends CommonApiResponse {
  data: ManageProfileResponse;
}
export interface ManageProfileResponse {
  profile_id: string;
  profile_number: string;
  profile_name: string;
  source_profile_id: string;
  privileges: ProfileResponse[];
}
export type ProfileType = 'menu' | 'module' | 'permission' | 'field';
export interface ProfileResponse {
  rid: string;
  type: ProfileType;
  name: string;
  desc: string;
  is_enabled?: boolean;
  menu_id?: string;
  module_id?: string;
  permission_id?: string;
  field_id?: string;
  is_field_available?: boolean;
  read?: boolean;
  edit?: boolean;
  is_read_only?: boolean;
  depends_on_menu?: string[];
  depends_on_module?: string[];
  depends_on_permission?: string[];
  depended_by_menu?: string[];
  depended_by_module?: string[];
  depended_by_permission?: string[];
  updatedByDependsOn?: boolean;
  is_modified?: boolean;
  has_extended_permission?: boolean;
  hasReadExtendedPermsission?: boolean;
  hasEditExtendedPermsission?: boolean;
}

export interface UpdateExtendedPermission {
  profile_id?: string;
  user_id: string;
  profile_name?: string;
  privileges: ProfileResponse[];
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
    organisation_name: string;
    logo_url: string;
    profile_id: string;
  };
}

export interface Permissions {
  rid: string;
  type: string;
  name: string;
  desc: string;
  is_read_only?: boolean | null;
  is_enabled?: boolean;
  menu_id?: string;
  module_id?: string;
  permission_id?: string;
  is_field_available?: boolean;
  field_id?: string;
  read?: boolean;
  edit?: boolean;
  fields?: Permissions[];
  depends_on?: {
    id: string;
    type: string;
  }[];
}

export enum PermissionsMenus {
  MENU = 'menu',
  MODULE = 'module',
  PERMISSION = 'permission',
  FIELD = 'field',
}
export enum AllMenus {
  DASHBOARD = 'dashboard',
  ACCOUNTS = 'accounts',
  PROJECTS = 'projects',
  TIMESHEETS = 'timesheets',
  CASES = 'cases',
  SURVEY = 'survey',
  NOTES = 'notes',
  ATTACHMENTS = 'attachments',
  CHECKLISTS = 'checklists',
  IMPORTS = 'imports',
  MANAGE_USER = 'manage_user',
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
}

// export enum AllModules {
//   ACCOUNTS = 'accounts',
//   USER_MANAGEMENT = 'user_management',
//   PROFILE_MANAGEMENT = 'profile_management',
//   FINANCIAL_HIGHLIGHTS = 'financial_highlights',
//   DETAILS = 'details',
//   PROJECTS = 'projects',
//   INTRACTION = 'interaction',
//   CASES = 'cases',
//   ACTIVITIES = 'activities',
//   NOTES = 'notes',
//   ATTACHMENTS = 'attachments',
//   CHECKLISTS = 'checklists',
//   TIMESHEETS = 'timesheets',
//   IMPORTS = 'imports',
//   RESOURCES = 'resources',
//   PROJECT_FINANCIAL_HIGHLIGHTS = 'project_financial_highlights',
//   PROJECT_DETAILS = 'project_details',
//   PROJECT_RESOURCES = 'project_resources',
//   PROJECT_TASK = 'project_task',
//   PROJECT_INTERACTIONS = 'project_interactions',
//   PROJECT_TECHNICAL_SUMMARY = 'project_technical_summary',
//   PROJECT_CASES = 'project_cases',
//   PROJECT_ACTIVITIES = 'project_activities',
//   PROJECT_NOTES = 'project_notes',
//   PROJECT_ATTACHMENTS = 'project_attachments',
//   PROJECT_CHECKLISTS = 'project_checklists',
// }
export enum AllModules {
  ACCOUNTS = 'accounts',
  PROJECTS = 'projects',
  PROJECT_RESOURCES = 'project_resources',
  FINANCIAL_HIGHLIGHTS = 'financial_highlights',
  RESOURCES = 'resources',
  PROJECT_TASK = 'project_task',
  PROJECT_INTERACTIONS = 'project_interactions',
  RESOURCE_COST = 'resource cost',
  RESOURCE_SKILL = 'resource skill',
  PROJECT_TECHNICAL_SUMMARY = 'project_technical_summary',
  ACTIVITIES = 'activities',
  TIMELINE = 'timeline',
  USER_MANAGEMENT = 'user_management',
  PROFILE_MANAGEMENT = 'profile_management',
}

// export enum AllPermissions {
//   ACCOUNT_CREATE = 'accounts_create',
//   ACCOUNT_EDIT = 'accounts_edit_update',
//   ACCOUNT_DELETE = 'accounts_delete',
//   ACCOUNT_VIEW_ALL = 'accounts_view_all',
//   ACCOUNT_DETAILS_VIEW = 'account_details_view',
//   ACCOUNT_DETAILS_DOWNLOAD = 'account_details_download',
//   ACCOUNT_DETAILS_OVERVIEW = 'account_details_overview',
//   ACCOUNT_DETAILS_TIMELINE = 'account_details_timeline',
//   ACCOUNT_DETAILS_ADD_ACTIVITY = 'account_details_add_activity',
//   ACCOUNT_EXPORT = 'accounts_export',
//   RESOURCES_DOWNLOAD = 'account_resources_download',
//   RESOURCES_OVERVIEW = 'account_resources_view_overview',
//   RESOURCE_VIEW_TIMELINE = 'account_resources_view_timeline',
//   RESOURCE_VIEW_ALL = 'account_resources_view_all',
//   RESOURCE_VIEW = 'account_resources_resource_view',
//   RESOURCE_CREATE = 'account_resources_create',
//   RESOURCE_DELETE = 'account_resources_delete',
//   RESOURCE_EDIT = 'account_resources_edit_update',
//   RESOURCE_COST_CREATE = 'account_resources_cost_create',
//   RESOURCE_COST_VIEW = 'account_resources_resource_cost_view',
//   RESOURCE_COST_EDIT = 'account_resources_resource_cost_edit_update',
//   RESOURCE_COST_DELETE = 'account_resources_resource_cost_delete',
//   RESOURCE_COST_DOWNLOAD = 'account_resources_cost_download',
//   RESOURCE_SKILL_CREATE = 'account_resources_skill_create',
//   RESOURCE_SKILL_VIEW = 'account_resources_resource_skill_view',
//   RESOURCE_SKILL_EDIT = 'account_resources_resource_skill_edit_update',
//   RESOURCE_SKILL_DELETE = 'account_resources_resource_skill_delete',
//   RESOURCE_SKILL_DOWNLOAD = 'account_resources_skill_download',
//   USER_EXPORT = 'user_export',
//   USER_VIEW_ALL = 'user_view_all',
//   USER_VIEW_PERMISSION = 'user_view_permission',
//   USER_VIEW = 'user_view',
//   USER_CREATE = 'user_create',
//   USER_EDIT_UPDATE = 'user_edit_update',
//   USER_SUSPEND = 'user_suspend',
//   USER_ACTIVATE = 'user_activate',
//   USER_RESET_PASSWORD = 'user_reset_password',
//   USER_DELETE = 'user_delete',
//   USER_ASSIGN_PERMISSION = 'user_assign_permission',
//   PROFILE_VIEW = 'profile_view',
//   PROFILE_CREATE = 'profile_create',
//   PROFILE_EXPORT = 'profile_export',
//   PROFILE_EDIT = 'profile_edit_update',
//   PROFILE_DELETE = 'profile_delete',
//   PROFILE_VIEW_ALL = 'profile_view_all',
//   ACCOUNT_PROJECTS_OVERVIEW = 'account_projects_view_overview',
//   ACCOUNT_PROJECTS_TIMELINE = 'account_projects_view_timeline',
//   ACCOUNT_PROJECTS_VIEW_ALL = 'account_projects_view_all',
//   ACCOUNT_PROJECTS_EXPORT = 'account_project_export',
//   ACCOUNT_PROJECTS_CREATE = 'account_projects_create',
//   ACCOUNT_PROJECTS_DOWNLOAD = 'account_projects_download',
//   ACCOUNT_PROJECTS_EDIT = 'account_projects_edit_update',
//   ACCOUNT_PROJECTS_DELETE = 'account_projects_delete',
//   PROJECT_PROJECTS_DOWNLOAD = 'projects_projects_download',
//   PROJECT_PROJECTS_EXPORT = 'projects_projects_export',
//   PROJECT_PROJECTS_EDIT = 'projects_projects_edit',
//   PROJECT_PROJECTS_DELETE = 'projects_projects_delete',
//   PROJECT_DETAILS_OVERVIEW = 'project_details_overview',
//   PROJECT_DETAILS_TIMELINE = 'project_details_timeline',
// }

export enum AllPermissions {
  USER_ASSIGN_PERMISSION = 'user_assign_permission',
  PROJECTS_CREATE = 'projects_create',
  ACCOUNTS_CREATE = 'accounts_create',
  ACCOUNT_RESOURCES_CREATE = 'account_resources_create',
  PROJECTS_RESOURCES_CREATE = 'projects_resources_create',
  USER_CREATE = 'user_create',
  USER_DELETE = 'user_delete',
  PROFILE_CREATE = 'profile_create',
  PROJECTS_TASK_CREATE = 'projects_task_create',
  ACCOUNT_RESOURCES_COST_CREATE = 'account_resources_cost_create',
  ACCOUNT_RESOURCES_SKILL_CREATE = 'account_resources_skill_create',
  PROFILE_DELETE = 'profile_delete',
  PROJECTS_DELETE = 'projects_delete',
  PROJECTS_RESOURCES_DELETE = 'projects_resources_delete',
  PROJECTS_TASK_DELETE = 'projects_task_delete',
  ACCOUNTS_DELETE = 'accounts_delete',
  ACCOUNT_RESOURCES_DELETE = 'account_resources_delete',
  ACCOUNT_RESOURCE_COST_DELETE = 'account_resource_cost_delete',
  ACCOUNT_RESOURCE_SKILL_DELETE = 'account_resource_skill_delete',
  PROFILE_PERMISSION_VIEW_EDIT = 'profile_permission_view_edit',
  PROJECTS_TASK_EXPORT = 'projects_task_export',
  ACCOUNT_RESOURCES_EXPORT = 'account_resources_export',
  ACCOUNT_RESOURCES_COST_EXPORT = 'account_resources_cost_export',
  PROFILE_EXPORT = 'profile_export',
  ACCOUNT_RESOURCES_SKILL_EXPORT = 'account_resources_skill_export',
  PROJECTS_RESOURCES_EXPORT = 'projects_resources_export',
  USER_EXPORT = 'user_export',
  PROJECTS_EXPORT = 'projects_export',
  ACCOUNTS_EXPORT = 'accounts_export',
  PROJECTS_VIEW_EDIT = 'projects_view_edit',
  USER_VIEW_EDIT = 'user_view_edit',
  PROFILE_VIEW_EDIT = 'profile_view_edit',
  ACCOUNT_RESOURCES_VIEW_EDIT = 'account_resources_view_edit',
  ACCOUNT_RESOURCE_COST_EDIT_VIEW = 'account_resource_cost_edit_view',
  PROJECTS_RESOURCES_VIEW_EDIT = 'projects_resources_view_edit',
  ACCOUNTS_VIEW_EDIT = 'accounts_view_edit',
  PROJECTS_TASK_VIEW_EDIT = 'projects_task_view_edit',
  ACCOUNT_RESOURCE_SKILL_VIEW_EDIT = 'account_resource_skill_view_edit',
  USER_VIEW_PERMISSION = 'user_view_permission',
  PROFILE_PERMISSION_VIEW = 'profile_permission_view',
  ACCOUNT_PROJECTS_TIMELINE = 'account_projects_timeline',
  ACCOUNT_PROJECTS_OVERVIEW = 'account_projects_overview',
  ACCOUNT_ATTACHMENT_OVERVIEW = 'account_attachments_overview',
  ACCOUNT_ATTACHMENT_TIMELINE = 'account_attachments_timeline',
  ATTACHMENT_VIEW_EDIT = 'attachments_view_edit',
  ACCOUNT_IMPORTS_OVERVIEW = 'account_imports_overview',
  ACCOUNT_IMPORTS_TIMELINE = 'account_imports_timeline',
}

export interface Country {
  rid: string;
  country_name: string;
}

export type FieldTypes = string | string[] | dayjs.Dayjs | null | File;

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

export interface StatusItem {
  rid: string;
  status_name: string;
  status_description: string;
  status: string;
}

export interface GetStatusApiResponse extends CommonApiResponse {
  data: {
    status: StatusItem[];
  };
}

export interface DocumentType {
  rid: string;
  type_name: string;
  type_description: string | null;
  category_rid: string;
}

export interface DocumentCategory {
  rid: string;
  category_name: string;
  category_description: string | null;
}

export interface DocumentTypeResponseData {
  documentTypes: DocumentType[];
  documentCategories: DocumentCategory[];
}

export interface DocumentTypeResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: DocumentTypeResponseData;
}
