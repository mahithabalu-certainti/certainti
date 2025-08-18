import Joi from "joi";

const uuidRegex =
  /^[A-Z0-9]{4}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createInteractionSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  fiscal_year: Joi.number().integer().min(1900).max(2100).required(),
  interaction_type_rid: Joi.string().pattern(uuidRegex).required(),
  interaction_source_rid: Joi.string().pattern(uuidRegex).required(),
  status_rid: Joi.string().pattern(uuidRegex).required(),
  parent_interaction_rid: Joi.string().allow(null, ""),
  questions: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().max(255).required(),
        notes: Joi.string().max(1000).allow(""),
        is_mandatory: Joi.boolean().required(),
        action_type: Joi.string().valid("add", "update", "delete").required(),
      })
    )
    .min(1)
    .required(),
});

const updateInteractionSchema = Joi.object({
  interaction_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  status_rid: Joi.string().pattern(uuidRegex).required(),
  parent_interaction_rid: Joi.string().allow(null, ""),
  questions: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().pattern(uuidRegex).allow(null, ""),
        question: Joi.string().max(255).required(),
        notes: Joi.string().max(1000).allow(""),
        is_mandatory: Joi.boolean().required(),
        action_type: Joi.string().valid("add", "edit", "delete").required(),
      })
    )
    .min(1)
    .required(),
});

const updateInteractionResponseSchema = Joi.object({
  interaction_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  status_rid: Joi.string().pattern(uuidRegex).required(),
  parent_interaction_rid: Joi.string().allow(null, ""),
  questions: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().pattern(uuidRegex).allow(null, ""),
        question: Joi.string().max(255).required(),
        response: Joi.string().max(1000).allow(""),
        attachments: Joi.array().items(
          Joi.object({
            fileName: Joi.string().max(255).required(),
            fileSize: Joi.number().required(),
            fileType: Joi.string().max(20).required(),
            fileUrl: Joi.string().uri().required(),
          })
        ).required(),
      })
    )
    .min(1)
    .required(),
});

const createOtpSchema = Joi.object({
  interaction_rid: Joi.string().max(50).required(),
  account_rid: Joi.string().max(50).required(),
});

export {
  createInteractionSchema,
  updateInteractionSchema,
  updateInteractionResponseSchema,
  createOtpSchema,
};
