import Joi from "joi";

const uuidRegex =
  /^[A-Z0-9]{4}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const generateOtpSchema = Joi.object({
  interaction_rid: Joi.string().max(50).required(),
  account_rid: Joi.string().max(50).required(),
});

const verifyOtpSchema = Joi.object({
  interaction_rid: Joi.string().max(50).required(),
  account_rid: Joi.string().max(50).required(),
  otp: Joi.string().max(6).required(),
});

const updateInteractionResponseSchema = Joi.object({
  interaction_rid: Joi.string().pattern(uuidRegex).required(),
  account_rid: Joi.string().pattern(uuidRegex).required(),
  project_rid: Joi.string().pattern(uuidRegex).required(),
  project_fiscal_rid: Joi.string().pattern(uuidRegex).required(),
  status_action: Joi.string().required(),
  response_source: Joi.string().optional().default("Manual"),
  parent_interaction_rid: Joi.string().allow(null, ""),
  attachments: Joi.array()
    .items(
      Joi.object({
        fileName: Joi.string().max(255).required(),
        fileSize: Joi.number().required(),
        fileType: Joi.string().max(20).required(),
        fileUrl: Joi.string().uri().required(),
      })
    )
    .optional(),
  questions: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().pattern(uuidRegex).allow(null, ""),
        question: Joi.string().required(),
        response: Joi.string().allow(""),
        attachments: Joi.array()
          .items(
            Joi.object({
              fileName: Joi.string().max(255).required(),
              fileSize: Joi.number().required(),
              fileType: Joi.string().max(20).required(),
              fileUrl: Joi.string().uri().required(),
            })
          )
          .required(),
      })
    )
    .min(1)
    .required(),
});

const listInteractionDetailsByIdSchema = Joi.object({ 
  project_fiscal_rid: Joi.string().pattern(uuidRegex).optional().label("Project Fiscal Rid"),
  type: Joi.string().valid("account", "project").default('project').label("Type"),
});


export { generateOtpSchema, verifyOtpSchema, updateInteractionResponseSchema, listInteractionDetailsByIdSchema };
