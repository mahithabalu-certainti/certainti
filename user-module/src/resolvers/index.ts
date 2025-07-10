import { IResolvers } from "@graphql-tools/utils";
import { constants } from "../utils/constant";
import { updateAzureUser } from "../services/manageUser";

interface UpdateUserFields {
  rid: string;
  first_name?: string;
  profile_rid?: string;
  role_rid?: string;
  status_rid?: string;
  azure_id?: string;
}

interface UpdateUserProfileFields {
  rid: string;
  profile_name?: string;
  profile_description?: string;
}

const userResolvers: IResolvers = {
  Query: {
    permissionById: async (_: any, { azureId }: { azureId: string }, ctx) => {
      try {
        // Use userService from contexts
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
  Mutation: {
    updateUser: async (_: any, args: { input: UpdateUserFields }, ctx) => {
      try {
        const { input } = args;
        const userId = ctx.userId;

        if (input.azure_id && input.first_name) {
          const existingData = await ctx.services.userServices.listUserById(input.rid, constants.ENV_TRD365);
          const userRecord = existingData.data.users;

          const toggleStatus = (status: string) => (status === "active" ? "inactive" : "active");
          const userStatus =
            !input.status_rid || input.status_rid === userRecord.status_rid
              ? userRecord.status.status_name
              : toggleStatus(userRecord.status.status_name);
          await updateAzureUser({
            azure_id: input.azure_id,
            first_name: input.first_name,
            last_name: userRecord.last_name,
            status_rid: userStatus
          });
        }

        const response = await ctx.services.userServices.updateUserInLine(
          input,
          input.rid,
          userId
        );

        if (response.statusCode === constants.SUCCESS) {
          return {
            success: true,
            message: "User updated successfully",
            user: response.data.user,
          };
        }

        return {
          success: false,
          message: response.errorMessage || "Failed to update user",
          user: null,
        };
      } catch (err) {
        return {
          success: false,
          message: (err as Error).message,
          user: null,
        };
      }
    },
    updateUserProfile: async (_: any, args: { input: UpdateUserProfileFields }, ctx) => {
      try {
        const { input } = args;
        const userId = ctx.userId;

        const existingRecords = await ctx.services.userManagementServices.getProfileByPk(input.rid);

        const response = await ctx.services.userManagementServices.updateProfileInline(
          input.rid,
          {
            profile_name: input.profile_name,
            profile_description: input.profile_description,
          },
          existingRecords.profile_name,
          existingRecords.profile_description,
          userId
        );

        if (response.statusCode === constants.SUCCESS) {
          return {
            success: true,
            message: "User profile updated successfully",
            profile: response.profile,
          };
        }

        return {
          success: false,
          message: response.errorMessage || "Failed to update user profile",
          profile: null,
        };
      } catch (err) {
        return {
          success: false,
          message: (err as Error).message,
          profile: null,
        };
      }
    }
  },
};

export default userResolvers;
