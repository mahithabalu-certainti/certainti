import { Request, Response } from 'express'
import { HttpStatus, rawQueries, STATUS_MESSAGE } from '../utils/constants'
import Configurations from '../config/config';
import { generateExcelBase64, handleErrorResponse, handleSuccessResponse, validateImportListByRidRequest, validateImportListRequest } from '../utils/helpers';

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
        const result: any = await importServices.listAllImportedData(data.page, data.limit, data.sort, data.sort_by, data.account_rid, data.filters, data.fiscal_year);
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

async function importListByRid (req : Request, res : Response) {
    try {
        const {account_rid, rid} = req.params
        const validation = validateImportListByRidRequest(account_rid, rid)
        if(validation) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, validation)
            return;
        }
        const result = await importServices.fetchImportById(account_rid, rid)
        if(result.statusCode == HttpStatus.SUCCESS) {
            handleSuccessResponse(res, result.data);
            return;
        }
        else {
            handleErrorResponse(res, HttpStatus.NOT_FOUND, HttpStatus.NOT_FOUND_MESSAGE, STATUS_MESSAGE.importsNoFound);
            return 
        }
    } catch (error : any) {
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message);
        return
    }
}

async function exportAllImportedDatas (req : Request, res : Response) {
    const data = req.body;
    let importedByFilter;
    let importedByCondition : string;
    let totalCount : number = 0
    
    const result: any = await importServices.listAllImportedData(data.page, data.limit, data.sort, data.sort_by, data.account_rid, data.filters, data.fiscal_year);
        if (result.statusCode !== HttpStatus.SUCCESS) {
            handleErrorResponse(res, HttpStatus.NOT_FOUND, HttpStatus.NOT_FOUND_MESSAGE, STATUS_MESSAGE.importsNoFound);
            return
        }
        if(data.filters.imported_by) {
            importedByFilter = data.filters.imported_by
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

        let finalData = flatData.map((d: any) => ({
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

        let finalPaginatedData = paginatedData.map((data : any) => {
            return {
                "Import ID" : data.r_number,
                "File Name" : data.file_name,
                "Format" : data.format,
                "Size" : data.size,
                "Entity" : data.entity,
                "Total Records" : data.total_records,
                "Fiscal Year" : data.fiscal,
                "Records Loaded Successfully" : data.records_loaded_successfully,
                "Records Failed to Load" : data.records_failed_to_load,
                "Records with Warning" : data.records_with_warning,
                "Status" : data.status,
                "Imported On" : new Date(data.imported_on).toISOString().slice(0, 10),
                "Imported By" : data.imported_by,
            }
        })

        const base64Response = await generateExcelBase64(finalPaginatedData, "Imports")

        handleSuccessResponse(res, base64Response);
        return;  
}

async function exportImportListPerRow (req : Request, res : Response) {
        const {account_rid, rid} = req.params
        const result : any = await importServices.fetchImportById(account_rid, rid)
        if(result.statusCode == HttpStatus.SUCCESS) {
            let finalData : any = result.data.imports
            finalData = {
                "Import ID" : finalData.r_number,
                "File Name" : finalData.file_name,
                "Format" : finalData.format,
                "Size" : finalData.size,
                "Entity" : finalData.entity,
                "Total Records" : finalData.total_records,
                "Fiscal Year" : finalData.fiscal,
                "Records Loaded Successfully" : finalData.records_loaded_successfully,
                "Records Failed to Load" : finalData.records_failed_to_load,
                "Records with Warning" : finalData.records_with_warning,
                "Status" : finalData.status,
                "Imported On" : finalData.imported_on.slice(0, 10),
                "Imported By" : finalData.imported_by,
            }
            let finalDataArray = []
            finalDataArray.push(finalData)
             const base64Response = await generateExcelBase64(finalDataArray, "Imports")
            handleSuccessResponse(res, base64Response);
            return;
        }
}


export default {
    fetchAllImportList,
    importListByRid,
    exportAllImportedDatas,
    exportImportListPerRow
}
