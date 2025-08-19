import Joi from "joi";

const generateOtpSchema = Joi.object({
  interaction_rid: Joi.string().max(50).required(),
  account_rid: Joi.string().max(50).required(),
});

const verifyOtpSchema = Joi.object({
  interaction_rid: Joi.string().max(50).required(),
  account_rid: Joi.string().max(50).required(),
  otp: Joi.string().max(6).required(),
});

export {
  generateOtpSchema,
  verifyOtpSchema
};
