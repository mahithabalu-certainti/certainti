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
        effective_to: Joi.date().required(),
        action_type: Joi.string().valid("add", "edit", "delete").required(),
      })
    )
    .min(1)
    .required(),
});

const listCaseTeamSchema = Joi.object({
  account_rid: Joi.string().required(),
  case_rid: Joi.string().required(),
  page: Joi.string().optional().pattern(/^[0-9]+$/),
  limit: Joi.string().optional().pattern(/^[0-9]+$/),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
});

const adminChecklistSchema = Joi.object({
  checklist_name: Joi.string().max(255).required(),
  checklist_description: Joi.string().max(2000).optional().allow(""),
  status_rid: Joi.string().required(),
  checklist_items: Joi.array()
    .items(
      Joi.object({  
        checklist_item_name: Joi.string().max(255).required(),
        sequence_no: Joi.number().integer().min(1).required(),
        description: Joi.string().max(2000).optional().allow(""), 
        action_type: Joi.string().valid("add", "edit", "delete").required(),
      })
    )
    .min(1)
    .required(),
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
  effort_in_days : Joi.number().optional(),
  reminder_interval: Joi.number().optional(),
  effective_start_datetime : Joi.string().optional(),
  effective_end_datetime : Joi.string().optional(),
  case_team_member_role_rid : Joi.string().optional(),
  checklist_template_rid : Joi.string().allow("").optional(),
  status_rid : Joi.string().optional(),
  priority_rid : Joi.string().allow("").optional(),
  milestone_rid : Joi.string().optional()
});

const updateTaskTemplateSchema = Joi.object({
  rid : Joi.string().max(255).required(),
  task_name: Joi.string().max(255).required(),
  effort_in_days : Joi.number().optional(),
  reminder_interval: Joi.number().optional(),
  effective_start_datetime : Joi.string().optional(),
  effective_end_datetime : Joi.string().optional(),
  case_team_member_role_rid : Joi.string().optional(),
  checklist_template_rid : Joi.string().allow("").optional(),
  status_rid : Joi.string().optional(),
  priority_rid : Joi.string().allow("").optional(),
  milestone_rid : Joi.string().optional()
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
  adminChecklistSchema,
  createTaskTemplateSchema,
  updateTaskTemplateSchema,
  listAdminCheckListSchema
};