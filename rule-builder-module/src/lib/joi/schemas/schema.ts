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

const createRuleMasterSchema = Joi.object({
    rule_name: Joi.string().required(),
    description: Joi.string().required(),
    is_active: Joi.boolean().required(),
    scope_type_rid: Joi.string().required(),
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

const createConditionSchema = Joi.object({
    field_name: Joi.string().required(),
    operator: Joi.string().required(),
    value: Joi.string().required(),
    data_type: Joi.string().required(),
    logical_operator: Joi.string().required(),
    sequence: Joi.number().required(),
    group_id: Joi.number().required(),
    created_by: Joi.string().required(),
});

const listConditionSchema = Joi.object({
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

const updateConditionSchema = Joi.object({
    condition_rid: Joi.string().required(),
    field_name: Joi.string().required(),
    operator: Joi.string().required(),
    value: Joi.string().required(),
    data_type: Joi.string().required(),
    logical_operator: Joi.string().required(),
    sequence: Joi.number().required(),
    group_id: Joi.number().required(),
    modified_by: Joi.string().optional(),
});


const createActionSchema = Joi.object({
    rule_rid: Joi.string().required(),
    action_type: Joi.string().required(),
    target_user: Joi.string().required(),
    new_value: Joi.string().optional().allow(null),
    action_order: Joi.number().required(),
    created_by: Joi.string().required(),
});

const listActionSchema = Joi.object({
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

const updateActionSchema = Joi.object({
    action_rid: Joi.string().required(),
    rule_rid: Joi.string().required(),
    action_type: Joi.string().required(),
    target_user: Joi.string().required(),
    new_value: Joi.string().optional().allow(null),
    action_order: Joi.number().required(),
    message_template: Joi.string().required(),
    metadata: Joi.string().required(),
    modified_by: Joi.string().optional(),
});


const createScopechema = Joi.object({
    rule_rid: Joi.string().required(),
    scope_entity_type: Joi.string().required(),
    scope_entity_rid: Joi.string().required(),
    is_active: Joi.boolean().required(),
    created_by: Joi.string().required(),
});

const listScopeSchema = Joi.object({
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

const updateScopeSchema = Joi.object({
    scope_rid: Joi.string().required(),
    rule_rid: Joi.string().required(),
    scope_entity_type: Joi.string().required(),
    scope_entity_rid: Joi.string().required(),
    is_active: Joi.boolean().required(),
    modified_by: Joi.string().optional(),
});


const createSchedulechema = Joi.object({
    rule_rid: Joi.string().required(),
    related_task_rid: Joi.string().required(),
    scheduled_datetime: Joi.date().required(),
    executed_datetime: Joi.date().required(),
    executed: Joi.boolean().required(),
    created_by: Joi.string().required(),
});

const listScheduleSchema = Joi.object({
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

const updateScheduleSchema = Joi.object({
    schedule_rid: Joi.string().required(),
    rule_rid: Joi.string().required(),
    related_task_rid: Joi.string().required(),
    scheduled_datetime: Joi.date().required(),
    executed_datetime: Joi.date().required(),
    executed: Joi.boolean().required(),
    modified_by: Joi.string().optional(),
});


const createAuditSchema = Joi.object({
    rule_rid: Joi.string().required(),
    action: Joi.string().required(),
    old_value: Joi.string().required(),
    new_value: Joi.string().required(),
    notes: Joi.string().required(),
    created_by: Joi.string().required(),
});


const createTriggerLogSchema = Joi.object({
    rule_rid: Joi.string().required(),
    event_name: Joi.string().required(),
    event_time: Joi.string().required(),
    context_entity_id: Joi.string().required(),
    status: Joi.string().required(),
    message: Joi.string().required(),
    created_by: Joi.string().required(),
});


const createRuleMapSchema = Joi.object({
    scope_type_rid: Joi.string().required(),
    rule_rid: Joi.string().required(),
    apply_type: Joi.string().required(),
    scope_entity_rid: Joi.when("apply_type", {
        is: 'INDIVIDUAL',
        then: Joi.array()
            .items(Joi.string())
            .min(1)
            .required()
            .messages({
                "any.required": "scope_entity_rid is required when apply_type = 'INDIVIDUAL'",
                "array.min": "scope_entity_rid must contain at least one value when apply_type = 'INDIVIDUAL'"
            }),
        otherwise: Joi.array().items(Joi.string()).optional()
    }),
    created_by: Joi.string().required(),
});

const listScopesSchema = Joi.object({
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});

const listScopeEventSchema = Joi.object({
    scope_type_rid: Joi.string().required().allow(""),
    status_rid: Joi.string().required().allow(""),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});

const listScopeEventConditionSchema = Joi.object({
    event_rid: Joi.string().required(),
    status_rid: Joi.string().required().allow(""),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});

const listScopeConditionCategorySchema = Joi.object({
    condition_rid: Joi.string().required(),
    status_rid: Joi.string().required().allow(""),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});

const listScopeFieldSchema = Joi.object({
    category_rid: Joi.string().required(),
    status_rid: Joi.string().required().allow(""),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});

const listScopeOperatorSchema = Joi.object({
    field_rid: Joi.string().required(),
    status_rid: Joi.string().required().allow(""),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});

const listScopeValueSchema = Joi.object({
    field_rid: Joi.string().required(),
    status_rid: Joi.string().required().allow(""),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});

const listScopeActionTypeSchema = Joi.object({
    scope_rid: Joi.string().required(),
    status_rid: Joi.string().required().allow(""),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});

const listScopeActionsSchema = Joi.object({
    action_type_rid: Joi.string().required().allow(""),
    status_rid: Joi.string().required().allow(""),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});

const createRuleSchema = Joi.object({
    rule_name: Joi.string().required(),
    description: Joi.string().optional().allow(""),
    scope_type_rid: Joi.string().required(),
    event_rid: Joi.string().required(),
    condition_rid: Joi.string().required(),
    condition_categories: Joi.array().items(
        Joi.object({
            category_rid: Joi.string().required(),
            category_operator: Joi.string().valid("AND", "OR").optional(), // assuming optional
            field_rid: Joi.string().required(),
            operator_rid: Joi.string().required(),
            value_rid: Joi.string().required()
        })
    ).required(),
    action_rid: Joi.array().items(Joi.string().required()).required(),
    created_by: Joi.string().required(),
    trigger_type: Joi.number().required()
});

const getRuleDetailSchema = Joi.object({
    rule_rid: Joi.string().required(),
});

const updateRuleSchema = Joi.object({
    rule_rid: Joi.string().required(),
    rule_name: Joi.string().required(),
    description: Joi.string().optional().allow(""),
    scope_type_rid: Joi.string().required(),
    event_rid: Joi.string().required(),
    condition_rid: Joi.string().required(),
    condition_categories: Joi.array().items(
        Joi.object({
            category_rid: Joi.string().required(),
            category_operator: Joi.string().valid("AND", "OR").optional(), // assuming optional
            field_rid: Joi.string().required(),
            operator_rid: Joi.string().required(),
            value_rid: Joi.string().required()
        })
    ).required(),
    action_rid: Joi.array().items(Joi.string().required()).required(),
    modified_by: Joi.string().required(),
    trigger_type: Joi.number().required()
});

export {
    createRuleMasterSchema,
    listRuleSchema,
    createConditionSchema,
    listConditionSchema,
    updateConditionSchema,
    listActionSchema,
    createActionSchema,
    updateActionSchema,
    listScopeSchema,
    createScopechema,
    updateScopeSchema,
    listScheduleSchema,
    createSchedulechema,
    updateScheduleSchema,
    createAuditSchema,
    createTriggerLogSchema,
    listScopesSchema,
    listScopeEventSchema,
    listScopeEventConditionSchema,
    listScopeConditionCategorySchema,
    listScopeFieldSchema,
    listScopeOperatorSchema,
    listScopeValueSchema,
    listScopeActionTypeSchema,
    listScopeActionsSchema,
    createRuleSchema,
    getRuleDetailSchema,
    updateRuleSchema,
    createRuleMapSchema,
};