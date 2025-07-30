export interface IEmailMessage {
  subject: string;
  body: {
    contentType: string;
    content: string;
  };
  toRecipients: { emailAddress: { address: string } }[];
}

type IOrganization = "EA" | "TRD365";
type IStatus = "active" | "inactive";

export interface IUserData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  mobile?: string;
  user_name?: string;
  profile_id: string;
  role: string;
  status_rid: string;
  street: string;
  city_rid: string;
  region_rid: string;
  zip_code: string;
  country_rid: string;
  designation?: string;
  manager_name?: string;
  manager_email?: string;
  manager_employee_id?: string;
  employee_id?: string;
  employment_date?: Date;
  department_id?: string;
  function_group_id?: string;
  phone?: string;
  created_by: string;
  organization: string;
  is_consultant_firm:boolean;
  org_id:string;
}

export interface IUpdateUserData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  profile_id: string;
  status_rid: string;
  street: string;
  city_rid: string;
  region_rid: string;
  zip_code: string;
  country_rid: string;
  mobile?: string;
  role: string;
  designation?: string;
  manager_name?: string;
  manager_email?: string;
  manager_employee_id?: string;
  employee_id?: string;
  employment_date?: Date;
  department_id?: string;
  function_group_id?: string;
  organization: string
  phone?: string;
  modified_by: string;
  is_consultant_firm:boolean;
  org_id:string;
  removeGroupMemberships?:boolean | false;
}

export interface ProjectAccessView {
  rid: string;
  project_name: string;
  account_name:string;
  account_rid: string;
  has_project_enabled: boolean;
  access_type: 'INCLUDE' | 'EXCLUDE' | null;
  has_access: boolean; // Derived boolean field
}



