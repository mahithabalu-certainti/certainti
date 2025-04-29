import Joi from "joi";
import moment from "moment";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isNotFutureDate = (value: string, helpers: Joi.CustomHelpers): any => {
  // Parse the date using moment with strict parsing
  const startDate = moment(value, "MM/DD/YYYY", true);

  // Check if the date format is valid
  if (!startDate.isValid()) {
    return helpers.error("date.invalidFormat", {
      message: "Invalid effective from date.",
    });
  }

  // Split the date string and convert to numbers
  const [month, day, year] = value.split("/").map(Number);

  // Create Date objects for comparison
  const inputDate = new Date(year, month - 1, day);
  const currentDate = new Date();

  // Normalize both dates to start of day for accurate comparison
  inputDate.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);

  // Check if date is in the future
  if (inputDate > currentDate) {
    return helpers.error("any.invalid", {
      message: "Date cannot be in the future.",
    });
  }

  return value;
};

const isValidDate = (value: string, helpers: Joi.CustomHelpers): any => {
  const startDate = moment(value, "MM/DD/YYYY", true);

  if (!startDate.isValid()) {
    return helpers.error("date.invalidFormat", {
      message: "Invalid date.",
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
    const date = moment(value, "MM/DD/YYYY", true);

    if (!date.isValid()) {
      return helpers.error("date.invalidFormat", {
        message: "Invalid effective end date.",
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
  account_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  resource_ref_id: Joi.string().min(5).max(50).required(),
  resource_type: Joi.string()
    .valid("FullTime", "Contract", "Non-Labor")
    .required(),
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
  state: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional()
    .allow("", null),
  city: Joi.string()
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
  designation: Joi.string().min(4).max(100).optional().allow("").allow(null),
  total_years_experience: Joi.number()
    .min(0)
    .max(99)
    .optional()
    .allow("")
    .allow(null),
  total_years_in_org: Joi.number()
    .optional()
    .min(0)
    .max(99)
    .allow("")
    .allow(null),
  resource_status: Joi.string().valid("Active", "Inactive").optional(),
  created_by: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  comments: Joi.string().max(1000).optional().allow("").allow(null),
}).custom((obj) => {
  const hasEffectiveDate = Boolean(obj.effective_from_date);
  const hasEndDate = Boolean(obj.effective_end_date);

  if (hasEffectiveDate !== hasEndDate) {
    throw new Error(
      "Both effective from date and end date must be provided together, or neither should be provided"
    );
  }

  return obj;
}).error((errors) => {
  return errors.map(error => {
    if (error.code === 'any.custom') {
      // Add proper field name to the error
      (error as any).context = { label: 'date_validation' };
      error.message = 'Both effective from date and end date must be provided together, or neither should be provided';
    }
    return error;
  });
});

const updateResourceSchema = Joi.object({
  resource_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  account_number: Joi.string().max(50).required(),
  resource_ref_id: Joi.string().max(50).required(),
  resource_type: Joi.string().valid("FullTime", "Contract").required(),
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
  state: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional()
    .allow("", null),
  city: Joi.string()
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
  designation: Joi.string().min(4).max(100).optional().allow("").allow(null),
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
}).custom((obj) => {
  const hasEffectiveDate = Boolean(obj.effective_from_date);
  const hasEndDate = Boolean(obj.effective_end_date);

  if (hasEffectiveDate !== hasEndDate) {
    throw new Error(
      "Both effective from date and end date must be provided together, or neither should be provided"
    );
  }

  return obj;
}).error((errors) => {
  return errors.map(error => {
    if (error.code === 'any.custom') {
      // Add proper field name to the error
      (error as any).context = { label: 'date_validation' };
      error.message = 'Both effective from date and end date must be provided together, or neither should be provided';
    }
    return error;
  });
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
  sortBy: Joi.string().default("created_datetime").optional().allow(""),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").optional().allow(""),
});

const createResourceSkillSchema = Joi.object({
  eid: Joi.string().max(255).optional().allow(null).allow(""),
  account_rid: Joi.string().max(255).required(),
  resource_type: Joi.string().valid("FullTime", "Contract").required(),
  resource_rid: Joi.string().max(255).optional().allow(null).allow(""),
  resource_number: Joi.string().max(255).required(),
  resource_ref_id: Joi.string().max(255).required(),
  resource_desc: Joi.string().max(100).optional().allow(null).allow(""),
  start_date: Joi.string()
    .max(10)
    .custom(isNotFutureDate, "Start date validation")
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "start_date must be in the format MM/DD/YYYY",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat":
        "Invalid start date. Please use the format MM/DD/YYYY",
    }),
  skill_description: Joi.string().max(255).optional().allow(null).allow(""),
  skill_level: Joi.string()
    .valid("Beginner", "Intermediate", "Advanced")
    .optional()
    .allow("")
    .allow(null),
  years_of_experience: Joi.number().min(0).max(99).optional().allow(null),
  created_by: Joi.string().max(255).optional().allow(null).allow(""),
  modified_by: Joi.string().max(255).optional().allow(null).allow(""),
  technical_weightage: Joi.number().min(0).optional().allow(null),
  skill_name: Joi.string().max(255).required().trim(),
  skill_type: Joi.string().max(255).optional().allow(null).allow(""),
  accountNumber: Joi.string().max(255).required(),
});

const updateResourceSkillSchema = Joi.object({
  rid: Joi.string().max(255).required(),
  eid: Joi.string().max(255).optional().allow(null).allow(""),
  start_date: Joi.string()
    .max(10)
    .custom(isNotFutureDate, "start date validation")
    .optional()
    .allow(null)
    .allow("")
    .messages({
      "string.pattern.base": "start_date must be in the format MM/DD/YYYY",
      "any.invalid": "Date cannot be in the future.",
      "date.invalidFormat": "start date. Please use the format MM/DD/YYYY",
    }),
  skill_description: Joi.string().max(255).optional().allow(null).allow(""),
  skill_level: Joi.string()
    .valid("Beginner", "Intermediate", "Advanced", "-")
    .optional()
    .allow("")
    .allow(null),
  skill_name: Joi.string().max(255).required().trim(),
  years_of_experience: Joi.number().min(0).max(99).optional().allow(null),
  modified_by: Joi.string().max(255).optional(),
  technical_weightage: Joi.number().min(0).optional().allow(null),
  skill_type: Joi.string().max(255).optional().allow(null).allow(""),
  status: Joi.string().max(255).default("active").optional(),
  modified_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  accountNumber: Joi.string().max(255).required(),
});

const listResourceSkillSchema = Joi.object({
  rid: Joi.string().pattern(uuidRegex).max(255).optional().allow(null),
  resourceRid: Joi.string().pattern(uuidRegex).max(255).optional().allow(null),
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
    cost: Joi.number()
    .precision(2)
    .min(0)
    .max(9999999999.99)
    .required()
    .messages({
      "number.base": "Cost must be a valid number",
      "number.min": "Cost cannot be negative",
      "number.max": "Cost cannot exceed 9,999,999,999.99",
      "number.precision": "Cost can only have up to 2 decimal places"
    }),
  status: Joi.string().max(255).default("active").optional(),
  modified_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  modified_by: Joi.string().max(255).optional(),
}).custom((obj) => {
  const hasEffectiveDate = Boolean(obj.effective_date);
  const hasEndDate = Boolean(obj.end_date);

  if (hasEffectiveDate !== hasEndDate) {
    throw new Error(
      "Both effective date and end date must be provided together, or neither should be provided"
    );
  }

  return obj;
}).error((errors) => {
  return errors.map(error => {
    if (error.code === 'any.custom') {
      // Add proper field name to the error
      (error as any).context = { label: 'date_validation' };
      error.message = 'Both effective date and end date must be provided together, or neither should be provided';
    }
    return error;
  });
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

const resourceCostSchema = Joi.object({
  eid: Joi.string().max(255).optional().allow(null).allow(""),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  accountNumber: Joi.string().max(255).required(),
  resource_number: Joi.string().max(255).required(),
  resource_type: Joi.string().valid("FullTime", "Contract").required(),
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
  cost: Joi.number()
    .precision(2)
    .min(0)
    .max(9999999999.99)
    .required()
    .messages({
      "number.base": "Cost must be a valid number",
      "number.min": "Cost cannot be negative",
      "number.max": "Cost cannot exceed 9,999,999,999.99",
      "number.precision": "Cost can only have up to 2 decimal places"
    }),
  fiscalYear: Joi.number().optional(),
  currency_rid: Joi.string().pattern(uuidRegex).optional().allow(null),
  status: Joi.string().max(255).default("active"),
  created_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  modified_datetime: Joi.date()
    .iso()
    .default(() => new Date()),
  created_by: Joi.string().max(255).optional(),
  modified_by: Joi.string().max(255).optional(),
})
.custom((obj) => {
  const hasEffectiveDate = Boolean(obj.effective_date);
  const hasEndDate = Boolean(obj.end_date);

  if (hasEffectiveDate !== hasEndDate) {
    throw new Error(
      "Both effective date and end date must be provided together, or neither should be provided"
    );
  }

  return obj;
}).error((errors) => {
  return errors.map(error => {
    if (error.code === 'any.custom') {
      // Add proper field name to the error
      (error as any).context = { label: 'date_validation' };
      error.message = 'Both effective date and end date must be provided together, or neither should be provided';
    }
    return error;
  });
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
  listResourceSchema,
};
