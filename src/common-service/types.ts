import dayjs from 'dayjs';
import { User } from '../admin/types/admin-user-detail';

export interface CommonApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
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
    permissions: Permissions[]
  };
}

export interface Permissions {
  rid: string,
  type: PermissionsMenus,
  name: string,
  desc: string,
  is_enabled?: boolean,
  menu_id?: string,
  module_id?: string,
  permission_id?: string,
  is_field_available?: boolean,
  field_id?: string,
  read?: boolean,
  edit?: boolean,
  fields?: Permissions[]
}

export enum PermissionsMenus {
  MENU = 'menu',
  MODULE = 'module',
  PERMISSION = 'permission',
  FIELD = 'field',
}

export enum AllModules {
  ACCOUNTS = 'accounts',
}

export enum AllPermissions {
  ACCOUNT_CREATE = 'accounts_create',
  ACCOUNT_EDIT = 'accounts_edit_update',
  ACCOUNT_DELETE = 'accounts_delete',
  ACCOUNT_EXPORT = 'accounts_export'
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
  ACCOUNTS = "accounts",
  DASHBOARD = "dashboard",
  PROJECTS = "projects",
  TIMESHEET = "timesheet",
  CASES = "cases",
  SURVEY = "survey",
  NOTES = "notes",
  ATTACHMENTS = "attachments",
  HELP = "help",
  SETTINGS = "settings",
  LOGOUT = "logout",
  MANAGE_PROFILE = "manage_profile",
  MANAGE_USER_GROUP = "manage_user_group",
  MANAGE_USER_ACCESS = "manage_user_access",
  MANAGE_SETTINGS = "manage_settings",
  MANAGE_GEO_BASED_RULE = "manage_geo-based_rule",
  IMPORT_TEMPLATE = "import_template",
  INTERACTION_TEMPLATE = "interaction_template",
  EMAIL_TEMPLATE = "email_template",
  SURVEY_TEMPLATE = "survey_template",
  TASK_TEMPLATE = "task_template",
  CHECKLIST_TEMPLATE = "checklist_template",
  MANAGE_USER = "manage_user"
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
