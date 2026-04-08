import { Op, QueryTypes, Sequelize } from "sequelize";
import { CaseService } from "./caseService";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import { ALPHANUMERIC_CONDITIONS, caseFilingTypes, caseStatuses, countryCodes, DOSSIER_NAME, entityTypes, ENV_PREFIX, eventNames, eventTypes, HttpStatus, rawQueries, SignOffTypes, STATUS_MESSAGE, techSummaryFieldMappings } from "../../utils/constants";
import { CaseCloseType, CaseClosureRemarks, CaseCountryComputedType, CaseData, CaseStateComputedType, CaseSubmissionType, ComputedValueRequest, CountryType, DossierFormResponse, ParentAccountType, ProjectFiscalIds, RdCreditsState, RegionDetails, RegionIds, RevokeSignoffRequest, StateType } from "../../utils/types";
import { fetchDossierForm, getCaseSummaryData, getValidRegionIdsFromCases } from "../../utils/rawQueries";
import { errorLog, generateExcelBase64, generateSasUrl, isValidTimezone, logMessage, uploadMultipleFilesToAzureBlob, uploadToAzureBlob } from "../../utils/helpers";
import { fetchCaseClosingRemarks, fetchRdFormUrlForCountry, fetchRdFormUrlForState, fetchStateCalcDataForDossier, fetchStateCodesByRids, fetchCountryCalcDataForDossier } from "../../utils/dossierRawquery";
import { createWorkbook, addStateSheetToWorkbook, uploadCombinedWorkbook, addFederalSheetToWorkbook, addStateSummarySheetToWorkbook, STATE_SHEET_ORDER } from "../rdStateProcessors/stateRdCreditExcelGenerators";
import { ENV, kafka } from "../../config/kafka";
import { Kafka, Producer } from "kafkajs";
import RDCreditSchemaService from "../rdComputation/schemaService";
import { ProjectResourceService } from "../projectResource/projectResourceService";
import moment from "moment";
import {buildRawWhereClause, fetchProjectResourceById, getAttachmentDisplayNames, getProjectResourcesByProjectIds, getProjectsByAccountId, getProjectTasksByProjectIds, getResourceCostsByResourceIds, getResourcesByAccountId, getResourceSkillsByResourceIds, getSortParameters, mapAttachmentToCommonFormat, processDateFilter, processNumberFilter, processProjectCountFilter, processTextFilter} from '../../utils/attachmentsHelper'
import { Attachment, AttachmentCreationAttributes } from "../../models/attachments";
import { createZipFile, uploadZipBufferToAzureBlob } from "../../utils/dossierPackage";
import { DossierForm } from "../../models/dossierForm";
import { AiTechnicalSummary } from "../../models/aiTechnicalSummary";
import { calculateCostForCaseSubmissionCurrentYear, calculateStateCostForCaseSubmissionCurrentYear } from "../../utils/rdFinancialWorkingQueries";
import { CaseHistorySubmissionCreationAttributes } from "../../models/caseHistorySubmissionModel";
import Decimal from "decimal.js";
import { generatePdfBuffer } from "../../utils/generatePdf";
import { CaseTechnicalSummary } from "../../models/caseTechnicalSummary";
import { truncate } from "node:fs";

export class ChildCaseService extends CaseService {
    private producer! : Producer;
    private rdCreditSchemaService = new RDCreditSchemaService()
    private projectResourceService : ProjectResourceService;

    constructor(logger : Logger) {
        super(logger)
        this.projectResourceService = new ProjectResourceService(this.logger)
    }

    protected async mainDbConfiguration() {
        const mainDb = await super.getMainDb();
        return mainDb;
    }
    protected async orgDbConfiguration() {
        const orgDb = await super.getOrgDb();
        return orgDb;
    }

    private async getProducer () {
        if(!this.producer) {
            const kafka = new Kafka({
                clientId : ENV.DOSSIER_CLIENT_ID,
                brokers : ENV.KAFKA_BROKER || "localhost:9092"
            })
            this.producer = kafka.producer();
            await this.producer.connect();
        }
        return this.producer;
    }

    async signOffFinancialWorking (data : any, file : any) {
      const mainDb = await this.mainDbConfiguration();
      const orgDb = await this.orgDbConfiguration();
      const transaction = await orgDb.transaction();
      const mainDbTransaction = await mainDb.transaction()
      try {
        const parentAccount : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
        if(parentAccount[0].length > 0) {
            let schemaName = rawQueries.fetchSchemaName(parentAccount[0][0].r_number);
            const getProjectIdsAssignedForCases = await orgDb.query<ProjectFiscalIds>(rawQueries.getProjectsForCases(data.case_rid, data.account_rid, schemaName), {type : QueryTypes.SELECT});
            let caseProjectIds : string[] = [];
            if(getProjectIdsAssignedForCases.length > 0) {
                getProjectIdsAssignedForCases.forEach((fiscalIds) => {
                    caseProjectIds.push(fiscalIds.project_fiscal_rid)
                })
            } else {
                return {
                    statusCode : HttpStatus.BAD_REQUEST,
                    statusMessage : STATUS_MESSAGE.noProjectsAssignedToCase
                }
            }
            const [caseDetails] : any = await orgDb.query(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : data.case_rid}, type : QueryTypes.SELECT})
            if(file !== undefined) {
                const fileUploadedResult = await uploadToAzureBlob(file, data.account_rid, '', parentAccount[0][0].r_number, 'signoff')
                await orgDb.query(rawQueries.insertDataIntoAttachments(schemaName, data.case_rid, data.userId, data.account_rid, fileUploadedResult.url, fileUploadedResult.name, caseDetails?.fiscal_year, fileUploadedResult.extension, fileUploadedResult.size, data.comments), {transaction : transaction})
            }
            const caseResult : any = await orgDb.query(rawQueries.updateSignoffInCase(schemaName, data.case_rid, data.sign_off), {transaction : transaction});
            if(caseResult[1].rowCount > 0) {
                const findFinancialWorkingId : any = await mainDb.query(rawQueries.getFinancialWorkingId(SignOffTypes.financialWorking), {transaction : mainDbTransaction});
                await orgDb.query(rawQueries.insertSignoffDetails(data.userId, findFinancialWorkingId[0][0].rid, data.case_rid, data.account_rid, schemaName, data.comments), {transaction : transaction})
                await orgDb.query(rawQueries.updateClaimQualifiedInCaseProject(data.case_rid, caseProjectIds, data.account_rid, schemaName), {transaction : transaction});
                await orgDb.query(rawQueries.updateClaimQualifiedInProjectFiscal(caseProjectIds, data.account_rid, schemaName), {transaction : transaction});
                await mainDb.query(rawQueries.updateClaimQualifiedInProjectFiscalSummary(caseProjectIds, data.account_rid), {transaction : mainDbTransaction})
                let mapIdsForCaseProjectregions : any[] = []
                let mappedValuesForCasesRegions = new Map(getProjectIdsAssignedForCases.map((d : any) => [d.project_fiscal_rid, {case_project_rid : d.rid, project_fiscal_rid : d.project_fiscal_rid, region_rid : d.region_rid}]));
                caseProjectIds.forEach((d) => {
                    mapIdsForCaseProjectregions.push(mappedValuesForCasesRegions.get(d))
                })
                let query = rawQueries.updateClaimQualifiedInCaseProjectFiscalRegion(mapIdsForCaseProjectregions, data.account_rid, schemaName)
                if(query) {
                    await orgDb.query(query, {transaction : transaction})
                }
                const userEventInfo:any = await this.helperMethod.fetchUserAndEventInfo({
                userId: data.userId!,
                eventType: eventTypes.UI_HANDLER
              });
                                
                await this.helperMethod.createAccountTimelineEntry(parentAccount[0][0].r_number!, {
                created_by: data.userId!,
                account_rid: data.account_rid,
                entity_rid: data.case_rid!,
                entity_name: entityTypes.FINANCIAL_WORKING,
                created_by_name: userEventInfo.full_name,
                event_type_rid: userEventInfo.event_type_rid,
                event_name: eventNames.SIGNOFF,
                descriptions:caseDetails.case_name,
                case_rid: data.case_rid,
              },["case"]);
                await transaction.commit()
                await mainDbTransaction.commit()
                return {
                    statusCode : HttpStatus.SUCCESS,
                    statusMessage : STATUS_MESSAGE.financialWorkingSignedOff
                }
            } else {
              await transaction.rollback()
              await mainDbTransaction.rollback()
                return {
                  statusCode : HttpStatus.FAILED,
                  statusMessage : STATUS_MESSAGE.financialWorkingSignedOffFailed
              }
            }
        } else {
          return {
              statusCode : HttpStatus.FAILED,
              statusMessage : STATUS_MESSAGE.accountNoFound
          }
        }
      } catch (err : any) {
        logMessage(
          `Error approving Financial Workings -> ${err?.name}: ${
            err?.errors?.map((e: any) =>
              `${e.path}: ${e.message} (value: ${e.value})`
            ).join(", ") || err?.message
          }\nStack: ${err?.stack}`
        );
        await transaction.rollback()
        await mainDbTransaction.rollback()
        return {
            statusCode : HttpStatus.FAILED,
            statusMessage : STATUS_MESSAGE.financialWorkingSignedOffFailed
        }
      }
    }
    async stateWiseRegionList (data : any) {
        const mainDb = await this.getMainDb();
        const orgDb = await this.getOrgDb();

        const parenRNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
        let schemaName = rawQueries.fetchSchemaName(parenRNumber[0][0].r_number);

        const getValidRegionId = await orgDb.query<RegionIds>(getValidRegionIdsFromCases(schemaName, data.account_rid, data.case_rid), {type : QueryTypes.SELECT});
        if(getValidRegionId.length > 0) {
            const allRegionIds = [...new Set(getValidRegionId.map((d : any) => d.rid))];
            const getRegionDetails = await mainDb.query<RegionDetails>(rawQueries.fetchStates(allRegionIds), {type : QueryTypes.SELECT});
            const mapStates = new Map(getRegionDetails.map((d : any) => [d.rid, d.state_name]));
            const result = getValidRegionId.map((d : any) => {
                return {
                    ...d,
                    state_name : mapStates.get(d.rid) || null
                }
            });
            result.sort((a : any, b : any) => {
                const nameA = (a.state_name || "").toString();
                const nameB = (b.state_name || "").toString();
                return nameA.localeCompare(nameB);
            });
            return result;
        } else {
            return []
        }
    }

    async getClosedCasesList(data: { account_rid: string }): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { cases: any };
      }> {
        const orgDb = await this.getOrgDb();
        const mainDb = await this.getMainDb();
        try {
         const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          data.account_rid
        );
        if (!accountNumber) {
                throw new Error("Invalid account ID");
            }
        const schemaName = rawQueries.fetchSchemaName(accountNumber);
        const checkTableQuery = rawQueries.checkCaseTableExists(schemaName);
        const [tableExists] = await orgDb.query(checkTableQuery, {
                 type: "SELECT",
               });
        if ((tableExists as any).exists === false) {
          return {
            statusCode: HttpStatus.SUCCESS,
              message: STATUS_MESSAGE.caseDetailsFetchedSuccess,
              data: { cases: [] }
          };
        }
          const [caseStatus]: any = await mainDb.query(rawQueries.fetchCaseStatusByType(caseStatuses.CLOSED));
          if (caseStatus.length === 0) {
            return {
                statusCode: HttpStatus.FAILED,
                message: STATUS_MESSAGE.dataNotAvailable,
                errorMessage: "Closed case status not found",
            };
          } 
          let [accountInfo]: any[] = await mainDb.query(
                  rawQueries.fetchAccountAndCountryDetails(data.account_rid),
                  { type: QueryTypes.SELECT }
                );
           const [caseFilingType]: any = await mainDb.query(rawQueries.fetchFilingTypeByName(caseFilingTypes.regular));
           if (caseFilingType.length === 0) {
            return {
                statusCode: HttpStatus.FAILED,
                message: STATUS_MESSAGE.dataNotAvailable,
                errorMessage: "Regular filing type not found",
            };
          } 
        
          const { Case } = await this.caseModelService.getModels(accountNumber);
            const closedCases = await Case.findAll({
                attributes: ['rid', 'case_name', 'fiscal_year'],
                where: {
                    account_rid: data.account_rid,
                    status_rid: caseStatus[0].rid,
                    filing_type_rid: caseFilingType[0].rid
                }
            });
            return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.caseDetailsFetchedSuccess,
            data: { cases: closedCases.map(d => ({
                rid: d.rid,
                fiscal_year: d.fiscal_year,
                case_full_name: accountInfo.account_name + '-' + accountInfo.country_code + '-' + d.fiscal_year + '-' + d.case_name
            })) },
          };
        } catch (error) {
          return {
            statusCode: HttpStatus.FAILED,
            message: STATUS_MESSAGE.dataNotAvailable,
            errorMessage: (error as Error).message,
          };
        }
}
async getCaseClosureRemarks (data : any) {
    const orgDb = await this.getOrgDb();
    const mainDb = await this.getMainDb();

    const getParentAccountNumber : any= await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    const schemaName = rawQueries.fetchSchemaName(getParentAccountNumber[0][0].r_number);
    const [caseDetails] : any = await orgDb.query(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : data.case_rid}, type : QueryTypes.SELECT})
    let isSortingRestricted : boolean;
    if(data.sort === 'signoff_type_name' || data.sort === 'created_by_name') {
        isSortingRestricted = true
    } else {
        isSortingRestricted = false
    }
    const result = await orgDb.query<CaseClosureRemarks>(fetchCaseClosingRemarks(schemaName, data.case_rid, data.sort, data.sort_by, isSortingRestricted), {type : QueryTypes.SELECT});
    if(result.length > 0) {
        const getUserIds = [...new Set(result.flatMap((d : any) => d.signoff_details.map((s : any) => s.created_by)))]
        const getSignoffTypeIds = [... new Set(result.flatMap((d : any) => d.signoff_details.map((s : any) => s.signoff_type_rid)))];
        const findUserDetails = await mainDb.query(rawQueries.getOwnerDetails(getUserIds));
        const findSignOffTypes = await mainDb.query(rawQueries.findSignOffTypes(getSignoffTypeIds));
        const sortValue : string = data.sort
        const mapUsersWithName = new Map(findUserDetails[0].map((d : any) => [d.rid, d.name]));
        const mapSignOffTypesWithName = new Map(findSignOffTypes[0].map((d : any) => [d.rid, d.signoff_type_name]));
        const finalData = result.map((d : CaseClosureRemarks) => {
            return {
                case_rid : d.case_rid,
                case_name : caseDetails.case_name,
                closing_remarks : d.signoff_details.map((s : any) => {
                    return {
                        created_by : s.created_by,
                        created_by_name : mapUsersWithName.get(s.created_by) || null,
                        signoff_type_rid : s.signoff_type_rid,
                        signoff_type_name : mapSignOffTypesWithName.get(s.signoff_type_rid) || null,
                        signoff_at : s.created_datetime
                    }
                })
            }
        })
        if(isSortingRestricted) {
            if(data.sort_by.toLowerCase() === 'asc' && data.sort === 'created_by_name') finalData[0]?.closing_remarks.sort((a, b) => a.created_by_name.localeCompare(b.created_by_name))
            else if (data.sort_by.toLowerCase() === 'desc' && data.sort === 'created_by_name') finalData[0]?.closing_remarks.sort((a, b) => b.created_by_name.localeCompare(a.created_by_name))
            else if (data.sort_by.toLowerCase() === 'asc' && data.sort === 'signoff_type_name') finalData[0]?.closing_remarks.sort((a, b) => a.signoff_type_name.localeCompare(b.signoff_type_name))
            else if (data.sort_by.toLowerCase() === 'desc' && data.sort === 'signoff_type_name') finalData[0]?.closing_remarks.sort((a, b) => b.signoff_type_name.localeCompare(a.signoff_type_name))
        }
        return finalData[0];
    } else {
        return {
            case_rid : caseDetails.rid,
            case_name : caseDetails.case_name,
            closing_remarks : []
        };
    }
}
async exportCaseClosingRemarks (data : any) {
    const result = await this.getCaseClosureRemarks(data);
    if(result?.closing_remarks.length! > 0) {
        const finalData = result?.closing_remarks.map((d : any) => {
            console.log("Signoff AT : ", d.signoff_at)
            return {
                "Approved Type" : d.signoff_type_name,
                "Approved By" : d.created_by_name,
                "Approved On": d.signoff_at ? data.timezone && isValidTimezone(data.timezone) ? moment(d.signoff_at).tz(data.timezone).format("YYYY-MMM-DD, hh:mm:ss A") : moment(d.signoff_at).utcOffset("+05:30").format("YYYY-MMM-DD, hh:mm:ss A") : "-",
            }
        });
        const generateCsv = await generateExcelBase64(finalData, "Approval Status");
        return generateCsv;
    }
}
async initiateCreateDossierForm (data : any) {
    const mainDb = await this.getMainDb();
    const fetchParentNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    const producer = await this.getProducer();
    const accountRid = data.account_rid;
    const caseRid = data.case_rid;
    const userId = data.userId;
    const accountNumber = fetchParentNumber[0][0].r_number;
    const timezones = data.timezone;
    const processingRid = await this.rdCreditSchemaService.markAsInitiated(fetchParentNumber[0][0].r_number, data.case_rid, 'dossier-form');
    const result = await producer.send({
        topic : ENV.DOSSIER_KAFKA_TOPIC,
        messages : [{key : processingRid, value : JSON.stringify({accountRid, caseRid, accountNumber, userId, timezones,accessToken : data.accessToken, fetchParentNumber})}],
        
    })
    console.log(`Message : ${JSON.stringify(result)}`)
    console.log(`Message published to ID : ${processingRid}`);
    return STATUS_MESSAGE.dossierCreationInitiatedSuccess;
}
async processDossierForm (accountNumber : string, caseRid : string, accountRid : string, userId : string, key : string, timez : string,fetchParentNumber : any) {
    const orgDb = await this.getOrgDb()
    const mainDB = await this.getMainDb()
    let schemaName = rawQueries.fetchSchemaName(accountNumber)
    const {DossierFormModel} = await this.getModels(schemaName)
    const [caseDetails] = await orgDb.query<CaseData>(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : caseRid}, type : QueryTypes.SELECT})
    let caseProjectsPayload : any = {}
    caseProjectsPayload.account_rid = accountRid;
    caseProjectsPayload.case_rid = caseRid;
    caseProjectsPayload.sort = "project_code";
    caseProjectsPayload.sort_by = "ASC"
    caseProjectsPayload.filter = {};
    caseProjectsPayload.search = "";
    caseProjectsPayload.fiscal_year = caseDetails!.fiscal_year;
    caseProjectsPayload.userId = userId,
    caseProjectsPayload.type = "qualifiedProjects"
    caseProjectsPayload.timezone = timez
    const getProjectQualifiedData = await this.exportAssignedProjects(caseProjectsPayload);
    const generateQualifiedProjectsCSV = await generateExcelBase64(getProjectQualifiedData.data,"Qualified-Projects")
    const getProjectResourceSummary = await this.projectResourceService.exportProjectResources(accountRid, caseRid,caseDetails!.fiscal_year, {}, "resource_code", "ASC", userId, "", "qualifiedProjects");
    const generateResourceSummaryCSV = await generateExcelBase64(getProjectResourceSummary.data?.projectResources,"Resource-Summary")
    let caseClosingPayload : any = {}
    caseClosingPayload.case_rid = caseRid;
    caseClosingPayload.account_rid = accountRid;
    caseClosingPayload.sort = 'signoff_at';
    caseClosingPayload.sort_by = 'ASC';
    caseClosingPayload.timezone = timez
    const closingRemarksData = await this.exportCaseClosingRemarks(caseClosingPayload);
    const fetchCountryUrl : any = await orgDb.query(fetchRdFormUrlForCountry(schemaName, caseRid));
    const fetchStateUrl : any = await orgDb.query(fetchRdFormUrlForState(schemaName, caseRid));
    let countryUrlData = fetchCountryUrl[0].filter((c : any) => c.country_url !== null);
    let stateUrlData = fetchStateUrl[0].filter((d : any) => d.state_url !== null);
    let stateUrls : string[];
    let countryUrls : string;
    if(countryUrlData.length > 0) {
      countryUrlData = countryUrlData.map((c : any) => {
      return {
        url : c.country_url
      }
    })
    countryUrls = countryUrlData[0].url
    } else {
      countryUrls = ''
    }
    if(stateUrlData.length > 0) {
      stateUrlData = stateUrlData.map((s : any) => {
      return {
        
        url : s.state_url
      }
    })
    stateUrls = stateUrlData.map((d : any) => d.url)
    } else {
      stateUrls = []
    }
    let exportedAttachments;
    let exportedUrls : string[]
    const exportProjectDocuments = await this.exportAttachments(userId, 'project', caseDetails?.rid, accountRid, '', {}, 'project_code', 'DESC', 0, {}, '', DOSSIER_NAME);
    if(exportProjectDocuments.data.length > 0) {
      exportedAttachments = exportProjectDocuments.data.map((d) => {
        return {
          url : d.browse_file
        }
      })
    }
    exportedUrls = exportedAttachments?.map((d : any) => d.url) || []

    const techSummary = await this.listTechnicalSummary(accountNumber,'',0,0,{},'r_number','ASC',"download",caseRid,accountRid,"qualifedProjects");
    const finalStructuredData = techSummary.technicalSummary.length < 1 ? [] : await generatePdfBuffer(techSummary.technicalSummary)

    // Generate combined financial calculations Excel
    // Sheet order matches reference: Fed R&D-2025 → State-Credit Summary → state sheets
    let stateFinancialCalcUrl: string | null = null;
    try {
      const combinedWorkbook = createWorkbook();
      let sheetsAdded = 0;

      // 1. Federal sheet (first)
      const federalCalcRows: any[] = (await orgDb.query(fetchCountryCalcDataForDossier(schemaName, caseRid)))[0];
      if (federalCalcRows.length > 0) {
        const fedRow = federalCalcRows[0];
        const inputParams    = typeof fedRow.input_params    === "string" ? JSON.parse(fedRow.input_params)    : (fedRow.input_params    ?? {});
        const computedFields = typeof fedRow.computed_fields === "string" ? JSON.parse(fedRow.computed_fields) : (fedRow.computed_fields ?? {});
        addFederalSheetToWorkbook(combinedWorkbook, inputParams, computedFields);
        sheetsAdded++;
      }

      // 2. State Credit Summary sheet (second)
      const stateSummary = await this.rdCreditSchemaService.getStateSummaryResults(accountNumber, caseRid, schemaName);
      if (stateSummary && Object.keys(stateSummary.federal ?? stateSummary).length > 0) {
        addStateSummarySheetToWorkbook(combinedWorkbook, stateSummary);
        sheetsAdded++;
      }

      // 3. State sheets in reference order
      const stateCalcRows: any[] = (await orgDb.query(fetchStateCalcDataForDossier(schemaName, caseRid)))[0];
      if (stateCalcRows.length > 0) {
        const stateRids = stateCalcRows.map((r: any) => r.state_rid);
        const stateCodeRows: any[] = (await mainDB.query(fetchStateCodesByRids(stateRids)))[0];
        const stateCodeMap: Record<string, string> = {};
        stateCodeRows.forEach((r: any) => { stateCodeMap[r.rid] = r.state_code; });

        // Fetch jurisdiction config — only states listed there are eligible
        const [jurisdictionConfig]: any = await orgDb.query(
          rawQueries.fetchConfiguration(schemaName, caseRid),
          { raw: true }
        );
        const jurisdictionStateRids: string[] =
          Array.isArray(jurisdictionConfig) && jurisdictionConfig.length > 0
            ? (jurisdictionConfig[0].states ?? [])
            : [];

        // Fetch project resource counts — only states with resources > 0 are eligible
        const projectData: any[] = await orgDb.query(
          rawQueries.fetchProjectCountsAndQreByState(schemaName),
          { replacements: { case_rid: caseRid, stateRids }, type: QueryTypes.SELECT }
        );
        const resourcesByStateRid = new Map<string, number>(
          projectData.map((d: any) => [d.state_rid, Number(d.total_resources || 0)])
        );

        // Build a lookup by state code — skip states not in jurisdiction or with no resources
        const rowByStateCode: Record<string, any> = {};
        stateCalcRows.forEach((row: any) => {
          const code = stateCodeMap[row.state_rid];
          const inJurisdiction = jurisdictionStateRids.includes(row.state_rid);
          const hasResources = (resourcesByStateRid.get(row.state_rid) ?? 0) > 0;
          if (code && inJurisdiction && hasResources) {
            rowByStateCode[code.toUpperCase()] = row;
          }
        });

        // Add in reference order first, then any remaining states not in the reference list
        const orderedCodes = [
          ...STATE_SHEET_ORDER.filter(c => rowByStateCode[c]),
          ...Object.keys(rowByStateCode).filter(c => !STATE_SHEET_ORDER.includes(c)),
        ];

        for (const stateCode of orderedCodes) {
          const row = rowByStateCode[stateCode];
          const computeResult = { inputFields: row.input_params, computedFields: row.computed_fields };
          const added = await addStateSheetToWorkbook(combinedWorkbook, stateCode, computeResult);
          if (added) sheetsAdded++;
        }
      }

      if (sheetsAdded > 0) {
        stateFinancialCalcUrl = await uploadCombinedWorkbook(combinedWorkbook, caseRid, caseDetails!.fiscal_year, accountRid, accountNumber);
      }
    } catch (err) {
      logMessage(`Error generating financial calculations Excel for dossier: ${err}`);
    }

    const files: any[] = [
    {
      name: "Qualified Projects",
      project_code : null,
      buffer: generateQualifiedProjectsCSV,
      extension: ".xlsx"
    },
    {
      name: "Resource Summary",
      project_code : null,
      buffer: generateResourceSummaryCSV,
      extension: ".xlsx"
    },
    {
      name: "Project Documents",
      urls : exportedUrls
    },
    {
      name: "Approval Status",
      project_code : null,
      buffer: closingRemarksData,
      extension: ".xlsx"
    },
    {
      name: "RD Form Federal",
      url: countryUrls
    },
    {
      name: "RD Form State",
      urls: stateUrls
    },
    {
      name: "Financial Workings",
      url: stateFinancialCalcUrl ?? ''
    }
  ];
  if (Array.isArray(finalStructuredData)) {
    if(finalStructuredData.length > 0) {
        finalStructuredData.forEach((pdf, index) => {
        files.push({
          name: `Technical Summary`,
          project_code : pdf.projectCode,
          buffer: pdf.base64,
          extension: ".pdf"
        });
      });
    }
  }
  const jsonToString = JSON.stringify(files)
  const findData = await DossierFormModel.findOne({
    where : {
      case_rid : caseRid,
      account_rid : accountRid
    }, raw : true,
    order : [['created_datetime', 'DESC']]
  })
  let dossierVersion;
  let now = new Date();
  if(findData) {
    dossierVersion = Number(findData.dossier_version ?? 0) + 1
    await DossierFormModel.update({
      is_initiated : true
    }, {
      where : {
        rid : findData.rid
      }
    })
  } else {
    dossierVersion = 1
  }
  await DossierFormModel.create({
    account_rid : accountRid,
    case_rid : caseRid,
    browse_url : '',
    created_by : userId,
    document_name : `${fetchParentNumber[0][0].child_account_name?.replace(" ", "") ?? fetchParentNumber[0][0].account_name?.replace(" ", "")}-FY${caseDetails!.fiscal_year}-V${dossierVersion}-${now.toISOString().split('T')[0]}`,
    extension : '',
    size : '',
    created_datetime : now,
    dossier_metadata : jsonToString,
    dossier_version : dossierVersion,
    is_initiated : true
  });
  await this.cloneTechnicalSummaryForDossierForm(accountNumber, caseRid, accountRid, userId, schemaName);
}

private async cloneTechnicalSummaryForDossierForm(accountNumber: string, caseRid: string, accountRid: string, userId: string, schemaName: string) {
  if (caseRid !== undefined && caseRid !== '') {
  const orgDb = await this.getOrgDb();
  const {  CaseTechnicalSummaryModel } = await this.getModels(schemaName);

  // First, delete any existing technical summaries for this case
  await CaseTechnicalSummaryModel.destroy({
    where: {
      case_rid: caseRid,
      account_rid: accountRid
    }
  });

  // Get qualified project IDs for the case
  const projectQuery = `
    SELECT DISTINCT cp.project_fiscal_rid
    FROM ${schemaName}.case_projects cp
    INNER JOIN ${schemaName}.project_fiscal pf ON pf.rid = cp.project_fiscal_rid
    WHERE cp.case_rid = $1
      AND cp.account_rid = $2
  `;
  
  const projectIds: any = await orgDb.query(projectQuery, {
    bind: [caseRid, accountRid],
    type: QueryTypes.SELECT
  });

  if (projectIds.length === 0) {
    // No qualified projects found
    return STATUS_MESSAGE.dossierCreationInitiatedSuccess;
  }

  const projectFiscalRidList = projectIds.map((d: any) => d.project_fiscal_rid);

  // Get the max version records for these projects from AiTechnicalSummary
  const technicalQuery = `
    SELECT DISTINCT ON (ats.project_fiscal_rid) ats.*
    FROM ${schemaName}.ai_technical_summary ats
    WHERE ats.account_rid = $1
      AND ats.project_fiscal_rid = ANY($2::text[])
    ORDER BY ats.project_fiscal_rid, ats.version DESC
  `;

  const technicalSummaryData = await orgDb.query(technicalQuery, {
    bind: [accountRid, projectFiscalRidList],
    type: QueryTypes.SELECT
  });
  console.log("Technical Summary Data : ", technicalSummaryData)

  if (technicalSummaryData.length > 0) {
    // Minimal mapping to reduce processing time
    const clonedTechnicalSummaryData = technicalSummaryData.map((d: any) => ({
      account_rid: d.account_rid,
      r_number: d.r_number,
      project_rid: d.project_rid,
      case_rid: caseRid,
      project_fiscal_rid: d.project_fiscal_rid,
      fiscal_year: d.fiscal_year,
      version: d.version,
      title: d.title,
      content: d.content,
      created_by: d.created_by,
      created_datetime: d.created_datetime,
      modified_by: d.modified_by,
      modified_datetime: d.modified_datetime
    }));

    // Bulk insert (already optimized)
    await CaseTechnicalSummaryModel.bulkCreate(clonedTechnicalSummaryData, { validate: false }); // Skip validation for speed if data is trusted
  }
}
}
  async exportAttachments(
    userId: string,
    attachmentLevel?: string,
    entityId?: string,
    accountRid?: string,
    search?: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC",
    fiscalYear: number = 0,
    graphqlData?: any,
    timezone : string = ``,
    type? : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data:  any[]
  }> {
     if (!accountRid) throw new Error("Account RID is required");
      const orgDbSequelize = await initOrgSequelize();
      if (!orgDbSequelize)
        throw new Error("Failed to initialize database connection");
      const mainDbSequelize = await initMainDbSequelize();
      if (!mainDbSequelize)
        throw new Error("Failed to initialize database connection");
      const accountData : any = await mainDbSequelize.query(await rawQueries.fetchParentAccount(accountRid, mainDbSequelize));
      let schemaNumber = accountData[0][0].r_number;
      
      const schemaName = rawQueries.fetchSchemaName(schemaNumber);
      const AttachmentModel = Attachment.initialize(orgDbSequelize, schemaName);

      let allAttachments: any[] = [];

      // Handle attached_to and uploaded_by filters separately
      let attachedToFilter;
      let uploadedByFilter;
      let projectCodeFilter;
      let projectNameFilter;
      if (filters.attached_to) {
        attachedToFilter = filters.attached_to;
        delete filters.attached_to;
      }
      if (filters.uploaded_by) {
        uploadedByFilter = filters.uploaded_by;
        delete filters.uploaded_by;
      }
      if (filters.project_code) {
        projectCodeFilter = filters.project_code;
        delete filters.project_code;
      }
      if (filters.project_name) {
        projectNameFilter = filters.project_name;
        delete filters.project_name;
      }

      const { whereClause } = buildRawWhereClause(filters, search);

      if (fiscalYear !== 0) {
        if (!whereClause[Op.and]) {
          whereClause[Op.and] = [];
        }
        whereClause[Op.and].push({ fiscal_year: fiscalYear });
      }

    const fetchAttachments = async (model: any, level: string, attachToIds: string[]) => {
      if (attachToIds.length === 0) return [];
      let where;
      if(graphqlData?.document_rid) {
       logMessage(`Doc Id : ${graphqlData.document_rid}`);
        where = {
          rid : graphqlData.document_rid,
          attachment_level : level,
          attach_to : { [Op.in]: attachToIds }
        };
      
        let arrayData = []
        arrayData.push(await model.findOne({ where }))
        return arrayData
      } else {
        where = {
          [Op.and]: [
            { attachment_level: level },
            { attach_to: { [Op.in]: attachToIds } },
            ...(whereClause[Op.and] || [])
          ]
        };
        return model.findAll({ where });
      }
    };

      // 🔷 Optimized resource cost and skill attachments fetch for multiple resources
      const fetchResourceCostSkillAttachmentsBulk = async (
        model: any,
        resourceIds: string[]
      ) => {
        let resourceCostSkillAttachments: any[] = [];
        if (resourceIds.length === 0) return resourceCostSkillAttachments;

        // 🔹 Fetch all resource_costs in one call
        const resourceCosts =
          await getResourceCostsByResourceIds(
            schemaNumber,
            resourceIds
          );
        const allResourceCostIds = resourceCosts.map((rc) => rc.rid);
        if (allResourceCostIds.length > 0) {
          const resourceCostAttachments = await fetchAttachments(
            model,
            "resource_cost",
            allResourceCostIds
          );
          resourceCostSkillAttachments.push(...resourceCostAttachments);
        }

        // 🔹 Fetch all resource_skills in one call
        const resourceSkills =
          await getResourceSkillsByResourceIds(
            schemaNumber,
            resourceIds
          );
        const allResourceSkillIds = resourceSkills.map((rs) => rs.rid);
        if (allResourceSkillIds.length > 0) {
          const resourceSkillAttachments = await fetchAttachments(
            model,
            "resource_skill",
            allResourceSkillIds
          );
          resourceCostSkillAttachments.push(...resourceSkillAttachments);
        }

        return resourceCostSkillAttachments;
      };

      // 🔷 Optimized project resource + task attachments fetch for multiple projects
      const fetchProjectResourceTaskAttachmentsBulk = async (
        model: any,
        projectIds: string[]
      ) => {
        let projectChildAttachments: any[] = [];
        if (projectIds.length === 0) return projectChildAttachments;

        // 🔹 Fetch all project_resources under projects in one call
        const projectResources =
          await getProjectResourcesByProjectIds(
            schemaNumber,
            projectIds
          );
        const projectResourceIds = projectResources.map((r) => r.rid);

        if (projectResourceIds.length > 0) {
          const projectResourceAttachments = await fetchAttachments(
            model,
            "project_resource",
            projectResourceIds
          );
          projectChildAttachments.push(...projectResourceAttachments);
        }

        // 🔹 Fetch all project_tasks under projects in one call
        const projectTasks =
          await getProjectTasksByProjectIds(
            schemaNumber,
            projectIds
          );
        const projectTaskIds = projectTasks.map((t) => t.rid);

        if (projectTaskIds.length > 0) {
          const projectTaskAttachments = await fetchAttachments(
            model,
            "project_task",
            projectTaskIds
          );
          projectChildAttachments.push(...projectTaskAttachments);
        }
        return projectChildAttachments;
      };

      // 🔷 Non-parent account logic with batched optimized fetches
      if (attachmentLevel === "account" && entityId) {
        const accountAttachments = await fetchAttachments(
          AttachmentModel,
          "account",
          [entityId]
        );
        allAttachments.push(...accountAttachments);

        const projects =
          await getProjectsByAccountId(
            schemaNumber,
            entityId
          );
        const projectIds = projects.map((p) => p.rid);
        if (projectIds.length > 0) {
          const projectAttachments = await fetchAttachments(
            AttachmentModel,
            "project",
            projectIds
          );
          allAttachments.push(...projectAttachments);

          const projectChildAttachments =
            await fetchProjectResourceTaskAttachmentsBulk(
              AttachmentModel,
              projectIds
            );
          allAttachments.push(...projectChildAttachments);
        }

        const resources = await getResourcesByAccountId(
          schemaNumber,
          entityId
        );
        const resourceIds = resources.map((r) => (r as { rid: string }).rid);
        if (resourceIds.length > 0) {
          const resourceAttachments = await fetchAttachments(
            AttachmentModel,
            "resource",
            resourceIds
          );
          allAttachments.push(...resourceAttachments);

          const resourceCostSkillAttachments =
            await fetchResourceCostSkillAttachmentsBulk(
              AttachmentModel,
              resourceIds
            );
          allAttachments.push(...resourceCostSkillAttachments);
        }
      }

      // 🔷 Project logic
      else if (attachmentLevel === "project" && entityId) {
        let entityIds : string[]
        if(type === DOSSIER_NAME) {
          let orgSchemaName = rawQueries.fetchSchemaName(schemaNumber)
          const caseProjectIds = await orgDbSequelize.query<string[]>(rawQueries.fetchAssignedProjectIds(entityId, orgSchemaName, DOSSIER_NAME), {type : QueryTypes.SELECT})
          entityIds = caseProjectIds.map((d : any) => d.project_fiscal_rid)
        } else entityIds = [entityId]
        const projectAttachments = await fetchAttachments(
          AttachmentModel,
          "project",
          entityIds
        );
        if(type === DOSSIER_NAME) {
          let fetchProjectDetails : any[] = [...new Set(projectAttachments.map((project : any) => project.dataValues.attach_to))];
          let validArray : any[] = [];
          if(fetchProjectDetails.length > 0) validArray = fetchProjectDetails
          else validArray = ['']
          let projectFiscalDetails = await orgDbSequelize.query(rawQueries.fetchProjectFiscalDetails(validArray, schemaName));
          let projectDetailsMap = new Map(projectFiscalDetails[0].map((d : any) => [d.rid, {project_name : d.project_name, project_code : d.project_code, signoff : d.signoff}]))
          projectAttachments.forEach((d: any) => {
            d.dataValues.project_code = projectDetailsMap.get(d.dataValues.attach_to)?.project_code || null;
            d.dataValues.project_name = projectDetailsMap.get(d.dataValues.attach_to)?.project_name || null;
          });
        }
        allAttachments.push(...projectAttachments);
        if(type !== DOSSIER_NAME) {
           const projectChildAttachments =
            await fetchProjectResourceTaskAttachmentsBulk(AttachmentModel, [
              entityId,
            ]);
          allAttachments.push(...projectChildAttachments);
        }
      }

      // 🔷 Project_resource logic
      else if (attachmentLevel === "project_resource" && entityId) {
        const projectResourceAttachments = await fetchAttachments(
          AttachmentModel,
          "project_resource",
          [entityId]
        );
        allAttachments.push(...projectResourceAttachments);
        const projectResource =
          await fetchProjectResourceById(
            schemaNumber,
            entityId
          );
        const projectTasks =
          await getProjectTasksByProjectIds(
            schemaNumber,
            [(projectResource as any)?.project_fiscal_rid]
          );
        const projectTaskIds = projectTasks.map((t) => t.rid);
        if (projectTaskIds.length > 0) {
          const projectTaskAttachments = await fetchAttachments(
            AttachmentModel,
            "project_task",
            projectTaskIds
          );
          allAttachments.push(...projectTaskAttachments);
        }
      }

      // 🔷 Resource logic
      else if (attachmentLevel === "resource" && entityId) {
        const resourceAttachments = await fetchAttachments(
          AttachmentModel,
          "resource",
          [entityId]
        );
        allAttachments.push(...resourceAttachments);

        const resourceCostSkillAttachments =
          await fetchResourceCostSkillAttachmentsBulk(AttachmentModel, [
            entityId,
          ]);
        allAttachments.push(...resourceCostSkillAttachments);
      }

      // 🔷 Other direct levels
      else {
        if (!whereClause[Op.and]) {
          whereClause[Op.and] = [];
        }

        if (entityId) {
          whereClause[Op.and].push({ attach_to: entityId });
        } else if (attachmentLevel) {
          whereClause[Op.and].push({ attachment_level: attachmentLevel });
        }

      try {
        const result = await AttachmentModel.findAll({ where: whereClause });
        allAttachments.push(...result);
      } catch (error) {
        errorLog('Error fetching attachments:', (error as Error).message);
        throw new Error('Failed to fetch attachments');
      }
    }

      // 🔷 Fetch display names
      if (graphqlData?.document_rid) {
        allAttachments = allAttachments.filter((d: any) => d != null);
      }
      const attachmentDisplayNames = await getAttachmentDisplayNames(
        allAttachments,
        schemaName
      );

      // 🔷 Apply attached_to filter if present
      if (attachedToFilter) {
        allAttachments = allAttachments.filter((attachment) => {
          let displayName =
            attachmentDisplayNames[attachment.rid] ||
            String(attachment.attach_to) ||
            "";
          const displayValue = displayName.toLowerCase();
          const operator = Object.keys(attachedToFilter)[0];
          const filterValue = (attachedToFilter[operator!] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return displayValue.includes(filterValue);
            case "equals":
              return displayValue === filterValue;
            case "not_equals":
              return displayValue !== filterValue || displayValue === null;
            default:
              return false;
          }
        });
      }

      if (uploadedByFilter) {
        allAttachments = allAttachments.filter((attachment) => {
          const uploadedBy = attachment.uploaded_by?.toLowerCase() || "";
          const operator = Object.keys(uploadedByFilter)[0];
          const filterValue = (uploadedByFilter[operator!] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return uploadedBy.includes(filterValue);
            case "equals":
              return uploadedBy === filterValue;
            case "not_equals":
              return uploadedBy !== filterValue || uploadedBy === null;
            default:
              return false;
          }
        });
      }
      if (projectCodeFilter) {
        allAttachments = allAttachments.filter((attachment) => {
          const projectCode = attachment.project_code?.toLowerCase() || "";
          const operator = Object.keys(projectCodeFilter)[0];
          const filterValue = (projectCodeFilter[operator!] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return projectCode.includes(filterValue);
            case "equals":
              return projectCode === filterValue;
            case "not_equals":
              return projectCode !== filterValue || projectCode === null;
            default:
              return false;
          }
        });
      }
      if (projectNameFilter) {
        allAttachments = allAttachments.filter((attachment) => {
          const projectName = attachment.project_name?.toLowerCase() || "";
          const operator = Object.keys(projectNameFilter)[0];
          const filterValue = (projectNameFilter[operator!] || "").toLowerCase();
          switch (operator) {
            case "contains":
              return projectName.includes(filterValue);
            case "equals":
              return projectName === filterValue;
            case "not_equals":
              return projectName !== filterValue || projectName === null;
            default:
              return false;
          }
        });
      }

      // 🔷 Sort
      const validSortFields = [
        "document_name",
        "document_type",
        "document_category",
        "r_number",
        "format",
        "attachment_level",
        "size_in_mb",
        "attached_to",
        "comments",
        "uploaded_by",
        "created_datetime",
        "fiscal_year",
      ];
      const finalSortBy = validSortFields.includes(sortBy)
        ? sortBy
        : "created_datetime";
      const finalSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

      allAttachments.sort((a, b) => {
        // Special handling for created_datetime
        if (finalSortBy === "created_datetime") {
          const aDate = new Date(a[finalSortBy]).getTime();
          const bDate = new Date(b[finalSortBy]).getTime();
          return finalSortOrder === "ASC" ? aDate - bDate : bDate - aDate;
        }

        let aVal =
          finalSortBy === "attached_to"
            ? attachmentDisplayNames[a.rid] ?? ""
            : a[finalSortBy] ?? "";
        let bVal =
          finalSortBy === "attached_to"
            ? attachmentDisplayNames[b.rid] ?? ""
            : b[finalSortBy] ?? "";

        // Convert to string safely
        aVal =
          typeof aVal === "string"
            ? aVal.toLowerCase()
            : String(aVal).toLowerCase();
        bVal =
          typeof bVal === "string"
            ? bVal.toLowerCase()
            : String(bVal).toLowerCase();

        const aEmpty = !aVal || aVal.trim() === "";
        const bEmpty = !bVal || bVal.trim() === "";

        if (aEmpty && bEmpty) return 0; // Both empty – equal
        if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1; // a empty comes last in ASC, first in DESC
        if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1; // b empty comes last in ASC, first in DESC

        // Both non-empty, normal comparison
        return finalSortOrder === "ASC"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });

      // 🔷 Map document types and users
      const documentTypeIds = [
        ...new Set(allAttachments.map((att) => att.document_type_rid)),
      ];
      const documentCategoryIds = [
        ...new Set(allAttachments.map((att) => att.document_category_rid)),
      ];
      const userIds = [...new Set(allAttachments.map((att) => att.created_by))];

      const mainSequelize = await initMainDbSequelize();
      const [documentTypes, documentCategories, users] = await Promise.all([
        documentTypeIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchDocumentByIds(),
              { replacements: { documentTypeIds }, type: "SELECT" }
            )
          : Promise.resolve([]),
        documentCategoryIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchDocumentCategory(),
              { replacements: { documentCategoryIds }, type: "SELECT" }
            )
          : Promise.resolve([]),
        userIds.length > 0
          ? mainSequelize.query(
              rawQueries.fetchUserByIds(),
              { replacements: { userIds }, type: "SELECT" }
            )
          : Promise.resolve([]),
      ]);

      const documentTypeMap = new Map(
        documentTypes.map((dt: any) => [dt.rid, dt.type_name])
      );
      const documentCategoryMap = new Map(
        documentCategories.map((dc: any) => [dc.rid, dc.category_name])
      );
      const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

    // 🔷 Map final results
    let attachments = await Promise.all(allAttachments.map(async attachment => ({
      ...attachment.get({ plain: true }),
      document_type: documentTypeMap.get(attachment.document_type_rid) || null,
      document_category: documentCategoryMap.get(attachment.document_category_rid) || null,
      uploaded_by: userMap.get(attachment.created_by) || attachment.created_by,
      attached_to: attachmentDisplayNames[attachment.rid] || attachment.attach_to,
      browse_file : await generateSasUrl(attachment.browse_file)
    })))

      // Handle uploaded_by sorting
      if (sortBy === "uploaded_by") {
        attachments.sort((a, b) => {
          const aType = a.uploaded_by || "";
          const bType = b.uploaded_by || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }
      if (sortBy === "project_code") {
        attachments.sort((a, b) => {
          const aType = a.project_code || "";
          const bType = b.project_code || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }
      if (sortBy === "project_name") {
        attachments.sort((a, b) => {
          const aType = a.project_name || "";
          const bType = b.project_name || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }

      // Handle document_type sorting
      if (sortBy === "document_type") {
        attachments.sort((a, b) => {
          const aType = a.document_type || "";
          const bType = b.document_type || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }

      // Handle document_category sorting
      if (sortBy === "document_category") {
        attachments.sort((a, b) => {
          const aType = a.document_category || "";
          const bType = b.document_category || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: attachments
    };
}
async getModels(schemaName: string) {
    const sequelize = await initOrgSequelize();
    const DossierFormModel = DossierForm.initialise(sequelize, schemaName)
    const AiTechnicalSummaryModel = AiTechnicalSummary.initialize(sequelize, schemaName)
    const CaseTechnicalSummaryModel = CaseTechnicalSummary.initialize(sequelize, schemaName)
    return {
      DossierFormModel,
      AiTechnicalSummaryModel,CaseTechnicalSummaryModel
    }
}
async fetchDossierPackage (data : any) : Promise<any> {
  const orgDbSequelize = await initOrgSequelize();
  if (!orgDbSequelize)
    throw new Error("Failed to initialize database connection");
  const mainDbSequelize = await initMainDbSequelize();
  if (!mainDbSequelize)
    throw new Error("Failed to initialize database connection");
  const fetchParentNumber : any = await mainDbSequelize.query(await rawQueries.fetchParentAccount(data.account_rid, mainDbSequelize));
  let schemaName = rawQueries.fetchSchemaName(fetchParentNumber[0][0].r_number)
  const {DossierFormModel} = await this.getModels(schemaName);
  let getZipPackage : DossierForm | null
  if(data.dossier_version === undefined) {
    getZipPackage = await DossierFormModel.findOne({
        where : {
          case_rid : data.case_rid,
          account_rid : data.account_rid,
        },
        order : [['created_datetime', 'DESC']],
        limit : 1
      })
  } 
  else {
    getZipPackage = await DossierFormModel.findOne({
      where : {
        case_rid : data.case_rid,
        account_rid : data.account_rid,
        dossier_version : data.dossier_version
      },
      order : [['created_datetime', 'DESC']],
      limit : 1
    })
  }
  
  if(getZipPackage) {
    let responsePackage : any[] = [];
    const stringToJson = JSON.parse(getZipPackage.dossier_metadata as string) as any[];
    const storeRequestSet = new Set(data.downloaded_list)
    for(let j = 0; j < stringToJson.length; j++) {
      if(storeRequestSet.has(stringToJson[j].name)) {
        if(stringToJson[j].extension === '.xlsx' || stringToJson[j].extension === '.pdf') {
          responsePackage.push({
            name : stringToJson[j].name,
            project_code : stringToJson[j].project_code,
            buffer : Buffer.from(stringToJson[j].buffer, 'base64'),
            extension : stringToJson[j].extension
          });
        } else {
          if(stringToJson[j].name === 'RD Form Federal') {
            let finalizedName : string = '';
            if(stringToJson[j].url !== '') {
              let splittedName = stringToJson[j].url.split('/').pop() as string
              finalizedName = splittedName.split('_').slice(2,3).join('_')

              responsePackage.push({
                name : `RD Form-${finalizedName}`,
                url : stringToJson[j].url === '' ? '' : await generateSasUrl(stringToJson[j].url)
              })
            }
          } else if(stringToJson[j].name === 'Financial Workings') {
            if(stringToJson[j].url) {
              responsePackage.push({
                name : 'Financial Calculations',
                url : await generateSasUrl(stringToJson[j].url),
                extension: '.xlsx'
              })
            }
          } else {
            responsePackage.push({
              name : '',
              urls : stringToJson[j].urls?.length > 0 ? await Promise.all(stringToJson[j].urls.map(async (d: any) => {
                return await generateSasUrl(d)
              })) : []
            })
          }
        }
      }
    }
    const [caseDetails] : any[] = await orgDbSequelize.query(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : data.case_rid}, type : QueryTypes.SELECT})
    const convertToZip = await createZipFile(responsePackage);
    const base64 = Buffer.from(convertToZip).toString('base64');
     const userEventInfo:any = await this.helperMethod.fetchUserAndEventInfo({
        userId: data.user_id!,
        eventType: eventTypes.UI_HANDLER
      });
      const obj = getZipPackage.get({plain : true})
      delete obj.dossier_metadata               
      await this.helperMethod.createAccountTimelineEntry(fetchParentNumber[0][0].r_number, {
      created_by: data.user_id!,
      account_rid: data.account_rid,
      entity_rid: data.case_rid!,
      entity_name: entityTypes.FINANCIAL_WORKING,
      created_by_name: userEventInfo.full_name,
      event_type_rid: userEventInfo.event_type_rid,
      event_name: eventNames.CREATE,
      descriptions:caseDetails.case_name,
      case_rid: data.case_rid,
    },["case"]);
    return {
      statusCode : HttpStatus.SUCCESS,
      data : {
        document_name : getZipPackage.document_name,
        base64 : base64
      }
    }
  } else {
    return {
      statusCode : HttpStatus.NOT_FOUND,
      data : null
    }
  }
}
async listTechnicalSummary(
    accountNumber: string,
    projectFiscalRid: string,
    page: number = 1,
    limit: number = 100,
    filters: Record<string, string>,
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    type: string = "list",
    caseRid? : string,
    accountRid? : string,
    summaryType? : string
  ) {
    try {
      const orgDbSequelize = await initOrgSequelize();
      if (!orgDbSequelize)
        throw new Error("Failed to initialize database connection");
      const mainDbSequelize = await initMainDbSequelize();
      if (!mainDbSequelize)
        throw new Error("Failed to initialize database connection");
      const offset = (page - 1) * limit;
        let modifiedByFilter;
      let modifiedByConditions;
      let projectNameFilter;
      let projectNameConditions;
      let projectCodeFilter;
      let projectCodeConditions;
      let totalResults: number = 0;
      let disablePagination = false;
      if(type === "download")
        {
          disablePagination = true
        }
       const detectConditions = (filters: any) => {
        if (!filters) return null;
        for (let conditions of Object.values(ALPHANUMERIC_CONDITIONS)) {
          if (Object.keys(filters).includes(conditions)) return conditions;
        }
        return null;
      };
      if (filters?.modified_by) {
        modifiedByFilter = filters.modified_by;
        modifiedByConditions = detectConditions(modifiedByFilter);
      }
      if (filters?.project_name) {
        projectNameFilter = filters.project_name;
        projectNameConditions = detectConditions(projectNameFilter);
      }
      if (filters?.project_code) {
        projectCodeFilter = filters.project_code;
        projectCodeConditions = detectConditions(projectCodeFilter);
      }
       ["modified_by"].forEach(key => {
        if (filters[key]) {
          disablePagination = true;
          delete filters[key];
        }
      });
      ["project_name"].forEach(key => {
        if (filters[key]) {
          disablePagination = true;
          delete filters[key];
        }
      });
      ["project_code"].forEach(key => {
        if (filters[key]) {
          disablePagination = true;
          delete filters[key];
        }
      });
      if (mainTableFilters[sortBy] !== undefined) {
        disablePagination = true;
      }
      const { whereClause } = this.buildWhereClause(filters);
      const [finalSortBy, finalSortOrder] = getSortParameters(sortBy, sortOrder);
      let schemaName = rawQueries.fetchSchemaName(accountNumber)
      const { AiTechnicalSummaryModel } = await this.getModels(schemaName);
      // Fetch technical summaries and count
      let whereCondition;
      if(caseRid !== undefined && caseRid !== '') {
        const projectFiscalIds : any = await orgDbSequelize.query(rawQueries.getCaseProjectsIds(caseRid, accountRid!, schemaName, summaryType!))
        whereCondition = {
          account_rid : accountRid,
          project_fiscal_rid: {
            [Op.in] : projectFiscalIds[0].length > 0 ? projectFiscalIds[0].map((d : any) => d.project_fiscal_rid) : []
          },
          [Op.and]: Sequelize.where(
        Sequelize.col('"AiTechnicalSummary".version'),
        '=',
        Sequelize.literal(`
          (
            SELECT MAX(t2.version)
            FROM ${schemaName}.ai_technical_summary AS t2
            WHERE 
              t2.account_rid = "AiTechnicalSummary".account_rid
              AND t2.project_fiscal_rid = "AiTechnicalSummary".project_fiscal_rid
          )
        `)),
          ...whereClause
        }
      } else {
        whereCondition = {
          project_fiscal_rid: projectFiscalRid,
          ...whereClause
        }
      }
      const { rows: technicalSummary, count } = await AiTechnicalSummaryModel.findAndCountAll({
        where: whereCondition,
        order: [[finalSortBy, finalSortOrder]],
        ...(disablePagination
          ? {}
          : { limit: limit, offset: offset }),
      });
      // You can now use both technicalSummary (array) and count (number)
      if (technicalSummary.length === 0) {
        return {
          technicalSummary: [],
          count: 0
        };
      }
      let fetchProjectDetails : any[] = [...new Set(technicalSummary.map((project : any) => project.dataValues.project_fiscal_rid))];
      let createdByIds: any[] = [...new Set(technicalSummary.map((user: any) => user.created_by))];
      let modifiedByIds: any[] = [...new Set(technicalSummary.map((user: any) => user.modified_by))];
      let statusIds: any[] = [...new Set(technicalSummary.map((user: any) => user.status_rid))];
      let fetchCreatedByUsers = await mainDbSequelize.query(rawQueries.fetchUser(createdByIds));
      let fetchModifiedByUsers = await mainDbSequelize.query(rawQueries.fetchUser(modifiedByIds));
      let fetchStatusInfo = await mainDbSequelize.query(rawQueries.fetchStatus(statusIds));
      let projectFiscalDetails = await orgDbSequelize.query(rawQueries.fetchProjectFiscalDetails(fetchProjectDetails, schemaName));

      let createdMap: Map<string, string> = new Map(fetchCreatedByUsers[0].map((user: any) => [user.rid, `${user.first_name} ${user.last_name}`]));
      let modifiedMap: Map<string, string> = new Map(fetchModifiedByUsers[0].map((user: any) => [user.rid, `${user.first_name} ${user.last_name}`]));
      let statusMap: Map<string, string> = new Map(fetchStatusInfo[0].map((status: any) => [status.rid, status.name]));
      let projectDetailsMap = new Map(projectFiscalDetails[0].map((d : any) => [d.rid, {project_name : d.project_name, project_code : d.project_code, signoff : d.signoff}]))
      let finalData = technicalSummary == null ? [] : technicalSummary.map((d: any) => {
        return {
          rid: d.rid,
          account_rid : d.account_rid,
          project_rid : d.project_rid,
          project_fiscal_rid : d.project_fiscal_rid,
          project_code : projectDetailsMap.get(d.project_fiscal_rid)?.project_code || null,
          project_name : projectDetailsMap.get(d.project_fiscal_rid)?.project_name || null,
          signoff : projectDetailsMap.get(d.project_fiscal_rid)?.signoff,
          r_number: d.r_number,
          technical_summary: d.technical_summary,
          version: d.version,
          status_rid: d.status_rid,
          status_name: statusMap.get(d.status_rid) || null,
          created_by: d.created_by,
          created_user_name: createdMap.get(d.created_by) || null,
          modified_by: d.modified_by,
          modified_user_name: modifiedMap.get(d.modified_by) || null,
          created_datetime: d.created_datetime,
          modified_datetime: d.modified_datetime
        };
      });
      const applyFilters = (data: any[], conditions: any, value: any, field: any) => {
        if (!conditions || !field) return data;
        const val = value[conditions];
        switch (conditions) {
          case ALPHANUMERIC_CONDITIONS.equals:
            return data.filter((d: any) => d[field]?.toLowerCase() === val?.toLowerCase());
          case ALPHANUMERIC_CONDITIONS.notEquals:
            return data.filter((d: any) => d[field]?.toLowerCase() != val?.toLowerCase());
          case ALPHANUMERIC_CONDITIONS.contains:
            return data.filter((d: any) => d[field]?.toLowerCase().includes(val?.toLowerCase()));
          case ALPHANUMERIC_CONDITIONS.isEmpty:
            return data.filter((d: any) => d[field] == null);
          default:
            return data;
        }
      };
      if (modifiedByConditions != null && modifiedByConditions != undefined)
        finalData = applyFilters(finalData, modifiedByConditions, modifiedByFilter, "modified_user_name");
      if(projectCodeConditions != null && projectCodeConditions != undefined)
        finalData = applyFilters(finalData, projectCodeConditions, projectCodeFilter, "project_code")
      if(projectNameConditions != null && projectNameConditions != undefined)
        finalData = applyFilters(finalData, projectNameConditions, projectNameFilter, "project_name")
      if (mainTableFilters[sortBy] != undefined && sortBy.toLowerCase() == 'asc') {
        finalData = finalData.sort((a: any, b: any) => {
          if (!a?.[sortBy]) return 1;
          if (!b?.[sortBy]) return -1;
          return a[sortBy].localeCompare(b[sortBy]);
        });
      } else if (mainTableFilters[sortBy] != undefined && sortBy.toLowerCase() == 'desc') {
        finalData = finalData.sort((a: any, b: any) => {
          if (!b?.[sortBy]) return 1;
          if (!a?.[sortBy]) return -1;
          return b[sortBy].localeCompare(a[sortBy]);
        });
      }
      totalResults = disablePagination ? finalData.length : count;
      let finalPaginatedData = [];
      if(type === "download") 
        {
          finalPaginatedData = finalData;
        }
        else
        {
           finalPaginatedData = disablePagination ? finalData.slice((page - 1) * limit, page * limit) : finalData;
        }

    
      return {
        technicalSummary: finalPaginatedData,
        count: totalResults
      };
    } catch (err) {
      logMessage(`Error listing technical summary: ${err}`);
      throw new Error("Error listing technical summary: " + (err as Error).message);
    }
  }
private buildWhereClause(filters: Record<string, any>, schemaName?: string): {
    whereClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};
    let includeClause: Array<any> = [];
    if (filters) {
      const filterProcessors: Record<string, Function> = {
        'r_number': (value: any) => processTextFilter('r_number', value, whereClause),
        'technical_summary': (value: any) => processTextFilter('technical_summary', value, whereClause),
        'version': (value: any) => processNumberFilter('version', value, whereClause),
        'created_datetime': (value: any) => processDateFilter('created_datetime', value, whereClause),
        'modified_datetime': (value: any) => processDateFilter('modified_datetime', value, whereClause),
        'status_rid': (value: any) => processTextFilter('status_rid', value, whereClause),
        'project_count': (value: any) => processProjectCountFilter(value, whereClause, schemaName ?? ""),
      };
      Object.keys(filters).forEach(key => {
        
        const value = filters[key];
        if (value === undefined || value === null) return;
        if (filterProcessors[key]) {
          filterProcessors[key](value);
        } else if (value !== '') {
          whereClause[key] = value;
        }
      });
    }
    return { whereClause };
  }
  async closeCase (data : CaseCloseType, files : Express.Multer.File[]) {
    const mainDb = await super.getMainDb();
    const orgDb = await super.getOrgDb();
    const mainDbTransaction = await mainDb.transaction()
    const orgDbTransaction = await orgDb.transaction();
    try {
    const findParentAccount = await mainDb.query<ParentAccountType>(await rawQueries.fetchParentAccount(data.account_rid, mainDb), {type : QueryTypes.SELECT, plain : true});
    if(findParentAccount) {
      const schemaName = rawQueries.fetchSchemaName(findParentAccount.r_number)
      const {RdCreditCalculationsSummary, CaseHistorySubmission, SignoffDetails, Attachment, RdCreditCountryCalculations, RdCreditStateCalculations, Case, CaseSummary, ProjectFiscal} = await this.caseModelService.getModels(findParentAccount.r_number);
      const findFinancialWorkingId : any = await mainDb.query(rawQueries.getFinancialWorkingId(SignOffTypes.case));
      await SignoffDetails.create({
        account_rid : data.account_rid,
        case_rid : data.case_rid,
        signoff_type_rid : findFinancialWorkingId[0][0].rid,
        created_by : data.user_rid,
        created_datetime : new Date()
      }, {transaction : orgDbTransaction});
      if(files.length > 0) {
        const fileUploadedResult = await uploadMultipleFilesToAzureBlob(data.account_rid, findParentAccount.r_number, files);
        this.logger.info("fileUploadedResult Completed and Retrieved");
        if(fileUploadedResult.length > 0) {
          const setComments = new Map(data.state_credits.map((d) => [d.state_rid, d.comments]));
          const setCountryComments = new Map();
          setCountryComments.set(data.country_credits.country_rid, data.country_credits.comments);
          let storeInArrayOfObjects : AttachmentCreationAttributes[] = [];
          let fetchStateIdFromName : string;
          let fetchCountryIdFromName : string;
          fileUploadedResult.forEach((d) => {
            if(d.name.startsWith("file_state_")) {
              fetchStateIdFromName = d.name.replace("file_state_", "");
            }
            else if(d.name.startsWith("file_country_")) {
              fetchCountryIdFromName = d.name.replace("file_country_", "");
            }
            storeInArrayOfObjects.push({
              created_by : data.user_rid,
              attach_to : data.case_rid,
              account_rid : data.account_rid,
              browse_file : d.url,
              size_in_mb : d.size,
              attachment_level : "close case",
              fiscal_year : Number(data.fiscal_year),
              document_category_rid : "",
              document_type_rid : "",
              document_category_others: "",
              document_type_others : "",
              comments : setComments.get(fetchStateIdFromName) ?? setCountryComments.get(fetchCountryIdFromName),
              document_name : d.name,
              format : d.extension,
              created_datetime : new Date(),
            });
          });
          await Attachment.bulkCreate(storeInArrayOfObjects, {transaction : orgDbTransaction})
          this.logger.info("Attachment Data created successfully");
        }
      }
      if(Object.keys(data.country_credits).length > 0) {
        const [affectedCount] = await RdCreditCalculationsSummary.update({
          final_credit_approved : data.country_credits.rd_credits_approved,
          final_credit_submitted : data.country_credits.rd_credits_submitted,
          final_credit : data.country_credits.rd_credits_computed,
          modified_by : data.user_rid,
          modified_datetime : new Date()
        }, {
          where : {
            case_rid : data.case_rid,
            country_rid : data.country_credits.country_rid,
            state_rid : {
              [Op.eq] : null
            }
          }, 
          transaction : mainDbTransaction
        },);
        await RdCreditCountryCalculations.update({
          final_credit_approved : data.country_credits.rd_credits_approved,
          final_credit_submitted : data.country_credits.rd_credits_submitted,
          modified_datetime : new Date()
        }, {
          where : {
            case_rid : data.case_rid,
            country_rid : data.country_credits.country_rid
          },
          transaction : orgDbTransaction
        })
        this.logger.info("Country Credits updated successfully")
        if(affectedCount > 0) {
          const [caseSubmittedCost] = await orgDb.query<CaseSubmissionType>(calculateCostForCaseSubmissionCurrentYear(schemaName, data.case_rid, data.country_credits.country_rid, "update"), {type : QueryTypes.SELECT});
          this.logger.info("caseSubmittedCost Data Retrived successfully")
          const checkIsAlreadyHistoryCreated = await CaseHistorySubmission.findOne({
            where : {
              account_rid : data.account_rid,
              fiscal_year : data.fiscal_year,
              country_rid : data.country_credits.country_rid,
              
            }, raw : true
          })
          if(!checkIsAlreadyHistoryCreated) {
            await CaseHistorySubmission.create({
              account_rid : data.account_rid,
              country_rid : data.country_credits.country_rid,
              created_by : data.user_rid,
              fiscal_year : data.fiscal_year,
              total_project_cost : parseFloat(new Decimal(caseSubmittedCost?.total_fte_cost ?? 0).add(caseSubmittedCost?.total_subcon_cost ?? 0).add(caseSubmittedCost?.total_nonlabor_cost ?? 0).toFixed(2)) || 0.00,
              total_fte_cost : caseSubmittedCost?.total_fte_cost || 0.00,
              total_subcon_cost : caseSubmittedCost?.total_subcon_cost || 0.00,
              total_nonlabor_cost : caseSubmittedCost?.total_nonlabor_cost || 0.00,
              total_qre : caseSubmittedCost?.total_qre || 0.00,
              total_rd_credits : data.country_credits.rd_credits_approved,
              annual_gross_receipts : caseSubmittedCost?.average_annual_gross_receipts || 0.00,
              total_project : 0,
              total_qualified_project : 0,
              total_qualified_project_cost : 0
            }, {transaction : orgDbTransaction});
            this.logger.info("CaseHistorySubmission For Country Created successfully")
          }
        }
      } 
      if(data.state_credits.length > 0 && data.country_rid) {
        for(let stateData of data.state_credits) {
          await RdCreditCalculationsSummary.update({
          final_credit_approved : stateData.rd_credits_approved,
          final_credit_submitted : stateData.rd_credits_submitted,
          final_credit : stateData.rd_credits_computed,
          modified_by : data.user_rid,
          modified_datetime : new Date()
        }, {
          where : {
            case_rid : data.case_rid,
            state_rid : stateData.state_rid
          }, transaction : mainDbTransaction
        });
        await RdCreditStateCalculations.update({
          final_credit_approved : stateData.rd_credits_approved,
          final_credit_submitted : stateData.rd_credits_submitted,
          modified_datetime : new Date()
        }, {
          where : {
            case_rid : data.case_rid,
            state_rid : stateData.state_rid,

          },transaction : orgDbTransaction
        })
        }
        this.logger.info("RdCreditCalculationsSummary For Statewise Updated successfully")
        const caseSubmittedCost = await orgDb.query<CaseSubmissionType>(calculateStateCostForCaseSubmissionCurrentYear(schemaName, data.case_rid, data.state_credits, "update"), {type : QueryTypes.SELECT});
        this.logger.info("caseSubmittedCost For Statewise Retrieved successfully")
        if(caseSubmittedCost.length > 0) {
          let storeArrayStateData : CaseHistorySubmissionCreationAttributes[] = [];
          const findIsStateAlreadyCreated = await CaseHistorySubmission.findAll({
            where : {
              account_rid : data.account_rid,
              fiscal_year : data.fiscal_year,
              state_rid : {
                [Op.in] : data.state_credits.map((d) => d.state_rid)
              }
            },
            attributes : ['state_rid'],
            raw : true
          });
          let finalizedData : any[]
          if(findIsStateAlreadyCreated.length > 0) {
            finalizedData = findIsStateAlreadyCreated.map((d) => d.state_rid) || []
          } else finalizedData = []
          
          caseSubmittedCost.forEach((d : CaseSubmissionType) => {
            if(!finalizedData.includes(d.state_rid)) {
              storeArrayStateData.push({
                account_rid : data.account_rid,
                country_rid : data.country_rid,
                state_rid : d.state_rid,
                created_by : data.user_rid,
                fiscal_year : data.fiscal_year,
                total_project_cost : parseFloat(new Decimal(d.total_fte_cost).add(d.total_subcon_cost).add(d.total_nonlabor_cost).toFixed(2)) || 0.00,
                total_fte_cost : d.total_fte_cost || 0.00,
                total_subcon_cost : d.total_subcon_cost || 0.00,
                total_nonlabor_cost : d.total_nonlabor_cost || 0.00,
                total_qre : d.total_qre || 0.00,
                total_rd_credits : data.state_credits.map((dd : RdCreditsState) => dd.state_rid === d.state_rid ? dd.rd_credits_approved : 0)[0] ?? 0,
                annual_gross_receipts : d.average_annual_gross_receipts || 0.00,
                total_project : 0,
                total_qualified_project : 0,
                total_qualified_project_cost : 0
              }); 
            }
          });
          await CaseHistorySubmission.bulkCreate(storeArrayStateData, {transaction : orgDbTransaction});
          this.logger.info("CaseHistorySubmission For State Inserted successfully")
        }
      }
      if(JSON.stringify(data.user_preference) !== '') {
        const getCaseCloseStatus = await mainDb.query<{rid : string, status_name : string, status_type : string}>(rawQueries.getCaseCloseStatus(), {type : QueryTypes.SELECT, plain : true})
        await Case.update({
          status_rid : getCaseCloseStatus?.rid,
          case_total_rd_cost : data.country_credits.rd_credits_computed,
        }, {
          where : {
            rid : data.case_rid
          }, transaction : orgDbTransaction
        })
        await CaseSummary.update({
        status_rid : getCaseCloseStatus?.rid
        }, {
          where : {
            case_rid : data.case_rid
          }, transaction : mainDbTransaction
        })
        const projectIds = await orgDb.query<ProjectFiscalIds>(rawQueries.fetchAssignedProjectIds(data.case_rid, schemaName, "closeCase"), {type : QueryTypes.SELECT});
        await ProjectFiscal.update({
          is_rd_claim_qualified : false
        }, {
          where : {
            rid : {
              [Op.in] : projectIds.map((d) => d.project_fiscal_rid)
            },
            is_rd_claim_qualified : true
          }, transaction : orgDbTransaction
        })
      }
      await orgDbTransaction.commit();
      await mainDbTransaction.commit();
      return {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : STATUS_MESSAGE.caseClosedSuccess
      }
    } else {
      await orgDbTransaction.rollback()
      await mainDbTransaction.rollback()
      return {
        statusCode : HttpStatus.NOT_FOUND,
        statusMessage : STATUS_MESSAGE.accountNoFound,
      }
    }
  } catch (error) {
      await orgDbTransaction.rollback()
      await mainDbTransaction.rollback()
      return {
        statusCode : HttpStatus.FAILED,
        statusMessage : STATUS_MESSAGE.failedToUpdate,
      }
  }
}
  async getComputedValue (data : ComputedValueRequest) {
    const mainDb = await super.getMainDb();
    const orgDb = await super.getOrgDb();
    const fetchParentAccount = await mainDb.query<ParentAccountType>(await rawQueries.fetchParentAccount(data.account_rid, mainDb), {type : QueryTypes.SELECT, plain : true});
    if(fetchParentAccount) {
      let schemaName = rawQueries.fetchSchemaName(fetchParentAccount.r_number);
      let stateData : CaseStateComputedType[] = []
      if(data.state_rid.length > 0) {
        const fetchStateComputedData = await orgDb.query<CaseStateComputedType>(calculateStateCostForCaseSubmissionCurrentYear(schemaName, data.case_rid, data.state_rid, "list"), {type : QueryTypes.SELECT});
        this.logger.info(`State Computed Data retrived successfully`)
        const safetyCheckForId = [...new Set(fetchStateComputedData.map((d : CaseStateComputedType) => d.state_rid))];
        let validArray = [];
        if(safetyCheckForId.length > 0) validArray = safetyCheckForId
        else validArray = ['']
        const findAllState = await mainDb.query<StateType>(rawQueries.fetchStatesByIds(), {
          type : QueryTypes.SELECT,
          replacements : {
            ids : validArray
          }
        })
        const mapStateName = new Map(findAllState.map((d) => [d.rid, d.state_name]));
        stateData = fetchStateComputedData.map((d) => {
          return {
            ...d,
            state_name : mapStateName.get(d.state_rid) || ''
          }
        });
      } else {
        stateData = []
      }
      let fetchCountryComputedData = null
      if(data.country_rid) {
        fetchCountryComputedData = await orgDb.query<CaseCountryComputedType>(calculateCostForCaseSubmissionCurrentYear(schemaName, data.case_rid, data.country_rid, "list"), {type : QueryTypes.SELECT, plain : true});
        this.logger.info(`Country Computed Data retrived successfully`)
        if(fetchCountryComputedData) {
          const findCountryData = await mainDb.query<CountryType>(rawQueries.getCountryDetails(fetchCountryComputedData.country_rid), {type : QueryTypes.SELECT, plain : true});
          if(findCountryData) {
            fetchCountryComputedData.country_name = findCountryData.country_name
          }
        } else {
          fetchCountryComputedData = null
        }
      }
      let finalData = {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : STATUS_MESSAGE.computedDataFetchedSuccess,
        data : {
          countryComputedData : fetchCountryComputedData,
          stateComputedData : stateData
        }
      }
      this.logger.info(`FinalData computed successfully`)
      return finalData;
    } 
    else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        statusMessage : STATUS_MESSAGE.accountNoFound,
        data : {
          countryComputedData : null,
          stateComputedData : []
        }
      }
    }
  }
  async revokeSignOff (data : RevokeSignoffRequest) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    const orgDbTransaction = await orgDb.transaction();
    const mainDbTransaction = await mainDb.transaction();
    try {
      const [fetchParentAccount] = await mainDb.query<ParentAccountType>(await rawQueries.fetchParentAccount(data.account_rid, mainDb), {type : QueryTypes.SELECT});
      if(fetchParentAccount) {
        const schemaName = rawQueries.fetchSchemaName(fetchParentAccount.r_number);
        let dynamicEntityType : string
        const [caseDetails] : any[] = await orgDb.query(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : data.case_rid}, type : QueryTypes.SELECT})
        if(data.type === 'RD Forms') {
          await orgDb.query(rawQueries.revokRdFormSignOff(schemaName, data.case_rid), {transaction : orgDbTransaction})
          await orgDb.query(rawQueries.revokeDossierFormInitiateStatus(schemaName, data.case_rid), {transaction : orgDbTransaction})
          await orgDbTransaction.commit();
          await mainDbTransaction.commit();
          dynamicEntityType = entityTypes.RD_FORM  
        }
        else {
          const getProjectIdsAssignedForCases = await orgDb.query<ProjectFiscalIds>(rawQueries.getProjectsForCases(data.case_rid, data.account_rid, schemaName), {type : QueryTypes.SELECT});
          let caseProjectIds : string[] = [];
          if(getProjectIdsAssignedForCases.length > 0) {
            getProjectIdsAssignedForCases.forEach((fiscalIds) => {
              caseProjectIds.push(fiscalIds.project_fiscal_rid)
            })
          } else {
            await orgDbTransaction.rollback()
            await mainDbTransaction.rollback()
            return {
              statusCode : HttpStatus.BAD_REQUEST,
              statusMessage : STATUS_MESSAGE.noProjectsAssignedToCase
            }
          }
          await orgDb.query(rawQueries.updateSignoffInCase(schemaName, data.case_rid, false), {transaction : orgDbTransaction});
          await orgDb.query(rawQueries.revokeClaimQualifiedInCaseProject(data.case_rid, caseProjectIds, data.account_rid, schemaName), {transaction : orgDbTransaction});
          await orgDb.query(rawQueries.revokeClaimQualifiedInProjectFiscal(caseProjectIds, data.account_rid, schemaName), {transaction : orgDbTransaction});
          await mainDb.query(rawQueries.revokeClaimQualifiedInProjectFiscalSummary(caseProjectIds, data.account_rid), {transaction : mainDbTransaction})
          await orgDb.query(rawQueries.revokeDossierFormInitiateStatus(schemaName, data.case_rid), {transaction : orgDbTransaction})
          let mapIdsForCaseProjectregions : any[] = []
          let mappedValuesForCasesRegions = new Map(getProjectIdsAssignedForCases.map((d : any) => [d.project_fiscal_rid, {case_project_rid : d.rid, project_fiscal_rid : d.project_fiscal_rid, region_rid : d.region_rid}]));
          caseProjectIds.forEach((d) => {
              mapIdsForCaseProjectregions.push(mappedValuesForCasesRegions.get(d))
          })
          let query = rawQueries.revokeClaimQualifiedInCaseProjectFiscalRegion(mapIdsForCaseProjectregions, data.account_rid, schemaName)
          if(query) {
              await orgDb.query(query, {transaction : orgDbTransaction})
          }
          await orgDb.query(rawQueries.revokRdFormSignOff(schemaName, data.case_rid), {transaction : orgDbTransaction})
          await orgDbTransaction.commit();
          await mainDbTransaction.commit();
          dynamicEntityType = entityTypes.FINANCIAL_WORKING
        }
        const userEventInfo:any = await this.helperMethod.fetchUserAndEventInfo({userId: data.userId!,eventType: eventTypes.UI_HANDLER});
        await this.helperMethod.createAccountTimelineEntry(fetchParentAccount.r_number, {
          created_by: data.userId!,
          account_rid: data.account_rid,
          entity_rid: data.case_rid!,
          entity_name: dynamicEntityType,
          created_by_name: userEventInfo.full_name,
          event_type_rid: userEventInfo.event_type_rid,
          event_name: eventNames.REVOKED,
          descriptions: caseDetails?.case_name || '',
          case_rid: data.case_rid,
          },["case"]);
          return {
            statusCode : HttpStatus.SUCCESS,
            statusMessage : STATUS_MESSAGE.revokedSuccessfully
          }
        }
        await orgDbTransaction.rollback()
        await mainDbTransaction.rollback()
        return {
          statusCode : HttpStatus.NOT_FOUND,
          statusMessage : STATUS_MESSAGE.accountNoFound
      }
    } 
    catch (error) {
      await orgDbTransaction.rollback()
      await mainDbTransaction.rollback()
      return {
          statusCode : HttpStatus.FAILED,
          statusMessage : STATUS_MESSAGE.failedToUpdate
      }
    }
  }
   async getDossierFormDetails (data : any) : Promise<any> {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb(); 
    const [fetchParentAccount] = await mainDb.query<ParentAccountType>(await rawQueries.fetchParentAccount(data.account_rid, mainDb), {type : QueryTypes.SELECT});
    if(fetchParentAccount) {
      let paginationAllowed : boolean = false;
      let sortingAllowed : boolean = false;
      let filterAllowed : boolean = false;
      let totalResult = 0;
      if(Object.keys(data.filter).length > 1) {
        for(let [key, cond] of Object.entries(data.filter)) {
          if(key === 'created_by_name') {
            paginationAllowed = false
            filterAllowed = true
            break
          } else {
            paginationAllowed = true
            filterAllowed = true
            break;
          }
        }
      } else if(Object.keys(data.filter).length === 1) {
        for(let [key, cond] of Object.entries(data.filter)) {
          if(key === 'created_by_name') {
            paginationAllowed = false
            filterAllowed = false
            break;
          } else {
            paginationAllowed = true
            filterAllowed = true
            break;
          }
        }
      }
      else {
        paginationAllowed = true
        filterAllowed = false
      }
      if(data.sort === 'created_by_name') {
        sortingAllowed = false
      } else {
        sortingAllowed = true
      }
      const schemaName = rawQueries.fetchSchemaName(fetchParentAccount.r_number);
      const result = await orgDb.query<DossierFormResponse>(fetchDossierForm(data.page, data.limit, data.sort, data.sort_by, data.filter, data.search, schemaName, paginationAllowed, sortingAllowed, filterAllowed, data.account_rid, data.case_rid), {type : QueryTypes.SELECT});
      if(result.length > 0) {
        const getUserIds = [...new Set(result.map((d) => d.created_by))];
        const getUserMetaData : any = await mainDb.query(rawQueries.getOwnerDetails(getUserIds));
        const mapUser : Map<string, string>= new Map(getUserMetaData[0].map((d : any) => [d.rid, d.name]));
        let iteratedResult = result.map((d) => {
          return {
            ...d,
            created_by_name : mapUser.get(d.created_by) || ''
          }
        })
        if(!filterAllowed) {
          if(Object.keys(data.filter).length > 0) {
            if(Object.keys(data.filter['created_by_name']).some((d) => d ==='equals')) {
            iteratedResult = iteratedResult.filter((d) => d.created_by_name.toLowerCase() === data.filter['created_by_name']['equals'].toLowerCase())
          }
          if(Object.keys(data.filter['created_by_name']).some((d) => d === 'not_equals')) {
            iteratedResult = iteratedResult.filter((d) => d.created_by_name.toLowerCase() !== data.filter['created_by_name']['not_equals'].toLowerCase())
          }
          if(Object.keys(data.filter['created_by_name']).some((d) => d === 'contains')) {
            iteratedResult = iteratedResult.filter((d) => d.created_by_name.toLowerCase().includes(data.filter['created_by_name']['contains'].toLowerCase()))
          }
          }
        }
        if(!sortingAllowed) {
          if(data.sort_by === 'ASC')
            iteratedResult.sort((a, b) => a.created_by_name.localeCompare(b.created_by_name))
          else 
            iteratedResult.sort((a, b) => b.created_by_name.localeCompare(a.created_by_name))
        }
        totalResult = paginationAllowed ? Number(result[0]!.total_result) : iteratedResult.length

        if(!paginationAllowed) {
          iteratedResult = iteratedResult.slice(((data.page - 1) * data.limit), data.limit)
        }
        return {
          statusCode : HttpStatus.SUCCESS,
          data : iteratedResult,
          total : totalResult
        }
      } else {
        return {
          statusCode : HttpStatus.SUCCESS,
          data : [],
          totalResult : 0
        }
      }
    } else {
      return {
          statusCode : HttpStatus.NOT_FOUND,
          data : [],
          totalResult : 0
        }
    }
  }
  async updateCaseSettings (data : any) {
    const mainDb = await this.getMainDb();
    const [fetchParentAccount] = await mainDb.query<ParentAccountType>(await rawQueries.fetchParentAccount(data.account_rid, mainDb), {type : QueryTypes.SELECT});
    if(fetchParentAccount) {
      const {Case} = await this.caseModelService.getModels(fetchParentAccount.r_number);
      await Case.update({
        assessment_methodology : data.assessment_methodology,
        modified_by : data.userId,
        modified_datetime : new Date()
      }, {
        where : {
          rid : data.rid
        }
      });
      return {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : STATUS_MESSAGE.settingsUpdatedSuccess
      }
    } else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        statusMessage : STATUS_MESSAGE.accountNotFound
      }
    }
  }
  async getCaseSettings (data : any) {
    const mainDb = await this.getMainDb();
    const [fetchParentAccount] = await mainDb.query<ParentAccountType>(await rawQueries.fetchParentAccount(data.account_rid, mainDb), {type : QueryTypes.SELECT});
    if(fetchParentAccount) {
      const {Case} = await this.caseModelService.getModels(fetchParentAccount.r_number);
      return await Case.findOne({
        attributes : ['rid', 'assessment_methodology'],
        where : {
          rid : data.rid
        }, raw : true
      })
    }
  }
  async getCaseSummary (data : any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    const [fetchParentAccount] = await mainDb.query<ParentAccountType>(await rawQueries.fetchParentAccount(data.account_rid, mainDb), {type : QueryTypes.SELECT});
    if(fetchParentAccount) {
      const findAccCtryDetails : any = await mainDb.query(rawQueries.fetchAccountAndCountryDetails(data.account_rid))
      let schemaName = rawQueries.fetchSchemaName(fetchParentAccount.r_number)
      const result : any = await orgDb.query(getCaseSummaryData(data.case_rid, schemaName));
      const finalResult = {
        case_rid : data.case_rid,
        account_rid : data.account_rid,
        title : `${findAccCtryDetails[0][0].account_name} ${findAccCtryDetails[0][0].country_code} ${result[0][0].fiscal_year} Dossier`,
        company_overview : result[0][0].business_details,
        assessment_methodology : result[0][0].assessment_methodology,
        overall_project_summary : "NA"
      }
      return finalResult;
    }
    return null;
  }
}

export const mainTableFilters : Record<any, any> = {
  created_user_name : "created_user_name",
  updated_user_name : "updated_user_name",
  interaction_type_name : "interaction_type_name",
  interaction_source_name : "interaction_source_name",
  status_name : "status_name",
  response_source_name : "response_source_name",
  interaction_level_name:"interaction_level_name",
  modified_by: "modified_by",
  modified_user_name:"modified_user_name",
  project_name : "project_name",
  project_code : "project_code"
}

