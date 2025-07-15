import {IResolvers} from '@graphql-tools/utils'
import { HttpStatus } from '../utils/constants'
import { validateProjectRequest } from '../utils/helpers'

export const projectResolver : IResolvers = {
    Mutation : {
        updateSpecificProjectDetails : async(_, {data} : {data : any}, ctx) => {
            try {
                let validation = validateProjectRequest(data);
                if(validation)
                    return {
                    statusCode : HttpStatus.BAD_REQUEST,
                    statusCodeValue : HttpStatus.BAD_REQUEST_MESSAGE,
                    statusMessage : validation
                }
                data.userId = ctx.req.headers['x-user-id']
                let result = await ctx.services.projectGraphQlServices.inLineEditProject(data)
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
                        data : result.data
                    }
                }
                else {
                    return {
                        statusCode : HttpStatus.NOT_FOUND,
                        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
                        statusMessage : result.statusMessage,
                        data : result.data
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