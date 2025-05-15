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
  account_name: Joi.string().min(7).max(125).required(),
  account_description: Joi.string().max(2000).optional().allow("").allow(null),
  status: Joi.string().valid("active", "inactive").required(),
  is_parent: Joi.boolean().required(),
  parent_account_rid: Joi.string().allow(null).optional(),
  account_currency_rid: Joi.string().allow("").allow(null)
    .pattern(uuidRegex, "valid UUID")
    .optional()
    .messages({
      "string.pattern.base": "Invalid UUID format for currency RID",
      "any.required": "Account currency RID is required",
    }),
  account_country_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID").allow("").allow(null)
    .optional()
    .messages({
      "string.pattern.base": "Invalid UUID format for country RID",
      "any.required": "Account country RID is required",
    }),
  account_country_region_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID").allow("").allow(null)
    .optional()
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
    .pattern(/^\d+(\.\d{0,2})?$/)
    .optional()
    .messages({
      "string.pattern.base":"Blended Rate - FTE  must be a valid  number maximum up to (9999999999999999.99)",
    })
    .allow(null)
    .allow(""),

  blended_rate_subcon: Joi.string()
    .pattern(/^\d+(\.\d{0,2})?$/)
    .optional()
    .messages({
      "string.pattern.base":"Blended Rate - SubCon must be a valid  number maximum up to (9999999999999999.99)",
      "string.max": "Blended Rate - SubCon must not exceed 10 digits",
    })
    .allow(null)
    .allow(""),
  created_by: Joi.string().max(255).optional(),
  modified_by: Joi.string().max(255).optional(),
  industry_rid: Joi.string().required(),
  industry_name_other: Joi.string().optional().allow("").allow(null),
  business_details: Joi.string().min(1).max(2000).required(),
  comments: Joi.string().min(1).max(2000).optional(),
  website: Joi.string()
    .max(50)
    .allow(null)
    .optional()
    .pattern(/^(https?:\/\/|www\.)[a-zA-Z0-9.-]+(:[0-9]+)?(\/[a-zA-Z0-9.-]*)*\/?$/)
    .messages({
      "string.pattern.base": `Website URL must begin with 'http' ,'www.' or 'https://'`,
      "string.max": "The website must not exceed 255 characters."
    }),
  project_manager: Joi.string().pattern(/^(?!.*(['-])\1)[A-Za-z][A-Za-z' -]{0,126}[A-Za-z]$/).min(2).max(128).optional().allow("").allow(null),
  created_datetime: Joi.date().iso().allow(null),
  modified_datetime: Joi.date().iso().allow(null),
  annual_revenue: Joi.string().pattern(/^\d+(\.\d{0,2})?$/).optional()
    .messages({
      "string.pattern.base":"Annual Revenue must be a valid  number maximum up to (9999999999999999.99)",
    }).allow("").allow(null),
  data_storage: Joi.string()
    .valid("separate_db", "store_in_parent")
    .max(255)
    .required(),
  key_contacts: Joi.array()
    .items(
    Joi.object({
        key_contact_name: Joi.string().pattern(/^(?!.*(['-])\1)[A-Za-z][A-Za-z' -]{0,126}[A-Za-z]$/).min(2).max(128).optional().allow("").allow(null)
        .messages({
          "string.base": "Key Contact Name must be a text value.",
          "string.min": "Key Contact Name must be at least 2 characters long.",
          "string.max": "Key Contact Name cannot exceed 128 characters.",
          "string.pattern.base":
            " Key Contact Name is not valid",
        }),
        key_contact_email: Joi.string()
        .trim()
        .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9-]+\.[a-zA-Z]{2,63}$/) 
        .min(3).max(254).optional().allow("").allow(null).messages({
          "string.base": "Key Contact Email must be a text value.",
          "string.empty": "Key Contact Email cannot be empty.",
          "string.min": "Key Contact Email must be at least 6 characters long.",
          "string.max": "Key Contact Email cannot exceed 254 characters.",
          "string.pattern.base": "Invalid Key Contact Email Address."
        }),
        key_contact_role_rid: Joi.string().guid({ version: ["uuidv4"] }).optional().allow("").allow(null),
        is_primary_contact: Joi.boolean().valid(true, false).optional(),
        include_in_communication: Joi.boolean().valid(true, false).optional(),
        status: Joi.string().valid('active', 'inactive').required(),
        action_type: Joi.string().valid('add', 'edit','delete').required()
      })
    )
    .optional()
});

const updateAccountSchema = Joi.object({
  account_rid: Joi.string().max(255).required(),
  account_id: Joi.string().max(255).required(),
  account_name: Joi.string().min(7).max(125).required(),
  r_number: Joi.string().required(),
  account_description: Joi.string().max(2000).optional().allow("").allow(null),
  status: Joi.string().valid("active", "inactive").required(),
  is_parent: Joi.boolean().required(),
  parent_account_rid: Joi.string().allow(null).optional(),
  account_currency_rid: Joi.string().allow("").allow(null)
    .pattern(uuidRegex, "valid UUID")
    .optional()
    .messages({
      "string.pattern.base": "Invalid UUID format for currency RID",
      "any.required": "Account currency RID is required",
    }),
  account_country_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID").allow("").allow(null)
    .optional()
    .messages({
      "string.pattern.base": "Invalid UUID format for country RID",
      "any.required": "Account country RID is required",
    }),
  account_country_region_rid: Joi.string().allow("").allow(null)
    .pattern(uuidRegex, "valid UUID")
    .optional()
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
    .pattern(/^\d+(\.\d{0,2})?$/)
    .optional()
    .messages({
      "string.pattern.base":"Blended Rate - FTE  must be a valid  number maximum up to (9999999999999999.99)",
    })
    .allow(null)
    .allow(""),

  blended_rate_subcon: Joi.string()
    .pattern(/^\d+(\.\d{0,2})?$/)
    .optional()
    .messages({
      "string.pattern.base":"Blended Rate - SubCon must be a valid  number maximum up to (9999999999999999.99)",
      "string.max": "Blended Rate - SubCon must not exceed 10 digits",
    })
    .allow(null)
    .allow(""),
  modified_by: Joi.string().max(255).optional(),
  industry_rid: Joi.string().min(5).required(),
  industry_name_other: Joi.string().optional().allow("").allow(null),
  business_details: Joi.string().min(1).max(2000).required(),
  comments: Joi.string().min(1).max(2000).optional(),
  website: Joi.string()
    .min(10)
    .max(255)
    .allow(null)
    .optional()
   .pattern(/^(https?:\/\/|www\.)[a-zA-Z0-9.-]+(:[0-9]+)?(\/[a-zA-Z0-9.-]*)*\/?$/)
    .messages({
      "string.pattern.base": `Website URL must begin with 'http','www.' or 'https://'`,
      "string.max": "The website must not exceed 255 characters."
    }),
  project_manager: Joi.string().pattern(/^(?!.*(['-])\1)[A-Za-z][A-Za-z' -]{0,126}[A-Za-z]$/).min(2).max(128).optional().allow("").allow(null)
  .messages({
    "string.base": "Delivary Manager must be a text value.",
    "string.min": "Delivary Manager must be at least 2 characters long.",
    "string.max": "Delivary Manager cannot exceed 128 characters.",
    "string.pattern.base":
      " Delivary Manager is not valid",
  }),
  annual_revenue: Joi.string().pattern(/^\d+(\.\d{0,2})?$/).optional()
    .messages({
      "string.pattern.base":"Annual Revenue must be a valid  number maximum up to (9999999999999999.99)",
    }).allow("").allow(null),
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
          otherwise: Joi.forbidden(),
        }),
        key_contact_name: Joi.string().pattern(/^(?!.*(['-])\1)[A-Za-z][A-Za-z' -]{0,126}[A-Za-z]$/).min(2).max(128).optional().allow("").allow(null)
        .messages({
          "string.base": "Key Contact Name must be a text value.",
          "string.min": "Key Contact Name must be at least 2 characters long.",
          "string.max": "Key Contact Name cannot exceed 128 characters.",
          "string.pattern.base":
            " Key Contact Name is not valid",
        }),
        key_contact_email: Joi.string()
        .trim()
        .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9-]+\.[a-zA-Z]{2,63}$/) 
        .min(3).max(254).optional().allow("").allow(null).messages({
          "string.base": "Key Contact Email must be a text value.",
          "string.empty": "Key Contact Email cannot be empty.",
          "string.min": "Key Contact Email must be at least 6 characters long.",
          "string.max": "Key Contact Email cannot exceed 254 characters.",
          "string.pattern.base": "Invalid Key Contact Email Address"
        }),
        key_contact_role_rid: Joi.string().guid({ version: ["uuidv4"] }).optional().allow("").allow(null),
        is_primary_contact: Joi.boolean().valid(true, false).optional(),
        include_in_communication: Joi.boolean().valid(true, false).optional(),
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
