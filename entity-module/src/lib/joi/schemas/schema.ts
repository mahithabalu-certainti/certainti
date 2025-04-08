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

export {
  resourceCostValidation,
  listResourceCostValidation,
  getResourceCostValidation,
  updateResourceCostValidation,
  resourceCostSchema,
  listResourceCostSchema,
  getResourceCostSchema,
  updateResourceCostSchema,
};
