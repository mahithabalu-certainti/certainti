export const emailTemplateMappings = [
  {
    permissionField: "r_number",
    exportField: "Template ID",
    dataField: "r_number",
  },
  {
    permissionField: "email_template_name",
    exportField: "Template Name",
    dataField: "email_template_name",
  },
  {
    permissionField: "description",
    exportField: "Description",
    dataField: "description",
  },
  {
    permissionField: "category_rid",
    exportField: "Category",
    dataField: "category_rid",
  },
  {
    permissionField: "created_by",
    exportField: "Created By",
    dataField: "created_by",
  },
  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },
  {
    permissionField: "modified_by",
    exportField: "Updated By",
    dataField: "modified_by",
  },
  {
    permissionField: "modified_datetime",
    exportField: "Updated On",
    dataField: "modified_datetime",
  },
  {
    permissionField: "status_rid",
    exportField: "Status",
    dataField: "status_name",
  },
  //{ permissionField: 'modified_by', exportField: 'Updated By', dataField: 'modified_by' },
  //{ permissionField: 'modified_datetime', exportField: 'Updated On', dataField: 'modified_datetime' }
];

export const checklistsFieldMappings = [
  {
    permissionField: "r_number",
    exportField: "Checklist ID",
    dataField: "r_number",
  },
  {
    permissionField: "checklist_name",
    exportField: "Checklist Name",
    dataField: "checklist_name",
  },
  {
    permissionField: "attachment_level",
    exportField: "Related Entity",
    dataField: "attachment_level",
  },
  {
    permissionField: "attach_to",
    exportField: "Related To ID",
    dataField: "attach_to",
  },
  {
    permissionField: "attached_to",
    exportField: "Related To Name",
    dataField: "attached_to",
  },
  {
    permissionField: "fiscal_year",
    exportField: "Fiscal Year",
    dataField: "fiscal_year",
  },

  {
    permissionField: "created_by_name",
    exportField: "Created By",
    dataField: "created_by_name",
  },
  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },
  {
    permissionField: "modified_by_name",
    exportField: "Updated By",
    dataField: "modified_by_name",
  },
  {
    permissionField: "modified_datetime",
    exportField: "Updated On",
    dataField: "modified_datetime",
  }

];

export const taskTemplateFieldMappings = [
  {
    permissionField: "r_number",
    exportField: "Template ID",
    dataField: "r_number",
  },
  {
    permissionField: "task_name",
    exportField: "Task Name",
    dataField: "task_name",
  },
  {
    permissionField: "effort_in_days",
    exportField: "Effort In Days",
    dataField: "effort_in_days",
  },
  {
    permissionField: "task_type_rid",
    exportField: "Task Type",
    dataField: "task_type_name",
  },
  {
    permissionField: "milestone_type_rid",
    exportField: "Milestone Name",
    dataField: "milestone_name",
  },
  {
    permissionField: "case_team_member_role_rid",
    exportField: "Assign Role",
    dataField: "role_name",
  },
  {
    permissionField: "priority_rid",
    exportField: "Priority",
    dataField: "priority_name",
  },
  {
    permissionField: "checklist",
    exportField: "Checklist",
    dataField: "checklist_name",
  },
  {
    permissionField: "task_category_rid",
    exportField: "Task Category",
    dataField: "category_name",
  },
  {
    permissionField: "weightage_rid",
    exportField: "Task Weightage",
    dataField: "weightage_value",
  },
  {
    permissionField: "status_rid",
    exportField: "Status",
    dataField: "status_name",
  },
  {
    permissionField: "task_description",
    exportField: "Task Description",
    dataField: "task_description",
  },
  {
    permissionField: "created_by",
    exportField: "Created By",
    dataField: "created_by_name",
  },
  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },
  {
    permissionField: "modified_by",
    exportField: "Updated By",
    dataField: "modified_by",
  },
  {
    permissionField: "modified_datetime",
    exportField: "Updated On",
    dataField: "modified_datetime",
  }
];

export const caseTaskMapping = [
  {
    permissionField: "task_name",
    exportField: "Task Name",
    dataField: "task_name",
  },
  {
    permissionField: "assigned_to",
    exportField: "Assigned To",
    dataField: "assigned_to_name",
  },
  {
    permissionField: "role_rid",
    exportField: "Role To Be Assigned",
    dataField: "role_name",
  },
  {
    permissionField: "effective_start_datetime",
    exportField: "Start Date",
    dataField: "effective_start_datetime",
  },
  {
    permissionField: "effective_end_datetime",
    exportField: "Due Date",
    dataField: "effective_end_datetime",
  },
  {
    permissionField: "status_rid",
    exportField: "Status",
    dataField: "task_status_name",
  }
]


export const activityFieldMappings = [
  {
    permissionField: "r_number",
    exportField: "Activity ID",
    dataField: "r_number",
  },
  {
    permissionField: "activity_type",
    exportField: "Activity Type",
    dataField: "activity_type",
  },
  {
    permissionField: "created_by",
    exportField: "Created By",
    dataField: "created_by_name",
  },
  {
    permissionField: "status_rid",
    exportField: "Status",
    dataField: "status_name",
  },
  {
    permissionField: "attachment_level",
    exportField: "Related Entity",
    dataField: "attachment_level",
  },
  {
    permissionField: "attached_to",
    exportField: "Related To Name",
    dataField: "attached_to",
  },
  {
    permissionField: "effective_end_datetime",
    exportField: "Due Date",
    dataField: "effective_end_datetime",
  },


];
export const taskactivityFieldMappings = [
  {
    permissionField: "r_number",
    exportField: "Task ID",
    dataField: "r_number",
  },
  {
    permissionField: "task_name",
    exportField: "Task Name",
    dataField: "task_name",
  },
  {
    permissionField: "status_rid",
    exportField: "Status",
    dataField: "status_name",
  },
  {
    permissionField: "attached_to",
    exportField: "Related To",
    dataField: "attached_to",
  },
  {
    permissionField: "created_by",
    exportField: "Created By",
    dataField: "created_by",
  },
  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },
  {
    permissionField: "description",
    exportField: "Description",
    dataField: "description",
  },
  {
    permissionField: "effective_end_datetime",
    exportField: "Due Date",
    dataField: "effective_end_datetime",
  },
  {
    permissionField: "assigned_to",
    exportField: "Assigned To",
    dataField: "assigned_to_name",
  },

];
export const emailactivityFieldMappings = [
  {
    permissionField: "r_number",
    exportField: "Email ID",
    dataField: "r_number",
  },
  {
    permissionField: "status_rid",
    exportField: "Email Status",
    dataField: "status_name",
  },
  {
    permissionField: "attached_to",
    exportField: "Related To",
    dataField: "attached_to",
  },
  {
    permissionField: "created_by_name",
    exportField: "Created By",
    dataField: "created_by_name",
  },

  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },
  {
    permissionField: "to_email",
    exportField: "Email To",
    dataField: "to_email",
  },
  {
    permissionField: "subject",
    exportField: "Email Subject",
    dataField: "subject",
  }



];
export const callactivityFieldMappings = [
  {
    permissionField: "r_number",
    exportField: "Call ID",
    dataField: "r_number",
  },
  {
    permissionField: "call_platform",
    exportField: "Call Platform",
    dataField: "call_platform",
  },
  {
    permissionField: "attached_to",
    exportField: "Related To",
    dataField: "attached_to",
  },
  {
    permissionField: "status_rid",
    exportField: "Call Status",
    dataField: "status_name",
  },
  {
    permissionField: "effective_start_datetime",
    exportField: "Call Start Date",
    dataField: "effective_start_datetime",
  },
  {
    permissionField: "effective_end_datetime",
    exportField: "Call End Date",
    dataField: "effective_end_datetime",
  },
  {
    permissionField: "created_by_name",
    exportField: "Created By",
    dataField: "created_by_name",
  },
  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },
];

export const meetingactivityFieldMappings = [
  {
    permissionField: "r_number",
    exportField: "Meeting ID",
    dataField: "r_number",
  },
  {
    permissionField: "status_rid",
    exportField: "Meeting Status",
    dataField: "status_name",
  },
  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },
  {
    permissionField: "invited_by",
    exportField: "Invited By",
    dataField: "invited_by",
  },
  {
    permissionField: "effective_start_time",
    exportField: "Meeting Start Time",
    dataField: "effective_start_time",
  },
  {
    permissionField: "effective_end_time",
    exportField: "Meeting End Time",
    dataField: "effective_end_time",
  },
  {
    permissionField: "attached_to",
    exportField: "Related To",
    dataField: "attached_to",
  }
];

export const reviewProjectsFieldMappings = [
  {
    permissionField: "project_code",
    exportField: "Project Code",
    dataField: "project_code",
  },
  {
    permissionField: "fiscal_year",
    exportField: "Fiscal Year",
    dataField: "fiscal_year",
  },
  {
    permissionField: "project_name",
    exportField: "Name",
    dataField: "project_name",
  },
  {
    permissionField: "project_type_rid",
    exportField: "Project Type",
    dataField: "project_type_rid",
  },
  {
    permissionField: "project_classification_rid",
    exportField: "Project Classification",
    dataField: "project_classification_rid",
  },
  {
    permissionField: "project_group",
    exportField: " Project Group",
    dataField: "project_group",
  },
  {
    permissionField: "industry_rid",
    exportField: " Industry",
    dataField: "industry_rid",
  },
  {
    permissionField: "primary_point_of_contact",
    exportField: "Primary Point of Contact",
    dataField: "primary_point_of_contact",
  },
  {
    permissionField: "primary_point_of_contact_email",
    exportField: "Primary Point of Contact Email",
    dataField: "primary_point_of_contact_email",
  },
  {
    permissionField: "total_fte_prj",
    exportField: "Total FTE Count",
    dataField: "total_fte_prj",
  },
  {
    permissionField: "total_subcon_prj",
    exportField: "Total Sub Con Count",
    dataField: "total_subcon_prj",
  },
  {
    permissionField: "total_nonlabor_prj",
    exportField: "Total Non Labor Count",
    dataField: "total_nonlabor_prj",
  },
  {
    permissionField: "total_effort_fte_prj",
    exportField: "Total FTE Effort",
    dataField: "total_effort_fte_prj",
  },
  {
    permissionField: "total_effort_subcon_prj",
    exportField: "Total Sub Con Effort",
    dataField: "total_effort_subcon_prj",
  },
  {
    permissionField: "total_effort_prj",
    exportField: "Total Effort in Hrs",
    dataField: "total_effort_prj",
  },
  {
    permissionField: "total_cost_fte_prj",
    exportField: "Total FTE Cost",
    dataField: "total_cost_fte_prj",
  },
  {
    permissionField: "total_cost_subcon_prj",
    exportField: "Total Sub Con Cost",
    dataField: "total_cost_subcon_prj",
  },
  {
    permissionField: "total_cost_nonlabor_prj",
    exportField: "Total Non Labor Cost",
    dataField: "total_cost_nonlabor_prj",
  },
  {
    permissionField: "total_cost_prj",
    exportField: "Total Cost",
    dataField: "total_cost_prj",
  },
  {
    permissionField: "total_resources_prj",
    exportField: "Number of Project Resource",
    dataField: "total_resources_prj",
  },
  {
    permissionField: "total_tasks",
    exportField: "Number of Project Task",
    dataField: "total_tasks",
  },
  {
    permissionField: "total_technical_summaries",
    exportField: "Number of Technical Summary Generated",
    dataField: "total_technical_summaries",
  }

];

export const casesFieldMappings = [
  {
    permissionField: "r_number",
    exportField: "Case ID",
    dataField: "r_number",
  },
  {
    permissionField: "filing_type_rid",
    exportField: "Filing Type",
    dataField: "filing_type_name",
  },
  {
    permissionField: "case_name",
    exportField: "Case Name",
    dataField: "case_name",
  },
  {
    permissionField: "fiscal_year",
    exportField: "Fiscal Year",
    dataField: "fiscal_year",
  },
  {
    permissionField: "case_owner_rid",
    exportField: "Case Owner",
    dataField: "case_owner_name",
  },
  {
    permissionField: "case_total_projects",
    exportField: "No of Projects",
    dataField: "case_total_projects",
  },
  {
    permissionField: "case_total_project_cost",
    exportField: "Total Project Cost",
    dataField: "case_total_project_cost",
  },

  {
    permissionField: "case_total_qualified_projects",
    exportField: "No of Qualified Projects",
    dataField: "case_total_qualified_projects",
  },
  {
    permissionField: "case_total_qualified_project_cost",
    exportField: "Total Qualified Project Cost",
    dataField: "case_total_qualified_project_cost",
  },

  {
    permissionField: "case_total_qre_cost",
    exportField: "Total QRE",
    dataField: "case_total_qre_cost",
  },
  {
    permissionField: "case_total_rd_cost",
    exportField: "Total RD Credits",
    dataField: "case_total_rd_cost",
  },

  // { permissionField: 'created_by', exportField: 'Created By', dataField: 'created_by' },
  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },
  {
    permissionField: "submitted_datetime",
    exportField: "Submitted On",
    dataField: "submitted_datetime",
  },
  {
    permissionField: "approved_datetime",
    exportField: "Approved On",
    dataField: "approved_datetime",
  },

  {
    permissionField: "status_rid",
    exportField: "Status",
    dataField: "status_name",
  },
  //{ permissionField: 'modified_by', exportField: 'Updated By', dataField: 'modified_by' },
  //{ permissionField: 'modified_datetime', exportField: 'Updated On', dataField: 'modified_datetime' }
];

export const casesSummaryFieldMappings = [
  {
    permissionField: "r_number",
    exportField: "Case ID",
    dataField: "r_number",
  },
  {
    permissionField: "account_name",
    exportField: "Account Name",
    dataField: "account_name",
  },
  {
    permissionField: "filing_type_rid",
    exportField: "Filing Type",
    dataField: "filing_type_name",
  },
  {
    permissionField: "case_name",
    exportField: "Case Name",
    dataField: "case_name",
  },
  {
    permissionField: "fiscal_year",
    exportField: "Fiscal Year",
    dataField: "fiscal_year",
  },
  {
    permissionField: "country_rid",
    exportField: "Country",
    dataField: "country_name",
  },
  {
    permissionField: "case_owner_rid",
    exportField: "Case Owner",
    dataField: "case_owner_name",
  },
  {
    permissionField: "case_total_project_cost",
    exportField: "Total Project Cost",
    dataField: "case_total_project_cost",
  },
  {
    permissionField: "case_total_qre_cost",
    exportField: "Total QRE",
    dataField: "case_total_qre_cost",
  },
  {
    permissionField: "case_total_rd_cost",
    exportField: "Total RD Credits",
    dataField: "case_total_rd_cost",
  },
  {
    permissionField: "case_total_projects",
    exportField: "No of Projects",
    dataField: "case_total_projects",
  },
  {
    permissionField: "case_total_qualified_projects",
    exportField: "No of Qualified Projects",
    dataField: "case_total_qualified_projects",
  },
  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },
  {
    permissionField: "status_rid",
    exportField: "Status",
    dataField: "status_name",
  },
];

export const adminCheckListMappings = [
  {
    permissionField: "r_number",
    exportField: "Checklist ID",
    dataField: "r_number",
  },
  {
    permissionField: "checklist_name",
    exportField: "Checklist Name",
    dataField: "checklist_name",
  },
  {
    permissionField: "checklist_description",
    exportField: "Checklist Description",
    dataField: "checklist_description",
  },
  {
    permissionField: "created_by",
    exportField: "Created By",
    dataField: "created_by",
  },
  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },
  {
    permissionField: "modified_by",
    exportField: "Updated By",
    dataField: "modified_by",
  },
  {
    permissionField: "modified_datetime",
    exportField: "Updated On",
    dataField: "modified_datetime",
  },
  {
    permissionField: "status_rid",
    exportField: "Status",
    dataField: "status_name",
  },
  //{ permissionField: 'modified_by', exportField: 'Updated By', dataField: 'modified_by' },
  //{ permissionField: 'modified_datetime', exportField: 'Updated On', dataField: 'modified_datetime' }
];

export const jurisdictionRuleMapping = [
  {
    permissionField: "r_number",
    exportField: "Jurisdiction Rule ID",
    dataField: "r_number",
  },
  {
    permissionField: "config_name",
    exportField: "Configuration Name",
    dataField: "config_name",
  },
  {
    permissionField: "country_rid",
    exportField: "Country",
    dataField: "country_name",
  },
  {
    permissionField: "state_rid",
    exportField: "Region",
    dataField: "state_name",
  },
  {
    permissionField: "is_federal",
    exportField: "Is Federal?",
    dataField: "is_federal",
  },
  {
    permissionField: "effective_start_date",
    exportField: "Start Date",
    dataField: "effective_start_date",
  },
  {
    permissionField: "effective_end_date",
    exportField: "End Date",
    dataField: "effective_end_date",
  },

  {
    permissionField: "created_by",
    exportField: "Created By",
    dataField: "created_by",
  },
  {
    permissionField: "created_datetime",
    exportField: "Created On",
    dataField: "created_datetime",
  },

  {
    permissionField: "modified_by",
    exportField: "Updated By",
    dataField: "modified_by",
  },
  {
    permissionField: "modified_datetime",
    exportField: "Updated On",
    dataField: "modified_datetime",
  },
  {
    permissionField: "status_rid",
    exportField: "Status",
    dataField: "status_name",
  }
];

export const dataMapperFieldMappings = [
  { permissionField: "r_number", exportField: "Form ID", dataField: "r_number" },
  { permissionField: "form_name", exportField: "Form Name", dataField: "form_name" },
  { permissionField: "is_federal", exportField: "Is Federal?", dataField: "is_federal" },
  { permissionField: "country_rid", exportField: "Country", dataField: "country_name" },
  { permissionField: "state_rid", exportField: "Region", dataField: "state_name" },
  { permissionField: "effective_from_date", exportField: "Start Date", dataField: "effective_from_date" },
  { permissionField: "effective_to_date", exportField: "End Date", dataField: "effective_to_date" },
  { permissionField: "status_rid", exportField: "Status", dataField: "status_name" },
  { permissionField: "document_name", exportField: "Document Name", dataField: "document_name" },
  { permissionField: "created_by", exportField: "Created By", dataField: "created_by" },
  { permissionField: "created_datetime", exportField: "Created On", dataField: "created_datetime" },
  { permissionField: "modified_by", exportField: "Updated By", dataField: "modified_by" },
  { permissionField: "modified_datetime", exportField: "Updated On", dataField: "modified_datetime" },
  { permissionField: "error_message", exportField: "Error Message", dataField: "error_message" }
];