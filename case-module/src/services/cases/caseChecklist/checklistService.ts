import { Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../../config/mainDataSource";
import { initOrgSequelize } from "../../../config/orgDataSource";
import { HttpStatus, STATUS_MESSAGE } from "../../../utils/constants";
import { logMessage } from "../../../utils/helpers";
import { ICreateChecklist } from "../../../utils/types";
import { CaseModelService } from "../../caseModelsService";
import { ChecklistSchemaService } from "./checklistSchemaService";
import { HelperMethods } from "../helperMethods";
import CaseSchemaService from "../schemaService";

export class ChecklistService {
    private checklistSchemaService : ChecklistSchemaService
    private caseModelService: CaseModelService;
    private caseSchemaService: CaseSchemaService
     private helperMethod : HelperMethods
     private orgDbSequelize: Sequelize | null = null;
       private mainDbSequelize: Sequelize | null = null;

    constructor () {
        this.checklistSchemaService = new ChecklistSchemaService()
        this.caseModelService = new CaseModelService();
        this.caseSchemaService = new CaseSchemaService();
        this.helperMethod = new HelperMethods(
        this.caseModelService
    );
    }

     protected async getMainDb() {
        if (!this.mainDbSequelize) {
          this.mainDbSequelize = await initMainDbSequelize();
        }
        return this.mainDbSequelize;
      }
    
      protected async getOrgDb() {
        if (!this.orgDbSequelize) {
          this.orgDbSequelize = await initOrgSequelize();
        }
        return this.orgDbSequelize;
      }
      /**
         * Creates a new admin checklist with associated checklist items within a database transaction.
         *
         * @param {ICreateChecklist} caseRequest - The checklist data including template information and checklist items to create
         * @param {string} userId - The ID of the user creating the checklist (will be set as created_by)
         *
         * @returns {Promise<{
         *   statusCode: number;
         *   message: string;
         *   errorMessage?: string;
         *   data?: { checklist: any };
         * }>} - Result of the creation process with status code, message, and checklist data if successful
         *
         * @description
         * This method performs the following operations within a database transaction:
         * - Initializes a database transaction for atomic operations
         * - Sets the created_by field to the provided userId
         * - Creates the admin checklist record using the schema service
         * - Creates associated checklist items linked to the new checklist
         * - Commits the transaction on success or rolls back on any error
         * - Returns success response with checklist data or error response with details
         * - Logs errors and ensures proper transaction cleanup
         */
      
        async createCheckList(
          caseRequest: ICreateChecklist,
          userId: string
        ): Promise<{
          statusCode: number;
          message: string;
          errorMessage?: string;
          data?: { checklist: any };
        }> {
          // Initialize database connection and start transaction for atomic operations
          const dbInit = await this.caseModelService.getSequelize();
          const transaction = await dbInit.transaction();
          try {
            // Set the user who is creating this checklist
            const { accountNumber } =
            await this.caseSchemaService.fetchValidAccountNumberById(
              caseRequest.account_rid
            );
    
          if (!accountNumber) {
            logMessage(`Invalid account ID ${caseRequest.account_rid}`);
            return {
              statusCode: HttpStatus.FAILED,
              message: HttpStatus.FAILED_MESSAGE,
              errorMessage: "Invalid account ID",
            };
          }
            caseRequest.created_by = userId;
    
          const isUnique = await this.caseSchemaService.checkIsChecklistNameUnique(caseRequest,accountNumber);
          if (!isUnique) {
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: HttpStatus.BAD_REQUEST_MESSAGE,
              errorMessage: `A checklist with the name "${caseRequest.checklist_name}" already exists for the fiscal year "${caseRequest.fiscal_year}". Please choose a different name.`,
            };
          }
            // Create the main admin checklist record
            const response =
              await this.checklistSchemaService.createCheckList(
                accountNumber,
                caseRequest,
                transaction
              );
      
            // If checklist creation was successful, manage associated checklist items (add/edit/delete)
            if (response) {
              await this.helperMethod.manageCheckListItems(
                accountNumber,
                caseRequest,
                response.rid,
                transaction
              );
            }
      
            // Commit the transaction after all operations succeed
            await transaction.commit();
      
            return {
              statusCode: HttpStatus.SUCCESS,
              message: STATUS_MESSAGE.adminChecklistCreated,
              data: {
                checklist: response,
              },
            };
          } catch (err) {
            console.log(err);
             const errorMessage = err instanceof Error ? err.message : err;
            logMessage(`Error creating checklist: ${errorMessage}`);
            await transaction.rollback();
            return {
              statusCode: HttpStatus.FAILED,
              message: HttpStatus.FAILED_MESSAGE,
              errorMessage: STATUS_MESSAGE.adminChecklistFailed,
            };
          }
        }
    
        async updateCheckList(
            caseRequest: ICreateChecklist,
            userId: string
          ): Promise<{
            statusCode: number;
            message: string;
            errorMessage?: string;
            data?: { checklist: any };
          }> {
            // Initialize database connection and start transaction for atomic operations
            const dbInit = await this.caseModelService.getSequelize();
            const transaction = await dbInit.transaction();
            try {
              // Set the user who is creating this checklist
              caseRequest.modified_by = userId;
              caseRequest.created_by = userId;
               const { accountNumber } =
            await this.caseSchemaService.fetchValidAccountNumberById(
              caseRequest.account_rid
            );
    
            if (!accountNumber) {
              logMessage(`Invalid account ID ${caseRequest.account_rid}`);
              return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: "Invalid account ID",
              };
            }
    
             if( caseRequest.checklist_name ){
              const isUnique = await this.caseSchemaService.checkisExistingCheckilistUnique(caseRequest,accountNumber);
              if (!isUnique) {
                return {
                  statusCode: HttpStatus.BAD_REQUEST,
                  message: HttpStatus.BAD_REQUEST_MESSAGE,
                  errorMessage: `A checklist with the name "${caseRequest.checklist_name}" for fiscal year "${caseRequest.fiscal_year}" already exists. Please choose a different name or fiscal year.`,
                };
              }
            }
              // Create the main admin checklist record
              const response =
                await this.checklistSchemaService.updateCheckList(
                  accountNumber,caseRequest,transaction
                );
    
        
              // If checklist creation was successful, manage associated checklist items (add/edit/delete)
              if (response) {
                await this.helperMethod.manageCheckListItems(
                  accountNumber,
                  caseRequest,
                  caseRequest.checklist_rid!,
                  transaction
                );
              }
        
              // Commit the transaction after all operations succeed
              await transaction.commit();
        
              return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.adminChecklistCreated,
                data: {
                  checklist: response,
                },
              };
            } catch (err) {
              logMessage(`Error updating checklist: ${err}`);
              await transaction.rollback();
              return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: STATUS_MESSAGE.adminChecklistFailed,
              };
            }
          }
        async getCheckListDetailsById(checkListRid: string,caseRequest:any): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { checklistDetails: any };
      }> {
        try {
          const { accountNumber } =
            await this.caseSchemaService.fetchValidAccountNumberById(
              caseRequest.account_rid
            );
            if(!this.mainDbSequelize) {
              this.mainDbSequelize = await initMainDbSequelize();
            }
    
            if (!accountNumber) {
              logMessage(`Invalid account ID ${caseRequest.account_rid}`);
              return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: "Invalid account ID",
              };
            }
          const checklistDetails =
            await this.checklistSchemaService.fetchChecklistDetailsById(
              checkListRid,accountNumber,caseRequest.account_rid, this.mainDbSequelize
            );
      
          if (!checklistDetails) {
            return {
              statusCode: HttpStatus.FAILED,
              message: HttpStatus.FAILED_MESSAGE,
              errorMessage: "Invalid CheckList ID",
            };
          }
      
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              checklistDetails,
            },
          };
        } catch (err) {
          logMessage(`Error fetching checklist details, ${err}`);
            return {
              statusCode: HttpStatus.FAILED,
              message: HttpStatus.FAILED_MESSAGE,
              errorMessage: STATUS_MESSAGE.checkListError,
            };
        }
      }
    
        async getAllChecklists(
          userId: string,
          attachmentLevel?: string,
          entityId?: string,
          accountRid?: string,
          page: number = 1,
          limit: number = 10,
          search?: string,
          filters: Record<string, any> = {},
          sortBy: string = 'created_datetime',
          sortOrder: string = 'DESC',
          fiscalYear: number = 0,
          apiType: string = 'list',
          graphqlData? : any
        ): Promise<{
          statusCode: number;
          message: string;
          errorMessage?: string;
          data?: { checklists: any[]; totalCount: number };
        }> {
          try {
            const { accountNumber } =
            await this.caseSchemaService.fetchValidAccountNumberById(
              accountRid!
            );
    
            if (!accountNumber) {
              logMessage(`Invalid account ID ${accountRid!}`);
              return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: "Invalid account ID",
              };
            }
            const userGroupType = await this.caseSchemaService.getUserGroupType(
            userId
          );
          const userProfileType = await this.caseSchemaService.getUserProfileType(
            userId
          );
          const isCustomGlobal = userGroupType === "DEFAULT";
          const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";
          const isPOCProfile =
            userProfileType?.profileName === "Project Point of Contact";
          let accessibleIds: string[] = [];
    
          if (!isCustomGlobal) {
            accessibleIds = await this.helperMethod.getAccessibleProjectIds(
              userId,
              isDefaultParent,
              isPOCProfile,
              userProfileType?.email,
              isCustomGlobal
            );
            if (accessibleIds.length === 0) {
              return {
                message: 'No accessible checklist found for the user.',
                statusCode: HttpStatus.NOT_FOUND,
                data: {
                    totalCount: 0,
                  checklists: [],
                },
              };
            }
          }
    
          if (isCustomGlobal && isPOCProfile) {
            accessibleIds = await this.helperMethod.getAccessibleProjectIds(
              userId,
              isDefaultParent,
              isPOCProfile,
              userProfileType?.email,
              isCustomGlobal
            );
            if (accessibleIds.length === 0) {
              return {
                message: 'No accessible checklist found for the user.',
                statusCode: HttpStatus.NOT_FOUND,
                data: {
                
                  totalCount: 0,
                  checklists: [],
                },
              };
            }
          }
             const checklistResponse:any =
            await this.checklistSchemaService.fetchChecklists(
              accountNumber,
              fiscalYear,
              attachmentLevel,
              entityId,
              accountRid,
              page,
              limit,
              search,
              filters,
              sortBy,
              sortOrder,
              apiType,
              accessibleIds,
              graphqlData
            );
      
             return {
              statusCode: HttpStatus.SUCCESS,
              message: HttpStatus.SUCCESS_MESSAGE,
              data: { checklists: checklistResponse.checklists || [], totalCount: checklistResponse.totalCount || 0 }
            };
        
          } catch (error) {
            logMessage(`Error fetching checklists, ${error}`);
            return {
              statusCode: 500,
              message: 'Failed to fetch checklists',
              errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
              data: { checklists: [], totalCount: 0 }
            };
          }
        }
}