import { Request, Response } from "express";
import {
  errorLog,
  generateExcelBase64,
  handleCustomResponse,
  handleErrorResponse,
  handleSuccessResponse,
  isValidTimezone,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import { HttpStatus } from "../utils/constants";
import Configurations from "../config/config";
import { createJurisdictionRDConfigSchema, exportJurisdictionConfigSchema, jurisdictionRDConfigSchema, jurisdictionRDConfigSchemaForNew, jurisdictionSchema, listJurisdictionConfigSchema, updateJurisdictionRDConfigSchema } from "../lib/joi/schemas/schema";
// Load services from configuration
const Services = Configurations.getInstance().getServices();
const jurisdictionService = Services.jurisdictionService;
const caseService = Services.caseService;
import moment from "moment";
import { jurisdictionRuleMapping } from "../utils/excelExportMapping";


/**
 * Controller to handle creation or update of jurisdiction configuration.
 *
 * Steps:
 * 1. Logs incoming request
 * 2. Validates request using Joi schema
 * 3. Ensures user ID is present in headers
 * 4. Calls jurisdiction service to create or update configuration
 * 5. Returns structured success/error responses
 */
async function addOrUpdateJurisdictionConfiguration(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Add/Update Jurisdiction Configuration";
  try {
    // Step 1: Log request
    logMessage(
      `[${methodName}] Request received: ${JSON.stringify(
        req.body
      )}, userId: ${req.headers["x-user-id"]}`
    );

    // Step 2: Validate request body
    const value = await validateRequest(req, jurisdictionSchema, res);
    if (!value) {
      errorLog(methodName, "Invalid request body");
      return;
    }

    // Step 3: Validate userId
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID missing in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    // Step 4: Call service to create/update record
    const result = await jurisdictionService.createOrUpdateJurisdiction(
      value,
      userId,
    );

    // Step 5: Handle service response
    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, result.data, result.message);
    } else {
      errorLog(methodName, result.message);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.message
      );
    }
  } catch (err) {
    // Step 6: Catch unexpected errors
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller to get jurisdiction configuration.
 *
 * Steps:
 * 1. Logs incoming request
 * 2. Validates required params (accountRid, caseRid)
 * 3. Calls service to fetch jurisdiction data
 * 4. Returns structured success/error responses
 */
async function getJurisdictionConfiguration(req: Request, res: Response): Promise<void> {
  const methodName = "Get Jurisdiction Configuration";
  try {
    // Step 1: Log request
    logMessage(
      `[${methodName}] Request received: params=${JSON.stringify(req.params)}, userId=${req.headers["x-user-id"]}`
    );

    // Step 2: Extract parameters
    const { accountRid, caseRid, level } = req.query;
    const userId = req.headers["x-user-id"] as string;

    // Validate required parameters
    if (!userId) {
      errorLog(methodName, "User ID missing in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    if (!accountRid) {
      errorLog(methodName, "Missing accountRid");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "AccountRid is required"
      );
      return;
    }

    if (!level) {
      errorLog(methodName, "Missing level");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "level is required"
      );
      return;
    }

    if (level === "case" && !caseRid) {
      errorLog(methodName, "Missing caseRid");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Case RID is required"
      );
      return;
    }

    const entity_rid = level === "case" ? caseRid : accountRid;

    // Step 3: Call service
    const result = await jurisdictionService.getJurisdictionConfiguration(accountRid as string, entity_rid as string);

    // Step 4: Handle service response
    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, result.data, result.message);
    } else {
      errorLog(methodName, result.message);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.message
      );
    }
  } catch (err) {
    // Step 5: Catch unexpected errors
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function getJurisdictionConfigDetailsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get jurisdiction config details";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, jurisdictionRDConfigSchema, res,"GET");
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    let jurisdictionConfigResponse =
        await jurisdictionService.getJurisdictionConfigDetailsById(
          value
        );

    if (jurisdictionConfigResponse.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, jurisdictionConfigResponse.data);
      return;
    } else {
      errorLog(methodName, jurisdictionConfigResponse.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        jurisdictionConfigResponse.errorMessage
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

async function getJurisdictionConfigDataForCreate(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get jurisdiction config details for create";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, jurisdictionRDConfigSchemaForNew, res,"GET");
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    let jurisdictionConfigResponse =
        await jurisdictionService.getJurisdictionConfigDetailsForNew(
          value
        );

    if (jurisdictionConfigResponse.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, jurisdictionConfigResponse.data);
      return;
    } else {
      errorLog(methodName, jurisdictionConfigResponse.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        jurisdictionConfigResponse.errorMessage
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

async function updateJurisdictionConfig(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Update jurisdiction config details";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, updateJurisdictionRDConfigSchema, res);
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    let jurisdictionConfigResponse =
        await jurisdictionService.updateJurisdictionConfig(
          value
        );

    if (jurisdictionConfigResponse.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, jurisdictionConfigResponse.data);
      return;
    } else {
      errorLog(methodName, jurisdictionConfigResponse.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        jurisdictionConfigResponse.errorMessage
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

async function createJurisdictionConfig(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Create jurisdiction config details";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, createJurisdictionRDConfigSchema, res);
    if(!value)
    {
      return;
    }
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    value.created_by = userId;
    let jurisdictionConfigResponse =
        await jurisdictionService.createJurisdictionConfig(
          value
        );

    if (jurisdictionConfigResponse.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, jurisdictionConfigResponse.data);
      return;
    } else {
      errorLog(methodName, jurisdictionConfigResponse.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        jurisdictionConfigResponse.errorMessage
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

async function listJurisdictionsConfigurations(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get jurisdiction config details";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listJurisdictionConfigSchema, res,'GET');
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
     let parsedFilters: Record<string, any> = {};
    
        try {
          parsedFilters = JSON.parse(value.filters);
        } catch (error) {
          errorLog(
            methodName,
            "Invalid filters format. Must be a valid JSON object."
          );
        }
    let jurisdictionConfigResponse =
        await jurisdictionService.listJurisdictionConfig(
          value,
          "list",
          parsedFilters

        );

    if (jurisdictionConfigResponse.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, jurisdictionConfigResponse.data);
      return;
    } else {
      errorLog(methodName, jurisdictionConfigResponse.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        jurisdictionConfigResponse.errorMessage
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

async function exportJurisdictionsConfigurations(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get jurisdiction config details";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, exportJurisdictionConfigSchema, res,'GET');
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
     let parsedFilters: Record<string, any> = {};
    
        try {
          parsedFilters = JSON.parse(value.filters);
        } catch (error) {
          errorLog(
            methodName,
            "Invalid filters format. Must be a valid JSON object."
          );
        }
      let result =
        await jurisdictionService.listJurisdictionConfig(
          value,
          "download",
          parsedFilters

        );
       const fields = await caseService.getAllowedExportFields(
             userId,
             "manage_geo_based_rule_view_edit"
           );
           const allowedFieldSet = new Set<string>();
           for (const field of fields) {
             if (field.read) {
               allowedFieldSet.add(field.field_name);
             }
           }
            const isValidTZ = value.timezone && isValidTimezone(value.timezone);
            const formatDate = (date?: Date) => {
                 if (!date) return null;
                 
                 return moment(date)
                   .tz(isValidTZ ? value.timezone : "UTC")
                   .format("YYYY-MMM-DD, hh:mm:ss A");
               };
          // Helper for just date
            const formatDateOnly = (date?: Date) => {
              if (!date) return null;
              return moment(date).format("YYYY-MMM-DD");
            };
    if (result.statusCode === HttpStatus.SUCCESS) {
            const finalStructuredData =
              result?.data?.configs.length < 1
                ? []
                : result?.data?.configs.map((d: any) => {
                    let resultMap: { [key: string]: any } = {
                      r_number: d.r_number,
                      status_name: d.status_name,
                      config_name: d.config_name,
                      effective_start_date: formatDateOnly(d?.effective_start_date),
                      effective_end_date: formatDateOnly(d?.effective_end_date),
                      country_name: d.country_name,
                      state_name: d.state_name,
                      is_federal: d.is_federal ? "Yes" : "No",
                      created_by: d.created_user_name,
                      created_datetime: formatDate(d?.created_datetime),
                      modified_by: d.modified_user_name,
                      modified_datetime:
                        d?.modified_datetime == null
                          ? ""
                          : formatDate(d.modified_datetime) 
                    };
      
                    // Build exportRecord using allowed fields and resultMap
                    const exportRecord: Record<string, any> = {};
                    jurisdictionRuleMapping.forEach((mapping) => {
                      if (allowedFieldSet.has(mapping.permissionField)) {
                        exportRecord[mapping.exportField] =
                          resultMap[mapping.dataField];
                      }
                    });
      
                    return exportRecord;
                  });
      
            const generateBase64Response = await generateExcelBase64(
              finalStructuredData,
              "EmailTemplates"
            );
            handleSuccessResponse(res, generateBase64Response);
          }  else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
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



// Export controller
export default {
  addOrUpdateJurisdictionConfiguration,
  getJurisdictionConfiguration,
  getJurisdictionConfigDetailsById,
  updateJurisdictionConfig,
  createJurisdictionConfig,
  getJurisdictionConfigDataForCreate,
  listJurisdictionsConfigurations,
  exportJurisdictionsConfigurations
};
