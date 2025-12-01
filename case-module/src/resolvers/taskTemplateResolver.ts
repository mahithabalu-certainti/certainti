import { IResolvers } from "@graphql-tools/utils";
import { HttpStatus } from "../utils/constants";

export const adminTaskTemplateResolver: IResolvers = {
  Mutation: {
    UpdateTaskTemplateInline: async (_, { data }, ctx) => {
      try {
        const userId = ctx.req.headers["x-user-id"];
        if (!userId) {
          return {
            statusCode: HttpStatus.UNAUTHORIZED,
            statusCodeValue: HttpStatus.UNAUTHORIZED_MESSAGE,
            statusMessage: "User ID is required",
            data: null,
          };
        }
        data.userId = userId
        const result = await ctx.services.caseManagementService.inlineEditTaskTemplate(
          data,
          userId
        );
        if (result.statusCode === HttpStatus.SUCCESS) {
          return {
            statusCode: HttpStatus.SUCCESS,
            statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
            statusMessage: result.statusMessage,
            data: result.data
        };
      } else {
        return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusCodeValue: HttpStatus.BAD_REQUEST_MESSAGE,
            statusMessage: result.statusMessage,
            data: null
        };
      }
    }catch (error: any) {
        return {
          statusCode: HttpStatus.FAILED,
          statusCodeValue: HttpStatus.FAILED_MESSAGE,
          statusMessage: error.message,
          data: null,
        };
      }
  },
}
}