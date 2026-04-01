import { IResolvers } from '@graphql-tools/utils';
import { HttpStatus, STATUS_MESSAGE } from '../utils/constants';
// import validation helpers if needed
// import { validateCheckListInput } from '../utils/helpers';

export const checkListResolver: IResolvers = {
  Mutation: {
    updateCheckListInline: async (_, { data }: { data: any }, ctx) => {
      try {
        data.userId = ctx.req.headers['x-user-id'];
        if (!data.userId) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: STATUS_MESSAGE.userIdMissingInHeader,
            data: null,
          };
        }
        // Add validation if needed
        // const requestValidation = validateCheckListInput(data);
        // if (requestValidation) {
        //   return {
        //     statusCode: HttpStatus.BAD_REQUEST,
        //     statusMessage: requestValidation,
        //     data: null,
        //   };
        // }
         const userId = ctx.req.headers["x-user-id"];
         const checklistUpdateData = {
          ...data,
          checklist_rid: data.rid,
          checklist_items:[],
          modified_by: userId,
          modified_datetime: new Date(),
        };
        const result = await ctx.services.checklistService.updateCheckList(checklistUpdateData, userId);
          if (result.statusCode === HttpStatus.SUCCESS) {
          // Fetch the updated checklist information to return complete data like listchecklist
          try {
            const checklistListResult = await ctx.services.checklistService.getCheckListDetailsById(
                data.rid,
                {
                    account_rid: data.account_rid,
                    attachmentLevel: data.attachmentLevel,
                    entityId: data.entityId
                }
            );
            if (checklistListResult.statusCode === HttpStatus.SUCCESS &&
                checklistListResult.data?.checklistDetails) {
                let latestData = {
                     "rid": checklistListResult.data.checklistDetails.checklist_rid,
                "r_number": checklistListResult.data.checklistDetails.r_number,
                "created_by_name":   checklistListResult.data.checklistDetails.created_by,
                "modified_by_name": checklistListResult.data.checklistDetails.modified_by,
                "created_datetime": checklistListResult.data.checklistDetails.created_datetime,
                "modified_datetime": checklistListResult.data.checklistDetails.modified_datetime,
                "account_rid": checklistListResult.data.checklistDetails.account_rid,
                "attach_to": checklistListResult.data.checklistDetails.attach_to,
                "attachment_level": checklistListResult.data.checklistDetails.attachment_level,
                "fiscal_year": checklistListResult.data.checklistDetails.fiscal_year,
                "checklist_name": checklistListResult.data.checklistDetails.checklist_name,
                "checklist_description": checklistListResult.data.checklistDetails.checklist_description,
                "status_rid": checklistListResult.data.checklistDetails.status_rid,
                "assigned_to": checklistListResult.data.checklistDetails.assigned_to,
                "checklist_template_rid": checklistListResult.data.checklistDetails.checklist_template_rid,
                //"created_by_name":checklistListResult.data.checklistDetails.created_by_name,
               // "modified_by_name": checklistListResult.data.checklistDetails.modified_by_name,
                "attached_to": checklistListResult.data.checklistDetails.attached_to,
                }

              return {
                statusCode: HttpStatus.SUCCESS,
                statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
                statusMessage: result.message,
                data: latestData
              };
            } else {
              // Fallback to original update result if fetching fails
              return {
                statusCode: HttpStatus.SUCCESS,
                statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
                statusMessage: result.message,
                data: result.data?.checklist || null,
              };
            }
          } catch (fetchError) {
            // Fallback to original update result if fetching fails
            return {
              statusCode: HttpStatus.SUCCESS,
              statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
              statusMessage: result.message,
              data: result.data?.checklist || null,
            };
          }
        } else {
          return {
            statusCode: result.statusCode,
            statusCodeValue: HttpStatus.FAILED_MESSAGE,
            statusMessage: result.errorMessage || result.message,
            data: null,
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
    }
  },
};
