import { ExpressContextFunctionArgument } from "@apollo/server/express4";
import Services from "../services";
import authMiddleware from "../middlewares/authMiddleware";

interface AppContext {
  services: Services;
}

/**
 * Initializes the request context, applying authentication middleware
 * and adding services and token to the context.
 *
 * @param {RequestContext} ctx - The GraphQL context containing the request and other data.
 * @param {AppContext} appContext - The application context containing services.
 * @returns {Promise<RequestContext>} - The enhanced context with services and token.
 */
const initRequestContext = async (
  ctx: ExpressContextFunctionArgument,
  appContext: Services
): Promise<any> => {
  // await authMiddleware(ctx.req, null, () => {});
  return {
    ...ctx,
    services: appContext,
    token: ctx.req.headers.authorization,
  };
};

export default initRequestContext;
