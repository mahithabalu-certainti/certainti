import { IResolvers } from "@graphql-tools/utils";
// ... existing code ...

const userResolvers: IResolvers = {
  Query: {
    permissionById: async (_: any, { azureId }: { azureId: string }, ctx) => {
      try {
        // Use userService from context
        const result = await ctx.services.userServices.permissionById(azureId);
        if (!result || result.statusCode !== 200) {
          throw new Error("Permission not found");
        }
        return result.data;
      } catch (err) {
        throw new Error("Failed to fetch permission by Azure ID");
      }
    },
  },
};

export default userResolvers;