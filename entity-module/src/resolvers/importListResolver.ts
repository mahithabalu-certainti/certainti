import {IResolvers} from '@graphql-tools/utils'
import { HttpStatus, STATUS_MESSAGE } from '../utils/constants'
export const importResolver : IResolvers = {
    Mutation : {
        listAllImportedData : async (_, {data} : {data : any}, ctx) => {
            const result = await ctx.services.importGraphqlServices.listAllImportedData(
                data.page, data.limit , data.sort, data.sort_by, data.account_rid, data.filters
            )
            if(result.statusCode == HttpStatus.SUCCESS) {
                let finalData = result.data.flatMap((d : any) => {
                    return d.imports == null ? [] : d.imports.map((data : any) => ({
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
                            status : data.status,
                            imported_on : data.imported_on,
                            imported_by : data.imported_by,
                    })
                )
                })
                return {
                    statusCode : HttpStatus.SUCCESS,
                    statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
                    statusMessage : STATUS_MESSAGE.importListedSuccess,
                    data : {
                        page : data.page,
                        limit : data.limit,
                        total_count : result.data[0].imports == null ? 0 : result.data[0].imports[0].count,
                        imports : finalData
                    }
                }
            } else {
                return {
                    statusCode : HttpStatus.NOT_FOUND,
                    statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
                    statusMessage : STATUS_MESSAGE.importsNoFound,
                    data : result.data
                }
            }
        }
    }
}