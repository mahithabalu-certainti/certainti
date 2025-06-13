export interface IEmailMessage {
  subject: string;
  body: {
    contentType: string;
    content: string;
  };
  toRecipients: { emailAddress: { address: string } }[];
}

type IOrganization = "EA" | "PF2.0";
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
  status: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
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
  status: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
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
  
}
