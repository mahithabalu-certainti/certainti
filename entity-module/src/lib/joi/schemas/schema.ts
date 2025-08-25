import Decimal from "decimal.js";
import Joi from "joi";
import moment from "moment";
const uuidRegex = /^[A-Z0-9]{4}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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

const isProjectResEndDateAfterStartDate = (
  value: string,
  helpers: Joi.CustomHelpers
): any => {
  const context = helpers.state?.ancestors[0];

  // If either value or effective_from_date is missing, return the value as-is
  if (!context?.start_date || !value) {
    return value;
  }

  // Parse dates in yyyy-mm-dd format
  const [ endYear, endMonth, endDay ] = value.split("-").map(Number);
  const [startYear,startMonth, startDay] = context.start_date
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
const MAX_COST_VALUE = 9999999999999999.99;

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
    .allow('').allow(null)
    .messages({
      'string.pattern.base': `${fieldName.replace(/_/g, ' ')} must be a valid number with up to 2 decimal places`,
      'number.maxCost': `${fieldName.replace(/_/g, ' ')} must be a valid string number maximum up to (${MAX_COST_VALUE})`
    });
};

const createResourcesSchema = Joi.object({
  account_number: Joi.string().max(50).required(),
  account_id: Joi.string()
    .pattern(uuidRegex, "valid UUID")
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
  resource_type_rid: Joi.string().pattern(uuidRegex, "valid UUID").required().messages({
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
    .pattern(/^[A-Za-z\s\-'.]{3,64}$/)
    .min(3)
    .max(64)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "Role must contain only letters, hyphens (-), apostrophes ('), periods (.) and spaces",
      "string.min": "Role must be at least 3 characters long",
      "string.max": "Role must not exceed 64 characters"
    }),  
  country_rid: Joi.string()
     .pattern(uuidRegex, "valid UUID")
    .optional()
    .allow("", null),
  region_rid: Joi.string()
     .pattern(uuidRegex, "valid UUID")
    .optional()
    .allow("", null),
  city_rid: Joi.string()
     .pattern(uuidRegex, "valid UUID")
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
  .pattern(/^[A-Za-z\s\-'.]{3,64}$/)
  .min(3)
  .max(64)
  .optional()
  .allow("")
  .allow(null)
  .messages({
    "string.pattern.base": "Resource Designation must contain only letters, hyphens (-), apostrophes ('), periods (.) and spaces",
    "string.min": "Resource Designation must be at least 3 characters long",
    "string.max": "Resource Designation must not exceed 64 characters"
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
    status_rid: Joi.string().pattern(uuidRegex, "valid UUID").required().messages({
      'any.required': 'status_rid is required'
    }),
    created_by: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .optional(),
  comments: Joi.string().optional().allow("").allow(null),
});

const updateResourceSchema = Joi.object({
  resource_id: Joi.string()
    .pattern(uuidRegex, "valid UUID")
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
 resource_type_rid: Joi.string().pattern(uuidRegex, "valid UUID").required().messages({
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
    .pattern(/^[A-Za-z\s\-'.]{3,64}$/)
    .min(3)
    .max(64)
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.pattern.base": "Role must contain only letters, hyphens (-), apostrophes ('), periods (.) and spaces",
      "string.min": "Role must be at least 3 characters long",
      "string.max": "Role must not exceed 64 characters"
    }),
  country_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .optional()
    .allow("", null),
  region_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .optional()
    .allow("", null),
  city_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
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
  .pattern(/^[A-Za-z\s\-'.]{3,64}$/)
  .min(3)
  .max(64)
  .optional()
  .allow("")
  .allow(null)
  .messages({
    "string.pattern.base": "Resource Designation must contain only letters, hyphens (-), apostrophes ('), periods (.) and spaces",
    "string.min": "Resource Designation must be at least 3 characters long",
    "string.max": "Resource Designation must not exceed 64 characters"
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
  status_rid: Joi.string().pattern(uuidRegex, "valid UUID").required().messages({
    'any.required': 'status_rid is required'
  }),
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
  bothParentAndChild: Joi.boolean().optional().default(false),
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
  bothParentAndChild: Joi.boolean().optional().default(false),
  timezone: Joi.string().optional()
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
  resource_type_rid: Joi.string().pattern(uuidRegex, "valid UUID").required().messages({
    'any.required': 'Resource type is required'
  }),
  resource_rid: Joi.string().max(255).optional().allow(null).allow(""),
  resource_number: Joi.string().max(255).required(),
  resource_code: Joi.string().max(255).required(),
  effective_from: Joi.string()
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
          message: "Effective from cannot be before 1950-01-01"
        });
      }
    
      if (inputDate > today) {
        return helpers.error("date.max", {
          message: "Effective from cannot be in the future"
        });
      }
    
      return value;
    })    
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.base": "Effective from must be a valid date",
      "string.max": "Effective from  format should be YYYY-MM-DD",
      "date.invalidFormat": "Invalid date format. Please use YYYY-MM-DD",
      "date.min": "Effective from  cannot be before 1950-01-01",
      "date.max": "Effective from  cannot be in the future"
    }),
  skill_description: Joi.string().max(255).optional().allow(null).allow(""),
  skill_level_rid: Joi.string()
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
  effective_from: Joi.string()
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
          message: "Effective from cannot be before 1950-01-01"
        });
      }
    
      if (inputDate > today) {
        return helpers.error("date.max", {
          message: "Effective from cannot be in the future"
        });
      }
    
      return value;
    })
    .optional()
    .allow("")
    .allow(null)
    .messages({
      "string.base": "Effective from must be a valid date",
      "string.max": "Effective from format should be YYYY-MM-DD",
      "date.invalidFormat": "Invalid date format. Please use YYYY-MM-DD",
      "date.min": "Effective from cannot be before 1950-01-01",
      "date.max": "Effective from cannot be in the future"
    }),
  skill_description: Joi.string().max(255).optional().allow(null).allow(""),
  skill_level_rid: Joi.string()
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
  status_rid: Joi.string().max(255).optional(),
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
  resource_rid: Joi.string().pattern(uuidRegex).required(),
  currency_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  effective_from: Joi.string()
    .max(10)
    .custom(isValidDate, "Effective date validation")
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "Effective from must be in the format YYYY-MM-DD",
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
  // annual_cost: costFieldValidator('annual_cost'),
  // semi_annual_cost: costFieldValidator('semi_annual_cost'),
  // monthly_cost: costFieldValidator('monthly_cost'),
  // bi_weekly_cost: costFieldValidator('bi_weekly_cost'),
  // weekly_cost: costFieldValidator('weekly_cost'),
  // daily_cost: costFieldValidator('daily_cost'),
  // hourly_cost: costFieldValidator('hourly_cost'),
  salary: costFieldValidator('salary'),
  bonus: costFieldValidator('bonus'),
  insurance: costFieldValidator('insurance'),
  deductions: costFieldValidator('deductions'),
  resource_cost: costFieldValidator('resource_cost'),
  effort_in_hrs: Joi.string()
  .pattern(/^\d{1,16}(\.\d{1,2})?$/)
  .messages({
    "string.pattern.base":
      "Effort in hours must be a number with up to 16 digits and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return value; // return string (not number) to match original type
  })
  .messages({
    "any.invalid": "Effort in hours must be a valid positive number",
  })
  .optional()
  .allow(null)
  .allow(""),
  status_rid: Joi.string().max(255).optional(),
  user_preference: Joi.string().optional().allow(null).allow(""),
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
});

export const updateResourceDuplicateStatus = Joi.object({
  rid: Joi.string().pattern(uuidRegex).required(),
  action: Joi.string()
    .valid("accept", "reject")
    .required()
    .messages({
      "any.only": 'Action must be either "accept" or "reject"',
      "any.required": "Action is required"
    }),
  accountNumber: Joi.string().max(255).required(),
  type: Joi.string().valid("Anomaly", "Duplicate").required().messages({
      "any.only": 'Type must be either "Anomaly" or "Duplicate"',
      "any.required": "Type is required"
    }),
});

// .custom((value, helpers) => {
//   const filled = costFields.filter(field => value[field] && value[field].toString().trim() !== '');

//   if (filled.length === 0) {
//     return helpers.error('any.atLeastOneCostRequired');
//   }

//   if (filled.length > 1) {
//     return helpers.error('any.onlyOneCostAllowed');
//   }

//   return value;
// }).messages({
//   'any.onlyOneCostAllowed': 'Only one cost field should have a value',
//   'any.atLeastOneCostRequired': 'At least one cost field is required'
// });


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
  resource_type_rid: Joi.string().pattern(uuidRegex, "valid UUID").required().messages({
    'any.required': 'Resource type is required'
  }),
  resource_rid: Joi.string().pattern(uuidRegex).required(),
  resource_code: Joi.string().max(255).required(),
  effective_from: Joi.string()
    .max(10)
    .custom(isValidDate, "Effective date validation")
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "Effective from must be in the format YYYY-MM-DD",
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
  // annual_cost: costFieldValidator('annual_cost'),
  // semi_annual_cost: costFieldValidator('semi_annual_cost'),
  // monthly_cost: costFieldValidator('monthly_cost'),
  // bi_weekly_cost: costFieldValidator('bi_weekly_cost'),
  // weekly_cost: costFieldValidator('weekly_cost'),
  // daily_cost: costFieldValidator('daily_cost'),
  // hourly_cost: costFieldValidator('hourly_cost'),
  salary: costFieldValidator('salary'),
  bonus: costFieldValidator('bonus'),
  insurance: costFieldValidator('insurance'),
  deductions: costFieldValidator('deductions'),
  resource_cost: costFieldValidator('resource_cost'),
  effort_in_hrs: Joi.string()
  .pattern(/^\d{1,16}(\.\d{1,2})?$/)
  .messages({
    "string.pattern.base":
      "Effort in hours must be a number with up to 16 digits and up to 2 decimal places",
  })
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return helpers.error("any.invalid");
    }
    return value; // return string (not number) to match original type
  })
  .messages({
    "any.invalid": "Effort in hours must be a valid positive number",
  })
  .optional()
  .allow(null)
  .allow(""),
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
  status_rid: Joi.string().max(255),
  comments: Joi.string().optional().allow(null).allow(""),
  user_preference: Joi.string().optional().allow(null).allow(""),
  created_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  modified_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  created_by: Joi.string().max(255).optional(),
  modified_by: Joi.string().max(255).optional(),
});

// .custom((value, helpers) => {
//   const filled = costFields.filter(field => value[field] && value[field].toString().trim() !== '');

//   if (filled.length === 0) {
//     return helpers.error('any.atLeastOneCostRequired');
//   }

//   if (filled.length > 1) {
//     return helpers.error('any.onlyOneCostAllowed');
//   }

//   return value;
// }).messages({
//   'any.onlyOneCostAllowed': 'Only one cost field should have a value',
//   'any.atLeastOneCostRequired': 'At least one cost field is required'
// });

const createProjectSchema = Joi.object({
  account_id: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .required(),
  project_code: Joi.string().min(5).max(50).required(),
  program_name: Joi.string().min(4).max(255).optional().allow("").allow(null),
  project_name: Joi.string().min(4).max(255).optional().allow("").allow(null),
  industry_rid: Joi.string()
  .pattern(uuidRegex, "valid UUID")
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
  project_type_rid: Joi.string().pattern(uuidRegex, "valid UUID").required(),
  project_classification_rid: Joi.string().pattern(uuidRegex, "valid UUID").optional().allow(null),
  project_classification_other: Joi.string().optional().allow(null).allow(""),
  project_client_group: Joi.string().max(255).optional().allow("").allow(null),
  project_group: Joi.string().max(255).optional().allow("").allow(null),
  status_rid: Joi.string().required(),
  fiscal_year: Joi.number().integer().min(1000).max(9999).required().messages({
    "number.base": "Fiscal year must be a number",
    "number.min": "Fiscal year must be a 4-digit number",
    "number.max": "Fiscal year must be a 4-digit number",
    "any.required": "Fiscal year is required",
  }),
  country_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .optional()
    .allow("", null),
  region_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .optional()
    .allow("", null),
  currency_rid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
    .optional()
    .allow("", null),
  total_effort: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total Effort must have up to 16 digits before the decimal and up to 2 decimal places",
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
  total_subcon: Joi.number().greater(0).optional().allow(null),
  total_cost_nonlabor: Joi.string()
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
  total_effort_fte: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total FTE Effort must have up to 16 digits before the decimal and up to 2 decimal places",
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
  total_effort_subcon: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total SUB Con Effort must have up to 16 digits before the decimal and up to 2 decimal places",
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
  total_cost_fte: Joi.string()
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
  total_cost_subcon: Joi.string()
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
      key_contact_role: Joi.string().pattern(uuidRegex, "valid UUID").optional().allow(null),
      is_primary_contact: Joi.boolean().valid(true, false).optional().allow(null),
      interaction_cc_recipient: Joi.boolean()
        .optional()
        .messages({
          'boolean.base': 'Interaction CC Recipient must be a boolean value (true or false)',
          'any.required': 'Interaction CC Recipient is required',
        }),
      include_in_communication: Joi.boolean().optional().allow(null),
      status_rid: Joi.string().optional().allow(null),
      action_type: Joi.string().valid('add').required()
    })
  )
  .optional(),
  project_description: Joi.string().max(1000).allow(null).allow(""),
});

const updateProjectSchema = Joi.object({
  project_fiscal_id: Joi.string().pattern(uuidRegex, "valid UUID").required(),
  project_id: Joi.string().pattern(uuidRegex, "valid UUID").required(),
  account_id: Joi.string().pattern(uuidRegex, "valid UUID").required(),
  project_code: Joi.string().min(5).max(50).required(),
  program_name: Joi.string().min(4).max(255).optional().allow("").allow(null),
  project_name: Joi.string().min(4).max(255).optional().allow("").allow(null),
  industry_rid: Joi.string()
  .pattern(uuidRegex, "valid UUID")
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

  project_type_rid: Joi.string().pattern(uuidRegex, "valid UUID").required(),
  project_classification_rid: Joi.string().pattern(uuidRegex, "valid UUID").optional().allow(null),
  project_classification_other: Joi.string().optional().allow(null).allow(""),
  project_client_group: Joi.string().max(255).optional().allow("").allow(null),
  project_group: Joi.string().max(255).optional().allow("").allow(null),
  status_rid: Joi.string().required(),
  fiscal_year: Joi.number().integer().min(1000).max(9999).required().messages({
    "number.base": "Fiscal year must be a number",
    "number.min": "Fiscal year must be a 4-digit number",
    "number.max": "Fiscal year must be a 4-digit number",
    "any.required": "Fiscal year is required",
  }),
  country_rid: Joi.string().pattern(uuidRegex, "valid UUID").optional().allow("", null),
  region_rid: Joi.string().pattern(uuidRegex, "valid UUID").optional().allow("", null),
  currency_rid: Joi.string().pattern(uuidRegex, "valid UUID").optional().allow("", null),
  total_effort: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total Effort must have up to 16 digits before the decimal and up to 2 decimal places",
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
  total_subcon: Joi.number().greater(0).optional().allow(null),
  
  total_effort_fte: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total FTE Effort must have up to 16 digits before the decimal and up to 2 decimal places",
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
  total_effort_subcon: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total SUB Con Effort must have up to 16 digits before the decimal and up to 2 decimal places",
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
  total_cost_fte: Joi.string()
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
  total_cost_subcon: Joi.string()
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
  total_cost_nonlabor: Joi.string()
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
  last_rd_ai_assess_by: Joi.string().pattern(uuidRegex, "valid UUID").optional().allow("", null),
  project_description: Joi.string().max(2000).allow(null).allow(""),
  key_contacts: Joi.array()
    .items(
      Joi.object({
        action_type: Joi.string().valid('edit', "add", "delete").required(),
        rid: Joi.string()
         .pattern(uuidRegex, "valid UUID")
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
        key_contact_role: Joi.string().pattern(uuidRegex, "valid UUID").optional().allow(null),
        is_primary_contact: Joi.boolean().valid(true, false).optional().allow(null),
        interaction_cc_recipient: Joi.boolean()
        .optional()
        .messages({
          'boolean.base': 'Interaction CC Recipient must be a boolean value (true or false)',
          'any.required': 'Interaction CC Recipient is required',
        }),
        include_in_communication: Joi.boolean().optional().allow(null),
        status_rid: Joi.string().optional().allow(null)
      })
    )
    .optional(),
  comments: Joi.string().max(2000).allow(null).allow(""),
});

const createAttachmentSchema = Joi.object({
    account_rid: Joi.string().pattern(uuidRegex, "valid UUID").required(),
    // browse_file: Joi.string()
    //     .required()
    //     .max(1000)
    //     .custom((value, helpers) => {
    //         // Check for disallowed file extensions
    //         const disallowedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.bash'];
    //         if (disallowedExtensions.some(ext => value.toLowerCase().endsWith(ext))) {
    //             return helpers.error('string.fileType');
    //         }
    //         return value;
    //     })
    //     .messages({
    //         'string.empty': 'Browse file path cannot be empty',
    //         'any.required': 'Browse file path is required',
    //         'string.max': 'Browse file path must be less than or equal to 1000 characters',
    //         'string.fileType': 'Executable file types (.exe, .bat, .cmd, .sh, .bash) are not allowed'
    //     }),
    attach_to: Joi.string().pattern(uuidRegex, "valid UUID").required(),
    attachment_level: Joi.string()
        .valid('account', 'project', 'project_resource', 'project_task', 'resource', 'resource_cost', 'resource_skill')
        .required()
        .messages({
            'string.empty': 'Attachment level cannot be empty',
            'any.required': 'Attachment level is required',
            'any.only': 'Attachment level must be one of: account, project, project_resource, project_task, resource, resource_cost, resource_skill'
        }),
    // document_name: Joi.string()
    //     .required()
    //     .max(100)
    //     .messages({
    //         'string.empty': 'Document name cannot be empty',
    //         'any.required': 'Document name is required', 
    //         'string.max': 'Document name must be less than or equal to 100 characters'
    //     }),
    // format: Joi.string()
    //     .required()
    //     .max(10)
    //     .pattern(/^[a-zA-Z0-9.]+$/) // Allows alphanumeric and periods
    //     .invalid('.exe', '.bat', '.cmd', '.sh', '.bash')
    //     .custom((value, helpers) => {
    //         // Ensure format starts with a period
    //         if (!value.startsWith('.')) {
    //             return helpers.error('string.format');
    //         }
    //         return value;
    //     })
    //     .messages({
    //         'string.empty': 'Format cannot be empty',
    //         'any.required': 'Format is required',
    //         'string.max': 'Format must be less than or equal to 10 characters',
    //         'any.invalid': 'Executable file formats are not allowed',
    //         'string.pattern.base': 'Format must contain only alphanumeric characters and periods',
    //         'string.format': 'Format must start with a period (e.g., .pdf)'
    //     }),
    // size_in_mb: Joi.number()
    //     .required()
    //     .precision(2)
    //     .positive()
    //     .max(20)
    //     .messages({
    //         'number.base': 'Size must be a number',
    //         'any.required': 'Size is required',
    //         'number.positive': 'Size must be a positive number',
    //         'number.precision': 'Size can have maximum 2 decimal places',
    //         'number.max': 'File size must be 20MB or less'
    //     }),
    fiscal_year: Joi.number()
        .integer()
        .custom((value, helpers) => {
            const currentYear = new Date().getFullYear();
            const minYear = currentYear - 20;
            
            if (value < minYear || value > currentYear) {
                return helpers.error('number.yearRange');
            }
            return value;
        })
        .default(() => new Date().getFullYear())
        .required()
        .messages({
            'number.base': 'Fiscal year must be a number',
            'number.integer': 'Fiscal year must be an integer',
            'number.yearRange': `Fiscal year must be between ${new Date().getFullYear() - 20} and ${new Date().getFullYear()}`,
            'any.required': 'Fiscal year is required'
        }),
    document_category_rid: Joi.string()
        .pattern(uuidRegex, "valid UUID")
        .required()
        .messages({
            'string.empty': 'Document category cannot be empty',
            'any.required': 'Document category is required',
            'string.pattern.base': 'Document category must be a valid UUID'
        }),
    document_type_rid: Joi.string()
        .pattern(uuidRegex, "valid UUID")
        .required()
        .messages({
            'string.empty': 'Document type cannot be empty',
            'any.required': 'Document type is required',
            'string.pattern.base': 'Document category must be a valid UUID'
        }),
    document_category_others: Joi.string()
        .min(2)
        .max(120)
        .pattern(/^[A-Za-z][A-Za-z\s\-'.]{1,118}[A-Za-z]$/)
        .optional()
        .allow("")
        .allow(null)
        .messages({
            "string.pattern.base": "Other category must start and end with a letter and can only contain letters, spaces, hyphens (-), apostrophes ('), and periods (.)",
            "string.min": "Other category must be at least 2 characters long",
            "string.max": "Other category must not exceed 120 characters"
        }),
    document_type_others: Joi.string()
        .min(2)
        .max(120)
        .pattern(/^[A-Za-z][A-Za-z\s\-'.]{1,118}[A-Za-z]$/)
        .optional()
        .allow("")
        .allow(null)
        .messages({
            "string.pattern.base": "Other category must start and end with a letter and can only contain letters, spaces, hyphens (-), apostrophes ('), and periods (.)",
            "string.min": "Other category must be at least 2 characters long",
            "string.max": "Other category must not exceed 120 characters"
        }),     
    comments: Joi.string()
        .allow(null, '')
        .when(Joi.exist(), {
            then: Joi.string()
                .min(1)
                .max(2000)
                .trim()
                .messages({
                    'string.min': 'Comments must be at least 1 character long when provided',
                    'string.max': 'Comments must be less than or equal to 2000 characters'
                })
        }),
});

const listAttachmentsSchema = Joi.object({
    attachmentLevel: Joi.string()
        .valid('account', 'project', 'project_resource', 'project_task', 'resource', 'resource_cost', 'resource_skill')
        .required()
        .messages({
            'string.empty': 'Attachment level cannot be empty',
            'any.required': 'Attachment level is required',
            'any.only': 'Attachment level must be one of: account, project, project_resource, project_task, resource, resource_cost, resource_skill'
        }),
    entityId: Joi.string()
        .pattern(uuidRegex, "valid UUID")
        .required()
        .messages({
            'any.required': 'Entity ID is required',
            'string.pattern.base': 'Entity ID must be a valid UUID'
        }),
    accountRid: Joi.string()
        .pattern(uuidRegex, "valid UUID")
        .required()
        .messages({
            'any.required': 'Account RID is required',
            'string.pattern.base': 'Account RID must be a valid UUID'
        }),
    page: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'any.required': 'Page number is required',
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be greater than or equal to 1'
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .required()
        .messages({
            'any.required': 'Limit is required',
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be greater than or equal to 1',
            'number.max': 'Limit cannot exceed 100'
        }),
    search: Joi.string()
        .max(255)
        .allow('')
        .allow(null)
        .optional()
        .messages({
            'string.base': 'Search must be a string',
            'string.max': 'Search cannot exceed 255 characters'
        }),
    filters: Joi.string().default("{}").optional(),
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
    sortBy: Joi.string().default("created_datetime").optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
})

const exportListAttachmentsSchema = Joi.object({
    attachmentLevel: Joi.string()
        .valid('account', 'project', 'project_resource', 'project_task', 'resource', 'resource_cost', 'resource_skill')
        .required()
        .messages({
            'string.empty': 'Attachment level cannot be empty',
            'any.required': 'Attachment level is required',
            'any.only': 'Attachment level must be one of: account, project, project_resource, project_task, resource, resource_cost, resource_skill'
        }),
    entityId: Joi.string()
        .pattern(uuidRegex, "valid UUID")
        .required()
        .messages({
            'any.required': 'Entity ID is required',
            'string.pattern.base': 'Entity ID must be a valid UUID'
        }),
    accountRid: Joi.string()
        .pattern(uuidRegex, "valid UUID")
        .required()
        .messages({
            'any.required': 'Account RID is required',
            'string.pattern.base': 'Account RID must be a valid UUID'
        }),
    search: Joi.string()
        .max(255)
        .allow('')
        .allow(null)
        .optional()
        .messages({
            'string.base': 'Search must be a string',
            'string.max': 'Search cannot exceed 255 characters'
        }),
    filters: Joi.string().default("{}").optional(),
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
    sortBy: Joi.string().default("created_datetime").optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
})

const listAttachmentSummarySchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'any.required': 'Page number is required',
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be greater than or equal to 1'
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .required()
        .messages({
            'any.required': 'Limit is required',
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be greater than or equal to 1',
            'number.max': 'Limit cannot exceed 100'
        }),
    search: Joi.string()
        .max(255)
        .allow('')
        .allow(null)
        .optional()
        .messages({
            'string.base': 'Search must be a string',
            'string.max': 'Search cannot exceed 255 characters'
        }),
    filters: Joi.string().default("{}").optional(),
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
    globalFilters: Joi.string().default("{}").optional(),
    sortBy: Joi.string().default("created_datetime").optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
})

const exportListAttachmentSummarySchema = Joi.object({
    search: Joi.string()
        .max(255)
        .allow('')
        .allow(null)
        .optional()
        .messages({
            'string.base': 'Search must be a string',
            'string.max': 'Search cannot exceed 255 characters'
        }),
    filters: Joi.string().default("{}").optional(),
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
    globalFilters: Joi.string().default("{}").optional(),
    sortBy: Joi.string().default("created_datetime").optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
})

const getDocumentTypeAndCategorySchema = Joi.object({
   category_rid: Joi.string().pattern(uuidRegex, "valid UUID").optional()
})

const createProjectResourceSchema = Joi.object({
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  resource_code: Joi.string().min(3).max(50).required(),
  assigned_skill_role_type_rid: Joi.string().pattern(uuidRegex).optional().allow(null).allow(""),
  skill_role_rid: Joi.string().pattern(uuidRegex).optional().allow(null).allow(""),
  skill_role_others: Joi.string().min(3).max(100).optional().allow("").allow(null),
  status_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  country_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  region_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  currency_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  start_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isNotFutureDate, "Future Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "end_date must be in the format YYYY-MM-DD",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat": "Invalid start_date date.",
    }),
  end_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isProjectResEndDateAfterStartDate, "End Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "end_date must be in the formatYYYY-MM-DD",
      "any.invalid": "Effective end date must be after the start date.",
      "date.invalidFormat":
        "Invalid end_date. Please use the format YYYY-MM-DD",
    }),

  total_hours_pro_res: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total Effort must have up to 16 digits before the decimal and up to 2 decimal places",
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
  total_cost_pro_res: Joi.string()
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
    "any.invalid": "Total Cost must be a valid positive number",
  })
  .optional()
  .allow(null),

  salary: costFieldValidator('salary'),
  bonus: costFieldValidator('bonus'),
  insurance: costFieldValidator('insurance'),
  deductions: costFieldValidator('deductions'),
  
  description: Joi.string().max(2000).optional().allow("").allow(null),
});

const updateProjectResourceSchema = Joi.object({
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_resource_rid: Joi.string().pattern(uuidRegex).required(),
  resource_code: Joi.string().min(3).max(50).required(),
  assigned_skill_role_type_rid: Joi.string().pattern(uuidRegex).optional().allow(null).allow(""),
  skill_role_rid: Joi.string().pattern(uuidRegex).optional().allow(null).allow(""),
  skill_role_others: Joi.string().min(3).max(100).optional().allow("").allow(null),
  status_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  country_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  region_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  currency_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  start_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isNotFutureDate, "Future Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "end_date must be in the format YYYY-MM-DD",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat": "Invalid start_date date.",
    }),
  end_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isProjectResEndDateAfterStartDate, "End Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "end_date must be in the formatYYYY-MM-DD",
      "any.invalid": "Effective end date must be after the start date.",
      "date.invalidFormat":
        "Invalid end_date. Please use the format YYYY-MM-DD",
    }),

  total_hours_pro_res: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total Effort must have up to 16 digits before the decimal and up to 2 decimal places",
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
  total_cost_pro_res: Joi.string()
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
    "any.invalid": "Total Cost must be a valid positive number",
  })
  .optional()
  .allow(null),

  salary: costFieldValidator('salary'),
  bonus: costFieldValidator('bonus'),
  insurance: costFieldValidator('insurance'),
  deductions: costFieldValidator('deductions'),
  
  description: Joi.string().max(2000).optional().allow("").allow(null),
});

const exportListProjectResourceSchema = Joi.object({
  fiscalYear: Joi.number().min(1000).max(9999).optional().allow(0).messages({
    "number.base": "Fiscal year must be a number",
    "number.min": "Fiscal year must be a 4-digit number",
    "number.max": "Fiscal year must be a 4-digit number",
    "any.required": "Fiscal year is required",
  }),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("created_datetime").optional().allow(""),
  sortOrder: Joi.string()
    .valid("ASC", "DESC")
    .default("DESC")
    .optional()
    .allow(""),
  timezone: Joi.string().optional()
});

const listProjectTasksSchema = Joi.object({
  projectRid: Joi.string().pattern(uuidRegex).required(),
  accountRid: Joi.string().pattern(uuidRegex).required(),
    page: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'any.required': 'Page number is required',
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be greater than or equal to 1'
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .required()
        .messages({
            'any.required': 'Limit is required',
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be greater than or equal to 1',
            'number.max': 'Limit cannot exceed 100'
        }),
    search: Joi.string()
        .max(255)
        .allow('')
        .allow(null)
        .optional()
        .messages({
            'string.base': 'Search must be a string',
            'string.max': 'Search cannot exceed 255 characters'
        }),
    filters: Joi.string().default("{}").optional(),
    sortBy: Joi.string().default("created_datetime").optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
})

const exportListProjectTasksSchema = Joi.object({
  projectRid: Joi.string().pattern(uuidRegex).required(),
  accountRid: Joi.string().pattern(uuidRegex).required(),
    search: Joi.string()
        .max(255)
        .allow('')
        .allow(null)
        .optional()
        .messages({
            'string.base': 'Search must be a string',
            'string.max': 'Search cannot exceed 255 characters'
        }),
    filters: Joi.string().default("{}").optional(),
    sortBy: Joi.string().default("created_datetime").optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
})

const projectTaskByIdSchema = Joi.object({
  taskRid: Joi.string().pattern(uuidRegex).required(),
  accountRid: Joi.string().pattern(uuidRegex).required(),
})
const createProjectTaskSchema = Joi.object({
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  resource_code: Joi.string().min(3).max(50).required(),
  country_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  region_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  currency_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  start_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isNotFutureDate, "Future Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "end_date must be in the format YYYY-MM-DD",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat": "Invalid start_date date.",
    }),
  end_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isProjectResEndDateAfterStartDate, "End Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "end_date must be in the formatYYYY-MM-DD",
      "any.invalid": "Effective end date must be after the start date.",
      "date.invalidFormat":
        "Invalid end_date. Please use the format YYYY-MM-DD",
    }),

  total_hours_pro_task: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total Effort must have up to 16 digits before the decimal and up to 2 decimal places",
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
  
  total_cost_pro_task: Joi.string()
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
    "any.invalid": "Total Cost must be a valid positive number",
  })
  .optional()
  .allow(null),
  
  comments: Joi.string().max(2000).optional().allow("").allow(null),
});

const updateProjectTaskSchema = Joi.object({
  project_task_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  resource_code: Joi.string().min(3).max(50).required(),
  country_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  region_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  currency_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  start_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isNotFutureDate, "Future Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "end_date must be in the format YYYY-MM-DD",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat": "Invalid start_date date.",
    }),
  end_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isProjectResEndDateAfterStartDate, "End Date Validation")
    .optional()
    .messages({
      "string.pattern.base":
        "end_date must be in the formatYYYY-MM-DD",
      "any.invalid": "Effective end date must be after the start date.",
      "date.invalidFormat":
        "Invalid end_date. Please use the format YYYY-MM-DD",
    }),

  total_hours_pro_task: Joi.string()
  .pattern(decimal18_2Regex)
  .messages({
    "string.pattern.base": "Total Effort must have up to 16 digits before the decimal and up to 2 decimal places",
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
  
  total_cost_pro_task: Joi.string()
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
    "any.invalid": "Total Cost must be a valid positive number",
  })
  .optional()
  .allow(null),
  
  comments: Joi.string().max(2000).optional().allow("").allow(null),
});

const listResourceCostSchemaForFinancialHighlights = Joi.object({
  projectRid: Joi.string().pattern(uuidRegex).max(255).optional(),
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
  accountRid: Joi.string().max(255).required(),
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

const exportResourceCostSchemaForFinancialHighlights = Joi.object({
  projectRid: Joi.string().pattern(uuidRegex).max(255).optional(),
  search: Joi.string().max(255).optional().allow("").allow(null),
  filters: Joi.string().default("{}").optional(),
  sortBy: Joi.string().default("created_datetime").optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
  accountRid: Joi.string().max(255).required(),
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

const listAccountLevelProjectCostsSchema = Joi.object({
    accountRid: Joi.string().max(255).required(),
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
    search: Joi.string().max(255).optional().allow("").allow(null),
    filters: Joi.string().default("{}").optional(),
    sortBy: Joi.string().default("created_datetime").optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
    page: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'any.required': 'Page number is required',
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be greater than or equal to 1'
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .required()
        .messages({
            'any.required': 'Limit is required',
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be greater than or equal to 1',
            'number.max': 'Limit cannot exceed 100'
        })
});

const exportListAccountLevelProjectCostsSchema = Joi.object({
    accountRid: Joi.string().max(255).required(),
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
    search: Joi.string().max(255).optional().allow("").allow(null),
    filters: Joi.string().default("{}").optional(),
    sortBy: Joi.string().default("created_datetime").optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
});

const importedAccountLevelProjects = Joi.object({
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
  bothParentAndChild: Joi.boolean().optional().default(false),
  documentRid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
});

const exportImportedAccountLevelProjects = Joi.object({
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
  bothParentAndChild: Joi.boolean().optional().default(false),
  documentRid: Joi.string()
    .pattern(uuidRegex, "valid UUID"),
  timezone: Joi.string().optional()  
});

const importedAccountLevelResources = Joi.object({
  page: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("1"),
  limit: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("100"),
  search: Joi.string().max(255).optional(),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("created_datetime").optional().allow(""),
  sortOrder: Joi.string()
    .valid("ASC", "DESC")
    .default("DESC")
    .optional()
    .allow(""),
  documentRid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
});

const exportImportedAccountLevelResources = Joi.object({
  search: Joi.string().max(255).optional(),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("created_datetime").optional().allow(""),
  sortOrder: Joi.string()
    .valid("ASC", "DESC")
    .default("DESC")
    .optional()
    .allow(""),
  documentRid: Joi.string()
    .pattern(uuidRegex, "valid UUID")
});

const importedAccountLevelProjectTasks = Joi.object({
  documentRid: Joi.string().pattern(uuidRegex).required(),
    page: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'any.required': 'Page number is required',
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be greater than or equal to 1'
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .required()
        .messages({
            'any.required': 'Limit is required',
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be greater than or equal to 1',
            'number.max': 'Limit cannot exceed 100'
        }),
    search: Joi.string()
        .max(255)
        .allow('')
        .allow(null)
        .optional()
        .messages({
            'string.base': 'Search must be a string',
            'string.max': 'Search cannot exceed 255 characters'
        }),
    filters: Joi.string().default("{}").optional(),
    sortBy: Joi.string().default("created_datetime").optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
})

const exportImportedAccountLevelProjectTasks = Joi.object({
  documentRid: Joi.string().pattern(uuidRegex).required(),
    search: Joi.string()
        .max(255)
        .allow('')
        .allow(null)
        .optional()
        .messages({
            'string.base': 'Search must be a string',
            'string.max': 'Search cannot exceed 255 characters'
        }),
    filters: Joi.string().default("{}").optional(),
    sortBy: Joi.string().default("created_datetime").optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional(),
})

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
  exportListResourceSchema,
  createAttachmentSchema,
  listAttachmentsSchema,
  getDocumentTypeAndCategorySchema,
  listAttachmentSummarySchema,
  createProjectResourceSchema,
  updateProjectResourceSchema,
  exportListProjectResourceSchema,
  exportListAttachmentsSchema,
  exportListAttachmentSummarySchema,
  listProjectTasksSchema,
  projectTaskByIdSchema,
  exportListProjectTasksSchema,
  createProjectTaskSchema,
  updateProjectTaskSchema,
  listResourceCostSchemaForFinancialHighlights,
  exportResourceCostSchemaForFinancialHighlights,
  listAccountLevelProjectCostsSchema,
  exportListAccountLevelProjectCostsSchema,
  importedAccountLevelProjects,
  importedAccountLevelResources,
  importedAccountLevelProjectTasks,
  exportImportedAccountLevelProjects,
  exportImportedAccountLevelResources,
  exportImportedAccountLevelProjectTasks
};
