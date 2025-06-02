import Decimal from "decimal.js";
import Joi from "joi";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const decimal18_2Regex = /^\d{1,16}(\.\d{1,2})?$/;

const isNotFutureDate = (value: string, helpers: Joi.CustomHelpers): any => {
  if (!value) return value;

  // Parse the date in MM/DD/YYYY format
  const [year, month, day] = value.split("-").map(Number);

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

  // Parse the date in yyyy-mm-dd format
  const [year, month, day] = value.split("-").map(Number);

  // Create a date object with time set to noon UTC
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return helpers.error("date.invalidFormat", {
      message: "Invalid date format. Please use YYYY-MM-DD.",
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

  // Parse dates in yyyy-mm-dd format
  const [ endYear, endMonth, endDay ] = value.split("-").map(Number);
  const [startYear,startMonth, startDay] = context.effective_from_date
    .split("-")
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

const isEndDateAfterStartDateForProject = (
  value: string,
  helpers: Joi.CustomHelpers
): any => {
  const context = helpers.state?.ancestors[0];

  // If either value or effective_from_date is missing, return the value as-is
  if (!context?.project_startdate || !value) {
    return value;
  }

  // Parse dates in MM/DD/YYYY format
  const [endYear, endMonth, endDay] = value.split("-").map(Number);
  const [startYear, startMonth, startDay] = context.project_startdate
    .split("-")
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

const costFields = [
  'annual_cost',
  'semi_annual_cost',
  'monthly_cost',
  'bi_weekly_cost',
  'weekly_cost',
  'daily_cost',
  'hourly_cost'
];

// Shared validation method
const MAX_COST_VALUE = 999999999999.99;

const costFieldValidator = (fieldName: string) => {
  return Joi.string()
    .pattern(/^\d+(\.\d{1,2})?$/)
    .custom((value, helpers) => {
      if (!value) return value; // skip empty string, already allowed

      const numValue = parseFloat(value);
      if (numValue > MAX_COST_VALUE) {
        return helpers.error('number.maxCost');
      }

      return value;
    })
    .allow('')
    .messages({
      'string.pattern.base': `${fieldName.replace(/_/g, ' ')} must be a valid number with up to 2 decimal places`,
      'number.maxCost': `${fieldName.replace(/_/g, ' ')} must be a valid string number maximum up to (${MAX_COST_VALUE})`
    });
};

const createResourcesSchema = Joi.object({
  account_number: Joi.string().max(50).required(),
  account_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  resource_code: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z0-9\-_]{2,49}$/)
    .required()
    .messages({
      'string.base': 'Resource Code must be a string.',
      'string.empty': 'Resource Code is required.',
      'string.pattern.base': 'Resource Code must start with a letter and can only contain letters, numbers, hyphens and underscores.',
      'string.min': 'Resource Code must be at least 3 characters long.',
      'string.max': 'Resource Code must not exceed 50 characters.',
      'any.required': 'Resource Code is a required field.'
    }),
  resource_type: Joi.string().valid("Full-Time", "Sub Con", "Non-Labor").required().messages({
    'any.only': 'Resource type must be one of: Full-Time, Sub Con, or Non-Labor',
    'any.required': 'Resource type is required'
  }),
  name: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z\s\-']{0,62}[A-Za-z]$/)
    .min(2)
    .max(64)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "Name must start and end with a letter and contain only letters, spaces, hyphens and apostrophes",
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name must not exceed 64 characters"
    }),
  first_name: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z\s\-']{0,62}[A-Za-z]$/)
    .min(2)
    .max(64)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "First name must start and end with a letter and contain only letters, spaces, hyphens and apostrophes",
      "string.min": "First name must be at least 2 characters long",
      "string.max": "First name must not exceed 64 characters"
    }),
  last_name: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z\s\-']{0,62}[A-Za-z]$/)
    .min(2)
    .max(64)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "Last name must start and end with a letter and contain only letters, spaces, hyphens and apostrophes",
      "string.min": "Last name must be at least 2 characters long", 
      "string.max": "Last name must not exceed 64 characters"
    }),
  org_name: Joi.string()
    .pattern(/^[A-Za-z0-9][A-Za-z0-9\s&\-.'(),]{1,98}[A-Za-z0-9]$/)
    .min(3)
    .max(100)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "Organization name must start and end with alphanumeric characters and can only contain letters, numbers, spaces, and the following characters: & - . ' , ()",
      "string.min": "Organization name must be at least 3 characters long",
      "string.max": "Organization name must not exceed 100 characters",
      "string.empty": "Organization name cannot be an empty string",
      "any.allowOnly": "Organization name cannot be null or empty"
    }),
  role: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z\s\-'.]{1,98}[A-Za-z]$/)
    .min(3)
    .max(100)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "Role must contain only letters, hyphens, apostrophes, periods and spaces",
      "string.min": "Role must be at least 3 characters long",
      "string.max": "Role must not exceed 100 characters"
    }),
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
    .custom((value, helpers) => {
      if (!value) return value;
    
      const [year,month, day] = value.split("-").map(Number);
      const inputDate = new Date(Date.UTC(year, month - 1, day));
      const minDate = new Date(Date.UTC(1950, 0, 1));
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); // Normalize to date only
    
      if (isNaN(inputDate.getTime())) {
        return helpers.error("date.invalidFormat", {
          message: "Invalid date format. Please use YYYY-MM-DD."
        });
      }
    
      if (inputDate < minDate) {
        return helpers.error("date.min", {
          message: "Effective From date cannot be before 1950-01-01"
        });
      }
    
      if (inputDate > today) {
        return helpers.error("date.max", {
          message: "Effective From date cannot be in the future"
        });
      }
    
      return value;
    })
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.base": "Effective from date must be a valid date",
      "string.max": "Effective from date format should be YYYY-MM-DD",
      "date.invalidFormat": "Invalid date format. Please use YYYY-MM-DD",
      "date.min": "Effective from date cannot be before 1950-01-01",
      "date.max": "Effective from date cannot be in the future"
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
        "effective_end_date must be in the format YYYY-MM-DD",
      "any.invalid": "Effective end date must be after the start date.",
      "date.invalidFormat":
        "Invalid effective end date. Please use the format YYYY-MM-DD",
    }),
  resource_designation: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z\s\-'.]{1,62}[A-Za-z]$/)
    .min(3)
    .max(64)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "Resource designation must contain only letters, hyphens, apostrophes, periods and spaces",
      "string.min": "Resource designation must be at least 3 characters long",
      "string.max": "Resource designation must not exceed 64 characters"
    }),
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
  comments: Joi.string().optional().allow("").allow(null),
});

const updateResourceSchema = Joi.object({
  resource_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  account_number: Joi.string().max(50).required(),
  resource_code: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z0-9\-_]{2,49}$/)
    .required()
    .messages({
      'string.base': 'Resource Code must be a string.',
      'string.empty': 'Resource Code is required.',
      'string.pattern.base': 'Resource Code must start with a letter and can only contain letters, numbers, hyphens and underscores.',
      'string.min': 'Resource Code must be at least 3 characters long.',
      'string.max': 'Resource Code must not exceed 50 characters.',
      'any.required': 'Resource Code is a required field.'
    }),
  resource_type: Joi.string().valid("Full-Time", "Sub Con", "Non-Labor").required().messages({
    'any.only': 'Resource type must be one of: Full-Time, Sub Con, or Non-Labor',
    'any.required': 'Resource type is required'
  }),
  name: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z\s\-']{0,62}[A-Za-z]$/)
    .min(2)
    .max(64)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "Name must start and end with a letter and contain only letters, spaces, hyphens and apostrophes",
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name must not exceed 64 characters"
    }),
  first_name: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z\s\-']{0,62}[A-Za-z]$/)
    .min(2)
    .max(64)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "First name must start and end with a letter and contain only letters, spaces, hyphens and apostrophes",
      "string.min": "First name must be at least 2 characters long",
      "string.max": "First name must not exceed 64 characters"
    }),
  last_name: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z\s\-']{0,62}[A-Za-z]$/)
    .min(2)
    .max(64)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "Last name must start and end with a letter and contain only letters, spaces, hyphens and apostrophes",
      "string.min": "Last name must be at least 2 characters long", 
      "string.max": "Last name must not exceed 64 characters"
    }),
  org_name: Joi.string()
    .pattern(/^[A-Za-z0-9][A-Za-z0-9\s&\-.'(),]{1,98}[A-Za-z0-9]$/)
    .min(3)
    .max(100)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "Organization name must start and end with alphanumeric characters and can only contain letters, numbers, spaces, and the following characters: & - . ' , ()",
      "string.min": "Organization name must be at least 3 characters long",
      "string.max": "Organization name must not exceed 100 characters",
      "string.empty": "Organization name cannot be an empty string",
      "any.allowOnly": "Organization name cannot be null or empty"
    }),
  role: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z\s\-'.]{1,98}[A-Za-z]$/)
    .min(3)
    .max(100)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "Role must contain only letters, hyphens, apostrophes, periods and spaces",
      "string.min": "Role must be at least 3 characters long",
      "string.max": "Role must not exceed 100 characters"
    }),
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
    .custom((value, helpers) => {
      if (!value) return value;
    
      const [year,month, day] = value.split("-").map(Number);
      const inputDate = new Date(Date.UTC(year, month - 1, day));
      const minDate = new Date(Date.UTC(1950, 0, 1));
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); // Normalize to date only
    
      if (isNaN(inputDate.getTime())) {
        return helpers.error("date.invalidFormat", {
          message: "Invalid date format. Please use YYYY-MM-DD."
        });
      }
    
      if (inputDate < minDate) {
        return helpers.error("date.min", {
          message: "Effective From date cannot be before 1950-01-01"
        });
      }
    
      if (inputDate > today) {
        return helpers.error("date.max", {
          message: "Effective From date cannot be in the future"
        });
      }
    
      return value;
    })
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.base": "Effective from date must be a valid date",
      "string.max": "Effective from date format should be YYYY-MM-DD",
      "date.invalidFormat": "Invalid date format. Please use YYYY-MM-DD",
      "date.min": "Effective from date cannot be before 1950-01-01",
      "date.max": "Effective from date cannot be in the future"
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
        "effective_end_date must be in the format YYYY-MM-DD",
      "any.invalid": "Effective end date must be after the start date.",
      "date.invalidFormat":
        "Invalid effective end date. Please use the format YYYY-MM-DD",
    }),
  resource_designation: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z\s\-'.]{1,62}[A-Za-z]$/)
    .min(3)
    .max(64)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "Resource designation must contain only letters, hyphens, apostrophes, periods and spaces",
      "string.min": "Resource designation must be at least 3 characters long",
      "string.max": "Resource designation must not exceed 64 characters"
    }),
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
  comments: Joi.string().optional().allow("").allow(null),
});

const listResourceSchema = Joi.object({
  page: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("1"),
  limit: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("100"),
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

const exportListResourceSchema = Joi.object({
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
  resource_code: Joi.string().max(255).required(),
  start_date: Joi.string()
    .max(10)
    .custom((value, helpers) => {
      if (!value) return value;
    
      const [ year, month, day ] = value.split("-").map(Number);
      const inputDate = new Date(Date.UTC(year, month - 1, day));
      const minDate = new Date(Date.UTC(1950, 0, 1));
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); // Normalize to date only
    
      if (isNaN(inputDate.getTime())) {
        return helpers.error("date.invalidFormat", {
          message: "Invalid date format. Please use YYYY-MM-DD."
        });
      }
    
      if (inputDate < minDate) {
        return helpers.error("date.min", {
          message: "Start date cannot be before 1950-01-01"
        });
      }
    
      if (inputDate > today) {
        return helpers.error("date.max", {
          message: "Start date cannot be in the future"
        });
      }
    
      return value;
    })    
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.base": "Start date must be a valid date",
      "string.max": "Start date format should be YYYY-MM-DD",
      "date.invalidFormat": "Invalid date format. Please use YYYY-MM-DD",
      "date.min": "Start date cannot be before 1950-01-01",
      "date.max": "Start date cannot be in the future"
    }),
  skill_description: Joi.string().max(255).optional().allow(null).allow(""),
  skill_level: Joi.string()
    .valid("Beginner", "Intermediate", "Advanced")
    .optional()
    .allow("")
    .allow(null),
  skill_type_rid: Joi.string().max(255).required(),
  skill_subtype_rid: Joi.string().max(255).required(),
  skill_type_others: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z\s\-'._]{1,62}[A-Za-z]$/)
    .min(3)
    .max(64)
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "Skill type others must contain only letters, hyphens, apostrophes, periods, underscores and spaces",
      "string.min": "Skill type others must be at least 3 characters long",
      "string.max": "Skill type others must not exceed 64 characters"
    }),
  skill_subtype_others: Joi.string()
  .pattern(/^[A-Za-z][A-Za-z\s\-'._]{1,62}[A-Za-z]$/)
  .min(3)
  .max(64)
  .optional()
  .allow(null)
  .allow("")
  .messages({
    "string.pattern.base": "Skill type others must contain only letters, hyphens, apostrophes, periods, underscores and spaces",
    "string.min": "Skill type others must be at least 3 characters long",
    "string.max": "Skill type others must not exceed 64 characters"
  }),
  skill_details: Joi.string().optional().allow(null).allow(""),
  comments: Joi.string().optional().allow(null).allow(""),  
  created_by: Joi.string().max(255).optional().allow(null).allow(""),
  modified_by: Joi.string().max(255).optional().allow(null).allow(""),
  accountNumber: Joi.string().max(255).required(),
});

const updateResourceSkillSchema = Joi.object({
  rid: Joi.string().max(255).required(),
  eid: Joi.string().max(255).optional().allow(null).allow(""),
  start_date: Joi.string()
    .max(10)
    .custom((value, helpers) => {
      if (!value) return value;
    
      const [year,month,day] = value.split("-").map(Number);
      const inputDate = new Date(Date.UTC(year, month - 1, day));
      const minDate = new Date(Date.UTC(1950, 0, 1));
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); // Normalize to date only
    
      if (isNaN(inputDate.getTime())) {
        return helpers.error("date.invalidFormat", {
          message: "Invalid date format. Please use YYYY-MM-DD."
        });
      }
    
      if (inputDate < minDate) {
        return helpers.error("date.min", {
          message: "Start date cannot be before 1950-01-01"
        });
      }
    
      if (inputDate > today) {
        return helpers.error("date.max", {
          message: "Start date cannot be in the future"
        });
      }
    
      return value;
    })
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.base": "Start date must be a valid date",
      "string.max": "Start date format should be YYYY-MM-DD",
      "date.invalidFormat": "Invalid date format. Please use YYYY-MM-DD",
      "date.min": "Start date cannot be before 1950-01-01",
      "date.max": "Start date cannot be in the future"
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
  skill_type_others: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z\s\-'._]{1,62}[A-Za-z]$/)
    .min(3)
    .max(64)
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "Skill type others must contain only letters, hyphens, apostrophes, periods, underscores and spaces",
      "string.min": "Skill type others must be at least 3 characters long",
      "string.max": "Skill type others must not exceed 64 characters"
    }),
  skill_subtype_others: Joi.string()
  .pattern(/^[A-Za-z][A-Za-z\s\-'._]{1,62}[A-Za-z]$/)
  .min(3)
  .max(64)
  .optional()
  .allow(null)
  .allow("")
  .messages({
    "string.pattern.base": "Skill type others must contain only letters, hyphens, apostrophes, periods, underscores and spaces",
    "string.min": "Skill type others must be at least 3 characters long",
    "string.max": "Skill type others must not exceed 64 characters"
  }),
  skill_details: Joi.string().optional().allow(null).allow(""),
  comments: Joi.string().optional().allow(null).allow(""),
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
      "string.pattern.base": "effective_date must be in the format YYYY-MM-DD",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat":
        "Invalid effective date. Please use the format YYYY-MM-DD",
    }),
  end_date: Joi.string()
    .max(10)
    .custom(isValidDate, "End date validation")
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "end_date must be in the format YYYY-MM-DD",
      "date.invalidFormat":
        "Invalid end date. Please use the format YYYY-MM-DD",
    }),
  annual_cost: costFieldValidator('annual_cost'),
  // semi_annual_cost: costFieldValidator('semi_annual_cost'),
  monthly_cost: costFieldValidator('monthly_cost'),
  bi_weekly_cost: costFieldValidator('bi_weekly_cost'),
  weekly_cost: costFieldValidator('weekly_cost'),
  daily_cost: costFieldValidator('daily_cost'),
  hourly_cost: costFieldValidator('hourly_cost'),
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
  comments: Joi.string().optional().allow("").allow(null), 
  modified_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  modified_by: Joi.string().max(255).optional(),
}).custom((value, helpers) => {
  const filled = costFields.filter(field => value[field] && value[field].toString().trim() !== '');

  if (filled.length === 0) {
    return helpers.error('any.atLeastOneCostRequired');
  }

  if (filled.length > 1) {
    return helpers.error('any.onlyOneCostAllowed');
  }

  return value;
}).messages({
  'any.onlyOneCostAllowed': 'Only one cost field should have a value',
  'any.atLeastOneCostRequired': 'At least one cost field is required'
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
  resource_code: Joi.string().max(255).required(),
  effective_date: Joi.string()
    .max(10)
    .custom(isValidDate, "Effective date validation")
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "effective_date must be in the format YYYY-MM-DD",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat":
        "Invalid effective date. Please use the format YYYY-MM-DD",
    }),
  end_date: Joi.string()
    .max(10)
    .custom(isValidDate, "End date validation")
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "end_date must be in the format YYYY-MM-DD",
      "date.invalidFormat":
        "Invalid end date. Please use the format YYYY-MM-DD",
    }),
  annual_cost: costFieldValidator('annual_cost'),
  // semi_annual_cost: costFieldValidator('semi_annual_cost'),
  monthly_cost: costFieldValidator('monthly_cost'),
  bi_weekly_cost: costFieldValidator('bi_weekly_cost'),
  weekly_cost: costFieldValidator('weekly_cost'),
  daily_cost: costFieldValidator('daily_cost'),
  hourly_cost: costFieldValidator('hourly_cost'),
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
  comments: Joi.string().optional().allow(null).allow(""),
  created_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  modified_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  created_by: Joi.string().max(255).optional(),
  modified_by: Joi.string().max(255).optional(),
}).custom((value, helpers) => {
  const filled = costFields.filter(field => value[field] && value[field].toString().trim() !== '');

  if (filled.length === 0) {
    return helpers.error('any.atLeastOneCostRequired');
  }

  if (filled.length > 1) {
    return helpers.error('any.onlyOneCostAllowed');
  }

  return value;
}).messages({
  'any.onlyOneCostAllowed': 'Only one cost field should have a value',
  'any.atLeastOneCostRequired': 'At least one cost field is required'
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
        "project start date must be in the format YYYY-MM-DD",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat": "Invalid project start date.",
    }),
  project_enddate: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isEndDateAfterStartDateForProject, "End Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "Project end date must be in the format YYYY-MM-DD",
      "any.invalid": "Project end date must be after the start date.",
      "date.invalidFormat": "Invalid Project end date.",
    }),
  project_type: Joi.string().valid("Fixed", "Time & Material").required(),
  project_classification_rid: Joi.string().guid({ version: ["uuidv4"] }).optional().allow(null),
  project_classification_other: Joi.string().optional().allow(null).allow(""),
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
    try {
      const num = new Decimal(value);
      if (num.lte(0)) {
        return helpers.error("any.invalid");
      }
      return value; 
    } catch (err) {
      return helpers.error("any.invalid");
    }
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
    try {
      const num = new Decimal(value);
      if (num.lte(0)) {
        return helpers.error("any.invalid");
      }
      return value; 
    } catch (err) {
      return helpers.error("any.invalid");
    }
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
    try {
      const num = new Decimal(value);
      if (num.lte(0)) {
        return helpers.error("any.invalid");
      }
      return value; 
    } catch (err) {
      return helpers.error("any.invalid");
    }
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
    try {
      const num = new Decimal(value);
      if (num.lte(0)) {
        return helpers.error("any.invalid");
      }
      return value; 
    } catch (err) {
      return helpers.error("any.invalid");
    }
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
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
      "string.pattern.base": "project start date must be in the format YYYY-MM-DD",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat": "Invalid project start date.",
    }),

  project_enddate: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isEndDateAfterStartDateForProject, "End Date Validation")
    .messages({
      "string.pattern.base": "Project end date must be in the format YYYY-MM-DD",
      "any.invalid": "Project end date must be after the start date.",
      "date.invalidFormat": "Invalid Project end date.",
    }),

  project_type: Joi.string().valid("Fixed", "Time & Material").required(),
  project_classification_rid: Joi.string().guid({ version: ["uuidv4"] }).optional().allow(null),
  project_classification_other: Joi.string().optional().allow(null).allow(""),
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
    try {
      const num = new Decimal(value);
      if (num.lte(0)) {
        return helpers.error("any.invalid");
      }
      return value; 
    } catch (err) {
      return helpers.error("any.invalid");
    }
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
    try {
      const num = new Decimal(value);
      if (num.lte(0)) {
        return helpers.error("any.invalid");
      }
      return value; 
    } catch (err) {
      return helpers.error("any.invalid");
    }
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
    try {
      const num = new Decimal(value);
      if (num.lte(0)) {
        return helpers.error("any.invalid");
      }
      return value; 
    } catch (err) {
      return helpers.error("any.invalid");
    }
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
    try {
      const num = new Decimal(value);
      if (num.lte(0)) {
        return helpers.error("any.invalid");
      }
      return value; 
    } catch (err) {
      return helpers.error("any.invalid");
    }
  })
  .messages({
    "any.invalid": "Total Effort must be a valid positive number",
  })
  .optional()
  .allow(null),
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
  updateProjectSchema,
  exportListResourceSchema
};
