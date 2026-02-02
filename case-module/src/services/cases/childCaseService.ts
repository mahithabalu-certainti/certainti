import { QueryTypes, Sequelize } from "sequelize";
import { CaseService } from "./caseService";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import { caseFilingTypes, caseStatuses, HttpStatus, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
import { CaseClosureRemarks, CaseData, ProjectFiscalIds, RegionDetails, RegionIds } from "../../utils/types";
import { getValidRegionIdsFromCases } from "../../utils/rawQueries";
import { uploadToAzureBlob } from "../../utils/helpers";
import { fetchCaseClosingRemarks } from "../../utils/dossier-rawquery";
import { ENV, kafka } from "../../config/kafka";
import { Kafka, Producer } from "kafkajs";
import RDCreditSchemaService from "../rdComputation/schemaService";
import { ProjectResourceService } from "../projectResource/projectResourceService";

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
                await orgDb.query(rawQueries.insertDataIntoAttachments(schemaName, data.case_rid, data.userId, data.account_rid, fileUploadedResult.url, fileUploadedResult.name, caseDetails?.fiscal_year, fileUploadedResult.extension, fileUploadedResult.size, data.comments))
            }
            const caseResult : any = await orgDb.query(rawQueries.updateSignoffInCase(schemaName, data.case_rid, data.sign_off));
            if(caseResult[1].rowCount) {
                const findFinancialWorkingId : any = await mainDb.query(rawQueries.getFinancialWorkingId());
                await orgDb.query(rawQueries.insertSignoffDetails(data.userId, findFinancialWorkingId[0][0].rid, data.case_rid, data.account_rid, schemaName))
                await orgDb.query(rawQueries.updateClaimQualifiedInCaseProject(data.case_rid, caseProjectIds, data.account_rid, schemaName));
                await orgDb.query(rawQueries.updateClaimQualifiedInProjectFiscal(caseProjectIds, data.account_rid, schemaName));
                await mainDb.query(rawQueries.updateClaimQualifiedInProjectFiscalSummary(caseProjectIds, data.account_rid))
                let mapIdsForCaseProjectregions : any[] = []
                let mappedValuesForCasesRegions = new Map(getProjectIdsAssignedForCases.map((d : any) => [d.project_fiscal_rid, {case_project_rid : d.rid, project_fiscal_rid : d.project_fiscal_rid, region_rid : d.region_rid}]));
                caseProjectIds.forEach((d) => {
                    mapIdsForCaseProjectregions.push(mappedValuesForCasesRegions.get(d))
                })
                let query = rawQueries.updateClaimQualifiedInCaseProjectFiscalRegion(mapIdsForCaseProjectregions, data.account_rid, schemaName)
                if(query) {
                    await orgDb.query(query)
                }
                return {
                    statusCode : HttpStatus.SUCCESS,
                    statusMessage : STATUS_MESSAGE.financialWorkingSignedOff
                }
            } else {
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
          const [caseStatus]: any = await mainDb.query(rawQueries.fetchCaseStatusByType(caseStatuses.CLOSED));
          if (caseStatus.length === 0) {
            return {
                statusCode: HttpStatus.FAILED,
                message: STATUS_MESSAGE.dataNotAvailable,
                errorMessage: "Closed case status not found",
            };
          } 
           const [caseFilingType]: any = await mainDb.query(rawQueries.fetchFilingTypeByName(caseFilingTypes.regular));
           if (caseFilingType.length === 0) {
            return {
                statusCode: HttpStatus.FAILED,
                message: STATUS_MESSAGE.dataNotAvailable,
                errorMessage: "Regular filing type not found",
            };
          } 
        const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          data.account_rid
        );

            if (!accountNumber) {
                throw new Error("Invalid account ID");
            }
          const { Case } = await this.caseModelService.getModels(accountNumber);
            const closedCases = await Case.findAll({
                attributes: ['rid', 'case_name'],
                where: {
                    account_rid: data.account_rid,
                    status_rid: caseStatus[0].rid,
                    filing_type_rid: caseFilingType[0].rid
                }
            });
            return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.caseDetailsFetchedSuccess,
            data: { cases: closedCases },
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
    const result = await orgDb.query<CaseClosureRemarks>(fetchCaseClosingRemarks(schemaName, data.case_rid), {type : QueryTypes.SELECT});
    if(result.length > 0) {
        const getUserIds = [...new Set(result.flatMap((d : any) => d.signoff_details.map((s : any) => s.created_by)))]
        const getSignoffTypeIds = [... new Set(result.flatMap((d : any) => d.signoff_details.map((s : any) => s.signoff_type_rid)))];
        const findUserDetails = await mainDb.query(rawQueries.getOwnerDetails(getUserIds));
        const findSignOffTypes = await mainDb.query(rawQueries.findSignOffTypes(getSignoffTypeIds));

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
        return finalData[0];
    } else {
        return {
            case_rid : caseDetails.rid,
            case_name : caseDetails.case_name,
            closing_remarks : []
        };
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
    const processingRid = await this.rdCreditSchemaService.markAsInitiated(fetchParentNumber[0][0].r_number, data.case_rid, 'dossier-form');
    const result = await producer.send({
        topic : ENV.DOSSIER_KAFKA_TOPIC,
        messages : [{key : processingRid, value : JSON.stringify({accountRid, caseRid, accountNumber, userId})}]
    })
    console.log(`Message : ${JSON.stringify(result)}`)
    console.log(`Message published to ID : ${processingRid}`);
    return STATUS_MESSAGE.dossierCreationInitiatedSuccess;
}
async processDossierForm (accountNumber : string, caseRid : string, accountRid : string, userId : string) {
    const orgDb = await this.getOrgDb()
    let schemaName = rawQueries.fetchSchemaName(accountNumber)
    const [caseDetails] = await orgDb.query<CaseData>(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : caseRid}, type : QueryTypes.SELECT})
    let caseProjectsPayload : any;
    caseProjectsPayload.account_rid = accountRid;
    caseProjectsPayload.case_rid = caseRid;
    caseProjectsPayload.sort = "project_code";
    caseProjectsPayload.sort_by = "ASC"
    caseProjectsPayload.filter = {};
    caseProjectsPayload.search = "";
    caseProjectsPayload.fiscal_year = caseDetails!.fiscal_year
    const getProjectQualifiedData = await this.exportAssignedProjects(caseProjectsPayload);
    const getProjectResourceSummary = await this.projectResourceService.exportProjectResources(accountRid, caseRid,caseDetails!.fiscal_year, {}, "resource_code", "ASC", userId, "");
    
}
}