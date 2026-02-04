import { Op, QueryTypes, Sequelize } from "sequelize";
import { CaseService } from "./caseService";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import { caseFilingTypes, caseStatuses, DOSSIER_NAME, HttpStatus, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
import { CaseClosureRemarks, CaseData, ProjectFiscalIds, RegionDetails, RegionIds } from "../../utils/types";
import { getValidRegionIdsFromCases } from "../../utils/rawQueries";
import { errorLog, generateExcelBase64, generateSasUrl, isValidTimezone, logMessage, uploadToAzureBlob } from "../../utils/helpers";
import { fetchCaseClosingRemarks, fetchRdFormUrlForCountry, fetchRdFormUrlForState } from "../../utils/dossier-rawquery";
import { ENV, kafka } from "../../config/kafka";
import { Kafka, Producer } from "kafkajs";
import RDCreditSchemaService from "../rdComputation/schemaService";
import { ProjectResourceService } from "../projectResource/projectResourceService";
import moment from "moment";
import {buildRawWhereClause, fetchProjectResourceById, getAttachmentDisplayNames, getProjectResourcesByProjectIds, getProjectsByAccountId, getProjectTasksByProjectIds, getResourceCostsByResourceIds, getResourcesByAccountId, getResourceSkillsByResourceIds, mapAttachmentToCommonFormat} from '../../utils/attachments.helper'
import { Attachment } from "../../models/attachments";
import { createZipFile, uploadZipBufferToAzureBlob } from "../../utils/dossier.package";
import { DossierForm } from "../../models/dossierForm";

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
                await orgDb.query(rawQueries.insertSignoffDetails(data.userId, findFinancialWorkingId[0][0].rid, data.case_rid, data.account_rid, schemaName, data.comments))
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
                }).sort((a, b) => a.signoff_at.localeCompare(b.signoff_at))
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
    console.log("exportCaseClosingRemarks ===> ", result)
    if(result?.closing_remarks.length! > 0) {
        const finalData = result?.closing_remarks.map((d : any) => {
            console.log("Signoff AT : ", d.signoff_at)
            return {
                "Signoff Type" : d.signoff_type_name,
                "Signoff At": d.signoff_at ? data.timezone && isValidTimezone(data.timezone) ? moment(d.signoff_at).tz(data.timezone).format("YYYY-MMM-DD, hh:mm:ss A") : moment(d.signoff_at).utcOffset("+05:30").format("YYYY-MMM-DD, hh:mm:ss A") : "-",
                "Signoff By" : d.created_by_name
            }
        });
        const generateCsv = await generateExcelBase64(finalData, "Closing-Remarks");
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
    caseProjectsPayload.userId = userId
    const getProjectQualifiedData = await this.exportAssignedProjects(caseProjectsPayload);
    const generateQualifiedProjectsCSV = await generateExcelBase64(
          getProjectQualifiedData.data,
          "Qualified-Projects"
    )
    const getProjectResourceSummary = await this.projectResourceService.exportProjectResources(accountRid, caseRid,caseDetails!.fiscal_year, {}, "resource_code", "ASC", userId, "");
    const generateResourceSummaryCSV = await generateExcelBase64(
          getProjectResourceSummary.data?.projectResources,
          "Resource-Summary"
        )
    
    const projectSummaryData = getProjectQualifiedData
    const generateProjectSummaryCSV = await generateExcelBase64(
          projectSummaryData.data,
          "Project-Summary"
    )
    let caseClosingPayload : any = {}
    caseClosingPayload.case_rid = caseRid;
    caseClosingPayload.account_rid = accountRid;
    caseClosingPayload.sort = 'signoff_at';
    caseClosingPayload.sort_by = 'ASC';
    caseClosingPayload.timezone = ''
    const closingRemarksData = await this.exportCaseClosingRemarks(caseClosingPayload);

    const fetchCountryUrl : any = await orgDb.query(fetchRdFormUrlForCountry(schemaName, caseRid));
    const fetchStateUrl : any = await orgDb.query(fetchRdFormUrlForState(schemaName, caseRid));
    let countryUrlData = fetchCountryUrl[0].filter((c : any) => c.country_url !== null);
    let stateUrlData = fetchStateUrl[0].filter((d : any) => d.state_url !== null);
    countryUrlData = countryUrlData[0][0].country_url
    let stateUrls = await Promise.all(stateUrlData[0].map(async (s : any) => {
      return {
        url : await generateSasUrl(s.state_url)
      }
    }))
    const exportProjectDocuments = await this.exportAttachments(userId, 'project', caseDetails?.rid, accountRid, '', {}, 'project_code', 'DESC', 0, {}, '', DOSSIER_NAME);
    const convertToZip = await createZipFile([
      {
      name : "QualifiedProjects",
      buffer : Buffer.from(generateQualifiedProjectsCSV, 'base64'),
      extension : ".xlsx"
    },
    {
      name : "ProjectSummary",
      buffer : Buffer.from(generateProjectSummaryCSV, 'base64'),
      extension : ".xlsx"
    },
    {
      name : "ResourceSummary",
      buffer : Buffer.from(generateResourceSummaryCSV, 'base64'),
      extension : ".xlsx"
    },
    {
      name : "ProjectDocument",
      buffer : Buffer.from(exportProjectDocuments.data, "base64"),
      extension : ".xlsx"
    },
    {
      name : "Closing-Remarks",
      buffer : Buffer.from(closingRemarksData!,'base64'),
      extension : ".xlsx"
    },
    {
      name : "RD-Forms-Federal",
      url : countryUrlData[0][0].country_url
    },
    {
      name : "RD-Forms-State",
      urls : stateUrls
    }
  ]);
  console.log(`Converted to Zip Successfully : `, convertToZip);
  const uploadToAzure = await uploadZipBufferToAzureBlob(convertToZip, "Dossier-Form", accountRid, caseDetails?.r_number!, accountNumber, "cases");
  console.log(`Uploaded To Azure Successfully : `, uploadToAzure);
  const createdResult = await DossierFormModel.create({
    account_rid : accountRid,
    case_rid : caseRid,
    browse_url : uploadToAzure.url,
    created_by : userId,
    document_name : uploadToAzure.name,
    extension : uploadToAzure.extension,
    size : JSON.stringify(uploadToAzure.size),
    created_datetime : new Date()
  });
  console.log(`Dossier form created : `, await generateSasUrl(createdResult.browse_url));
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
    data:  string
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
          const caseProjectIds = await orgDbSequelize.query<string[]>(rawQueries.fetchAssignedProjectIds(entityId, orgSchemaName), {type : QueryTypes.SELECT})
          entityIds = caseProjectIds.map((d : any) => d.project_fiscal_rid)
        } else entityIds = [entityId]
        const projectAttachments = await fetchAttachments(
          AttachmentModel,
          "project",
          entityIds
        );
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
        schemaNumber
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

      const allowedFieldsForExport =
        await this.getAllowedExportFields(
          userId,
          "attachments_view_edit"
        );
      const allowedFieldSet = new Set<string>();
      for (const field of allowedFieldsForExport) {
        if (field.read) {
          allowedFieldSet.add(field.field_desc);
        }
      }
      const labelMap: Record<string, string> = {
        "Project ID": "Project ID",
        "Project Name": "Project Name",
        "Document Name": "Document Name",
        Format: "Format",
        Size: "Size",
        "Fiscal Year": "Fiscal Year",
        "Document Category": "Document Category",
        "Document Type": "Document Type",
        "Related Entity": "Related Entity",
        "Related To ID": "Related To ID",
        "Related To Name": "Related To Name",
        "Attached By": "Attached By",
        "Attached On": "Attached On",
        "Attachment ID": "Attachment ID",
      };
      // Add "mb" suffix to size values for attachments
      attachments = attachments.map((attachment) => ({
        ...attachment,
        size_in_mb: attachment.size_in_mb
          ? `${attachment.size_in_mb} mb`
          : null,
      }));

      attachments = attachments.map((at) => {
        const rawMapped = mapAttachmentToCommonFormat(at, timezone); // with internal keys
        const filtered: Record<string, any> = {};
        for (const [fieldKey, value] of Object.entries(rawMapped)) {
          const label = labelMap[fieldKey]; // field_desc
          if (allowedFieldSet.has(label!)) {
            filtered[label!] = value; // export with label name
          }
        }
        return filtered;
      });

      const generateCsv = await generateExcelBase64(
          attachments,
          "Project-Documents"
        )

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: generateCsv
    };
}
async getModels(schemaName: string) {
    const sequelize = await initOrgSequelize();
    const DossierFormModel = DossierForm.initialise(sequelize, schemaName)
    return {
      DossierFormModel
    }
}
}