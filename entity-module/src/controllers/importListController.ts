import { Request, Response } from 'express'
import { HttpStatus, STATUS_MESSAGE } from '../utils/constants'
import Configurations from '../config/config';
import { handleErrorResponse, handleSuccessResponse, validateImportListRequest } from '../utils/helpers';

const services = Configurations.getInstance().getServices();
const importServices = services.importGraphqlServices;

async function fetchAllImportList(req: Request, res: Response) {
    try {
        const data = req.body;
        let importedByFilter;
        let importedByCondition : string;
        let totalCount : number = 0
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
        handleErrorResponse(
            res,
            HttpStatus.BAD_REQUEST,
            HttpStatus.BAD_REQUEST_MESSAGE,
            "User id is required"
        );
        return;
        }
        const requestValidation = validateImportListRequest(data)
        if(requestValidation) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, requestValidation);
            return
        }
        if(data.filters.imported_by) {
            importedByFilter = data.filters.imported_by
        }
        const result: any = await importServices.listAllImportedData(data.page, data.limit, data.sort, data.sort_by, data.account_rid, data.filters);
        if (result.statusCode !== HttpStatus.SUCCESS) {
            handleErrorResponse(res, HttpStatus.NOT_FOUND, HttpStatus.NOT_FOUND_MESSAGE, STATUS_MESSAGE.importsNoFound);
            return
        }

        let flatData = result.data.flatMap((d : any) => {
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
                imported_on : new Date(data.imported_on).toISOString(),
                imported_by : data.imported_by,
            })
        )
        })
        if (importedByFilter) {
        const conditionObj = importedByFilter;
        if (conditionObj.contains) {
            importedByFilter = conditionObj.contains.toLowerCase();
            importedByCondition = "contains";
        } else if (conditionObj.equals) {
            importedByFilter = conditionObj.equals.toLowerCase();
            importedByCondition = "equals";
        } else if (conditionObj.not_equals) {
            importedByFilter = conditionObj.not_equals.toLowerCase();
            importedByCondition = "not_equals";
        } else if (conditionObj.is_empty) {
            importedByFilter = conditionObj.is_empty;
            importedByCondition = "is_empty";
        }
    }

        const uniqueUserRids : any = [...new Set(flatData.map((d: any) => d.imported_by))];

        const userDetails: any[] = await importServices.fetchUserDetails(uniqueUserRids);

        const userMap = new Map(userDetails.map((user : any) => [user.rid, `${user.first_name} ${user.last_name}`]));

        const finalData = flatData.map((d: any) => ({
            ...d,
            imported_by: userMap.get(d.imported_by) || d.imported_by
        }));
        const filteredFinalData = importedByFilter
            ? finalData.filter((d: any) => {
                const importedByName = d.imported_by?.toLowerCase() || '';
                
                if (importedByCondition === "contains") {
                    return importedByName.includes(importedByFilter);
                } else if (importedByCondition === "equals") {
                    return importedByName === importedByFilter;
                } else if (importedByCondition === "not_equals") {
                    return importedByName !== importedByFilter;
                } else if (importedByCondition === "is_empty") {
                    return importedByName === null;
                }
                return true;
            })
            : finalData;

        const paginatedData = importedByFilter
            ? filteredFinalData.slice((data.page - 1) * data.limit, data.page * data.limit)
            : finalData;
        if(result.data[0].imports == null) totalCount = 0
        else totalCount = result.data[0].imports[0].count

        const finalResponse = {
            page: data.page,
            limit: data.limit,
            total_count: importedByFilter ? filteredFinalData.length : totalCount,
            imports: paginatedData
        };

        handleSuccessResponse(res, finalResponse);
        return;
    } catch (error: any) {
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message);
        return
    }
}


export default {
    fetchAllImportList
}
