import { time } from "console";
import Joi from "joi";

const createCaseSchema = Joi.object({
  account_rid: Joi.string().required(),
  fiscal_year: Joi.number().integer().min(1900).max(2100).required(),
  status_rid: Joi.string().optional(),
  case_owner_rid: Joi.string().required(),
  case_name: Joi.string().max(255).required(),
  description: Joi.string().max(2000).optional().allow(""),
  filing_type_rid: Joi.string().required(),
  case_startdate: Joi.date().required(),
  planned_submission_date: Joi.date().required(),
  statutory_submission_date: Joi.date().required(),
  tax_liability: Joi.number().optional().allow(null,"")
});

const updateCaseSchema = Joi.object({
  case_rid: Joi.string().required(),
  account_rid: Joi.string().required(),
  fiscal_year: Joi.number().integer().min(1900).max(2100).required(),
  status_rid: Joi.string().optional(),
  case_owner_rid: Joi.string().required(),
  case_name: Joi.string().max(255).required(),
  description: Joi.string().max(2000).optional().allow(""),
  filing_type_rid: Joi.string().required(),
  case_startdate: Joi.date().required(),
  planned_submission_date: Joi.date().required(),
  statutory_submission_date: Joi.date().required(),
  country_rid: Joi.string().optional(),
  tax_liability: Joi.number().optional().allow(null,"")
});

const exportCasesAccountSchema = Joi.object({
  account_rid: Joi.string().required(),
  filters: Joi.string().default("{}"),
  fiscal_year: Joi.string().optional(),
  search: Joi.string().max(255).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  timezone: Joi.string().optional(),
});

const listCasesAccountSchema = Joi.object({
  page: Joi.string().optional().pattern(/^[0-9]+$/),
  limit: Joi.string().optional().pattern(/^[0-9]+$/),
  account_rid: Joi.string().required(),
  filters: Joi.string().default("{}"),
  fiscal_year: Joi.string().optional(),
  search: Joi.string().max(255).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
});

const listCaseSummarySchema = Joi.object({
  page: Joi.string().optional().pattern(/^[0-9]+$/),
  limit: Joi.string().optional().pattern(/^[0-9]+$/),
  filters: Joi.string().default("{}"),
  globalFilters: Joi.string().default("{}"),
  fiscal_year: Joi.string().optional(),
  search: Joi.string().max(255).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
});

const exportCaseSummarySchema = Joi.object({
  filters: Joi.string().default("{}"),
  globalFilters: Joi.string().default("{}"),
  fiscal_year: Joi.string().optional(),
  search: Joi.string().max(255).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  timezone: Joi.string().optional()
});

const createHistoricalSubmissionSchema = Joi.object({
  account_rid: Joi.string().required(),
  historical_submissions: Joi.array()
    .items(
      Joi.object({
        history_submission_rid: Joi.string().optional(),
        fiscal_year: Joi.number().required(),
        total_project: Joi.number().integer().required(),
        total_qualified_project: Joi.number().integer().required(),
        total_project_cost: Joi.number().precision(2).required(),
        total_qualified_project_cost: Joi.number().precision(2).required(),
        total_qre: Joi.number().precision(2).required(),
        total_rd_credits: Joi.number().precision(2).required(),
        annual_gross_receipts: Joi.number().precision(2).optional(),
        eid: Joi.string().optional(),
        action_type: Joi.string().valid("add", "edit", "delete").required(),
      })
    )
    .min(1)
    .required(),
});

const listHistoricalSubmissionSchema = Joi.object({
  account_rid: Joi.string().required(),
  page: Joi.string().optional().pattern(/^[0-9]+$/),
  limit: Joi.string().optional().pattern(/^[0-9]+$/),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
});

const listActivityTaskSchema = Joi.object({
  accountRid: Joi.string().required(),
  attachmentLevel: Joi.string()
        .valid('account', 'project', 'project_resource', 'project_task', 'resource', 'resource_cost', 'resource_skill', 'case')
        .required()
        .messages({
            'string.empty': 'Attachment level cannot be empty',
            'any.required': 'Attachment level is required',
            'any.only': 'Attachment level must be one of: account, project, project_resource, project_task, resource, resource_cost, resource_skill, case'
        }),
    entityId: Joi.string()
        .required()
        .messages({
            'any.required': 'Entity ID is required',
            'string.pattern.base': 'Entity ID must be a valid UUID'
        }),
  page: Joi.string().optional().pattern(/^[0-9]+$/),
  limit: Joi.string().optional().pattern(/^[0-9]+$/),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  activityType:Joi.string().default("All")
});

const exportActivitySchema = Joi.object({
  accountRid: Joi.string().required(),
  attachmentLevel: Joi.string()
        .valid('account', 'project', 'project_resource', 'project_task', 'resource', 'resource_cost', 'resource_skill', 'case')
        .required()
        .messages({
            'string.empty': 'Attachment level cannot be empty',
            'any.required': 'Attachment level is required',
            'any.only': 'Attachment level must be one of: account, project, project_resource, project_task, resource, resource_cost, resource_skill, case'
        }),
    entityId: Joi.string()
        .required()
        .messages({
            'any.required': 'Entity ID is required',
            'string.pattern.base': 'Entity ID must be a valid UUID'
        }),
  timezone: Joi.string().optional(),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  activityType:Joi.string().default("All")
});





const createCaseTeamSchema = Joi.object({
  account_rid: Joi.string().required(),
  case_rid: Joi.string().required(),
  team_members: Joi.array()
    .items(
      Joi.object({
        case_team_rid: Joi.string().optional(),
        user_rid: Joi.string().required(),
        role_rid: Joi.string().required(),
        effective_from: Joi.date().required(),
        effective_to: Joi.date().optional().allow(null, ""),
        is_primary: Joi.boolean().required(),
        status_rid: Joi.string().required(),
        action_type: Joi.string().valid("add", "edit", "delete").required(),
      })
    )
    .min(1)
    .required(),
});

const listCaseTeamSchema = Joi.object({
  page: Joi.string().optional().pattern(/^[0-9]+$/),
  limit: Joi.string().optional().pattern(/^[0-9]+$/),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  account_rid: Joi.string().required(),
  case_rid: Joi.string().required(),
  is_dropdown_list : Joi.boolean().optional()
});

const listReviewProjectSchema = Joi.object({
  page: Joi.string().optional().pattern(/^[0-9]+$/),
  limit: Joi.string().optional().pattern(/^[0-9]+$/),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
});

const sentReviewProjectSchema = Joi.object({
  search: Joi.string().max(255).optional(),
  filters: Joi.object().default({}),
  sort_by: Joi.string().optional(),
  sort_order: Joi.string().valid("ASC", "DESC").default("ASC"),
  to_email: Joi.array().items(Joi.string().email()).required(),
  cc_email: Joi.array().items(Joi.string().email()).required(),
  recipient_name: Joi.string().max(255).optional(),
  subject: Joi.string().max(500).required(),
  body_html: Joi.string().optional().allow("", null),
  project_id:Joi.array().items(Joi.string()).optional(),
  account_rid: Joi.string().required(),
  case_rid: Joi.string().required()
});

const getEmailTemplatePreviewSchema = Joi.object({ 
  category_name: Joi.string().required(),
  account_rid: Joi.string().required(),
  case_rid: Joi.string().optional()
});



const exportReviewProjectSchema = Joi.object({
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  timezone: Joi.string().optional()
});

const adminChecklistSchema = Joi.object({
  checklist_name: Joi.string().max(255).required(),
  checklist_description: Joi.string().max(2000).optional().allow(""),
  status_rid: Joi.string().required(),
  checklist_items: Joi.array()
    .items(
      Joi.object({  
        checklist_item_name: Joi.string().max(255).required(),
        checklist_item_rid: Joi.string().optional(),
        description: Joi.string().max(2000).optional().allow(""), 
        action_type: Joi.string().valid("add", "edit", "delete").required(),
      })
    )
    .min(1)
    .required(),
});

const updateAdminChecklistSchema = Joi.object({
  checklist_template_rid: Joi.string().required(),
  checklist_name: Joi.string().max(255).required(),
  checklist_description: Joi.string().max(2000).optional().allow(""),
  status_rid: Joi.string().required(),
  checklist_items: Joi.array()
    .items(
      Joi.object({  
        checklist_item_name: Joi.string().max(255).required(),
        checklist_item_rid: Joi.string().optional(),
        description: Joi.string().max(2000).optional().allow(""), 
        action_type: Joi.string().valid("add", "edit", "delete").required(),
      })
    )
    .min(1)
    .required(),
});

const updateChecklistSchema = Joi.object({
  checklist_rid: Joi.string().required(),
  account_rid: Joi.string().required(),
  attach_to: Joi.string().required(),
  attachment_level: Joi.string().required(),
  fiscal_year: Joi.number().integer().min(1900).max(2100).optional(),
  checklist_name: Joi.string().max(255).required(),
  checklist_description: Joi.string().max(2000).optional().allow(""),
  status_rid: Joi.string().required(),
  checklist_items: Joi.array()
    .items(
      Joi.object({  
        checklist_item_name: Joi.string().max(255).required(),
        checklist_item_rid: Joi.string().optional(),
        status_rid: Joi.string().required(),
        checklist_item_description: Joi.string().max(2000).optional().allow(""), 
        action_type: Joi.string().valid("add", "edit", "delete").required(),
      })
    )
    .min(1)
    .required(),
});

const createEmailTemplateSchema = Joi.object({
  template_name: Joi.string().max(255).required(),
  description: Joi.string().max(2000).optional().allow(""),
  category_rid: Joi.string().optional().allow("", null),
  subject: Joi.string().max(500).required(),
  body_html: Joi.string().optional().allow("", null),
  status_rid: Joi.string().required(),
  
});

const updateEmailTemplateSchema = Joi.object({
  email_template_rid: Joi.string().required(),
  template_name: Joi.string().max(255).required(),
  description: Joi.string().max(2000).optional().allow(""),
  category_rid: Joi.string().optional().allow("", null),
  subject: Joi.string().max(500).required(),
  body_html: Joi.string().optional().allow("", null),
  status_rid: Joi.string().required(),
});


const listEmailTemplateSchema = Joi.object({
  page: Joi.string().optional().pattern(/^[0-9]+$/),
  limit: Joi.string().optional().pattern(/^[0-9]+$/),
  filters: Joi.string().default("{}"),
  search: Joi.string().max(255).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
}); 

const exportEmailTemplateSchema = Joi.object({
  filters: Joi.string().default("{}"),
  search: Joi.string().max(255).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  timezone: Joi.string().optional()
}); 


const checklistByIdSchema = Joi.object({
  account_rid: Joi.string().required()
});

const checklistSchema = Joi.object({
  attach_to: Joi.string().required(),
  attachment_level: Joi.string().required(),
  fiscal_year: Joi.number().integer().min(1900).max(2100).optional(),
  account_rid: Joi.string().required(),
  checklist_name: Joi.string().max(255).required(),
  checklist_description: Joi.string().max(2000).optional().allow(""),
  checklist_template_rid: Joi.string().optional().allow("",null),
  status_rid: Joi.string().required(),
  checklist_items: Joi.array()
    .items(
      Joi.object({  
        checklist_item_name: Joi.string().max(255).required(),
        checklist_item_description: Joi.string().max(2000).optional().allow(""), 
        status_rid: Joi.string().optional().allow("", null),
        action_type: Joi.string().valid("add", "edit", "delete").required(),
      })
    )
    .min(1)
    .required(),
});

const listCheckListSchema = Joi.object({
    attachmentLevel: Joi.string()
        .valid('account', 'project', 'project_resource', 'project_task', 'resource', 'resource_cost', 'resource_skill', 'case')
        .required()
        .messages({
            'string.empty': 'Attachment level cannot be empty',
            'any.required': 'Attachment level is required',
            'any.only': 'Attachment level must be one of: account, project, project_resource, project_task, resource, resource_cost, resource_skill, case'
        }),
    entityId: Joi.string()
        .required()
        .messages({
            'any.required': 'Entity ID is required',
            'string.pattern.base': 'Entity ID must be a valid UUID'
        }),
    accountRid: Joi.string()
        .required()
        .messages({
            'any.required': 'Account RID is required',
            'string.pattern.base': 'Account RID must be a valid UUID'
        }),
    page: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'any.required': 'Page number is required',
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be greater than or equal to 1'
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .required()
        .messages({
            'any.required': 'Limit is required',
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be greater than or equal to 1',
            'number.max': 'Limit cannot exceed 100'
        }),
    search: Joi.string()
        .max(255)
        .allow('')
        .allow(null)
        .optional()
        .messages({
            'string.base': 'Search must be a string',
            'string.max': 'Search cannot exceed 255 characters'
        }),
    filters: Joi.string().default("{}").optional(),
    fiscalYear: Joi.number()
    .integer()
    .min(1000)
    .max(9999)
    .allow(0)
    .optional()
    .messages({
      "number.base": "Fiscal year must be a number",
      "number.min": "Fiscal year must be a 4-digit number",
      "number.max": "Fiscal year must be a 4-digit number",
      "any.required": "Fiscal year is required",
    }),
    sortBy: Joi.string().default("created_datetime").optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
})

const exportCheckListSchema = Joi.object({
    attachmentLevel: Joi.string()
        .valid('account', 'project', 'project_resource', 'project_task', 'resource', 'resource_cost', 'resource_skill', 'case')
        .required()
        .messages({
            'string.empty': 'Attachment level cannot be empty',
            'any.required': 'Attachment level is required',
            'any.only': 'Attachment level must be one of: account, project, project_resource, project_task, resource, resource_cost, resource_skill, case'
        }),
    entityId: Joi.string()
        .required()
        .messages({
            'any.required': 'Entity ID is required',
            'string.pattern.base': 'Entity ID must be a valid UUID'
        }),
    accountRid: Joi.string()
        .required()
        .messages({
            'any.required': 'Account RID is required',
            'string.pattern.base': 'Account RID must be a valid UUID'
        }),
    search: Joi.string()
        .max(255)
        .allow('')
        .allow(null)
        .optional()
        .messages({
            'string.base': 'Search must be a string',
            'string.max': 'Search cannot exceed 255 characters'
        }),
    filters: Joi.string().default("{}").optional(),
    fiscalYear: Joi.number()
    .integer()
    .min(1000)
    .max(9999)
    .allow(0)
    .optional()
    .messages({
      "number.base": "Fiscal year must be a number",
      "number.min": "Fiscal year must be a 4-digit number",
      "number.max": "Fiscal year must be a 4-digit number",
      "any.required": "Fiscal year is required",
    }),
    timezone: Joi.string().optional(),
    sortBy: Joi.string().default("created_datetime").optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
})

const jurisdictionSchema = Joi.object({
  account_rid: Joi.string().required(),
  case_rid: Joi.string(),
  is_state_level: Joi.boolean().required(),
  is_federal_level: Joi.boolean().required(),
  states: Joi.array()
    .items(Joi.string().trim().optional())
    .optional(),
  level: Joi.string().valid("account", "case").required(), 
})
  .custom((value, helpers) => {
    const { is_state_level, is_federal_level, states } = value;

    // If state level is true → states must contain at least one
    if (is_state_level) {
      if (!Array.isArray(states) || states.length === 0) {
        return helpers.error("any.missingStates");
      }
    }

    // If state level is false → states must be empty or undefined
    if (!is_state_level) {
      if (Array.isArray(states) && states.length > 0) {
        return helpers.error("any.statesNotAllowed");
      }
    }

    // If flag is 'case' then case_rid is required
    if (value.level === "case" && !value.case_rid) {
      return helpers.error("any.required");
    }

    return value;
  })
  .messages({
    "any.missingStates":
      "States must contain at least one value when state level is true.",
    "any.statesNotAllowed":
      "States are not allowed when state level is false.",
    "any.required": "{{#label}} is required",
  });

const listAdminCheckListSchema = Joi.object({
 page: Joi.string().optional().pattern(/^[0-9]+$/),
  limit: Joi.string().optional().pattern(/^[0-9]+$/),
  filters: Joi.string().default("{}"),
  search: Joi.string().max(255).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  timezone: Joi.string().optional()
}); 

const createTaskTemplateSchema = Joi.object({
  task_name: Joi.string().max(255).required(),
  effort_in_days : Joi.number().allow("").optional(),
  effective_start_datetime : Joi.string().allow("").optional(),
  effective_end_datetime : Joi.string().allow("").optional(),
  case_team_member_role_rid : Joi.string().allow("").optional(),
  checklist_template_rid : Joi.string().allow("").optional(),
  status_rid : Joi.string().allow("").optional(),
  priority_rid : Joi.string().allow("").optional(),
  milestone_template_rid : Joi.string().allow("").optional(),
  task_type_rid : Joi.string().allow("").optional(),
  task_description : Joi.string().allow("").optional()
});

const updateTaskTemplateSchema = Joi.object({
  rid : Joi.string().max(255).required(),
  task_name: Joi.string().max(255).required(),
  effort_in_days : Joi.number().allow("").optional(),
  effective_start_datetime : Joi.string().allow("").optional(),
  effective_end_datetime : Joi.string().allow("").optional(),
  case_team_member_role_rid : Joi.string().allow("").optional(),
  checklist_template_rid : Joi.string().allow("").optional(),
  status_rid : Joi.string().allow("").optional(),
  priority_rid : Joi.string().allow("").optional(),
  milestone_template_rid : Joi.string().allow("").optional(),
  task_type_rid : Joi.string().allow("").optional(),
  task_description : Joi.string().allow("").optional()
});
const exportAdminCheckListByIdSchema = Joi.object({
  timezone: Joi.string().required()
});

const createTaskSchema = Joi.object({
  task_name: Joi.string().max(255).required(),
  effective_start_datetime : Joi.string().optional(),
  effective_end_datetime : Joi.string().optional(),
  assigned_to : Joi.string().allow("").optional(),
  checklist_template_rid : Joi.string().allow("").optional(),
  status_rid : Joi.string().optional(),
  priority_rid : Joi.string().allow("").optional(),
  weightage_rid : Joi.string().allow("").optional(),
  task_category_rid : Joi.string().allow("").optional(),
  milestone_template_rid : Joi.string().optional(),
  task_type_rid : Joi.string().allow("").optional(),
  task_description : Joi.string().allow("").optional(),
  task_status_rid : Joi.string().allow("").optional(),
  account_rid : Joi.string().max(255).required(),
  case_rid : Joi.string().max(255).required(),
  tags: Joi.array()
  .items(
    Joi.object({
      tag_rid: Joi.string().required(),
      is_new_tag: Joi.boolean().required()
    })
  )
  .optional(),
  workflow_connector: Joi.alternatives().try(
    Joi.object({
      source_rid: Joi.string().required(),
      target_rid: Joi.array().items(Joi.string()).min(1).required(),
      relationship_connector_rid: Joi.string().required(),
    }).unknown(false),

    Joi.object().empty(),
    Joi.valid(null)
  ).optional()
});

const createActivitTaskSchema = Joi.object({
  task_name: Joi.string().max(255).required(),
  effort_in_days : Joi.number().optional(),
  effective_start_datetime : Joi.string().optional(),
  effective_end_datetime : Joi.string().optional(),
  checklist_template_rid : Joi.string().allow("").optional(),
  status_rid : Joi.string().optional(),
  priority_rid : Joi.string().allow("").optional(),
  description : Joi.string().allow("").optional(),
  task_status_rid : Joi.string().allow("").optional(),
  account_rid : Joi.string().max(255).required(),
  attach_to : Joi.string().required(),
  attachment_level : Joi.string().required(),
  fiscal_year : Joi.number().optional(),
  tags: Joi.array().items(
  Joi.object({
    tag_rid: Joi.string().required(),
    is_new_tag: Joi.boolean().required()
  })
).default([]).optional(),
  assigned_to : Joi.string().allow("").optional(),
  checklist_rid: Joi.string().allow("").optional()
});

const createActivityEmailSchema = Joi.object({
 subject: Joi.string().max(500).required(),
 body_html: Joi.string().required(),
 template_rid: Joi.string().optional().allow("", null),
 account_rid : Joi.string().max(255).required(),
 attach_to : Joi.string().required(),
 attachment_level : Joi.string().required(),
 fiscal_year : Joi.number().optional(),
 activity_type: Joi.string().valid("email").required(),
 to_email:Joi.string().required(),
 cc_email:Joi.string().optional(),
 email_status:Joi.string().required(),
});

const createActivityMeetingSchema = Joi.object({
 account_rid : Joi.string().max(255).required(),
 attach_to : Joi.string().required(),
 attachment_level : Joi.string().required(),
 fiscal_year : Joi.number().optional(),
 activity_type: Joi.string().valid("Meeting").required(),
 subject: Joi.string().max(500).required(),
 effective_start_date: Joi.date().required(),
 effective_end_date: Joi.date().required(),
 effective_start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
      'string.pattern.base': 'Start time must be in HH:mm format (e.g., 11:00)'
    }),
 effective_end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
      'string.pattern.base': 'End time must be in HH:mm format (e.g., 11:00)'
    }),
  invitees: Joi.string().optional(),
  meeting_participants: Joi.string().required(),
  minutes_of_meeting: Joi.string().optional().allow(""),
  time_zone: Joi.string().required(),
  recurrence_type: Joi.string().valid("none", "daily", "weekly", "monthly", "yearly").required(),
  recurrence_interval: Joi.number().optional(),
  recurrence_days: Joi.string().optional()

});

const updateActivityMeetingSchema = Joi.object({
  activity_rid: Joi.string().max(255).required(),
 account_rid : Joi.string().max(255).required(),
 attach_to : Joi.string().required(),
 attachment_level : Joi.string().required(),
 fiscal_year : Joi.number().optional(),
 activity_type: Joi.string().valid("Meeting").required(),
 subject: Joi.string().max(500).required(),
 effective_start_date: Joi.date().required(),
 effective_end_date: Joi.date().required(),
 effective_start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
      'string.pattern.base': 'Start time must be in HH:mm format (e.g., 11:00)'
    }),
 effective_end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
      'string.pattern.base': 'End time must be in HH:mm format (e.g., 11:00)'
    }),
  invitees: Joi.string().optional(),
  meeting_participants: Joi.string().required(),
  minutes_of_meeting: Joi.string().optional().allow(""),
  time_zone: Joi.string().required(),
  recurrence_type: Joi.string().valid("none", "daily", "weekly", "monthly", "yearly").required(),
  recurrence_interval: Joi.number().optional(),
  recurrence_days: Joi.string().optional(),
  deleted_file_ids : Joi.array().items(Joi.string()).optional()
});

const updateActivityCallSchema = Joi.object({
  activity_rid: Joi.string().max(255).required(),
  account_rid : Joi.string().max(255).required(),
 attach_to : Joi.string().required(),
 attachment_level : Joi.string().required(),
 fiscal_year : Joi.number().optional(),
 activity_type: Joi.string().valid("call").required(),
  subject: Joi.string().max(500).required(),
  effective_start_datetime: Joi.string().required(),
  effective_end_datetime: Joi.string().required(),
  caller_id: Joi.string().optional(),
  call_platform: Joi.string().max(255).optional().allow(""),
  minutes_of_meeting: Joi.string().optional().allow(""),
  call_participants:Joi.string().optional().allow(""),
  deleted_file_ids : Joi.array().items(Joi.string()).optional()
});

const createActivityCallSchema = Joi.object({
 account_rid : Joi.string().max(255).required(),
 attach_to : Joi.string().required(),
 attachment_level : Joi.string().required(),
 fiscal_year : Joi.number().optional(),
 activity_type: Joi.string().valid("call").required(),
  subject: Joi.string().max(500).required(),
  effective_start_datetime: Joi.string().required(),
  effective_end_datetime: Joi.string().required(),
  caller_id: Joi.string().optional(),
  call_platform: Joi.string().max(255).optional().allow(""),
  minutes_of_meeting: Joi.string().optional().allow(""),
  call_participants:Joi.string().optional().allow(""),

});

const updateActivityEmailSchema = Joi.object({
 activity_rid: Joi.string().max(255).required(),
 subject: Joi.string().max(500).required(),
 body_html: Joi.string().required(),
 template_rid: Joi.string().optional().allow("", null),
 account_rid : Joi.string().max(255).required(),
 attach_to : Joi.string().required(),
 attachment_level : Joi.string().required(),
  fiscal_year : Joi.number().optional(),
  activity_type: Joi.string().valid("email").required(),
  to_email:Joi.string().required(),
  cc_email:Joi.string().optional(),
 email_status:Joi.string().required(),
  deleted_file_ids : Joi.array().items(Joi.string()).optional()
});



const updateTaskSchema = Joi.object({
  rid : Joi.string().max(255).required(),
  task_name: Joi.string().max(255).required(),
  effective_start_datetime : Joi.string().required(),
  effective_end_datetime : Joi.string().required(),
  assigned_to : Joi.string().allow("").optional(),
  checklist_template_rid : Joi.string().allow("").optional(),
  status_rid : Joi.string().optional(),
  priority_rid : Joi.string().allow("").optional(),
  weightage_rid : Joi.string().allow("").optional(),
  task_category_rid : Joi.string().allow("").optional(),
  milestone_template_rid : Joi.string().optional(),
  task_type_rid : Joi.string().allow("").optional(),
  task_description : Joi.string().allow("").optional(),
  task_status_rid : Joi.string().allow("").optional(),
  account_rid : Joi.string().max(255).required(),
  case_rid : Joi.string().max(255).required(),
  tags: Joi.array()
  .items(
    Joi.object({
      tag_rid: Joi.string().required(),
      is_new_tag: Joi.boolean().required()
    })
  )
  .optional(),
  workflow_connector: Joi.alternatives().try(
    Joi.object({
      source_rid: Joi.string().required(),
      target_rid: Joi.array().items(Joi.string()).min(1).required(),
      relationship_connector_rid: Joi.string().required(),
    }).unknown(false),

    Joi.object().empty(),
    Joi.valid(null)                    
  ).optional()
});
export {
  createCaseSchema,
  updateCaseSchema,
  exportCasesAccountSchema,
  listCasesAccountSchema,
  listCaseSummarySchema,
  exportCaseSummarySchema,
  createCaseTeamSchema,
  listCaseTeamSchema,
  listReviewProjectSchema,
  exportReviewProjectSchema,
  adminChecklistSchema,
  checklistSchema,
  jurisdictionSchema,
  createTaskTemplateSchema,
  updateTaskTemplateSchema,
  listAdminCheckListSchema,
  updateAdminChecklistSchema,
  updateChecklistSchema,
  exportAdminCheckListByIdSchema,
  checklistByIdSchema,
  listCheckListSchema,
  exportCheckListSchema,
  createTaskSchema,
  updateTaskSchema,
  createEmailTemplateSchema,
  updateEmailTemplateSchema,
  listHistoricalSubmissionSchema,
  createHistoricalSubmissionSchema,
  listEmailTemplateSchema,
  exportEmailTemplateSchema,
  createActivitTaskSchema,
  listActivityTaskSchema,
  exportActivitySchema,
  createActivityEmailSchema,
  updateActivityEmailSchema,
  createActivityMeetingSchema,
  updateActivityMeetingSchema,
  createActivityCallSchema,
  updateActivityCallSchema,
  sentReviewProjectSchema,
  getEmailTemplatePreviewSchema
};