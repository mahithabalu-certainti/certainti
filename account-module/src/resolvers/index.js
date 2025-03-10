const accountResolvers = {
  Query: {
    getAccountById: async (_, params, ctx) => {
      const result = await ctx.services.accountServices.accountsById(params.id);
      return result.data.account;
    },
  },
};

module.exports = accountResolvers;
