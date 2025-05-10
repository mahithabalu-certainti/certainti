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
  "in",
];

const accountSchema = Joi.object({
  account_id: Joi.string().max(255).allow(null).optional(),
  account_name: Joi.string().min(7).max(25).required(),
  account_description: Joi.string().max(500).optional().allow("").allow(null),
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
    .pattern(/^\d{2}\/\d{2}$/)
    .required()
    .messages({
      "string.pattern.base":
        "fiscal_start_date must be in the format DD/MM",
    }),

  fiscal_end_date: Joi.string()
    .pattern(/^\d{2}\/\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "fiscal_end_date must be in the format DD/MM",
    }),
  interaction_cc_list: Joi.string().allow(null),
  blended_rate_fte: Joi.string()
    .pattern(/^\d{1,10}$/)
    .max(10)
    .optional()
    .messages({
      "string.pattern.base":"Blended Rate - FTE must be a whole number with up to 10 digits",
      "string.max": "Blended Rate - FTE must not exceed 10 digits"
    })
    .allow(null)
    .allow(""),

  blended_rate_subcon: Joi.string()
    .pattern(/^\d{1,10}$/)
    .max(10)
    .optional()
    .messages({
      "string.pattern.base":"Blended Rate - SubCon must be a whole number with up to 10 digits",
      "string.max": "Blended Rate - SubCon must not exceed 10 digits",
    })
    .allow(null)
    .allow(""),
  created_by: Joi.string().max(255).optional(),
  modified_by: Joi.string().max(255).optional(),
  industry_rid: Joi.string().required(),
  industry_name: Joi.string().min(5).optional(),
  business_details: Joi.string().min(1).max(2000).required(),
  comments: Joi.string().min(1).max(2000).optional(),
  website: Joi.string()
    .max(50)
    .allow(null)
    .optional()
    .pattern(/^(https?:\/\/)[a-zA-Z0-9.-]+(:[0-9]+)?(\/[a-zA-Z0-9.-]*)*\/?$/)
    .messages({
      "string.pattern.base": `Website URL must begin with 'http' or 'https://'`,
      "string.max": "The website must not exceed 255 characters."
    }),
  project_manager: Joi.string().min(2).max(128).required(),
  created_datetime: Joi.date().iso().allow(null),
  modified_datetime: Joi.date().iso().allow(null),
  annual_revenue: Joi.number().required(),
  data_storage: Joi.string()
    .valid("separate_db", "store_in_parent")
    .max(255)
    .required(),
    key_contacts: Joi.array()
    .items(
      Joi.object({
        key_contact_name: Joi.string().min(2).max(128).required(),
        key_contact_email: Joi.string().email().min(3).max(125).required(),
        key_contact_role_rid: Joi.string().required(),
        is_primary_contact: Joi.boolean().required(),
        include_in_communication: Joi.boolean().required(),
        status: Joi.string().valid('active', 'inactive').required(),
        action_type: Joi.string().valid('add').required()
      })
    )
    .optional()
});

const updateAccountSchema = Joi.object({
  account_rid: Joi.string().max(255).required(),
  account_id: Joi.string().max(255).required(),
  account_name: Joi.string().min(7).max(125).required(),
  r_number: Joi.string().required(),
  account_description: Joi.string().max(500).optional().allow("").allow(null),
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
    .pattern(/^\d{2}\/\d{2}$/)
    .required()
    .messages({
      "string.pattern.base":
        "fiscal_start_date must be in the format DD/MM",
    }),

  fiscal_end_date: Joi.string()
    .pattern(/^\d{2}\/\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "fiscal_end_date must be in the format DD/MM",
    }),
  interaction_cc_list: Joi.string().allow(null),
  blended_rate_fte: Joi.string()
    .pattern(/^\d{1,10}$/)
    .max(10)
    .optional()
    .messages({
      "string.pattern.base":"Blended Rate - FTE must be a whole number with up to 10 digits",
      "string.max": "Blended Rate - FTE must not exceed 10 digits",
    })
    .allow(null)
    .allow(""),

  blended_rate_subcon: Joi.string()
    .pattern(/^\d{1,10}$/)
    .max(10)
    .optional()
    .messages({
      "string.pattern.base":"Blended Rate - SubCon must be a whole number with up to 10 digits",
      "string.max": "Blended Rate - SubCon must not exceed 10 digits",
    })
    .allow(null)
    .allow(""),
  modified_by: Joi.string().max(255).optional(),
  industry_rid: Joi.string().min(5).required(),
  industry_name: Joi.string().min(5).max(100).optional(),
  business_details: Joi.string().min(1).max(2000).required(),
  comments: Joi.string().min(1).max(2000).optional(),
  website: Joi.string()
    .min(10)
    .max(255)
    .allow(null)
    .optional()
    .pattern(/^(https?:\/\/)[a-zA-Z0-9.-]+(:[0-9]+)?(\/[a-zA-Z0-9.-]*)*\/?$/)
    .messages({
      "string.pattern.base": `Website URL must begin with 'http' or 'https://'`,
      "string.max": "The website must not exceed 255 characters."
    }),
  project_manager: Joi.string().min(2).max(128).required(),
  annual_revenue: Joi.number().required(),
  data_storage: Joi.string()
    .valid("separate_db", "store_in_parent")
    .max(255)
    .required(),
    key_contacts: Joi.array()
    .items(
      Joi.object({
        key_contact_id: Joi.string().when("action_type", {
          is: Joi.string().valid("edit", "delete"),
          then: Joi.required(),
          otherwise: Joi.forbidden(), // Optional: Prevents key_contact_id in 'add' action
        }),
        key_contact_name: Joi.string().min(2).max(128).required(),
        key_contact_email: Joi.string().email().min(3).max(125).required(),
        key_contact_role_rid: Joi.string().required(),
        is_primary_contact: Joi.boolean().required(),
        include_in_communication: Joi.boolean().required(),
        status: Joi.string().valid('active', 'inactive').required(),
        action_type: Joi.string().valid('add', 'edit','delete').required()
      })
    )
    .optional()
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
  globalFilters: Joi.string().default("{}"),
  fiscalYear: Joi.alternatives()
  .try(
    Joi.string().valid("FY-All"),  // Allow "FY-All"
    Joi.number()  // Allow numbers (years like 2023, 2024, etc.)
  )
});

const exportAccountSchema = Joi.object({
  search: Joi.string().max(255).optional(),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("createdAt"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
  globalFilters: Joi.string().default("{}"),
  fiscalYear: Joi.alternatives()
  .try(
    Joi.string().valid("FY-All"),  // Allow "FY-All"
    Joi.number()  // Allow numbers (years like 2023, 2024, etc.)
  )
});

export { accountSchema, updateAccountSchema, listAccountSchema, exportAccountSchema };
