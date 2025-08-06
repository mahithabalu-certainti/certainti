import {IResolvers} from '@graphql-tools/utils'
import { HttpStatus } from '../utils/constants'
export const importResolver : IResolvers = {
    Mutation : {
        updateInlineEditForImports : async (_, {data} : {data : any}, ctx) => {
            
            const result = await ctx.services.importGraphqlServices.inlineEditImportList(data)
            if(result.statusCode == HttpStatus.SUCCESS) {
                let data = result.data.imports
                let finalData = {
                rid : data.rid,
                r_number : data.r_number,
                file_name : data.file_name,
                format : data.format,
                size : data.size,
                entity : data.entity,
                total_records : data.total_records,
                fiscal : data.fiscal,
                records_loaded_successfully : data.records_loaded_successfully,
                records_failed_to_load : data.records_failed_to_load,
                records_with_warning : data.records_with_warning,
                records_failed_to_stage : data.records_failed_to_stage,
                status : data.status,
                imported_on : data.imported_on,
                imported_by : data.imported_by,
            }
                return {
                    statusCode : HttpStatus.SUCCESS,
                    statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
                    statusMessage : result.statusMessage,
                    data : finalData
                }
            } else {
                return {
                    statusCode : HttpStatus.BAD_REQUEST,
                    statusCodeValue : HttpStatus.BAD_REQUEST_MESSAGE,
                    statusMessage : result.statusMessage,
                    data : null
                }
            }
        }
    }
}