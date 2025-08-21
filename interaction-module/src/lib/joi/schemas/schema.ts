import Joi from "joi";

const uuidRegex =
  /^[A-Z0-9]{4}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createInteractionSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  fiscal_year: Joi.number().integer().min(1900).max(2100).required(),
  status_rid: Joi.string().required(),
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

const sendInteractionSchema = Joi.object({
  account_rid: Joi.string().pattern(uuidRegex).required(),
  interactions: Joi.array()
  .items(
    Joi.object({
      interaction_rid: Joi.string().pattern(uuidRegex).required(),
      emailInfo: Joi.object({
        email: Joi.string().email().optional().allow("",null),
        name: Joi.string().max(255).optional().allow("",null),
      }).required(),
    })
  )
  .min(1)
  .required(),
});
const getInteractionStatusSchema = Joi.object({
  status_scope: Joi.string().optional(),
  current_status: Joi.string().optional(),
});
const updateInteractionSchema = Joi.object({
  interaction_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  status_rid: Joi.string().required(),
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
  status_action: Joi.string().required(),
  parent_interaction_rid: Joi.string().allow(null, ""),
   attachments: Joi.array().items(
          Joi.object({
            fileName: Joi.string().max(255).required(),
            fileSize: Joi.number().required(),
            fileType: Joi.string().max(20).required(),
            fileUrl: Joi.string().uri().required(),
          })
        ).optional(),
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

export {
  createInteractionSchema,
  updateInteractionSchema,
  updateInteractionResponseSchema,
  getInteractionStatusSchema,
  sendInteractionSchema
};
