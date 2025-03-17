const authMiddleware = require("../middlewares/authMiddleware");

const initRequestContext = async (ctx, appContext) => {
  await authMiddleware(ctx.req, null, () => {});
  return {
    ...ctx,
    services: appContext,
    token: ctx.req.headers.authorization,
  };
};

module.exports = initRequestContext;
