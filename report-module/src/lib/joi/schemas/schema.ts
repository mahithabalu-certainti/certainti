import Decimal from "decimal.js";
import Joi from "joi";


const uuidRegex = /^[A-Z0-9]{4}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const decimal18_2Regex = /^\d{1,16}(\.\d{1,2})?$/;

const reportFlagSchema = Joi.object({
    flag: Joi.string().valid("all", "user").required(),
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
    globalFilters: Joi.object().default({}),
});

const meetingListSchema = Joi.object({
    flag: Joi.string().valid("all", "user").required(),
    globalFilters: Joi.object().default({}),
});

const getOverallProjectValueSchema = Joi.object({
    flag: Joi.string().valid("all", "user").required(),
    countryType: Joi.string().valid("all", "active").required(),
    fiscalYear: Joi.number().optional(),
    globalFilters: Joi.object().default({}),
});

const globalLevelChartSchema = Joi.object({
    flag: Joi.string().valid("all", "user").required(),
    countryType: Joi.string().valid("all", "active").required(),
    fiscalYear: Joi.number().optional(),
    countryRid: Joi.string().optional(),
    globalFilters: Joi.object().default({}),
});

const casesByHealthStatusSchema = Joi.object({
    flag: Joi.string().valid("all", "user").required(),
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
    filingType: Joi.string().valid("Amendment", "Defense", "Regular").optional(),
    globalFilters: Joi.object().default({}),
});

export {
    reportFlagSchema,
    getOverallProjectValueSchema,
    globalLevelChartSchema,
    casesByHealthStatusSchema,
    meetingListSchema
};
