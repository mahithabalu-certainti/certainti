import { Request, Response } from 'express';
import Joi from 'joi';
import { handleChatMessage } from '../services/chatService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logMessage } from '../utils/logger';

const messageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  context: Joi.object({
    level: Joi.string().valid('project', 'account', 'case', 'platform').required(),
    project_rid: Joi.string().optional().allow('', null),
    project_name: Joi.string().optional().allow('', null),
    account_rid: Joi.string().optional().allow('', null),
    account_name: Joi.string().optional().allow('', null),
    case_rid: Joi.string().optional().allow('', null),
  }).required(),
});

async function sendMessage(req: Request, res: Response): Promise<void> {
  const { error, value } = messageSchema.validate(req.body);
  if (error) {
    sendError(res, error.details[0].message, 400);
    return;
  }

  try {
    logMessage(`chatController: user=${req.headers['x-user-id'] || 'unknown'} level=${value.context.level}`);
    const result = await handleChatMessage({
      message: value.message,
      context: value.context,
    });
    sendSuccess(res, result);
  } catch (err: any) {
    logMessage(`chatController error: ${err.message}`);
    sendError(res, 'Failed to process your message. Please try again.', 500, err);
  }
}

export default { sendMessage };
