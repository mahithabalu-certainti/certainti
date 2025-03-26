import { IResolvers } from "@graphql-tools/utils";

const accountResolvers: IResolvers = {
  Query: {
    getAccountById: async (_, params: { id: number }, ctx) => {
      const result = await ctx.services.accountServices.accountsById(params.id);
      return result.data.account;
    },
  },
};

export default accountResolvers;
