import { Request, Response } from 'express'
import { HttpStatus, IMPORT_FIELD_MAPPINGS_FOR_EXPORT, rawQueries, STATUS_MESSAGE } from '../utils/constants'
import Configurations from '../config/config';
import { errorLog, generateExcelBase64, handleErrorResponse, handleSuccessResponse, successLog, validateImportListByRidRequest, validateImportListRequest, validateRequest } from '../utils/helpers';
import { validateLoadErrorListRequest, validateStagingErrorListRequest } from '../utils/helpers';
import { generateSasUrl } from '../utils/blob';
import { exportImportedAccountLevelProjects, exportImportedAccountLevelProjectTasks, exportImportedAccountLevelResources, importedAccountLevelProjects, importedAccountLevelProjectTasks, importedAccountLevelResources } from '../lib/joi/schemas/schema';

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

        let flatData = (
        await Promise.all(
            result.data.flatMap((d: any) => {
            if (!d.imports) return [];
            return d.imports.map(async (data: any) => ({
                rid: data.rid,
                r_number: data.r_number,
                file_name: data.file_name,
                format: data.format,
                size: data.size,
                entity: data.entity,
                total_records: data.total_records,
                fiscal: data.fiscal,
                records_loaded_successfully: data.records_loaded_successfully,
                records_failed_to_load: data.records_failed_to_load,
                records_with_warning: data.records_with_warning,
                status: data.status,
                status_descriptions: data.status_description,
                imported_on: new Date(data.imported_on).toISOString(),
                imported_by: data.imported_by,
                document_url: await generateSasUrl(data.document_url),
                document_rid: data.document_rid
            }));
            })
        )
        ).flat();

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

async function exportStagingFailureList (req : Request, res : Response) {
    try {
        const { accountRid, importRid, entityType } = req.params;

        const validation = validateStagingErrorListRequest(accountRid, importRid, entityType);
        if (validation) {
            return handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, validation);
        }

        const result = await importServices.listAllStageFailures(accountRid, importRid, entityType);

        if (result.statusCode !== HttpStatus.SUCCESS) {
            return handleErrorResponse(res, HttpStatus.NOT_FOUND, HttpStatus.NOT_FOUND_MESSAGE, STATUS_MESSAGE.importsNoFound);
        }

        const results = result.data as any[];

        let finalPaginatedData: any[] = [];
        let failureType = "";

        switch (entityType) {
            case "project":
                failureType = "Import - Load Failures - Project";
                finalPaginatedData = results.map((data) => ({
                    "Project Id": data.project_id,
                    "Project Name": data.project_name,
                    "Project Description": data.project_description,
                    "Total Hours": data.total_hours,
                    "Total Cost": data.total_cost,
                    "Point Of Contact": data.point_of_contact,
                    "Point Of Contact Email": data.point_of_contact_email,
                    "Start Date": data.start_date,
                    "End Date": data.end_date,
                    "Detailed Description": data.detailed_description,
                    "Currency": data.currency,
                    "Industry": data.industry,
                    "Program Name": data.program_name,
                    "Client Organization": data.client_organization,
                    "Country": data.country,
                    "City": data.city,
                    "Region": data.region,
                    "Project Manager": data.project_manager,
                    "Project Lead": data.project_lead,
                    "Project Tech Poc Name": data.project_tech_poc_name,
                    "Project Tech Poc Email": data.project_tech_poc_email,
                    "Project Delivery Head Name": data.project_delivery_head_name,
                    "Project Delivery Head Email": data.project_delivery_head_email,
                    "Project Type": data.project_type,
                    "Project Classification": data.project_classification,
                    "Project Client Group": data.project_client_group,
                    "Project Group": data.project_group,
                    "Total Fte Count": data.total_fte_count,
                    "Total Sub Con Count": data.total_sub_con_count,
                    "Total Fte Effort In Hrs": data.total_fte_effort_in_hrs,
                    "Total Fte Cost": data.total_fte_cost,
                    "Total Sub Con Effort In Hrs": data.total_sub_con_effort_in_hrs,
                    "Total Sub Con Cost": data.total_sub_con_cost,
                    "Total Non Labor Cost": data.total_non_labor_cost,
                    "Status": data.status,
                    "Error Description": data.error_descriptions
                }));
                break;

            case "project_resource":
                failureType = "Import - Load Failures - Project Resource";
                finalPaginatedData = results.map((data) => ({
                    "Project Id": data.project_id,
                    "Project Name": data.project_name,
                    "Project Description": data.project_description,
                    "Resource Id": data.resource_id,
                    "Resource Name": data.resource_name,
                    "Resource Type": data.resource_type,
                    "Resource Designation": data.resource_designation,
                    "Resource Role": data.resource_role,
                    "Start Date": data.start_date,
                    "End Date": data.end_date,
                    "Total Experience": data.total_experience,
                    "Total Hours": data.total_hours,
                    "Total Cost": data.total_cost,
                    "Project Resource Description": data.project_resource_description,
                    "Resource City": data.resource_city,
                    "Resource State Province": data.resource_state_province,
                    "Resource Country": data.resource_country,
                    "Currency": data.currency,
                    "Status": data.status,
                    "Error Description": data.error_descriptions
                }));
                break;

            case "resource":
                failureType = "Import - Load Failures - Resource";
                finalPaginatedData = results.map((data) => ({
                    "Resource Id": data.resource_id,
                    "Resource Name": data.resource_name,
                    "Resource Type": data.resource_type,
                    "Resource Organization": data.resource_organization,
                    "Resource Designation": data.resource_designation,
                    "Resource Role": data.resource_role,
                    "Total Experience": data.total_experience,
                    "Resource Start Date": data.resource_start_date,
                    "Resource End Date": data.resource_end_date,
                    "Resource City": data.resource_city,
                    "Resource State Province": data.resource_state_province,
                    "Resource Country": data.resource_country,
                    "Years In Organization": data.years_in_organization,
                    "Comments": data.comments,
                    "Status": data.status,
                    "Error Description": data.error_descriptions
                }));
                break;

            case "resource_skill":
                failureType = "Import - Load Failures - Resource Skill";
                finalPaginatedData = results.map((data) => ({
                    "Resource Id": data.resource_id,
                    "Resource Name": data.resource_name,
                    "Resource Type": data.resource_type,
                    "Start Date": data.start_date,
                    "Skill Type": data.skill_type,
                    "Skill Sub Type": data.skill_subtype,
                    "Skill Details": data.skill_details,
                    "Skill Level": data.skill_level,
                    "Comments": data.comments,
                    "Status": data.status,
                    "Error Description": data.error_descriptions
                }));
                break;

            case "project_task":
                failureType = "Import - Load Failures - Project Task";
                finalPaginatedData = results.map((data) => ({
                    "Project Id": data.project_id,
                    "Project Type": data.project_type,
                    "Project Name": data.project_name,
                    "Project Description": data.project_description,
                    "Resource Id": data.resource_id,
                    "Resource Name": data.resource_name,
                    "Resource Type": data.resource_type,
                    "Resource Designation": data.resource_designation,
                    "Resource Role": data.resource_role,
                    "Total Experience": data.total_experience,
                    "Task Start Date": data.task_start_date,
                    "Task End Date": data.task_end_date,
                    "Total Hours": data.total_hours,
                    "Total Cost": data.total_cost,
                    "Resource Task Description": data.resource_task_description,
                    "Resource City": data.resource_city,
                    "Resource State/Province": data.resource_state_province,
                    "Resource Country": data.resource_country,
                    "Currency": data.currency,
                    "Status": data.status,
                    "Error Description": data.error_descriptions
                }));
                break;
            
            case "resource_cost":
                failureType = "Import - Load Failures - Resource Cost";
                finalPaginatedData = results.map((data : any) => ({
                    "Resource Id" : data.resource_id,
                    "Bonus" : data.bonus,
                    "Insurance" : data.insurance,
                    "Deductions" : data.deductions,
                    "Resource Cost" : data.resource_cost,
                    "Comments" : data.comments,
                    "Resource Name" : data.resource_name,
                    "Resource Type" : data.resource_type,
                    "Resource Organization" : data.resource_organization,
                    "Currency" : data.currency,
                    "Start Date" : data.start_date,
                    "End Date" : data.end_date,
                    "Effort In Hours" : data.effort_in_hours,
                    "Salary" : data.salary
                }))
                break;

            default:
                return handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "Invalid entity type.");
        }

        const base64Response = await generateExcelBase64(finalPaginatedData, failureType);
        handleSuccessResponse(res, base64Response);
        return;  

    } catch (error: any) {
        return handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message);
    }
}

async function exportLoadFailureList(req: Request, res: Response) {
    try {
        const { accountRid, importRid, entityType } = req.params;

        const validation = validateLoadErrorListRequest(accountRid, importRid, entityType);
        if (validation) {
            return handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, validation);
        }

        const result = await importServices.listAllLoadFailures(accountRid, importRid, entityType);

        if (result.statusCode !== HttpStatus.SUCCESS) {
            return handleErrorResponse(res, HttpStatus.NOT_FOUND, HttpStatus.NOT_FOUND_MESSAGE, STATUS_MESSAGE.importsNoFound);
        }

        const results = result.data as any[];

        let finalPaginatedData: any[] = [];
        let failureType = "";

        switch (entityType) {
            case "project":
                failureType = "Import - Load Failures - Project";
                finalPaginatedData = results.map((data) => ({
                    "Project Id": data.project_id,
                    "Project Name": data.project_name,
                    "Project Description": data.project_description,
                    "Total Hours": data.total_hours,
                    "Total Cost": data.total_cost,
                    "Point Of Contact": data.point_of_contact,
                    "Point Of Contact Email": data.point_of_contact_email,
                    "Start Date": data.start_date,
                    "End Date": data.end_date,
                    "Detailed Description": data.detailed_description,
                    "Currency": data.currency,
                    "Industry": data.industry,
                    "Program Name": data.program_name,
                    "Client Organization": data.client_organization,
                    "Country": data.country,
                    "City": data.city,
                    "Region": data.region,
                    "Project Manager": data.project_manager,
                    "Project Lead": data.project_lead,
                    "Project Tech Poc Name": data.project_tech_poc_name,
                    "Project Tech Poc Email": data.project_tech_poc_email,
                    "Project Delivery Head Name": data.project_delivery_head_name,
                    "Project Delivery Head Email": data.project_delivery_head_email,
                    "Project Type": data.project_type,
                    "Project Classification": data.project_classification,
                    "Project Client Group": data.project_client_group,
                    "Project Group": data.project_group,
                    "Total Fte Count": data.total_fte_count,
                    "Total Sub Con Count": data.total_sub_con_count,
                    "Total Fte Effort In Hrs": data.total_fte_effort_in_hrs,
                    "Total Fte Cost": data.total_fte_cost,
                    "Total Sub Con Effort In Hrs": data.total_sub_con_effort_in_hrs,
                    "Total Sub Con Cost": data.total_sub_con_cost,
                    "Total Non Labor Cost": data.total_non_labor_cost,
                    "Status": data.status,
                    "Error Description": data.error_descriptions
                }));
                break;

            case "project_resource":
                failureType = "Import - Load Failures - Project Resource";
                finalPaginatedData = results.map((data) => ({
                    "Project Id": data.project_id,
                    "Project Name": data.project_name,
                    "Project Description": data.project_description,
                    "Resource Id": data.resource_id,
                    "Resource Name": data.resource_name,
                    "Resource Type": data.resource_type,
                    "Resource Designation": data.resource_designation,
                    "Resource Role": data.resource_role,
                    "Start Date": data.start_date,
                    "End Date": data.end_date,
                    "Total Experience": data.total_experience,
                    "Total Hours": data.total_hours,
                    "Total Cost": data.total_cost,
                    "Project Resource Description": data.project_resource_description,
                    "Resource City": data.resource_city,
                    "Resource State Province": data.resource_state_province,
                    "Resource Country": data.resource_country,
                    "Currency": data.currency,
                    "Status": data.status,
                    "Error Description": data.error_descriptions
                }));
                break;

            case "resource":
                failureType = "Import - Load Failures - Resource";
                finalPaginatedData = results.map((data) => ({
                    "Resource Id": data.resource_id,
                    "Resource Name": data.resource_name,
                    "Resource Type": data.resource_type,
                    "Resource Organization": data.resource_organization,
                    "Resource Designation": data.resource_designation,
                    "Resource Role": data.resource_role,
                    "Total Experience": data.total_experience,
                    "Resource Start Date": data.resource_start_date,
                    "Resource End Date": data.resource_end_date,
                    "Resource City": data.resource_city,
                    "Resource State Province": data.resource_state_province,
                    "Resource Country": data.resource_country,
                    "Years In Organization": data.years_in_organization,
                    "Comments": data.comments,
                    "Status": data.status,
                    "Error Description": data.error_descriptions
                }));
                break;

            case "resource_skill":
                failureType = "Import - Load Failures - Resource Skill";
                finalPaginatedData = results.map((data) => ({
                    "Resource Id": data.resource_id,
                    "Resource Name": data.resource_name,
                    "Resource Type": data.resource_type,
                    "Start Date": data.start_date,
                    "Skill Type": data.skill_type,
                    "Skill Sub Type": data.skill_subtype,
                    "Skill Details": data.skill_details,
                    "Skill Level": data.skill_level,
                    "Comments": data.comments,
                    "Status": data.status,
                    "Error Description": data.error_descriptions
                }));
                break;

            case "project_task":
                failureType = "Import - Load Failures - Project Task";
                finalPaginatedData = results.map((data) => ({
                    "Project Id": data.project_id,
                    "Project Type": data.project_type,
                    "Project Name": data.project_name,
                    "Project Description": data.project_description,
                    "Resource Id": data.resource_id,
                    "Resource Name": data.resource_name,
                    "Resource Type": data.resource_type,
                    "Resource Designation": data.resource_designation,
                    "Resource Role": data.resource_role,
                    "Total Experience": data.total_experience,
                    "Task Start Date": data.task_start_date,
                    "Task End Date": data.task_end_date,
                    "Total Hours": data.total_hours,
                    "Total Cost": data.total_cost,
                    "Resource Task Description": data.resource_task_description,
                    "Resource City": data.resource_city,
                    "Resource State/Province": data.resource_state_province,
                    "Resource Country": data.resource_country,
                    "Currency": data.currency,
                    "Status": data.status,
                    "Error Description": data.error_descriptions
                }));
                break;
                
            case "resource_cost":
                failureType = "Import - Load Failures - Resource Cost";
                finalPaginatedData = results.map((data : any) => ({
                    "Resource Id" : data.resource_id,
                    "Bonus" : data.bonus,
                    "Insurance" : data.insurance,
                    "Deductions" : data.deductions,
                    "Resource Cost" : data.resource_cost,
                    "Comments" : data.comments,
                    "Resource Name" : data.resource_name,
                    "Resource Type" : data.resource_type,
                    "Resource Organization" : data.resource_organization,
                    "Currency" : data.currency,
                    "Start Date" : data.start_date,
                    "End Date" : data.end_date,
                    "Effort In Hours" : data.effort_in_hours,
                    "Salary" : data.salary
                }))
                break;

            default:
                return handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "Invalid entity type.");
        }

        const base64Response = await generateExcelBase64(finalPaginatedData, failureType);
        handleSuccessResponse(res, base64Response);
        return;  

    } catch (error: any) {
        return handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message);
    }
}

async function importListByRid (req : Request, res : Response) {
    try {
        const {accountRid, rid} = req.params
        const validation = validateImportListByRidRequest(accountRid, rid)
        if(validation) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, validation)
            return;
        }
        const result = await importServices.fetchImportById(accountRid, rid)
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

async function exportAllImportedData (req : Request, res : Response) {
    const data = req.body;
    const {permissionModule} = data;
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
                status_description : data.status_description,
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

        const [importFields] = await Promise.all([
        importServices.getAllowedExportFields(
          userId,
          permissionModule
        ),
      ]);

      const allowedFieldSet = new Set<string>();
      for (const field of importFields) {
        if (field.read) {
          allowedFieldSet.add(field.field_name);
        }
      }

        let finalPaginatedData = paginatedData.map((data: any) => {
          const exportRecord: Record<string, any> = {};
          
          IMPORT_FIELD_MAPPINGS_FOR_EXPORT.forEach(mapping => {
              if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] = mapping.formatter 
                      ? mapping.formatter(data[mapping.dataField])
                      : data[mapping.dataField];
              }
          });
          
          return exportRecord;
      });

        const base64Response = await generateExcelBase64(finalPaginatedData, "Imports")

        handleSuccessResponse(res, base64Response);
        return;  
}

async function importedAccountLevelprojectList(req: Request, res: Response): Promise<void> {
  const methodName = "ImportedAccountLevelprojectList";
  try {
    const { accountId } = req.params;

    const value = await validateRequest(req, importedAccountLevelProjects, res, "GET");

    let parsedFilters: Record<string, any> = {};
    const userId = req.headers["x-user-id"] as string;

    if (!value) {
      return;
    }

    try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const pageNum: number = parseInt(value.page, 10) || 1;
    const limitNum: number = parseInt(value.limit, 10) || 25;

    const project = await importServices.fetchAccountLevelImportedProjects(
      accountId,
      value.fiscalYear !== "" && value.fiscalYear !== null
        ? value.fiscalYear
        : 0,
      pageNum,
      limitNum,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.bothParentAndChild,
      userId,
      value.documentRid
    );

    if (project.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, project.data);
      return;
    } else {
      errorLog(methodName, project.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        project.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function exportImportedProjectList(req: Request, res: Response): Promise<void> {
  const methodName = "exportImportedProjectList";
  try {
    const { accountId } = req.params;

    const value = await validateRequest(req, exportImportedAccountLevelProjects, res, "GET");

    let parsedFilters: Record<string, any> = {};
    const userId = req.headers["x-user-id"] as string;

    if (!value) {
      return;
    }

    try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const project = await importServices.exportAccountLevelImportedProjects(
      accountId,
      value.fiscalYear !== "" && value.fiscalYear !== null
        ? value.fiscalYear
        : 0,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.bothParentAndChild,
      userId,
      value.timezone,
      value.documentRid
    );

    if (project.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(project?.data?.projects,"Projects"));
      return;
    } else {
      errorLog(methodName, project.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        project.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function importedAccountLevelresourceList(req: Request, res: Response): Promise<void> {
  const methodName = "importedAccountLevelresourceList";
  try {
    const { accountId } = req.params;

    const value = await validateRequest(req, importedAccountLevelResources, res, "GET");

    let parsedFilters: Record<string, any> = {};
    const userId = req.headers["x-user-id"] as string;

    if (!value) {
      return;
    }

    try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const pageNum: number = parseInt(value.page, 10) || 1;
    const limitNum: number = parseInt(value.limit, 10) || 25;

    const resource = await importServices.fetchAccountLevelImportedResources(
      accountId,
      pageNum,
      limitNum,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.documentRid
    );

    if (resource.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, resource.data);
      return;
    } else {
      errorLog(methodName, resource.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resource.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function exportImportedResourceList(req: Request, res: Response): Promise<void> {
  const methodName = "exportImportedResourceList";
  try {
    const { accountId } = req.params;
    const userId = req.headers["x-user-id"] as string;


    const value = await validateRequest(req, exportImportedAccountLevelResources, res, "GET");

    let parsedFilters: Record<string, any> = {};

    if (!value) {
      return;
    }

    try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const resourcesList = await importServices.exportAccountLevelImportedResources(
      accountId,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.documentRid,
      userId
    );

    if (resourcesList.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(resourcesList?.data?.resources,"Resources"));
      return;
    } else {
      errorLog(methodName, resourcesList.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourcesList.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function importedAccountLevelProjectTaskList(req: Request, res: Response): Promise<void> {
  const methodName = "importedAccountLevelProjectTaskList";
  try {
    const { accountId } = req.params;
    const value = await validateRequest(
      req,
      importedAccountLevelProjectTasks,
      res,
      "GET"
    );
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    // Before calling buildRawWhereClause
    if (typeof value.filters === "string") {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error("Invalid filters JSON:", value.filters);
        value.filters = {};
      }
    }
    const tasks = await importServices.fetchAccountLevelImportedProjectTasks(
      accountId,
      value.documentRid,
      value.filters,
      value.search,
      value.page,
      value.limit,
      value.sortBy,
      value.sortOrder
    );

    if (tasks.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, tasks.data);
      return;
    } else {
      errorLog(methodName, tasks.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        tasks.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function exportImportedProjectTaskList(req: Request, res: Response): Promise<void> {
  const methodName = "exportImportedProjectTaskList";
  try {
    const { accountId } = req.params;
    const value = await validateRequest(
      req,
      exportImportedAccountLevelProjectTasks,
      res,
      "GET"
    );
    if (!value) {
      return;
    }

    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    // Before calling buildRawWhereClause
    if (typeof value.filters === "string") {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error("Invalid filters JSON:", value.filters);
        value.filters = {};
      }
    }
    const tasks = await importServices.exportAccountLevelImportedProjectTasks(
      accountId,
      value.documentRid,
      userId,
      value.filters,
      value.search,
      value.sortBy,
      value.sortOrder
    );

    if (tasks.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(tasks?.data?.tasks,"Project Tasks"));
      return;
    } else {
      errorLog(methodName, tasks.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        tasks.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

export default {
    fetchAllImportList,
    importListByRid,
    exportAllImportedData,
    exportStagingFailureList,
    exportLoadFailureList,
    importedAccountLevelprojectList,
    importedAccountLevelresourceList,
    importedAccountLevelProjectTaskList,
    exportImportedProjectList,
    exportImportedResourceList,
    exportImportedProjectTaskList
}   
