export interface IEmailMessage {
  subject: string;
  body: {
    contentType: string;
    content: string;
  };
  toRecipients: { emailAddress: { address: string } }[];
}

export interface IUserData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  full_name?: string;
  email: string;
  mobile?: string;
  user_name: string;
  profile_id: string;
  role: string;
  status: "active" | "inactive";
  street: string;
  city: number;
  state: number;
  zip_code: string;
  country: number;
  designation?: string;
  manager_name?: string;
  manager_email?: string;
  manager_employee_id?: string;
  employee_id?: string;
  employment_date?: Date;
  department_id?: string;
  function_group_id?: string;
  created_by: string;
  organization: "platform2.0" | "platform1.0";
}

export interface IUpdateUserData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  profile_id: string;
  status: "active" | "inactive";
  street: string;
  city: number;
  state: number;
  zip_code: string;
  country: number;
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
  organization: "platform2.0" | "platform1.0";
  updated_by: string;
}
