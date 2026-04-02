import Joi from "joi";

const uuidRegex =
  /^[A-Z0-9]{4}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createInteractionSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  fiscal_year: Joi.number().integer().min(1900).max(2100).required(),
  status_rid: Joi.string().required(),
  trigger_send: Joi.boolean().optional().default(false),
  questions: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().max(2000).required(),
        notes: Joi.string().max(2000).allow(""),
        is_mandatory: Joi.boolean().required(),
        action_type: Joi.string().valid("add", "update", "delete").required(),
      })
    )
    .min(1)
    .required(),
  email_info: Joi.object({
    email: Joi.string().email().optional().allow("", null),
    name: Joi.string().max(255).optional().allow("", null),
  }).optional(),
  interaction_assessment_source_rid: Joi.string().optional(),
  interaction_status_rid: Joi.string().optional()
});

const createInteractionTemplateSchema = Joi.object({
  status_rid: Joi.string().required(),
  interaction_level_rid: Joi.string().pattern(uuidRegex).required(),
  template_name: Joi.string().max(255).required(),
  questions: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().max(2000).required(),
        notes: Joi.string().max(2000).allow(""),
        is_mandatory: Joi.boolean().required(),
        action_type: Joi.string().valid("add", "update", "delete").required(),
      })
    )
    .min(1)
    .required(),
});

const createAccountInteractionSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  interaction_level_rid: Joi.string().pattern(uuidRegex).required(),
  trigger_send: Joi.boolean().optional().default(false),
  fiscal_year: Joi.number().integer().optional(),
  projects: Joi.array()
    .items(
      Joi.object({
        project_rid: Joi.string().pattern(uuidRegex).required(),
        project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
        fiscal_year: Joi.number().integer().min(1900).required(),
      })
    )
    .optional(),
  status_rid: Joi.string().required(),
  questions: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().max(2000).required(),
        notes: Joi.string().max(2000).allow(""),
        is_mandatory: Joi.boolean().required(),
        action_type: Joi.string().valid("add", "update", "delete").required(),
      })
    )
    .min(1)
    .required(),
  email_info: Joi.object({
    email: Joi.string().email().optional().allow("", null),
    name: Joi.string().max(255).optional().allow("", null),
  }).optional(),
  interaction_assessment_source_rid: Joi.string().optional(),
  interaction_status_rid: Joi.string().optional()
});
const listAccountInteractionSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  page: Joi.string().optional()
    .pattern(/^[0-9]+$/)
  ,
  limit: Joi.string().optional()
    .pattern(/^[0-9]+$/)
  ,
  filters: Joi.string().default("{}"),
  sort_by: Joi.string().optional(),
  sort_order: Joi.string().valid("ASC", "DESC").default("ASC"),
});

const listInboxMessagesSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  limit: Joi.string().optional().pattern(/^[0-9]+$/).default("50"),
});

const listMailboxFoldersSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
});

const listMailboxMessagesSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  folderId: Joi.string().optional().allow("", null),
  folderPath: Joi.string().optional().allow("", null),
  limit: Joi.string().optional().pattern(/^[0-9]+$/).default("50"),
  pageToken: Joi.string().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
});

const inboxMessageDetailsSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  messageId: Joi.string().required(),
});

const inboxAttachmentDetailsSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  messageId: Joi.string().required(),
  attachmentId: Joi.string().required(),
});

const sendInteractionSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  is_interaction_followup: Joi.boolean().optional().default(false),
  is_interaction_reinitiated: Joi.boolean().optional().default(false),
  interactions: Joi.array()
    .items(
      Joi.object({
        interaction_rid: Joi.string().pattern(uuidRegex).required(),
        project_fiscal_rid: Joi.string().pattern(uuidRegex).optional().allow(null, ""),
        interaction_level: Joi.string().optional().default("Project")
      })
    )
    .min(1)
    .required(),
  email_info: Joi.object({
    email: Joi.string().email().optional().allow("", null),
    name: Joi.string().max(255).optional().allow("", null),
  }).required(),
});

const sendAccountInteractionSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  type: Joi.string().valid("Account", "Project").optional().default("Account"),
  projects: Joi.array()
    .items(
      Joi.object({
        project_rid: Joi.string().pattern(uuidRegex).required(),
        project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
        fiscal_year: Joi.number().integer().min(1900).max(2100).required(),
      })
    )
    .min(1)
    .required(),
});
const getInteractionStatusSchema = Joi.object({
  status_scope: Joi.string().optional(),
  current_status: Joi.string().optional(),
  reminder_specific_list: Joi.boolean().optional(),
});


const updateAccountInteractionSchema = Joi.object({
  account_interaction_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  trigger_send: Joi.boolean().optional().default(false),
  questions: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().pattern(uuidRegex).allow(null, ""),
        question: Joi.string().max(2000).required(),
        notes: Joi.string().max(2000).allow(""),
        is_mandatory: Joi.boolean().required(),
        action_type: Joi.string().valid("add", "edit", "delete").required(),
      })
    )
    .min(1)
    .required(),
  email_info: Joi.object({
    email: Joi.string().email().optional().allow("", null),
    name: Joi.string().max(255).optional().allow("", null),
  }).optional()
});
const updateInteractionSchema = Joi.object({
  interaction_rid: Joi.string().pattern(uuidRegex).required(),
  interaction_level_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_rid: Joi.string().pattern(uuidRegex).optional(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).optional(),
  fiscal_year: Joi.number().integer().min(1900).max(2100).optional(),
  status_rid: Joi.string().required(),
  questions: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().pattern(uuidRegex).allow(null, ""),
        question: Joi.string().max(2000).required(),
        notes: Joi.string().max(2000).allow(""),
        is_mandatory: Joi.boolean().required(),
        action_type: Joi.string().valid("add", "edit", "delete").required(),
      })
    )
    .min(1)
    .required(),
  email_info: Joi.object({
    email: Joi.string().email().optional().allow("", null),
    name: Joi.string().max(255).optional().allow("", null),
  }).optional(),
  trigger_send: Joi.boolean().optional().default(false)
});

const updateInteractionResponseSchema = Joi.object({
  interaction_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_rid: Joi.string().pattern(uuidRegex).optional().allow(null, ""),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required().allow(null, ""),
  status_action: Joi.string().required(),
  response_source: Joi.string().optional().default("Manual"),
  attachments: Joi.array().items(
    Joi.object({
      fileName: Joi.string().max(255).required(),
      fileSize: Joi.number().required(),
      fileType: Joi.string().max(20).required(),
      fileUrl: Joi.string().uri().required(),
    })
  ).optional(),
  questions: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().pattern(uuidRegex).allow(null, ""),
        question: Joi.string().required(),
        response: Joi.string().allow(""),
        attachments: Joi.array().items(
          Joi.object({
            fileName: Joi.string().max(255).required(),
            fileSize: Joi.number().required(),
            fileType: Joi.string().max(20).required(),
            fileUrl: Joi.string().uri().required(),
          })
        ).required(),
      })
    )
    .min(1)
    .required(),
});


const listTechnicalSummarySchema = Joi.object({
  tech_summary_rid: Joi.string().pattern(uuidRegex).optional(),
  account_rid: Joi.string().pattern(uuidRegex).optional(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  case_rid : Joi.string().pattern(uuidRegex).optional().allow('')
});

const updateTechSummaryContextSchema = Joi.object({
  tech_summary_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  summary_context: Joi.string().required(),
});

const saveRefineSummarySchema = Joi.object({
  tech_summary_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  technical_summary: Joi.any().required(),
});

const refineSummarySchema = Joi.object({
  tech_summary_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  refinement_prompt: Joi.string().required(),
  existing_summary: Joi.any().required(),
});

const listAllTechnicalSummarySchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).optional(),
  page: Joi.string().optional()
    .pattern(/^[0-9]+$/)
  ,
  limit: Joi.string().optional()
    .pattern(/^[0-9]+$/)
  ,
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  case_rid: Joi.string().optional().allow(""),
  summaryType: Joi.string().optional().allow("")
});

const exportTechnicalSummarySchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).optional(),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  timezone: Joi.string().optional(),
  case_rid: Joi.string().optional().allow(""),
  summaryType: Joi.string().optional().allow("")
});

const listInteractionTemplatesSchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  filters: Joi.object().default("{}"),
  sortBy: Joi.string().optional(),
  apiSource: Joi.string().optional(),
  templateType: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  timezone: Joi.string().optional()
});


const updateInteractionTemplateSchema = Joi.object({
  template_rid: Joi.string().pattern(uuidRegex).required(),
  interaction_level_rid: Joi.string().pattern(uuidRegex).required(),
  template_name: Joi.string().max(255).required(),
  status_rid: Joi.string().required(),
  questions: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().pattern(uuidRegex).allow(null, ""),
        question: Joi.string().max(2000).required(),
        notes: Joi.string().max(2000).allow(""),
        is_mandatory: Joi.boolean().required(),
        action_type: Joi.string().valid("add", "edit", "delete").required(),
      })
    )
    .min(1)
    .required(),
});


const listAiAssessmentAuditSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).optional(),
  case_rid: Joi.string().pattern(uuidRegex).optional(),
  page: Joi.number().optional().default(1),
  limit: Joi.number().optional(),
  filters: Joi.object().optional().default({}),
  sortBy: Joi.string().optional().default("created_datetime"),
  sortOrder: Joi.string().valid("ASC", "DESC").optional().default("DESC"),
  search: Joi.string().optional().allow(""),
  timezone: Joi.string().optional()
});

export {
  createInteractionSchema,
  createAccountInteractionSchema,
  listAccountInteractionSchema,
  listInboxMessagesSchema,
  listMailboxFoldersSchema,
  listMailboxMessagesSchema,
  inboxMessageDetailsSchema,
  inboxAttachmentDetailsSchema,
  updateInteractionSchema,
  updateInteractionResponseSchema,
  listTechnicalSummarySchema,
  getInteractionStatusSchema,
  sendInteractionSchema,
  updateTechSummaryContextSchema,
  listAllTechnicalSummarySchema,
  exportTechnicalSummarySchema,
  sendAccountInteractionSchema,
  updateAccountInteractionSchema,
  createInteractionTemplateSchema,
  listInteractionTemplatesSchema,
  updateInteractionTemplateSchema,
  saveRefineSummarySchema,
  refineSummarySchema,
  listAiAssessmentAuditSchema
};
