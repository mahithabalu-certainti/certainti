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

const createRuleSchema = Joi.object({
    rule_name: Joi.string().required(),
    description: Joi.string().required(),
    is_active: Joi.boolean().required(),
    scope_type: Joi.number().required(),
    trigger_type: Joi.number().optional(),
    trigger_event: Joi.string().optional(),
    schedule_offset_type: Joi.string().optional().allow(null),
    schedule_offset_value: Joi.string().optional().allow(null),
    created_by: Joi.string().required(),
});

const listRuleSchema = Joi.object({
    page: Joi.string().optional()
        .pattern(/^[0-9]+$/)
    ,
    limit: Joi.string().optional()
        .pattern(/^[0-9]+$/)
    ,
    filters: Joi.string().default("{}"),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});

const updateRuleSchema = Joi.object({
    rule_rid: Joi.string().required(),
    rule_name: Joi.string().required(),
    description: Joi.string().required(),
    is_active: Joi.boolean().required(),
    scope_type: Joi.number().required(),
    trigger_type: Joi.number().optional(),
    trigger_event: Joi.string().optional(),
    schedule_offset_type: Joi.string().optional().allow(null),
    schedule_offset_value: Joi.string().optional().allow(null),
    modified_by: Joi.string().optional(),
});

export {
    createRuleSchema,
    listRuleSchema,
    updateRuleSchema
};