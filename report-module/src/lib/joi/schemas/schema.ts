import Decimal from "decimal.js";
import Joi from "joi";


const uuidRegex = /^[A-Z0-9]{4}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const decimal18_2Regex = /^\d{1,16}(\.\d{1,2})?$/;

const reportFlagSchema = Joi.object({
    flag: Joi.string().valid("all", "user").required()
});

const getOverallProjectValueSchema = Joi.object({
    flag: Joi.string().valid("all", "user").required(),
    fiscalYear: Joi.number().optional()
});

const globalLevelChartSchema = Joi.object({
    flag: Joi.string().valid("all", "user").required(),
    fiscalYear: Joi.number().optional(),
    countryRid: Joi.string().optional()
});

export {
    reportFlagSchema,
    getOverallProjectValueSchema,
    globalLevelChartSchema
};
