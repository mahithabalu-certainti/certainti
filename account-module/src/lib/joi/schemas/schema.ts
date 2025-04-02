import Joi from "joi";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const allowedTLDs = [
  "com",
  "org",
  "net",
  "info",
  "io",
  "app",
  "dev",
  "us",
  "uk",
  "ca",
  "pro",
  "top",
  "vip",
  "club",
  "social",
  "news",
  "buzz",
  "edu",
  "travel",
  "health",
  "in"
];

const accountSchema = Joi.object({
  account_id: Joi.string().max(255).required(),
  account_name: Joi.string().min(7).max(25).required(),
  account_description: Joi.string().max(500).optional(),
  status: Joi.string().valid("active", "inactive").required(),
  is_parent: Joi.boolean().required(),
  parent_account_rid: Joi.string().allow(null).optional(),
  account_currency_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .required()
    .messages({
      "string.pattern.base": "Invalid UUID format for currency RID",
      "any.required": "Account currency RID is required",
    }),
  account_country_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .required()
    .messages({
      "string.pattern.base": "Invalid UUID format for country RID",
      "any.required": "Account country RID is required",
    }),
  account_country_region_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .required()
    .messages({
      "string.pattern.base": "Invalid UUID format for region RID",
      "any.required": "Account country region RID is required",
    }),
  max_ai_interactions: Joi.number().integer().min(3).max(5).required(),
  autosend_interaction: Joi.boolean().required(),
  auto_access_rd: Joi.boolean().required(),
  fiscal_start_date: Joi.string()
    .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
    .required()
    .messages({
      "string.pattern.base":
        "fiscal_start_date must be in the format DD/MM/YYYY",
    }),

  fiscal_end_date: Joi.string()
    .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "fiscal_end_date must be in the format DD/MM/YYYY",
    }),
  interaction_cc_list: Joi.string().allow(null),
  blended_rate_fte: Joi.string()
    .pattern(/^\d{1,8}(\.\d{0,2})?$/)
    .max(10)
    .optional()
    .messages({
      "string.pattern.base":
        "blended_rate_fte must be a number with up to 10 characters, including decimal places",
      "string.max": "blended_rate_fte must be at most 10 characters long",
    }),

  blended_rate_subcon: Joi.string()
    .pattern(/^\d{1,8}(\.\d{0,2})?$/)
    .max(10)
    .optional()
    .messages({
      "string.pattern.base":
        "blended_rate_subcon must be a number with up to 10 characters, including decimal places",
      "string.max": "blended_rate_subcon must be at most 10 characters long",
    }),
  created_by: Joi.string().max(255).optional(),
  modified_by: Joi.string().max(255).optional(),
  primary_contact_name: Joi.string().min(3).max(25).required(),
  primary_contact_email: Joi.string().email().max(50).required(),
  primary_contact_number: Joi.string().max(10).required(),
  finance_poc_name: Joi.string().min(3).max(25).required(),
  finance_poc_email: Joi.string().email().max(50).required(),
  finance_poc_number: Joi.string().max(10).required(),
  industry: Joi.string().min(5).max(25).required(),
  website: Joi.string()
    .max(50)
    .allow(null)
    .optional()
    .pattern(
      new RegExp(`^https:\\/\\/[a-zA-Z0-9.-]+\\.(${allowedTLDs.join("|")})$`)
    )
    .messages({
      "string.pattern.base": `The website must be a valid HTTPS URL with a domain ending in one of the following: ${allowedTLDs.join(
        ", "
      )}.`,
    }),
  project_manager: Joi.string().email().max(50).required(),
  created_datetime: Joi.date().iso().allow(null),
  modified_datetime: Joi.date().iso().allow(null),
  annual_revenue: Joi.number().required(),
  data_storage: Joi.string()
    .valid("separate_db", "store_in_parent")
    .max(255)
    .required(),
});

const updateAccountSchema = Joi.object({
  account_rid: Joi.string().max(255).required(),
  account_id: Joi.string().max(255).required(),
  account_name: Joi.string().min(7).max(25).required(),
  r_number: Joi.string().required(),
  account_description: Joi.string().max(500).optional(),
  status: Joi.string().valid("active", "inactive").required(),
  is_parent: Joi.boolean().required(),
  parent_account_rid: Joi.string().allow(null).optional(),
  account_currency_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .required()
    .messages({
      "string.pattern.base": "Invalid UUID format for currency RID",
      "any.required": "Account currency RID is required",
    }),
  account_country_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .required()
    .messages({
      "string.pattern.base": "Invalid UUID format for country RID",
      "any.required": "Account country RID is required",
    }),
  account_country_region_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .required()
    .messages({
      "string.pattern.base": "Invalid UUID format for region RID",
      "any.required": "Account country region RID is required",
    }),
  max_ai_interactions: Joi.number().integer().min(3).max(5).required(),
  autosend_interaction: Joi.boolean().required(),
  auto_access_rd: Joi.boolean().required(),
  fiscal_start_date: Joi.string()
    .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
    .required()
    .messages({
      "string.pattern.base":
        "fiscal_start_date must be in the format DD/MM/YYYY",
    }),

  fiscal_end_date: Joi.string()
    .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "fiscal_end_date must be in the format DD/MM/YYYY",
    }),
  interaction_cc_list: Joi.string().allow(null),
  blended_rate_fte: Joi.string()
    .pattern(/^\d{1,8}(\.\d{0,2})?$/)
    .max(10)
    .optional()
    .messages({
      "string.pattern.base":
        "blended_rate_fte must be a number with up to 10 characters, including decimal places",
      "string.max": "blended_rate_fte must be at most 10 characters long",
    }),

  blended_rate_subcon: Joi.string()
    .pattern(/^\d{1,8}(\.\d{0,2})?$/)
    .max(10)
    .optional()
    .messages({
      "string.pattern.base":
        "blended_rate_subcon must be a number with up to 10 characters, including decimal places",
      "string.max": "blended_rate_subcon must be at most 10 characters long",
    }),
  modified_by: Joi.string().max(255).optional(),
  primary_contact_name: Joi.string().min(3).max(25).required(),
  primary_contact_email: Joi.string().email().max(50).required(),
  primary_contact_number: Joi.string().max(10).required(),
  finance_poc_name: Joi.string().min(3).max(25).required(),
  finance_poc_email: Joi.string().email().max(50).required(),
  finance_poc_number: Joi.string().max(10).required(),
  industry: Joi.string().min(5).max(25).required(),
  website: Joi.string()
    .max(50)
    .allow(null)
    .optional()
    .pattern(
      new RegExp(`^https:\\/\\/[a-zA-Z0-9.-]+\\.(${allowedTLDs.join("|")})$`)
    )
    .messages({
      "string.pattern.base": `The website must be a valid HTTPS URL with a domain ending in one of the following: ${allowedTLDs.join(
        ", "
      )}.`,
    }),
  project_manager: Joi.string().email().max(50).required(),
  annual_revenue: Joi.number().required(),
  data_storage: Joi.string()
    .valid("separate_db", "store_in_parent")
    .max(255)
    .required(),
});

const listAccountSchema = Joi.object({
  page: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("1"),
  limit: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("10"),
  search: Joi.string().max(255).optional(),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("createdAt"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
});

export { accountSchema, updateAccountSchema, listAccountSchema };
