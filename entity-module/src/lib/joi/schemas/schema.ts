import Joi from "joi";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const resourceCostSchema = Joi.object({
  resource_ref_id: Joi.string().max(255).required(),
  resource_cost_number: Joi.forbidden(),
  resource_currency: Joi.string().max(255).required(),
  resource_start_date: Joi.string().required(),
  resource_end_date: Joi.string().optional().allow(null),
  resource_annual_compensation: Joi.number().positive().optional(),
  resource_monthly_compensation: Joi.number().positive().optional(),
  resource_weekly_compensation: Joi.number().positive().optional(),
  resource_daily_compensation: Joi.number().positive().optional(),
  resource_hourly_compensation: Joi.number().positive().optional(),
  status: Joi.string().max(10).default("Active"),
  created_at: Joi.date()
    .iso()
    .default(() => new Date()),
  updated_at: Joi.date()
    .iso()
    .default(() => new Date()),
  created_by: Joi.string().max(50).optional(),
  updated_by: Joi.string().max(50).optional(),
});

const resourceCostValidation = (data: any) => {
  const { error } = resourceCostSchema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(error.details.map((err: any) => err.message).join(", "));
  }
};

const listResourceCostSchema = Joi.object({
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

const listResourceCostValidation = (data: any) => {
  const { error } = listResourceCostSchema.validate(data, {
    abortEarly: false,
  });
  if (error) {
    throw new Error(error.details.map((err: any) => err.message).join(", "));
  }
};

const getResourceCostSchema = Joi.object({
  id: Joi.string().pattern(uuidRegex).required(),
});

const getResourceCostValidation = (data: any) => {
  const { error } = getResourceCostSchema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(error.details.map((err: any) => err.message).join(", "));
  }
};

const updateResourceCostSchema = Joi.object({
  id: Joi.string().pattern(uuidRegex).required(),
  resource_cost_number: Joi.forbidden(),
  resource_currency: Joi.string().max(255).required(),
  resource_start_date: Joi.string().required(),
  resource_end_date: Joi.string().optional().allow(null),
  resource_annual_compensation: Joi.number().positive().optional(),
  resource_monthly_compensation: Joi.number().positive().optional(),
  resource_weekly_compensation: Joi.number().positive().optional(),
  resource_daily_compensation: Joi.number().positive().optional(),
  resource_hourly_compensation: Joi.number().positive().optional(),
  status: Joi.string().max(10).required(),
  updated_at: Joi.date()
    .iso()
    .default(() => new Date()),
  updated_by: Joi.string().max(50).optional(),
});

const updateResourceCostValidation = (data: any) => {
  const { error } = updateResourceCostSchema.validate(data, {
    abortEarly: false,
  });
  if (error) {
    throw new Error(error.details.map((err: any) => err.message).join(", "));
  }
};

const isNotFutureDate = (value: string, helpers: Joi.CustomHelpers): any => {
  const date = new Date(value);
  const currentDate = new Date();
  if (date > currentDate) {
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
  const context = helpers.state?.parent;

  if (
    context?.effective_from_date &&
    new Date(value) <= new Date(context.effective_from_date)
  ) {
    return helpers.error("any.invalid", {
      message: "Effective end date must be after the start date.",
    });
  }
  return value;
};

const createResourcesSchema = Joi.object({
  resource_ref_id: Joi.string().max(50).required(),
  resource_type: Joi.string().valid("Full_time", "Contract").required(),
  first_name: Joi.string().min(2).max(100).optional().allow("").allow(null),
  middle_name: Joi.string().max(100).optional().allow("").allow(null),
  last_name: Joi.string().min(2).max(100).optional().allow("").allow(null),
  full_name: Joi.string().min(3).max(200).optional().allow("").allow(null),
  org_name: Joi.string().min(3).max(100).optional().allow("").allow(null),
  role: Joi.string().min(4).max(100).optional().allow("").allow(null),
  fiscal_year: Joi.string().max(4).required(),
  email: Joi.string().email().max(255).optional().allow("").allow(null),
  mobile: Joi.string().max(15).optional().allow("").allow(null),
  country: Joi.string().max(3).optional().allow("").allow(null),
  region: Joi.string().max(50).optional().allow("").allow(null),
  currency: Joi.string().max(3).optional().allow("").allow(null),
  effective_from_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isNotFutureDate, "Future Date Validation")
    .optional(),
  effective_end_date: Joi.string()
    .max(10)
    .optional()
    .allow("")
    .allow(null)
    .custom(isEndDateAfterStartDate, "End Date Validation")
    .optional(),
  designation: Joi.string().min(4).max(100).optional().allow("").allow(null),
  manager_name: Joi.string().min(3).max(100).optional().allow("").allow(null),
  total_yearsof_experience: Joi.number().optional().allow("").allow(null),
  total_yearsof_experience_organization: Joi.number()
    .optional()
    .allow("")
    .allow(null),
});

export {
  resourceCostValidation,
  listResourceCostValidation,
  getResourceCostValidation,
  updateResourceCostValidation,
  resourceCostSchema,
  listResourceCostSchema,
  getResourceCostSchema,
  updateResourceCostSchema,
  createResourcesSchema
};
