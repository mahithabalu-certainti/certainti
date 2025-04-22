import Joi from "joi";
import moment from "moment";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isNotFutureDate = (value: string, helpers: Joi.CustomHelpers): any => {

  const startDate = moment(value, "DD/MM/YYYY");

  if(!startDate.isValid()){
    return helpers.error("date.invalidFormat", {
      message: "Invalid effective from date",
    });
  }

  const [day, month, year] = value.split("/").map(Number);

  const inputDate = new Date(year, month - 1, day);

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const comparisonDate = new Date(inputDate);
  comparisonDate.setHours(0, 0, 0, 0);

  if (comparisonDate > currentDate) {
    return helpers.error("any.invalid", {
      message: "Date cannot be in the future.",
    });
  }

  return value;
};

const isEndDateAfterStartDate = (
  value: string,
  helpers: Joi.CustomHelpers
): any => {
  const context = helpers.state?.ancestors[0];

  if (context?.effective_from_date && value) {

    const date = moment(value, "DD/MM/YYYY");

    if(!date.isValid()){
      return helpers.error("date.invalidFormat", {
        message: "Invalid effective end date",
      });
    }

    const [startDay, startMonth, startYear] = context.effective_from_date
      .split("/")
      .map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay);
    startDate.setHours(0, 0, 0, 0);

    const [endDay, endMonth, endYear] = value.split("/").map(Number);
    const endDate = new Date(endYear, endMonth - 1, endDay);
    endDate.setHours(0, 0, 0, 0);

    if (endDate <= startDate) {
      return helpers.error("any.invalid", {
        message: "Effective end date must be after the start date.",
      });
    }
  }

  return value;
};

const createResourcesSchema = Joi.object({
  account_number: Joi.string().max(50).required(),
  account_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
  resource_ref_id: Joi.string().max(50).required(),
  resource_type: Joi.string().valid("FullTime", "Contract").required(),
  first_name: Joi.string().min(2).max(100).optional().allow("").allow(null),
  middle_name: Joi.string().max(100).optional().allow("").allow(null),
  last_name: Joi.string().min(2).max(100).optional().allow("").allow(null),
  full_name: Joi.string().min(3).max(200).optional().allow("").allow(null),
  org_name: Joi.string()
    .min(3)
    .max(100)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.min":
        '"organization name" should have a minimum length of {#limit}',
      "string.max":
        '"organization name" should have a maximum length of {#limit}',
      "string.empty": '"organization name" cannot be an empty string',
      "any.allowOnly": '"organization name" cannot be null or empty',
    }),
  role: Joi.string().min(4).max(100).optional().allow("").allow(null),
  fiscal_year: Joi.number()
  .integer()
  .min(1000)
  .max(9999)
  .required()
  .messages({
    'number.base': 'Fiscal year must be a number',
    'number.min': 'Fiscal year must be a 4-digit number',
    'number.max': 'Fiscal year must be a 4-digit number',
    'any.required': 'Fiscal year is required',
  }),
  email: Joi.string().email().max(255).optional().allow("").allow(null),
  mobile: Joi.string().max(15).optional().allow("").allow(null),
  country: Joi.string().guid({ version: ['uuidv4'] }).optional().allow('', null),
  region: Joi.string().guid({ version: ['uuidv4'] }).optional().allow('', null),
  currency: Joi.string().guid({ version: ['uuidv4'] }).optional().allow('', null),
  effective_from_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isNotFutureDate, "Future Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "effective_from_date must be in the format DD/MM/YYYY",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat": "Invalid effective start date.",
    }),
  effective_end_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isEndDateAfterStartDate, "End Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "effective_end_date must be in the format DD/MM/YYYY",
      "any.invalid": "Effective end date must be after the start date.",
      "date.invalidFormat": "Invalid effective end date.",
    }),
  designation: Joi.string().min(4).max(100).optional().allow("").allow(null),
  manager_name: Joi.string().min(3).max(100).optional().allow("").allow(null),
  total_years_experience: Joi.number().optional().allow("").allow(null),
  total_years_in_org: Joi.number()
    .optional()
    .allow("")
    .allow(null),
  description: Joi.string().max(1000).optional().allow("").allow(null),
  cost: Joi.number()
    .precision(2)
    .min(0)
    .max(999999999999.99)
    .optional()
    .messages({
      "number.base": "Annual cost must be a number.",
      "number.min": "Annual cost must be a positive number.",
      "number.max": "Annual cost must not exceed 999999999999.99.",
      "any.required": "Annual cost is required.",
    }),
  cost_frequencty: Joi.string()
    .valid(
      "Annual",
      "Semi_annual",
      "Monthly",
      "Bi_weekly",
      "Weekly",
      "Daily",
      "Hourly"
    )
    .optional(),
  resource_status: Joi.string().valid("Active", "Inactive").optional(),
  created_by: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

const updateResourceSchema = Joi.object({
  resource_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
  account_number: Joi.string().max(50).required(),
  resource_ref_id: Joi.string().max(50).required(),
  resource_type: Joi.string().valid("FullTime", "Contract").required(),
  first_name: Joi.string().min(2).max(100).optional().allow("").allow(null),
  middle_name: Joi.string().max(100).optional().allow("").allow(null),
  last_name: Joi.string().min(2).max(100).optional().allow("").allow(null),
  full_name: Joi.string().min(3).max(200).optional().allow("").allow(null),
  org_name: Joi.string()
    .min(3)
    .max(100)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.min":
        '"organization name" should have a minimum length of {#limit}',
      "string.max":
        '"organization name" should have a maximum length of {#limit}',
      "string.empty": '"organization name" cannot be an empty string',
      "any.allowOnly": '"organization name" cannot be null or empty',
    }),
  role: Joi.string().min(4).max(100).optional().allow("").allow(null),
  fiscal_year: Joi.number()
  .integer()
  .min(1000)
  .max(9999)
  .required()
  .messages({
    'number.base': 'Fiscal year must be a number',
    'number.min': 'Fiscal year must be a 4-digit number',
    'number.max': 'Fiscal year must be a 4-digit number',
    'any.required': 'Fiscal year is required',
  }),
  email: Joi.string().email().max(255).optional().allow("").allow(null),
  mobile: Joi.string().max(15).optional().allow("").allow(null),
  country: Joi.string().guid({ version: ['uuidv4'] }).optional().allow('', null),
  region: Joi.string().guid({ version: ['uuidv4'] }).optional().allow('', null),
  currency: Joi.string().guid({ version: ['uuidv4'] }).optional().allow('', null),
  effective_from_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isNotFutureDate, "Future Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "effective_from_date must be in the format DD/MM/YYYY",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat": "Invalid effective start date.",
    }),
  effective_end_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isEndDateAfterStartDate, "End Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "effective_end_date must be in the format DD/MM/YYYY",
      "any.invalid": "Effective end date must be after the start date.",
      "date.invalidFormat": "Invalid effective end date.",
    }),
  designation: Joi.string().min(4).max(100).optional().allow("").allow(null),
  manager_name: Joi.string().min(3).max(100).optional().allow("").allow(null),
  total_years_experience: Joi.number().optional().allow("").allow(null),
  total_years_in_org: Joi.number()
    .optional()
    .allow("")
    .allow(null),
  description: Joi.string().max(1000).optional().allow("").allow(null),
  cost: Joi.number()
    .precision(2)
    .min(0)
    .max(999999999999.99)
    .optional()
    .messages({
      "number.base": "Annual cost must be a number.",
      "number.min": "Annual cost must be a positive number.",
      "number.max": "Annual cost must not exceed 999999999999.99.",
      "any.required": "Annual cost is required.",
    }),
    cost_frequency: Joi.string()
    .valid(
      "Annual",
      "Semi-Annual",
      "Monthly",
      "Bi-Weekly",
      "Weekly",
      "Daily",
      "Hourly"
    )
    .optional(),
  resource_status: Joi.string().valid("Active", "Inactive").optional(),
  modified_by: Joi.string().guid({ version: ['uuidv4'] }).required(),
});


const listResourceSchema = Joi.object({
  page: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("1"),
  limit: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("10"),
  fiscal_year: Joi.number()
    .integer()
    .min(1000)
    .max(9999)
    .optional()
    .messages({
      'number.base': 'Fiscal year must be a number',
      'number.min': 'Fiscal year must be a 4-digit number',
      'number.max': 'Fiscal year must be a 4-digit number',
      'any.required': 'Fiscal year is required',
    }),
  search: Joi.string().max(255).optional(),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("createdAt"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
});

const createResourceSkillSchema = Joi.object({
  eid: Joi.string().max(255).optional().allow(null).allow(""),
  account_rid: Joi.string().max(255).required(),
  resource_type: Joi.string().valid("FullTime", "Contract").required(),
  resource_rid: Joi.string().max(255).optional().allow(null).allow(""),
  resource_ref_id: Joi.string().max(255).required(),
  resource_desc: Joi.string().max(100).optional().allow(null).allow(""),
  start_date: Joi.string().max(10).optional().allow(null).allow(""),
  skill_description: Joi.string().max(255).optional().allow(null).allow(""),
  skill_level: Joi.string().valid("Beginner","Intermediate","Advanced").optional().allow("").allow(null),
  years_of_experience: Joi.number().min(0).optional().allow(null),
  created_by: Joi.string().max(255).optional().allow(null).allow(""),
  modified_by: Joi.string().max(255).optional().allow(null).allow(""),
  technical_weightage: Joi.number().min(0).optional().allow(null),
  skill_name: Joi.string().max(255).required().trim(),
  skill_type: Joi.string().max(255).optional().allow(null).allow(""),
  accountNumber: Joi.string().max(255).required()
})

const updateResourceSkillSchema = Joi.object({
  rid: Joi.string().max(255).required(),
  eid: Joi.string().max(255).optional().allow(null).allow(""),
  start_date: Joi.string().max(10).optional().allow(null).allow(""),
  skill_description: Joi.string().max(255).optional().allow(null).allow(""),
  skill_level: Joi.string().valid("Beginner","Intermediate","Advanced","-").optional().allow("").allow(null),
  skill_name: Joi.string().max(255).required().trim(),
  years_of_experience: Joi.number().min(0).optional().allow(null),
  modified_by: Joi.string().max(255).optional(),
  technical_weightage: Joi.number().min(0).optional().allow(null),
  skill_type: Joi.string().max(255).optional().allow(null).allow(""),
  status: Joi.string().max(255).default("active").optional(),
  modified_datetime: Joi.date()
   .iso()
   .default(() => new Date()),
  accountNumber: Joi.string().max(255).required(),
})

const listResourceSkillSchema = Joi.object({
  rid: Joi.string().pattern(uuidRegex).optional().allow(null).allow(""),
  page: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("1")
    .optional(),
  limit: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("10")
    .optional(),
  search: Joi.string().max(255).optional().allow("").allow(null),
  filters: Joi.string().default("{}").optional(),
  sortBy: Joi.string().default("created_datetime").optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
  accountNumber: Joi.string().max(255).required(),
  fiscalYear: Joi.number().default(new Date().getFullYear()).optional(),
});

const updateResourceCostSchema = Joi.object({
  rid: Joi.string().pattern(uuidRegex).required(),
  eid: Joi.string().max(255).optional().allow(null).allow(""),
  accountNumber: Joi.string().max(255).required(),
  effective_date: Joi.string().max(10).optional().allow(null).allow(""),
  end_date: Joi.string().max(10).optional().allow(null).allow(""),
  cost_frequency: Joi.string()
   .valid(
      "annual",
      "semi_annual",
      "monthly",
      "bi_weekly",
      "weekly",
      "daily",
      "hourly"
    )
   .required(),
  cost: Joi.number().min(0).max(999999999999.99).required(),
  currency_rid: Joi.string().pattern(uuidRegex).required(),
  status: Joi.string().max(255).default("active").optional(),
  modified_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  modified_by: Joi.string().max(255).optional(),
});

const getResourceCostSchema = Joi.object({
  id: Joi.string().pattern(uuidRegex).required(),
  accountNumber: Joi.string().max(255).required(),
});

const listResourceCostSchema = Joi.object({
  page: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("1"),
  limit: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("10"),
  search: Joi.string().max(255).optional().allow("").allow(null),
  filters: Joi.string().default("{}").optional(),
  sortBy: Joi.string().default("created_datetime").optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
  accountNumber: Joi.string().max(255).required(),
  fiscalYear: Joi.number().default(new Date().getFullYear()).optional(),
});

const resourceCostSchema = Joi.object({
  eid: Joi.string().max(255).optional().allow(null).allow(""),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  accountNumber: Joi.string().max(255).required(),
  resource_type: Joi.string().valid("FullTime", "Contract").required(),
  resource_rid: Joi.string().pattern(uuidRegex).optional().allow(null).allow(""),
  resource_ref_id: Joi.string().max(255).required(),
  effective_date: Joi.string().max(10).optional().allow(null).allow(""),
  end_date: Joi.string().max(10).optional().allow(null).allow(""),
  cost_frequency: Joi.string()
   .valid(
      "annual",
      "semi_annual",
      "monthly",
      "bi_weekly",
      "weekly",
      "daily",
      "hourly"
    )
   .required(),
  cost: Joi.number().min(0).max(999999999999.99).required(),
  fiscalYear: Joi.number().default(new Date().getFullYear()).optional(),
  currency_rid: Joi.string().pattern(uuidRegex).required(),
  status: Joi.string().max(255).default("active"),
  created_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  modified_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  created_by: Joi.string().max(255).optional(),
  modified_by: Joi.string().max(255).optional(),
});

export {
  listResourceSkillSchema,
  updateResourceSkillSchema,
  createResourceSkillSchema,
  resourceCostSchema,
  listResourceCostSchema,
  getResourceCostSchema,
  updateResourceCostSchema,
  createResourcesSchema,
  updateResourceSchema,
  listResourceSchema
};
