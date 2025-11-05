import dayjs from 'dayjs';
import { User } from '../admin/types/admin-user-detail';
import {
  Attachment,
  InteractionQuestionResponseType,
} from '../consultant/types';

export interface CommonApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
}
export interface ProfileApiResponse extends CommonApiResponse {
  data: ManageProfileResponse;
}

export interface VerifyOtpApiResponse extends CommonApiResponse {
  data: {
    auth_token: string;
    email: string;
  };
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
  is_edit_only?: boolean;
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

interface FieldPermission {
  field_id: string;
  field_name: string;
  field_desc: string;
  read: boolean;
  edit: boolean;
}

interface Permission {
  type: 'permission';
  menu_id: string;
  module_id: string;
  module_permission_id: string;
  menu_desc: string;
  module_desc: string;
  permission_desc: string;
  is_field_available: boolean;
  fields?: FieldPermission[];
}

// Define Module type
interface Module {
  type: 'module';
  module_id: string;
  menu_id: string;
  module_name: string;
  module_desc: string;
  menu_desc: string;
  is_enabled: boolean;
}

// Define Menu type
interface Menu {
  type: 'menu';
  menu_id: string;
  menu_name: string;
  menu_desc: string;
  is_enabled: boolean;
}

export type UserDetailPermissions = Permission | Module | Menu;

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
  TIMESHEETS = 'timesheet',
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
  // MANAGE_ACCOUNT_ACCESS = 'manage-account-access',
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_GEO_BASED_RULE = 'manage_geo-based_rule',
  IMPORT_TEMPLATE = 'import_template',
  INTERACTION_TEMPLATE = 'interaction_template',
  EMAIL_TEMPLATE = 'email_template',
  SURVEY_TEMPLATE = 'survey_template',
  TASK_TEMPLATE = 'task_template',
  CHECKLIST_TEMPLATE = 'checklist_template',
  CONFIGURATION = 'configuration',
  ACCOUNT_SETTINGS = 'manage_account_settings',
  PROJECT_SETTINGS = 'manage_project_settings',
  MANAGE_ACCOUNT_ACCESS = 'manage_account_access',
  FINANCIAL_HIGHLIGHTS = 'financial_highlights',
}

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
  USER_GROUP = 'manage_user_group',
  PROFILE_MANAGEMENT = 'profile_management',
  ATTACHMENTS = 'attachments',
  NOTES = 'notes',
  IMPORTS = 'imports',
  MANAGE_ACCOUNT_ACCESS = 'manage_account_access',
  INTERACTIONS = 'interactions',
  INTERACTION_TEMPLATES = 'interaction_templates',
  EMAIL_TEMPLATES = 'email_templates',
  CASES = 'cases',
}

export enum AllPermissions {
  PROJECTS_CREATE = 'projects_create',
  ACCOUNTS_CREATE = 'accounts_create',
  ACCOUNT_RESOURCES_CREATE = 'account_resources_create',
  PROJECTS_RESOURCES_CREATE = 'projects_resources_create',
  USER_CREATE = 'user_create',
  USER_GROUP_CREATE = 'user_group_create',
  USER_DELETE = 'user_delete',
  PROFILE_CREATE = 'profile_create',
  INTERACTION_TEMPLATES_CREATE = 'interaction_templates_create',
  INTERACTION_TEMPLATES_VIEW_EDIT = 'interaction_templates_view_edit',
  INTERACTION_TEMPLATES_EXPORT = 'interaction_templates_export',
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
  PROJECTS_TASK_EXPORT = 'projects_task_export',
  ACCOUNT_RESOURCES_EXPORT = 'account_resources_export',
  ACCOUNT_RESOURCES_COST_EXPORT = 'account_resources_cost_export',
  PROFILE_EXPORT = 'profile_export',
  ACCOUNT_RESOURCES_SKILL_EXPORT = 'account_resources_skill_export',
  PROJECTS_RESOURCES_EXPORT = 'projects_resources_export',
  USER_EXPORT = 'user_export',
  USER_GROUP_EXPORT = 'user_group_export',
  PROJECTS_EXPORT = 'projects_export',
  ACCOUNTS_EXPORT = 'accounts_export',
  PROJECTS_VIEW_EDIT = 'projects_view_edit',
  USER_VIEW_EDIT = 'user_view_edit',
  USER_GROUP_VIEW_EDIT = 'user_group_view_edit',
  PROFILE_VIEW_EDIT = 'profile_view_edit',
  ACCOUNT_TIMESHEET_VIEW = 'account_timesheet_view',
  ACCOUNT_TIMESHEET_PROJECT_VIEW = 'account_project_view',
  ACCOUNT_TIMESHEET_RESOURCE_VIEW = 'account_resource_view',
  ACCOUNT_TIMESHEET_PROJECT_TASK_VIEW = 'account_project_task_view',
  ACCOUNT_RESOURCES_VIEW_EDIT = 'account_resources_view_edit',
  ACCOUNT_RESOURCE_COST_EDIT_VIEW = 'account_resource_cost_edit_view',
  PROJECTS_RESOURCES_VIEW_EDIT = 'projects_resources_view_edit',
  ACCOUNTS_VIEW_EDIT = 'accounts_view_edit',
  PROJECTS_TASK_VIEW_EDIT = 'projects_task_view_edit',
  ACCOUNT_RESOURCE_SKILL_VIEW_EDIT = 'account_resource_skill_view_edit',
  ACCOUNT_PROJECTS_TIMELINE = 'account_projects_timeline',
  ACCOUNT_PROJECTS_OVERVIEW = 'account_projects_overview',
  ACCOUNT_ATTACHMENT_OVERVIEW = 'account_attachments_overview',
  ACCOUNT_ATTACHMENT_TIMELINE = 'account_attachments_timeline',
  ATTACHMENT_VIEW_EDIT = 'attachments_view_edit',
  ATTACHMENT_EXPORT = 'attachments_export',
  ACCOUNT_IMPORTS_OVERVIEW = 'account_imports_overview',
  ACCOUNT_IMPORTS_TIMELINE = 'account_imports_timeline',
  ACCOUNT_TIMESHEET_OVERVIEW = 'account_timesheet_overview',
  ATTACHMENT_CREATE = 'attachments_create',
  ACCOUNT_SETTINGS_VIEW_EDIT = 'account_settings_view_edit',
  PROJECT_SETTINGS_VIEW_EDIT = 'project_settings_view_edit',
  IMPORTS_VIEW_EDIT = 'imports_view_edit',
  TIMESHEET_VIEW_EDIT = 'timesheet_view_edit',
  TIMESHEET_PROJECT_TASK_VIEW_EDIT = 'timesheet_project_task_view_edit',
  IMPORTS_EXPORT = 'imports_export',
  MANAGE_ACCOUNT_ACCESS_VIEW_EDIT = 'manage_account_access_view_edit',
  PROJECT_FINANCIAL_OVERVIEW = 'project_financial_overview',
  PROJECT_FINANCIAL_TIMELINE = 'project_financial_timeline',
  ACCOUNT_FINANCIAL_OVERVIEW = 'account_financial_overview',
  ACCOUNT_FINANCIAL_TIMELINE = 'account_financial_timeline',
  PROJECT_FINANCIAL_SUMMARY_VIEW = 'project_summary_view',
  PROJECT_FINANCIAL_RESOURCE_COST_VIEW = 'project_resource_cost_view',
  PROJECT_FINANCIAL_RESOURCE_COST_EXPORT = 'project_resource_cost_export',
  ACCOUNT_FINANCIAL_SUMMARY_VIEW = 'account_summary_view',
  ACCOUNT_FINANCIAL_STATEWISE_SUMMARY_VIEW = 'account_statewise_summary_view',
  ACCOUNT_FINANCIAL_PROJECT_COST_VIEW = 'account_project_cost_view',
  ACCOUNT_FINANCIAL_PROJECT_COST_EXPORT = 'account_project_cost_export',
  ACCOUNT_FINANCIAL_RESOURCE_COST_VIEW = 'account_resource_cost_view',
  ACCOUNT_FINANCIAL_RESOURCE_COST_EXPORT = 'account_resource_cost_export',
  INTERACTIONS_OVERVIEW = 'interactions_overview',
  INTERACTIONS_TIMELINE = 'interactions_timeline',
  ACCOUNT_TIMESHEET_EXPORT = 'timesheet_export',
  INTERACTIONS_VIEW_EDIT = 'interactions_view_edit',
  INTERACTIONS_EXPORT = 'interactions_export',
  INTERACTIONS_CREATE = 'interactions_create',
  SEND_INTERACTIONS = 'send_interactions',
  TRIGGER_AI_ASSESSMENT = 'trigger_ai_assessment',
  PROJECT_TECHNICAL_SUMMARY_OVERVIEW = 'project_technical_summary_overview',
  PROJECT_TECHNICAL_SUMMARY_TIMELINE = 'project_technical_summary_timeline',
  PROJECT_TECHNICAL_SUMMARY_VIEW_EDIT = 'projects_tech_summary_view_edit',
  PROJECT_TECHNICAL_SUMMARY_EXPORT = 'projects_tech_summary_export',
  NOTES_OVERVIEW = 'notes_overview',
  NOTES_TIMELINE = 'notes_timeline',
  NOTES_VIEW_EDIT = 'notes_view_edit',
  NOTES_EXPORT = 'notes_export',
  NOTES_CREATE = 'notes_create',
  EMAIL_TEMPLATES_CREATE = 'email_templates_create',
  EMAIL_TEMPLATES_VIEW_EDIT = 'email_templates_view_edit',
  EMAIL_TEMPLATES_EXPORT = 'email_templates_export',
  CASES_OVERVIEW = 'cases_overview',
  CASES_TIMELINE = 'cases_timeline',
  CASES_VIEW_EDIT = 'cases_view_edit',
  CASES_TEAM_VIEW_EDIT = 'case_team_view_edit',
  CASES_EXPORT = 'cases_export',
  CASES_CREATE = 'cases_create',
  CASES_DELETE = 'cases_delete',
}

export interface Country {
  rid: string;
  country_name: string;
}

export type FieldTypes = string | string[] | dayjs.Dayjs | null | File;

export type FilterTypes = Record<string, string | number | boolean | string[]>;

export interface OnChange {
  fieldName: string;
  fieldValue: FieldTypes;
  isCreate?: boolean;
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
  TIMESHEET = 'timeline',
  CASES = 'cases',
  SURVEY = 'survey',
  NOTES = 'notes',
  ATTACHMENTS = 'attachments',
  INTERACTIONS = 'interactions',
  HELP = 'help',
  SETTINGS = 'settings',
  LOGOUT = 'logout',
  MANAGE_PROFILE = 'manage_profile',
  MANAGE_USER_GROUP = 'manage_user_group',
  MANAGE_USER_ACCESS = 'manage_user_access',
  MANAGE_ACCOUNT_ACCESS = 'manage_account_access',
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

export interface OverviewTabs {
  id: AllPermissions | AllMenus;
  name: string;
  hide: boolean;
  disable?: boolean;
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
  gotoExtendedPermission?: () => void;
}

export type PermissionTable = {
  rid: string;
  menu: string;
  modules: string;
  permissions: string;
  fields: string;
};

export interface UploadImportPayload {
  entity_type: string;
  file: File;
  fiscal_year?: string;
  account_rid: string;
  related_to: string;
  related_to_rid: string;
  uploaded_by_user_rid: string;
  account_r_number: string;
}

export enum Layout {
  TYPE_1 = 1,
}

export interface ExpandCollapseSelectOptions {
  group: string;
  options: {
    value: string;
    label: string;
  }[];
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

export interface EntityTypes {
  rid: string;
  entity_name: string;
}

export interface GetImportEntityTypeApiResponse extends CommonApiResponse {
  data: EntityTypes[];
}

export interface GenerateOtp {
  interaction_rid: string;
  account_rid: string;
}

export interface VerifyOtp extends GenerateOtp {
  otp: string;
}

//Interactions
export interface InteractionStatusItem {
  rid: string;
  status_name: string;
  status_type?: string | null;
}

export interface GetInteractionStatusApiResponse extends CommonApiResponse {
  data: {
    interactionStatus: InteractionStatusItem[];
  };
}
export interface InteractionlevelItem {
  rid: string;
  interaction_level_name: string;
}

export interface GetInteractionLevelApiResponse extends CommonApiResponse {
  data: {
    interactionLevel: InteractionlevelItem[];
  };
}

export interface InteractionTypeItem {
  rid: string;
  interaction_type_name: string;
}

export interface GetInteractionTypesApiResponse extends CommonApiResponse {
  data: {
    interactionTypes: InteractionTypeItem[];
  };
}

export interface InteractionResSourceItem {
  rid: string;
  response_source_name: string;
}

export interface GetInteractionResponeSourcesApiResponse
  extends CommonApiResponse {
  data: {
    responseSource: InteractionResSourceItem[];
  };
}

export interface InteractionResponseSourceItem {
  rid: string;
  response_source_name: string;
}
export interface GetInteractionResponseSourcesApiResponse
  extends CommonApiResponse {
  data: {
    responseSource: InteractionResponseSourceItem[];
  };
}

export interface InteractionQuestionUpdateRequest {
  account_rid: string;
  project_rid: string;
  project_fiscal_rid: string;
  interaction_rid: string;
  status_action: 'RESPONSE_DRAFT' | 'RESPONSE_RECEIVED';
  attachments: Attachment[];
  questions: InteractionQuestionResponseType[];
  authToken: string;
  userId: string;
  response_source: string;
}

export interface UploadAttachmentRequest {
  account_rid: string;
  project_rid: string;
  interaction_rid: string;
  file: File;
  authToken: string;
  userId: string;
}

export interface DeleteAttachmentRequest {
  file_url: string;
  authToken: string;
  userId: string;
}
