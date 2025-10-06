import {IResolvers} from '@graphql-tools/utils'
import { HttpStatus, STATUS_MESSAGE } from '../utils/constants'
import { validateNotesInput } from '../utils/helpers'
export const notesResolver : IResolvers  = {
    Mutation : {
        updateNotesInline : async (_, {data} : {data : any}, ctx) => {
            try {
                data.userId = ctx.req.headers['x-user-id']
                if(!data.userId) {
                    return {
                        statusCode : HttpStatus.BAD_REQUEST,
                        statusMessage : STATUS_MESSAGE.userIdEmpty,
                        data : null
                    }
                }
                const requestValidation = validateNotesInput(data)
                if(requestValidation) {
                    return {
                        statusCode : HttpStatus.BAD_REQUEST,
                        statusMessage : requestValidation,
                        data : null
                    } 
                }
                console.log("test====> ")
                const result = await ctx.services.notesGraphqlServices.updateInlineGraphqlDetailsForNotes(data)
                if(result.statusCode == HttpStatus.SUCCESS) {
                    return {
                        statusCode : HttpStatus.SUCCESS,
                        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
                        statusMessage : result.statusMessage,
                        data : result.data                  
                    }
                } else if(result.statusCode == HttpStatus.BAD_REQUEST) {
                    return {
                        statusCode : HttpStatus.BAD_REQUEST,
                        statusCodeValue : HttpStatus.BAD_REQUEST_MESSAGE,
                        statusMessage : result.statusMessage,
                        data : null                  
                    }              
                } else {
                    return {
                        statusCode : HttpStatus.NOT_FOUND,
                        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
                        statusMessage : result.statusMessage,
                        data : null                  
                    } 
                }  
            } catch (error : any) {
                return {
                    statusCode : HttpStatus.FAILED,
                    statusCodeValue : HttpStatus.FAILED_MESSAGE,
                    statusMessage : error.message,
                    data : null
                }
            }

        }
    }    
}