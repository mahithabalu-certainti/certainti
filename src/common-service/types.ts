import dayjs from 'dayjs';

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
    rid: string,
    user_role: UserRoles,
  };
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
  Admin = 'Admin',
  AccountAdministration = 'Account Administration',
  ProjectAdministration = 'Project Administration',
  CaseAdministration = 'Case Administration',
  ProjectFinancialAdministration = 'Project Financial Administration',
  ProjectFinancialReview = 'Project Financial Review',
  ProjectTechnicalReview = 'Project Technical Review',
}
