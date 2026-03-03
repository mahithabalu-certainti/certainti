import {IResolvers} from '@graphql-tools/utils';
import { Context } from '@microsoft/microsoft-graph-client';
import { HttpStatus, STATUS_MESSAGE } from '../utils/constants';
import { string } from 'joi';
export const interactionResolver : IResolvers = {
  Mutation : {
    updateInteractions : async (_, {data}, ctx) => {
      try {
        const userId = ctx.req.headers['x-user-id'];
        const result = await ctx.services.interactionService.updateInteractionStatus(data, userId);
        
        if (result.interactions.length > 0) {
          return {
            statusCode: HttpStatus.SUCCESS,
            statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
            statusMessage: STATUS_MESSAGE.interactionFetchedSuccess,
            data: result.interactions[0],
          };
        } else {
          return {
            statusCode: HttpStatus.SUCCESS,
            statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
            statusMessage: STATUS_MESSAGE.dataNotFound,
            data: result.data,
          };
        }
      } catch (error) {
        
      }
    }
  }
}