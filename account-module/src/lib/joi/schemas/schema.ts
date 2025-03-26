import Joi from "joi";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const accountSchema = Joi.object({
  account_id: Joi.string().max(255).required(),
  account_name: Joi.string().min(7).max(25).required(),
  account_description: Joi.string().max(500).optional(),
  status: Joi.string().valid("active", "inactive").required(),
  eid: Joi.number().integer().required(),
  is_parent: Joi.boolean().required(),
  parent_account_rid: Joi.string().allow(null).optional(),
  account_currency_rid: Joi.string().pattern(uuidRegex, 'valid UUID').required().messages({
    'string.pattern.base': 'Invalid UUID format for currency RID',
    'any.required': 'Account currency RID is required',
  }),
  account_country_rid: Joi.string().pattern(uuidRegex, 'valid UUID').required().messages({
    'string.pattern.base': 'Invalid UUID format for country RID',
    'any.required': 'Account country RID is required',
  }),
  account_country_region_rid: Joi.string().pattern(uuidRegex, 'valid UUID').required().messages({
    'string.pattern.base': 'Invalid UUID format for region RID',
    'any.required': 'Account country region RID is required',
  }),
  account_city_rid: Joi.string().pattern(uuidRegex, 'valid UUID').required().messages({
    'string.pattern.base': 'Invalid UUID format for city RID',
    'any.required': 'Account city RID is required',
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
  primary_contact: Joi.string().email().max(50).required(),
  primary_contact_name: Joi.string().min(3).max(25).required(),
  primary_contact_email: Joi.string().email().max(50).required(),
  contact_number: Joi.string().max(50).required(),
  point_of_contact: Joi.string().min(3).max(25).required(),
  poc_email: Joi.string().email().max(50).required(),
  poc_number: Joi.string().max(50).required(),
  industry: Joi.string().min(5).max(25).required(),
  website: Joi.string().max(50).allow(null).optional(),
  project_manager: Joi.string().email().max(50).required(),
  database_connection_rid: Joi.number().integer().allow(null),
  created_datetime: Joi.date().iso().allow(null),
  modified_datetime: Joi.date().iso().allow(null),
  annual_revenue: Joi.string()
    .pattern(/^\d{1,50}(\.\d{0,2})?$/)
    .required()
    .messages({
      "string.pattern.base":
        "annual_revenue must be a valid number with a maximum of 50 digits and up to 2 decimal places",
    }),
  data_residency: Joi.string().max(255).optional(),
  data_storage: Joi.string()
    .valid("separate_db", "store_in_parent")
    .max(255)
    .required(),
});

export { accountSchema };
