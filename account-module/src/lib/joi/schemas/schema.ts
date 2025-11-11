import Joi from "joi";

const uuidRegex = /^[A-Z0-9]{4}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
  account_id: Joi.string().max(255).allow(null).optional().label("Account ID"),
  account_name: Joi.string().min(3).max(125).required().label("Account Name"),
  comments: Joi.string().max(2000).optional().allow("").allow(null).label("Comments"),
  status_rid: Joi.string().required().label("Status"),
  is_parent: Joi.boolean().required().label("Is Parent"),
  parent_account_rid: Joi.string().allow(null).optional().label("Parent Account"),
  currency_rid: Joi.string().allow("").allow(null)
    .pattern(uuidRegex, "valid UUID")
    .optional()
    .messages({
      "string.pattern.base": "Invalid UUID format for currency RID",
      "any.required": "Account currency RID is required",
    }),
  country_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID").allow("").allow(null)
    .optional()
    .messages({
      "string.pattern.base": "Invalid UUID format for country RID",
      "any.required": "Account country RID is required",
    }),
  region_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID").allow("").allow(null)
    .optional()
    .messages({
      "string.pattern.base": "Invalid UUID format for region RID",
      "any.required": "Account country region RID is required",
    }),
    fiscal_start_date: Joi.string()
    .pattern(/^\d{2}\/\d{2}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Fiscal Start Date must be in the format MM/DD",
    }),

  fiscal_end_date: Joi.string()
    .pattern(/^\d{2}\/\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "Fiscal End Date must be in the format MM/DD",
    }),
  interaction_cc_list: Joi.string().allow(null).label("Interaction CC List"),
  created_by: Joi.string().max(255).optional(),
  modified_by: Joi.string().max(255).optional(),
  industry_rid: Joi.string().required().label("Industry"),
  industry_name_other: Joi.string().min(3).max(255).optional().allow("").allow(null).label("Industry Other"),
  business_details: Joi.string().min(1).max(2000).required().label("Business Details"),
  website: Joi.string()
    .min(10)
    .max(255)
    .allow(null)
    .optional()
    .pattern(/^(https?:\/\/|www\.)[a-zA-Z0-9.-]+(:[0-9]+)?(\/[a-zA-Z0-9.-]*)*\/?$/i)
    .messages({
      "string.pattern.base": `Website URL must begin with 'http' ,'www.' or 'https://'`,
      "string.max": "The website must not exceed 255 characters."
    }),
  created_datetime: Joi.date().iso().allow(null),
  modified_datetime: Joi.date().iso().allow(null),
  annual_revenue: Joi.string().pattern(/^\d+(\.\d{0,2})?$/).optional()
    .messages({
      "string.pattern.base":"Annual Revenue must be a valid  number maximum up to (999999999999.99)",
    }).allow("").allow(null),
  data_storage: Joi.string()
    .valid("separate_db", "store_in_parent")
    .max(255)
    .required().label("Data Storage"),
   organisation_name: Joi.string().min(7).max(125).required().label("Organisation Name"),
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
        .min(6).max(254).optional().allow("").allow(null).messages({
          "string.base": "Key Contact Email must be a text value.",
          "string.empty": "Key Contact Email cannot be empty.",
          "string.min": "Key Contact Email must be at least 6 characters long.",
          "string.max": "Key Contact Email cannot exceed 254 characters.",
          "string.pattern.base": "Invalid Key Contact Email Address."
        }),
        key_contact_role: Joi.string().optional().allow("").allow(null),
        is_primary_contact: Joi.boolean().valid(true, false).optional(),
        status_rid: Joi.string().required(),
        interaction_cc_recipient: Joi.boolean()
        .required()
        .messages({
          'boolean.base': 'interaction_cc_recipient must be a boolean value (true or false)',
          'any.required': 'interaction_cc_recipient is required',
        }),
        include_in_communication: Joi.boolean().optional().allow(null,""),
        action_type: Joi.string().valid('add', 'edit','delete').required()
      })
    )
    .optional()
});

const updateAccountSchema = Joi.object({
  account_rid: Joi.string().max(255).required().label("Account RID"),
  account_id: Joi.string().max(255).required().label("Account ID"),
  account_name: Joi.string().min(3).max(125).required().label("Account Name"),
  r_number: Joi.string().required().label("R number"),
  comments: Joi.string().max(2000).optional().allow("").allow(null).label("Comments"),
  status_rid: Joi.string().required().label("Status"),
  is_parent: Joi.boolean().required().label("Is Parent"),
  parent_account_rid: Joi.string().allow(null).optional().label("Parent Account"),
  currency_rid: Joi.string().allow("").allow(null)
    .pattern(uuidRegex, "valid UUID")
    .optional()
    .messages({
      "string.pattern.base": "Invalid UUID format for currency RID",
      "any.required": "Account currency RID is required",
    }).label("Currency"),
  country_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID").allow("").allow(null)
    .optional()
    .messages({
      "string.pattern.base": "Invalid UUID format for country RID",
      "any.required": "Account country RID is required",
    }).label("Country"),
  region_rid: Joi.string().allow("").allow(null)
    .pattern(uuidRegex, "valid UUID")
    .optional()
    .messages({
      "string.pattern.base": "Invalid UUID format for region RID",
      "any.required": "Account country region RID is required",
    }).label("Region"),
  fiscal_start_date: Joi.string()
    .pattern(/^\d{2}\/\d{2}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Fiscal Start Date must be in the format MM/DD",
    }),

  fiscal_end_date: Joi.string()
    .pattern(/^\d{2}\/\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "Fiscal End Date must be in the format MM/DD",
    }),
  interaction_cc_list: Joi.string().allow(null).label("Interaction cc list"),
  modified_by: Joi.string().max(255).optional(),
  logo_action:Joi.string().max(255).optional().allow("").allow(null),
  industry_rid: Joi.string().required().label("Industry"),
  industry_name_other: Joi.string().min(3).max(255).optional().allow("").allow(null).label("Industry Other"),
  business_details: Joi.string().min(1).max(2000).required().label("Business Details"),
  website: Joi.string()
    .min(10)
    .max(255)
    .allow(null)
    .optional()
    .pattern(/^(https?:\/\/|www\.)[a-zA-Z0-9.-]+(:[0-9]+)?(\/[a-zA-Z0-9.-]*)*\/?$/i)
    .messages({
      "string.pattern.base": `Website URL must begin with 'http','www.' or 'https://'`,
      "string.max": "The website must not exceed 255 characters."
    }),
  annual_revenue: Joi.string().pattern(/^\d+(\.\d{0,2})?$/).optional()
    .messages({
      "string.pattern.base":"Annual Revenue must be a valid  number maximum up to (9999999999999999.99)",
    }).allow("").allow(null).label("Annual Revenue"),
  data_storage: Joi.string()
    .valid("separate_db", "store_in_parent")
    .max(255)
    .required().label("Data Storage"),
  organisation_name: Joi.string().min(7).max(125).required().label("Organisation Name"),
  key_contacts: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().when("action_type", {
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
        .min(6).max(254).optional().allow("").allow(null).messages({
          "string.base": "Key Contact Email must be a text value.",
          "string.empty": "Key Contact Email cannot be empty.",
          "string.min": "Key Contact Email must be at least 6 characters long.",
          "string.max": "Key Contact Email cannot exceed 254 characters.",
          "string.pattern.base": "Invalid Key Contact Email Address"
        }),
        key_contact_role: Joi.string().optional().allow("").allow(null),
        is_primary_contact: Joi.boolean().valid(true, false).optional(),
        status_rid: Joi.string().required(),
        interaction_cc_recipient: Joi.boolean()
        .required()
        .messages({
          'boolean.base': 'Interaction CC Recipient  must be a boolean value (true or false)',
          'any.required': 'Interaction CC Recipient is required',
        }),
         include_in_communication: Joi.boolean().optional().allow(null,""),
        action_type: Joi.string().valid('add', 'edit','delete').required()
      })
    )
    .optional()
});

const listOrgAccountSchema = Joi.object({
  page: Joi.string().optional()
    .pattern(/^[0-9]+$/)
  ,
  limit: Joi.string().optional()
    .pattern(/^[0-9]+$/)
    ,
 globalFilters: Joi.string().default("{}"),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});

const listAccountSchema = Joi.object({
  page: Joi.alternatives()
    .try(
      Joi.number().integer().min(1),
      Joi.string().pattern(/^[0-9]+$/)
    )
    .default(1),
  limit: Joi.alternatives()
    .try(
      Joi.number().integer().min(1),
      Joi.string().pattern(/^[0-9]+$/)
    )
    .default(10),
  search: Joi.alternatives()
    .try(
      Joi.string().max(255).allow(''),
      Joi.string().max(255).optional()
    )
    .optional(),
  filters: Joi.alternatives()
    .try(
      Joi.object(),
      Joi.string()
    )
    .default({}),
  sortBy: Joi.string().default("createdAt"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
  globalFilters: Joi.alternatives()
    .try(
      Joi.object(),
      Joi.string()
    )
    .default({}),
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

const colorCodesSchema = Joi.object({
  status: Joi.string().valid("Active", "Inactive", "All").default("All"),
})

export { accountSchema, updateAccountSchema, listAccountSchema, exportAccountSchema, colorCodesSchema ,
  listOrgAccountSchema
};
