import Joi from "joi";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const decimal18_2Regex = /^\d{1,16}(\.\d{1,2})?$/;

const isNotFutureDate = (value: string, helpers: Joi.CustomHelpers): any => {
  if (!value) return value;

  // Parse the date in MM/DD/YYYY format
  const [month, day, year] = value.split("/").map(Number);

  // Create date objects with time set to noon UTC
  const inputDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const currentDate = new Date();

  // Check if the date is valid
  if (isNaN(inputDate.getTime())) {
    return helpers.error("date.invalidFormat", {
      message: "Invalid date format. Please use MM/DD/YYYY.",
    });
  }

  // Normalize current date to start of day UTC
  currentDate.setUTCHours(12, 0, 0, 0);

  // Check if date is in the future
  if (inputDate > currentDate) {
    return helpers.error("any.invalid", {
      message: "Date cannot be in the future.",
    });
  }

  return value;
};

const isValidDate = (value: string, helpers: Joi.CustomHelpers): any => {
  if (!value) return value;

  // Parse the date in MM/DD/YYYY format
  const [month, day, year] = value.split("/").map(Number);

  // Create a date object with time set to noon UTC
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return helpers.error("date.invalidFormat", {
      message: "Invalid date format. Please use MM/DD/YYYY.",
    });
  }

  return value;
};

const isEndDateAfterStartDate = (
  value: string,
  helpers: Joi.CustomHelpers
): any => {
  const context = helpers.state?.ancestors[0];

  // If either value or effective_from_date is missing, return the value as-is
  if (!context?.effective_from_date || !value) {
    return value;
  }

  // Parse dates in MM/DD/YYYY format
  const [endMonth, endDay, endYear] = value.split("/").map(Number);
  const [startMonth, startDay, startYear] = context.effective_from_date
    .split("/")
    .map(Number);

  // Create date objects with time set to noon UTC to avoid timezone issues
  const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 12, 0, 0));
  const startDate = new Date(
    Date.UTC(startYear, startMonth - 1, startDay, 12, 0, 0)
  );

  // Check if the end date is valid
  if (isNaN(endDate.getTime())) {
    return helpers.error("date.invalidFormat", {
      message: "Invalid effective end date.",
    });
  }

  // Check if the start date is valid
  if (isNaN(startDate.getTime())) {
    return helpers.error("date.invalidFormat", {
      message: "Invalid effective start date.",
    });
  }

  // Compare dates
  if (endDate <= startDate) {
    return helpers.error("any.invalid", {
      message: "Effective end date must be after the start date.",
    });
  }

  return value;
};

const createResourcesSchema = Joi.object({
  account_number: Joi.string().max(50).required(),
  account_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  resource_ref_id: Joi.string().min(5).max(50).required().messages({
    'string.base': 'Resource Ref ID must be a string.',
    'string.empty': 'Resource Ref ID is required.',
    'string.min': 'Resource Ref ID must be at least 5 characters long.',
    'string.max': 'Resource Ref ID must not exceed 50 characters.',
    'any.required': 'Resource Ref ID is a required field.'
  }),
  resource_type: Joi.string().valid("Full-Time", "Sub Con", "Non-Labor").required().messages({
    'any.only': 'Resource type must be one of: Full-Time, Sub Con, or Non-Labor',
    'any.required': 'Resource type is required'
  }),
  full_name: Joi.string().min(3).max(200).optional().allow("").allow(null),
  first_name: Joi.string().min(3).max(64).optional().allow("").allow(null),
  last_name: Joi.string().min(3).max(64).optional().allow("").allow(null),
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
  resource_country: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional()
    .allow("", null),
  resource_region: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional()
    .allow("", null),
  resource_city: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional()
    .allow("", null),
  effective_from_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isNotFutureDate, "Future Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "effective_from_date must be in the format MM/DD/YYYY",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat":
        "Invalid effective start date. Please use the format MM/DD/YYYY",
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
        "effective_end_date must be in the format MM/DD/YYYY",
      "any.invalid": "Effective end date must be after the start date.",
      "date.invalidFormat":
        "Invalid effective end date. Please use the format MM/DD/YYYY",
    }),
  resource_designation: Joi.string().min(4).max(100).optional().allow("").allow(null),
  total_years_experience: Joi.number()
    .precision(2)
    .min(0)
    .max(99.99)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "number.base": "Total years experience must be a number",
      "number.min": "Total years experience cannot be negative",
      "number.max": "Total years experience cannot exceed 99.99",
      "number.precision": "Total years experience can only have up to 2 decimal places"
    }),
  total_years_in_org: Joi.number()
    .precision(2)
    .min(0)
    .max(99.99)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "number.base": "Total years in organization must be a number",
      "number.min": "Total years in organization cannot be negative",
      "number.max": "Total years in organization cannot exceed 99.99",
      "number.precision": "Total years in organization can only have up to 2 decimal places"
    }),
  resource_status: Joi.string().valid("Active", "Inactive").optional(),
  created_by: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional(),
  comments: Joi.string().max(1000).optional().allow("").allow(null),
});

const updateResourceSchema = Joi.object({
  resource_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  account_number: Joi.string().max(50).required(),
  resource_ref_id: Joi.string().max(50).required(),
  resource_type: Joi.string().valid("Full-Time", "Sub Con", "Non-Labor").required().messages({
    'any.only': 'Resource type must be one of: Full-Time, Sub Con, or Non-Labor',
    'any.required': 'Resource type is required'
  }),
  full_name: Joi.string().min(3).max(200).optional().allow("").allow(null),
  first_name: Joi.string().min(3).max(64).optional().allow("").allow(null),
  last_name: Joi.string().min(3).max(64).optional().allow("").allow(null),
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
  resource_country: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional()
    .allow("", null),
  resource_region: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional()
    .allow("", null),
  resource_city: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional()
    .allow("", null),
  effective_from_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isNotFutureDate, "Future Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "effective_from_date must be in the format MM/DD/YYYY",
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
        "effective_end_date must be in the format MM/DD/YYYY",
      "any.invalid": "Effective end date must be after the start date.",
      "date.invalidFormat": "Invalid effective end date.",
    }),
  resource_designation: Joi.string().min(4).max(100).optional().allow("").allow(null),
  total_years_experience: Joi.number()
    .optional()
    .min(0)
    .max(99)
    .allow("")
    .allow(null),
  total_years_in_org: Joi.number()
    .optional()
    .min(0)
    .max(99)
    .allow("")
    .allow(null),
  resource_status: Joi.string().valid("Active", "Inactive").optional(),
  comments: Joi.string().max(1000).optional().allow("").allow(null),
});

const listResourceSchema = Joi.object({
  page: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("1"),
  limit: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("10"),
  fiscalYear: Joi.number().min(1000).max(9999).optional().allow(0).messages({
    "number.base": "Fiscal year must be a number",
    "number.min": "Fiscal year must be a 4-digit number",
    "number.max": "Fiscal year must be a 4-digit number",
    "any.required": "Fiscal year is required",
  }),
  search: Joi.string().max(255).optional(),
  filters: Joi.string().default("{}"),
  globalFilters: Joi.string().default("{}"),
  sortBy: Joi.string().default("created_datetime").optional().allow(""),
  sortOrder: Joi.string()
    .valid("ASC", "DESC")
    .default("DESC")
    .optional()
    .allow(""),
});

const exportResourceSchema = Joi.object({
  fiscalYear: Joi.number().min(1000).max(9999).optional().allow(0).messages({
    "number.base": "Fiscal year must be a number",
    "number.min": "Fiscal year must be a 4-digit number",
    "number.max": "Fiscal year must be a 4-digit number",
    "any.required": "Fiscal year is required",
  }),
  search: Joi.string().max(255).optional(),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("created_datetime").optional().allow(""),
  sortOrder: Joi.string()
    .valid("ASC", "DESC")
    .default("DESC")
    .optional()
    .allow(""),
});

const createResourceSkillSchema = Joi.object({
  eid: Joi.string().max(255).optional().allow(null).allow(""),
  account_rid: Joi.string().max(255).required(),
  resource_type: Joi.string().valid("Full-Time", "Sub Con", "Non-Labor").required().messages({
    'any.only': 'Resource type must be one of: Full-Time, Sub Con, or Non-Labor',
    'any.required': 'Resource type is required'
  }),
  resource_rid: Joi.string().max(255).optional().allow(null).allow(""),
  resource_number: Joi.string().max(255).required(),
  resource_ref_id: Joi.string().max(255).required(),
  start_date: Joi.number()
    .integer()
    .min(1900)
    .max(9999)
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "number.base": "Start date must be a valid year",
      "number.min": "Start date must be a 4-digit year",
      "number.max": "Start date must be a 4-digit year",
      "any.invalid": "Year cannot be in the future"
    }),
  skill_description: Joi.string().max(255).optional().allow(null).allow(""),
  skill_level: Joi.string()
    .valid("Beginner", "Intermediate", "Advanced")
    .optional()
    .allow("")
    .allow(null),
  skill_type_rid: Joi.string().max(255).required(),
  skill_subtype_rid: Joi.string().max(255).required(),
  skill_type_others: Joi.string().max(255).optional().allow(null).allow(""),
  skill_subtype_others: Joi.string().max(255).optional().allow(null).allow(""),
  skill_details: Joi.string().max(2000).optional().allow(null).allow(""),
  comments: Joi.string().max(2000).optional().allow(null).allow(""),  
  created_by: Joi.string().max(255).optional().allow(null).allow(""),
  modified_by: Joi.string().max(255).optional().allow(null).allow(""),
  accountNumber: Joi.string().max(255).required(),
});

const updateResourceSkillSchema = Joi.object({
  rid: Joi.string().max(255).required(),
  eid: Joi.string().max(255).optional().allow(null).allow(""),
  start_date: Joi.number()
    .integer()
    .min(1900)
    .max(9999)
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "number.base": "Start date must be a valid year",
      "number.min": "Start date must be a 4-digit year",
      "number.max": "Start date must be a 4-digit year",
      "any.invalid": "Year cannot be in the future"
    }),
  skill_description: Joi.string().max(255).optional().allow(null).allow(""),
  skill_level: Joi.string()
    .valid("Beginner", "Intermediate", "Advanced", "-")
    .optional()
    .allow("")
    .allow(null),
  modified_by: Joi.string().max(255).optional(),
  skill_type_rid: Joi.string().max(255).required(),
  skill_subtype_rid: Joi.string().max(255).required(),
  skill_type_others: Joi.string().max(255).optional().allow(null).allow(""),
  skill_subtype_others: Joi.string().max(255).optional().allow(null).allow(""),
  skill_details: Joi.string().max(2000).optional().allow(null).allow(""),
  comments: Joi.string().max(2000).optional().allow(null).allow(""),
  status: Joi.string().max(255).optional(),
  modified_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  accountNumber: Joi.string().max(255).required(),
});

const getResourceSkillSchema = Joi.object({
  id: Joi.string().pattern(uuidRegex).required(),
  accountNumber: Joi.string().max(255).required(),
});

const listResourceSkillSchema = Joi.object({
  resourceRid: Joi.string().pattern(uuidRegex).max(255).required(),
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
});


const exportResourceSkillSchema = Joi.object({
  rid: Joi.string().pattern(uuidRegex).max(255).optional().allow(null),
  resourceRid: Joi.string().pattern(uuidRegex).max(255).optional().allow(null),
  search: Joi.string().max(255).optional().allow("").allow(null),
  filters: Joi.string().default("{}").optional(),
  sortBy: Joi.string().default("created_datetime").optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
  accountNumber: Joi.string().max(255).required(),
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
});
const updateResourceCostSchema = Joi.object({
  rid: Joi.string().pattern(uuidRegex).required(),
  eid: Joi.string().max(255).optional().allow(null).allow(""),
  accountNumber: Joi.string().max(255).required(),
  currency_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  effective_date: Joi.string()
    .max(10)
    .custom(isValidDate, "Effective date validation")
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "effective_date must be in the format MM/DD/YYYY",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat":
        "Invalid effective date. Please use the format MM/DD/YYYY",
    }),
  end_date: Joi.string()
    .max(10)
    .custom(isValidDate, "End date validation")
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "end_date must be in the format MM/DD/YYYY",
      "date.invalidFormat":
        "Invalid end date. Please use the format MM/DD/YYYY",
    }),
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
    cost: Joi.string()
    .pattern(/^\d+(\.\d{0,2})?$/)
    .required()
    .messages({
      "string.base": "Cost must be a valid string number maximum up to (9999999999999999.99)",
      "string.pattern.base": "Cost must be a valid number with up to 2 decimal places",
      "string.empty": "Cost is required",
      "any.required": "Cost is required"
    }),
  status: Joi.string().max(255).default("active").optional(),
  fiscal_year: Joi.number()
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
  comments: Joi.string().max(2000).optional().allow("").allow(null), 
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
  resourceRid: Joi.string().pattern(uuidRegex).max(255).required(),
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
});

const exportResourceCostSchema = Joi.object({
  resourceRid: Joi.string().pattern(uuidRegex).max(255).required(),
  search: Joi.string().max(255).optional().allow("").allow(null),
  filters: Joi.string().default("{}").optional(),
  sortBy: Joi.string().default("created_datetime").optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
  accountNumber: Joi.string().max(255).required(),
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
});

const resourceCostSchema = Joi.object({
  eid: Joi.string().max(255).optional().allow(null).allow(""),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  accountNumber: Joi.string().max(255).required(),
  resource_number: Joi.string().max(255).required(),
  resource_type: Joi.string().valid("Full-Time", "Sub Con", "Non-Labor").required().messages({
    'any.only': 'Resource type must be one of: Full-Time, Sub Con, or Non-Labor',
    'any.required': 'Resource type is required'
  }),
  resource_rid: Joi.string().pattern(uuidRegex).required(),
  resource_ref_id: Joi.string().max(255).required(),
  effective_date: Joi.string()
    .max(10)
    .custom(isValidDate, "Effective date validation")
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "effective_date must be in the format MM/DD/YYYY",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat":
        "Invalid effective date. Please use the format MM/DD/YYYY",
    }),
  end_date: Joi.string()
    .max(10)
    .custom(isValidDate, "End date validation")
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "end_date must be in the format MM/DD/YYYY",
      "date.invalidFormat":
        "Invalid end date. Please use the format MM/DD/YYYY",
    }),
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
  cost: Joi.string()
    .pattern(/^\d+(\.\d{0,2})?$/)
    .required()
    .messages({
      "string.base": "Cost must be a valid string number maximum up to (9999999999999999.99)",
      "string.pattern.base": "Cost must be a valid number with up to 2 decimal places",
      "string.empty": "Cost is required",
      "any.required": "Cost is required"
    }),
    fiscal_year: Joi.number()
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
  currency_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  status: Joi.string().max(255).default("active"),
  comments: Joi.string().max(2000).optional().allow(null).allow(""),
  created_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  modified_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  created_by: Joi.string().max(255).optional(),
  modified_by: Joi.string().max(255).optional(),
});

const createProjectSchema = Joi.object({
  account_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  project_code: Joi.string().min(5).max(50).required(),
  program_name: Joi.string().min(4).max(255).optional().allow("").allow(null),
  project_name: Joi.string().min(4).max(255).optional().allow("").allow(null),
  industry_rid: Joi.string()
  .guid({ version: ["uuidv4"] })
  .optional().allow(null),
  industry_name: Joi.string().min(4).max(100).optional().allow(null).allow(""),
  project_startdate: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isNotFutureDate, "Future Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "project start date must be in the format DD/MM/YYYY",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat": "Invalid project start date.",
    }),
  project_enddate: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isEndDateAfterStartDate, "End Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "Project end date must be in the format DD/MM/YYYY",
      "any.invalid": "Project end date must be after the start date.",
      "date.invalidFormat": "Invalid Project end date.",
    }),
  project_type: Joi.string().valid("Fixed", "Time & Material").required(),
  project_classification_rid: Joi.string().guid({ version: ["uuidv4"] }).optional().allow(null),
  project_client_group: Joi.string().max(200).optional().allow("").allow(null),
  project_group: Joi.string().max(150).optional().allow("").allow(null),
  project_status: Joi.string().valid("Active", "Inactive").required(),
  fiscal_year: Joi.number().integer().min(1000).max(9999).required().messages({
    "number.base": "Fiscal year must be a number",
    "number.min": "Fiscal year must be a 4-digit number",
    "number.max": "Fiscal year must be a 4-digit number",
    "any.required": "Fiscal year is required",
  }),
  country: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional()
    .allow("", null),
  region: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional()
    .allow("", null),
  currency: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional()
    .allow("", null),
  // project_manager: Joi.string().min(3).max(100).required(),
  // project_lead: Joi.string().min(3).max(100).required(),
  // spoc_name: Joi.string().min(3).max(100).required(),
  // spoc_email: Joi.string().email().max(255).optional().allow("").allow(null),
  // spoc_mobile: Joi.string().max(15).optional().allow("").allow(null),
  // project_tpc_name: Joi.string()
  //   .min(3)
  //   .max(100)
  //   .optional()
  //   .allow("")
  //   .allow(null),
  // project_tpc_email: Joi.string()
  //   .email()
  //   .max(255)
  //   .optional()
  //   .allow("")
  //   .allow(null),
  // project_tpc_mobile: Joi.string().max(15).optional().allow("").allow(null),
  // project_cc_list: Joi.string()
  //   .allow("")
  //   .allow(null)
  //   .optional()
  //   .custom((value, helpers) => {
  //     if (!value) return value;

  //     const emails = value.split(",").map((e: string) => e.trim());
  //     const invalidEmails = emails.filter(
  //       (email: string) => Joi.string().email().validate(email).error
  //     );

  //     if (invalidEmails.length > 0) {
  //       return helpers.message({
  //         custom: `Invalid email(s) in Project CC List: ${invalidEmails.join(
  //           ", "
  //         )}`,
  //       });
  //     }

  //     return value;
  //   }, "Comma-separated email validator"),
  total_effort: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total Effort must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  total_cost: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total Cost must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  total_fte: Joi.number().greater(0).optional().allow(null),
  total_sub_con: Joi.number().greater(0).optional().allow(null),
  total_non_labor_cost: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total NON Labor Cost must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  total_fte_effort: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total FTE Effort must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  total_sub_con_effort: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total SUB Con Effort must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  total_fte_cost: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total FTE Cost must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  total_sub_con_cost: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total SUB Con Cost must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  // last_rd_ai_assess_on: Joi.string()
  // .max(10)
  // .custom(isValidDate, "Effective date validation")
  // .optional()
  // .allow(null)
  // .allow("")
  // .messages({
  //   "string.pattern.base": "Last rd ai assess date must be in the format MM/DD/YYYY",
  //   "any.invalid": "Date cannot be in the future.",
  //   "date.invalidFormat":
  //     "Last rd ai assess date. Please use the format MM/DD/YYYY",
  // }),
  // last_rd_ai_assess_by: Joi.string()
  //   .guid({ version: ["uuidv4"] })
  //   .optional()
  //   .allow("", null),
  auto_send_ai_interaction: Joi.boolean().required(),
  auto_access_rd: Joi.boolean().optional().allow(null).default(false),
  max_ai_interaction: Joi.number().greater(0).required(),
  blended_rate_fte: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Blended Rate FTE must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  blended_rate_sub_con: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Blended Rate Sub Con must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Blended Rate Sub Con must be a valid positive number",
  })
  .optional()
  .allow(null),
  comments: Joi.string().max(2000).allow(null).allow(""),
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
      .min(3).max(125).optional().allow("").allow(null).messages({
        "string.base": "Key Contact Email must be a text value.",
        "string.empty": "Key Contact Email cannot be empty.",
        "string.min": "Key Contact Email must be at least 6 characters long.",
        "string.max": "Key Contact Email cannot exceed 254 characters.",
        "string.pattern.base": "Key Contact Email must follow the format: localpart@domain.tld, with a valid TLD (2–63 characters)."
      }),
      key_contact_role: Joi.string().guid({ version: ["uuidv4"] }).optional().allow(null),
      is_primary_contact: Joi.boolean().valid(true, false).optional().allow(null),
      include_in_communication: Joi.boolean().valid(true, false).optional().allow(null),
      status: Joi.string().valid("Active", "Inactive").optional().allow(null),
      action_type: Joi.string().valid('add').required()
    })
  )
  .optional(),
  project_description: Joi.string().max(1000).allow(null).allow(""),
});

const updateProjectSchema = Joi.object({
  project_id: Joi.string().guid({ version: ["uuidv4"] }).required(),
  account_id: Joi.string().guid({ version: ["uuidv4"] }).required(),
  project_code: Joi.string().min(5).max(50).required(),
  program_name: Joi.string().min(4).max(255).optional().allow("").allow(null),
  project_name: Joi.string().min(4).max(255).optional().allow("").allow(null),
  industry_rid: Joi.string()
  .guid({ version: ["uuidv4"] })
  .optional().allow(null),
  industry_name: Joi.string().min(4).max(100).optional().allow(null).allow(""),
  project_startdate: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isNotFutureDate, "Future Date Validation")
    .messages({
      "string.pattern.base": "project start date must be in the format DD/MM/YYYY",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat": "Invalid project start date.",
    }),

  project_enddate: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isEndDateAfterStartDate, "End Date Validation")
    .messages({
      "string.pattern.base": "Project end date must be in the format DD/MM/YYYY",
      "any.invalid": "Project end date must be after the start date.",
      "date.invalidFormat": "Invalid Project end date.",
    }),

  project_type: Joi.string().valid("Fixed", "Time & Material").required(),
  project_classification_rid: Joi.string().guid({ version: ["uuidv4"] }).optional().allow(null),
  project_client_group: Joi.string().max(200).optional().allow("").allow(null),
  project_group: Joi.string().max(150).optional().allow("").allow(null),
  project_status: Joi.string().valid("Active", "Inactive").required(),
  fiscal_year: Joi.number().integer().min(1000).max(9999).required().messages({
    "number.base": "Fiscal year must be a number",
    "number.min": "Fiscal year must be a 4-digit number",
    "number.max": "Fiscal year must be a 4-digit number",
    "any.required": "Fiscal year is required",
  }),
  country: Joi.string().guid({ version: ["uuidv4"] }).optional().allow("", null),
  region: Joi.string().guid({ version: ["uuidv4"] }).optional().allow("", null),
  currency: Joi.string().guid({ version: ["uuidv4"] }).optional().allow("", null),
  total_effort: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total Effort must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  total_cost: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total Cost must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),

  total_fte: Joi.number().greater(0).optional().allow(null),
  total_sub_con: Joi.number().greater(0).optional().allow(null),
  
  total_fte_effort: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total FTE Effort must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  total_sub_con_effort: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total SUB Con Effort must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  total_fte_cost: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total FTE Cost must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  total_sub_con_cost: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total SUB Con Cost must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  total_non_labor_cost: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total NON Labor Cost must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),

  // last_rd_ai_assess_on: Joi.string()
  // .max(10)
  // .custom(isValidDate, "Effective date validation")
  // .optional()
  // .allow(null)
  // .allow("")
  // .messages({
  //   "string.pattern.base": "Last rd ai assess date must be in the format MM/DD/YYYY",
  //   "any.invalid": "Date cannot be in the future.",
  //   "date.invalidFormat":
  //     "Last rd ai assess date. Please use the format MM/DD/YYYY",
  // }),
  last_rd_ai_assess_by: Joi.string().guid({ version: ["uuidv4"] }).optional().allow("", null),
  auto_send_ai_interaction: Joi.boolean().optional().allow(null).default(false),
  auto_access_rd: Joi.boolean().optional().allow(null).default(false),
  max_ai_interaction: Joi.number().greater(0).optional().allow(null),

  blended_rate_fte: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Blended Rate FTE  must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
  blended_rate_sub_con: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Blened Rate SUB Con must have up to 16 digits before the decimal and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return num;
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),

  project_description: Joi.string().max(2000).allow(null).allow(""),
  key_contacts: Joi.array()
    .items(
      Joi.object({
        action_type: Joi.string().valid('edit', "add", "delete").required(),
        rid: Joi.string()
        .guid({ version: ["uuidv4"] })
        .when("action_type", {
          is: "edit",
          then: Joi.required(),
          otherwise: Joi.optional().allow(null),
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
        .min(3).max(125).optional().allow("").allow(null).messages({
          "string.base": "Key Contact Email must be a text value.",
          "string.empty": "Key Contact Email cannot be empty.",
          "string.min": "Key Contact Email must be at least 6 characters long.",
          "string.max": "Key Contact Email cannot exceed 254 characters.",
          "string.pattern.base": "Key Contact Email must follow the format: localpart@domain.tld, with a valid TLD (2–63 characters)."
        }),
        key_contact_role: Joi.string().guid({ version: ["uuidv4"] }).optional().allow(null),
        is_primary_contact: Joi.boolean().valid(true, false).optional().allow(null),
        include_in_communication: Joi.boolean().valid(true, false).optional().allow(null),
        status: Joi.string().valid("Active", "Inactive").optional().allow(null)
      })
    )
    .optional(),
  comments: Joi.string().max(2000).allow(null).allow(""),
});

export {
  listResourceSkillSchema,
  updateResourceSkillSchema,
  createResourceSkillSchema,
  getResourceSkillSchema,
  resourceCostSchema,
  listResourceCostSchema,
  getResourceCostSchema,
  updateResourceCostSchema,
  createResourcesSchema,
  updateResourceSchema,
  listResourceSchema,
  exportResourceSchema,
  exportResourceCostSchema,
  exportResourceSkillSchema,
  createProjectSchema,
  updateProjectSchema

};
