import { IResolvers } from "@graphql-tools/utils";
import { HttpStatus } from "../utils/constants";
import { validateProjectResourceRequest } from "../utils/helpers";

export const projectResourceResolver: IResolvers = {
  Mutation: {
    updateProjectResource: async (_, { data }: { data: any }, ctx) => {
      try {
        let validation = validateProjectResourceRequest(data);
        if (validation)
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusCodeValue: HttpStatus.BAD_REQUEST_MESSAGE,
            statusMessage: validation,
          };
        const userId = ctx.req.headers["x-user-id"];
        let result =
          await ctx.services.projectResourceServices.inLineEditProjectResource(data, userId);
        if (result.statusCode == HttpStatus.SUCCESS || result.statusCode == HttpStatus.PROMPT) {
          return {
            statusCode: result.statusCode == HttpStatus.PROMPT ? HttpStatus.PROMPT : HttpStatus.SUCCESS,
            statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
            statusMessage: result.message,
            data: result?.data,
          };
        } else {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            statusCodeValue: HttpStatus.NOT_FOUND_MESSAGE,
            statusMessage: result.errorMessage ? result.errorMessage : result.statusMessage,
            data: result.data,
          };
        }
      } catch (error: any) {
        return {
          statusCode: HttpStatus.FAILED,
          statusCodeValue: HttpStatus.FAILED_MESSAGE,
          statusMessage: error.message,
          data: null,
        };
      }
    },
  },
};
