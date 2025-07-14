import { Op, Sequelize,UniqueConstraintError,where,fn,col  } from "sequelize";
import { HttpStatus, STATUS, STATUS_MESSAGE } from "../utils/constant";
import { IAccount, IUpdateAccount,IKeyContactDetail } from "../utils/types";
import { getTableSchemaByEntity, uploadToAzureBlob} from  "../utils/helpers";
import SchemaService from "./schemaService";
import { models } from "../models";
import Decimal from "decimal.js";
import { States } from "../models/stateModel";
import currency from "currency.js";
import { Status } from "../models/statusModel";
import { Account as AccountModel } from "../models/accountModel";
import AccountDetails from "../models/accountDetailsModel";
import { KeyContact } from "../models/keyContactDetails";
import { initOrgSequelize } from "../config/orgdbDataSource";

const { Account, Country, Currency,Industry } = models;

class AccountService {
  private accountRepository: typeof Account | null;
  private schemaService: SchemaService;

  constructor() {
    this.accountRepository = null;
    this.schemaService = new SchemaService();
  }

  /**
   * Retrieves the Account model instance.
   * If the repository has not been initialized, it creates a new instance
   * using the database configuration.
   *
   * @returns {typeof Account} - The model for Account entities.
   */
  private getAccountRepository(): typeof Account {
    if (!this.accountRepository) {
      this.accountRepository = Account;
    }
    return this.accountRepository;
  }

  /**
   * Retrieves an account by its ID.
   *
   * @async
   * @param {number} rid - The ID of the account to retrieve.
   * @returns {Promise<{ statusCode: number, message: string, data?: { account: any } }>}
   * - An object containing the status code, message, and retrieved account data.
   */
async accountList(
  page: number = 1,
  limit: number = 10,
  search: string,
  filters: Record<string, any> = {},
  sortBy: string = "created_datetime", 
  sortOrder: string = "ASC",
  globalFilters: Record<string, string[]> = {},
  fiscalYear: number | "FY-All"
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { account: any; count: number };
}> {
  try {
    const repository = this.getAccountRepository();
    
    // Get USD currency_rid - cache this if possible
    const usdCurrency = await this.getUSDCurrency();
    
    // Parse filters if it's a string
    const parsedFilters = typeof filters === 'string' ? 
      (filters === '{}' ? {} : JSON.parse(filters)) : filters;
          
    const { whereClause } = this.buildWhereClause(parsedFilters, search);
    
    const {parentWhereClause, childWhereClause} = this.applyAccountIDFilter(globalFilters, whereClause);
    
    const offset = (page - 1) * limit;

    const [finalSortBy, finalSortOrder] = this.getSortParameters(
      sortBy,
      sortOrder
    );

    // Optimized order clause construction
    const order = this.buildOrderClause(
      finalSortBy, 
      finalSortOrder, 
      ['country', 'currency', 'industry'],
      ["total_projects", "total_project_cost", "total_project_hours", "qualifying_project_hours_fed", "qualifying_project_qre_fed", "qualifying_project_rd_credits_fed", "total_projects_rd_credits"]
    );

    // Check for key contact filters
    const hasKeyContactFilter = !!(parsedFilters?.finance_executive || parsedFilters?.professional_services_consultant || parsedFilters?.finance_lead) ||
         ['professional_services_consultant', 'financial_lead', 'finance_executive'].includes(finalSortBy || '');

    // Optimized query options
    const queryOptions: any = {
      where: parentWhereClause,
      order: [["account_name", "ASC"]],
      include: this.buildBaseIncludes(),
      attributes: ['rid', 'account_name', 'currency_rid', 'total_project_hours', 'total_projects', 'total_project_cost','total_projects_rd_credits', 'qualifying_project_hours_fed', 'qualifying_project_qre_fed', 'qualifying_project_rd_credits_fed','r_number','storage_type','professional_services_consultant', 'finance_lead', 'finance_executive', 'industry_name_other'] // Only select needed fields initially
    };

    // Only apply pagination if key_contact filter is NOT present
    if (!hasKeyContactFilter) {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    // Get parent accounts with minimal data first
    let parentAccounts = await repository.findAll(queryOptions);

    // Set USD currency for accounts with no currency
    this.setDefaultCurrency(parentAccounts, usdCurrency);

    // Get child accounts in a single query with minimal data
    const accountIds = parentAccounts.map((account: any) => account.rid);
    let childAccounts: any[] = [];
    
    if (accountIds.length > 0) {
      childAccounts = await repository.findAll({
        where: {
          parent_account_rid: {
            [Op.in]: accountIds,
          },
          ...childWhereClause,
        },
        include: this.buildChildIncludes(),
        order,
        attributes: ['rid', 
          'account_name', 'parent_account_rid', 'currency_rid', 'total_project_hours', 
          'total_projects','total_project_cost','total_projects_rd_credits', 'qualifying_project_hours_fed', 'qualifying_project_qre_fed', 'qualifying_project_rd_credits_fed','r_number','storage_type','parent_account_rid','professional_services_consultant', 'finance_lead', 'finance_executive', 'industry_name_other'
        ] // Only select needed fields
      });

      // Set USD currency for child accounts
      this.setDefaultCurrency(childAccounts, usdCurrency);
    }

    // Group child accounts by parent - optimized with Map
   const childAccountsByParent = new Map();
    childAccounts.forEach((child: any) => {
      if (!childAccountsByParent.has(child.parent_account_rid)) {
        childAccountsByParent.set(child.parent_account_rid, []);
      }
      childAccountsByParent.get(child.parent_account_rid).push(child);
    });
    if(Object.keys(parsedFilters).length > 0)
    {
    parentAccounts = parentAccounts.filter((parent: any) => {
      // Keep parent if it has children that match filters
      if (childAccountsByParent.has(parent.rid)) {
        return true;
      }
      // // Also keep parent if it has no children at all (standalone parent)
      // const hasChildren = await repository.count({
      //   where: { parent_account_rid: parent.rid }
      // });
      // return !hasChildren;
    });
  }
    // Attach child accounts to parents
    parentAccounts.forEach((account: any) => {
      account.setDataValue('child_accounts', childAccountsByParent.get(account.rid) || []);
    });

    // Get full account data only for the needed records
    const updatedAccount = await this.schemaService.insertFiscalInfoOnly(
      parentAccounts,
      filters,
      limit,
      offset,
      finalSortBy,
      finalSortOrder,
      'create',
      fiscalYear
    );

    // Optimize count query
    const totalCount = await this.getOptimizedCount(repository, parentWhereClause);

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        account: updatedAccount,
        count: !hasKeyContactFilter ? totalCount : updatedAccount?.total,
      },
    };
  } catch (err) {
    return this.throwServiceError(err as Error);
  }
}

// Helper methods
private buildOrderClause(
  finalSortBy: string,
  finalSortOrder: string,
  excludedFields: string[],
  numericFields: string[]
): any[] {
  const order: any[] = [];
  
      if (finalSortBy && !excludedFields.includes(finalSortBy)) {
        if (numericFields.includes(finalSortBy)) {
       order.push([
          Sequelize.cast(Sequelize.literal(`"Account"."${finalSortBy}"`), 'DECIMAL'),
          finalSortOrder
        ]);
      } else {
        order.push([
          Sequelize.literal(`"Account"."${finalSortBy}"`),
          finalSortOrder
        ]);
      }
    }
  
        if (finalSortBy === "country") {
          order.push([
            { model: Country, as: "country" },
            "country_name",
            finalSortOrder,
          ]);
        }
  
        if (finalSortBy === "currency") {
          order.push([
            { model: Currency, as: "currency" },
            "currency_code",
            finalSortOrder,
          ]);
        }
        
        if (finalSortBy === "industry") {
          order.push([
            { model: Industry, as: "industry" },
            "industry_name",
            finalSortOrder,
          ]);
        }
        if (finalSortBy == "country" || finalSortBy == "currency" || finalSortBy == "industry") {
           order.push(["account_name", "ASC"]);
        }
  return order;
}

private buildBaseIncludes() {
  return [
    {
      model: Country,
      as: "country",
      attributes: ["rid", "country_name"],
      required: false,
    },
    {
      model: Currency,
      as: "currency",
      attributes: ["rid", "currency_code", "currency_symbol"],
      required: false,
    },
    {
      model: Industry,
      as: "industry",
      attributes: ["rid", "industry_name"],
      required: false,
    },
    {
      model: Status,
      as: 'status',
      attributes: [['status_description','status_name']],
      required: false,
    }
  ];
}

private buildChildIncludes() {
  return [
    {
      model: Country,
      as: "country",
      attributes: ["rid", "country_name"]
    },
    {
      model: Currency,
      as: "currency",
      attributes: ["rid", "currency_code", "currency_symbol"]
    },
    {
      model: Account,
      as: "parent_account",
      attributes: ["rid", "account_name"],
    },
    {
      model: Industry,
      as: "industry",
      attributes: ["rid", "industry_name"],
      required: false,
    },
    {
      model: Status,
      as: 'status',
      attributes: ['status_name'],
      required: true,
  }
  ];
}

private setDefaultCurrency(accounts: any[], usdCurrency: any) {
  accounts.forEach((account: any) => {
    if (!account.currency_rid || account.currency_rid === '') {
      account.currency_rid = usdCurrency?.rid;
      account.setDataValue('currency', usdCurrency);
    }      
  });
}

private async getOptimizedCount(repository: any, whereClause: any) {
  try {
    return await repository.count({
      where: whereClause,
      distinct: true,
      col: 'rid', // Count distinct on primary key for better performance
      include: [], // Remove unnecessary includes for count
      logging: false // Disable logging for count queries
    });
  } catch (error) {
    // Fallback to original count method if optimized fails
    return await repository.count({
      where: whereClause,
      distinct: true,
      include: [
        {
          model: Country,
          as: "country",
          attributes: []
        },
        {
          model: Currency,
          as: "currency",
          attributes: []
        },
        {
          model: Industry,
          as: "industry",
          attributes: []
        }
      ]
    });
  }
}


       /**
   * Retrieves the all  account details with filters and search for exporting as excel.
   *
   * @async
   * @param {string} search - The search query to filter accounts by.
   * @param {Record<string, string>} filters - The filters applied to account data.
   * @param {string} sortBy - The field by which to sort the results.
   * @param {string} sortOrder - The order of sorting ('ASC' or 'DESC').
   * @returns {Promise<{ statusCode: number, message: string, data?: { account: any } }>}
   * - An object containing the status code, message, and retrieved account data.
   */
    async exportAccountList(
      search: string,
      filters: Record<string, any> = {},
      sortBy: string = "created_datetime",
      sortOrder: string = "ASC",
      globalFilters: Record<string, string[]> = {},
      fiscalYear: number | "FY-All"
    ): Promise<{
      statusCode: number;
      message: string;
      errorMessage?: string;
      data?: { account: any};
    }> {
      try {
        const repository = this.getAccountRepository();
        const usdCurrency = await this.getUSDCurrency();
        // Parse filters if it's a string
        const parsedFilters = typeof filters === 'string' ? 
          (filters === '{}' ? {} : JSON.parse(filters)) : filters;
              
        const { whereClause } = this.buildWhereClause(parsedFilters, search);
        
        const {parentWhereClause, childWhereClause} = this.applyAccountIDFilter(globalFilters, whereClause); 
        const [finalSortBy, finalSortOrder] = this.getSortParameters(
          sortBy,
          sortOrder
        );

    // Optimized order clause construction
        const order = this.buildOrderClause(
        finalSortBy, 
          finalSortOrder, 
          ['country', 'currency', 'industry', 'professional_services_consultant', 'finance_executive', 'finance_lead'],
          ["total_projects", "total_project_cost", "total_project_hours", "qualifying_project_hours_fed", "qualifying_project_qre_fed", "qualifying_project_rd_credits_fed", "total_projects_rd_credits",'professional_services_consultant', 'finance_lead', 'finance_executive']
        );

    // Check for key contact filters
    const hasKeyContactFilter = !!(parsedFilters?.finance_executive || parsedFilters?.professional_services_consultant || parsedFilters?.finance_lead) ||
         ['professional_services_consultant', 'financial_lead', 'finance_executive'].includes(finalSortBy || '');

    // Optimized query options
    const queryOptions: any = {
      where: parentWhereClause,
      order: [["account_name", "ASC"]],
      include: this.buildBaseIncludes(),
      attributes: ['rid', 'account_name', 'currency_rid', 'total_project_hours', 'total_projects', 'total_project_cost','total_projects_rd_credits', 'qualifying_project_hours_fed', 'qualifying_project_qre_fed', 'qualifying_project_rd_credits_fed','r_number','storage_type','professional_services_consultant', 'finance_lead', 'finance_executive'] // Only select needed fields initially
    };

   

    // Get parent accounts with minimal data first
    let parentAccounts = await repository.findAll(queryOptions);

    // Set USD currency for accounts with no currency
    this.setDefaultCurrency(parentAccounts, usdCurrency);

    // Get child accounts in a single query with minimal data
        const accountIds = parentAccounts.map((account: any) => account.rid);
        let childAccounts: any[] = [];
    
        if(accountIds.length > 0) {
          childAccounts = await repository.findAll({
            where: {
              parent_account_rid: {
                [Op.in]: accountIds,
              },
              ...childWhereClause,
            },
            include: this.buildChildIncludes(),
            order,
            attributes: ['rid', 
              'account_name', 'parent_account_rid', 'currency_rid', 'total_project_hours', 
              'total_projects','total_project_cost','total_projects_rd_credits', 'qualifying_project_hours_fed', 'qualifying_project_qre_fed', 'qualifying_project_rd_credits_fed','r_number','storage_type','parent_account_rid','professional_services_consultant', 'finance_lead', 'finance_executive', 'industry_name_other'
            ] // Only select needed fields
          });

          // Set USD currency for child accounts
          this.setDefaultCurrency(childAccounts, usdCurrency);
        }
        else {
          // If no parent accounts found, set empty child_accounts array
          parentAccounts.forEach((account: any) => {
            account.setDataValue('child_accounts', []);
          });
        }

    // Group child accounts by parent - optimized with Map
        const childAccountsByParent = new Map();
        childAccounts.forEach((child: any) => {
          if (!childAccountsByParent.has(child.parent_account_rid)) {
            childAccountsByParent.set(child.parent_account_rid, []);
          }
          childAccountsByParent.get(child.parent_account_rid).push(child);
        });
         if(Object.keys(parsedFilters).length > 0)
        {
          parentAccounts = parentAccounts.filter((parent: any) => {
          // Keep parent if it has children that match filters
          if (childAccountsByParent.has(parent.rid)) {
            return true;
          }
          // // Also keep parent if it has no children at all (standalone parent)
          // const hasChildren = await repository.count({
          //   where: { parent_account_rid: parent.rid }
          // });
          // return !hasChildren;
        });
      }
        // Attach child accounts to parents
        parentAccounts.forEach((account: any) => {
          account.setDataValue('child_accounts', childAccountsByParent.get(account.rid) || []);
        });
        // Get full account data only for the needed records
        const updatedAccount = await this.schemaService.insertFiscalInfoOnly(parentAccounts,filters,0,0,
          finalSortBy,
          finalSortOrder,
          'download',
          fiscalYear
        );
        const rawResult = updatedAccount?.data || [];
        const cleanedUsers = rawResult;
        const emptyRow = {
          "Account Name": "",
          "Industry": "",
          "Country": "",
          "Total Projects": "",
          "Total Project Hours": "",
          "Total Cost": "",
          "Estimated R&D Hours": "",
          "QRE": "",
          "Estimated R&D Credits": "",
          "Actual R&D Credits": "",
          "Finance Executive": "",
          "Finance Lead": "",
          "Professional Services Consultant": "",
          "Account ID": ""
        };

    // If no data found, return the empty row
    if (cleanedUsers.length === 0) {
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          account: [emptyRow]
        },
      };
    }
    const formatNumberForExport = (value: any, currency_symbol: string): string => {
      if (value == null || value === '') return '-';
    
      try {
        const decimalValue = new Decimal(value.toString());
        if (!decimalValue.isFinite()) return '-';
    
        // Extract just the formatted currency pattern using a dummy value
        const pattern = currency(0, {
          symbol: currency_symbol || '$',
          precision: 2,
          pattern: '! #',
          separator: ',',
          decimal: '.',
        }).format(); // e.g., "$ 0.00"
    
        // Format actual value manually using Decimal
        const [intPart, decPart] = decimalValue.toFixed().split('.');
        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
        const formattedNumber = decPart ? `${formattedInt}.${decPart}` : formattedInt;
        // Replace "0.00" in pattern with our real number
        return pattern.replace('0.00', formattedNumber);
    
      } catch (error) {
        console.error('Error formatting number:', error);
        return '-';
      }
    };
        let exportDetails: any[] = [];
        cleanedUsers.forEach((account: any) => {
          const currency_symbol = account?.currency?.currency_symbol;

          const baseRow = {
            "Account Name": account?.account_name || "-",
            "Industry": account?.industry?.industry_name || "-",
            "Country": account?.country?.country_name || "-",
            "Total Projects": account?.total_projects || '-',
            "Total Project Hours": account?.total_project_hours || "-",
            "Total Cost": formatNumberForExport(account?.total_project_cost, currency_symbol) ||  "-",
            "Estimated R&D Hours": account?.qualifying_project_hours_fed || "-",
            "QRE": formatNumberForExport(account?.qualifying_project_qre_fed, currency_symbol) || "-",
            "Estimated R&D Credits": formatNumberForExport(account?.qualifying_project_rd_credits_fed, currency_symbol) || "-",
            "Actual R&D Credits": formatNumberForExport(account?.total_projects_rd_credits, currency_symbol) || "-",
            "Finance Executive":account?.finance_executive || '-',
            "Finance Lead":account?.finance_lead || '-',
            "Professional Services Consultant":account?.professional_services_consultant || '-',
            "Account ID": account?.r_number || "-"
          };
          exportDetails.push(baseRow);
          if (Array.isArray(account.child_accounts) && account.child_accounts.length > 0) {
            account.child_accounts.forEach((child: any) => {
              const child_currency_symbol = child?.currency?.currency_symbol;

              exportDetails.push({
                "Account Name": child?.account_name || "-",
                "Industry": child?.industry?.industry_name || "-",
                "Country": child?.country?.country_name || "-",
                "Total Projects": child?.total_projects || '-',
                "Total Project Hours": child?.total_project_hours || "-",
                "Total Cost": formatNumberForExport(child?.total_project_cost, child_currency_symbol) || "-",
                "Estimated R&D Hours": child?.qualifying_project_hours_fed || "-",
                "QRE": formatNumberForExport(child?.qualifying_project_qre_fed, child_currency_symbol) || "-",
                "Estimated R&D Credits": formatNumberForExport(child?.qualifying_project_rd_credits_fed, child_currency_symbol) || "-",
                "Actual R&D Credits": formatNumberForExport(child?.total_projects_rd_credits, child_currency_symbol) || "-",
                "Finance Executive":child?.finance_executive || '-',
                "Finance Lead":child?.finance_lead || '-',
                "Professional Services Consultant":child?.professional_services_consultant || '-',
                "Account ID": child?.r_number || "-"
              });
                if(child?.projects_by_fiscal_year.length >0)
                { 
                   child.projects_by_fiscal_year.forEach((fiscalData: any) => {
                  exportDetails.push({
                      "Account Name": fiscalData?.fiscal_year || "-",
                      "Industry": "-",
                      "Country":  "-",
                      "Total Projects": fiscalData?.total_projects || '-',
                      "Total Project Hours": fiscalData?.total_project_hours || "-",
                      "Total Cost": formatNumberForExport(fiscalData?.total_project_cost, child_currency_symbol) || "-",
                      "Estimated R&D Hours": fiscalData?.qualifying_project_hours_fed || "-",
                      "QRE": formatNumberForExport(fiscalData?.qualifying_project_qre_fed, child_currency_symbol) || "-",
                      "Estimated R&D Credits": formatNumberForExport(fiscalData?.qualifying_project_rd_credits_fed, child_currency_symbol) || "-",
                      "Actual R&D Credits": formatNumberForExport(fiscalData?.total_projects_rd_credits, child_currency_symbol) || "-",
                      "Finance Executive": '-',
                      "Finance Lead": '-',
                      "Professional Services Consultant": '-',
                      "Account ID": '-'        
                     });  
                  });
                }
            });
          
         
          }
          
        });
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            account: exportDetails
          },
        };
      } catch (err) {
        return this.throwServiceError(err as Error);
      }
    }
  
  async createAccount(accountData: IAccount, userId:string,file:Express.Multer.File): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { account: any };
  }> {
    try {
      const repository = this.getAccountRepository();
      let parent_account = null;
      const {
        account_name,
        comments,
        parent_account_rid,
        country_rid,
        currency_rid,
        industry_rid,
        industry_name_other,
        region_rid,
        data_storage,
        status_rid,
        annual_revenue,
        key_contacts,
        organisation_name
      } = accountData;

      if (data_storage === "store_in_parent" && !parent_account_rid) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Parent account is required for data storage in parent",
        };
      }

      const isUnique = await this.checkIsAccounUnique(account_name);
      if(!isUnique){
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `An account with the name "${account_name}" already exists. Please choose a different name.`
        };
      }

      const isUniqueOrg = await this.checkIsAccounOrgUnique(organisation_name);
      if(!isUniqueOrg){
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `An account with the organisation name "${organisation_name}" already exists. Please choose a different name.`
        };
      }

      if (parent_account_rid !== null) {
        const parent_account = await repository.findOne({
          where: {
            rid: parent_account_rid,
          },
        });
        if (!parent_account) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: HttpStatus.BAD_REQUEST_MESSAGE,
            errorMessage: "Parent account not found",
          };
        }
      }

      if (data_storage === "store_in_parent" && parent_account_rid !== null) {
        parent_account = await repository.findOne({
          where: {
            rid: parent_account_rid || "",
          },
        });
      }

      let professional_services_consultant = '';
      let finance_executive = '';
      let finance_lead = '';

      for (const contact of key_contacts) {
        const role = await this.schemaService.getKeyContactRoleById(contact.key_contact_role);
        const roleName = (role as any)?.role_name;

        if (contact.is_primary_contact) {
          if (roleName === 'Professional Services Consultant' && !professional_services_consultant) {
            professional_services_consultant = contact.key_contact_name;
          } else if (roleName === 'Client Finance Executive' && !finance_executive) {
            finance_executive = contact.key_contact_name;
          } else if (roleName === 'Client Finance Lead' && !finance_lead) {
            finance_lead = contact.key_contact_name;
          }
        }
        // Optional: Exit early if all 3 are found
        if (professional_services_consultant && finance_executive && finance_lead) {
          break;
        }
      }

      const account = await repository.create({
        account_name,
        comments: comments || "",
        // r_number: "fnfdfn",
        region_rid: region_rid,
        is_parent: parent_account_rid ? false : true,
        parent_account_rid: parent_account_rid || null,
        storage_type: data_storage,
        country_rid:country_rid,
        currency_rid:currency_rid,
        industry_rid: industry_rid,
        industry_name_other: industry_name_other,
        status_rid,
        created_by: userId,
        annual_revenue: annual_revenue  || null,
        organisation_name,
        professional_services_consultant,
        finance_executive,
        finance_lead
      });
      if(account.rid && file)
      {
        if(file)
            {
             const file_url = await uploadToAzureBlob(file,account.rid);
              await repository.update({logo_url: file_url},
              { where: { rid: account.rid},
                returning: true
              })
            }
      }
      if (parent_account && data_storage === "store_in_parent") {
        await this.schemaService.insertAccountDetails(
          parent_account?.r_number || '',
          accountData,
          account.rid,
          userId
        );
         await this.insertClientTemplateDetails(
          parent_account?.r_number || '',
          account.rid
        );
        await this.schemaService.manageKeyContacts(
          key_contacts,
          account.rid,
          userId,
          parent_account?.r_number || '',
        );
      } else {
        if (account.r_number) {
          await this.schemaService.createNewSchema(account.r_number);
        }
        await this.schemaService.insertAccountDetails(
          account.r_number || '',
          accountData,
          account.rid,
          userId
        );
         await this.insertClientTemplateDetails(
          account.r_number || '',
          account.rid
        );
        await this.schemaService.manageKeyContacts(
          key_contacts,
          account.rid,
          userId,
          account.r_number || '',
        );
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          account,
        },
      };
    } catch (err) {
      console.error(err);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Account creation failed.",
      }
    }
  }
async insertClientTemplateDetails(
  account_number: string,
  account_rid: string,
) {
  const entityTypes = ['resource','resource_cost','resource_skill','project','project_resource'];
  
  // Loop through each entity type
  for (const entity of entityTypes) {
    try {
      // Step 1: Insert client template details for the current entity
      const templateDetailsRid = await this.schemaService.insertClientTemplateDetails(
        account_number,
        entity,
        entity,
        account_rid
      );

      const tableSchema = getTableSchemaByEntity(entity);
      // Step 2: Insert metadata using the rid from the previous step
      await this.schemaService.insertClientTemplateMetaDataDetails(
        account_number,
        entity,
        tableSchema,
        templateDetailsRid,
        account_rid
      );
    } catch (error) {
      console.error(`Error processing entity "${entity}":`, error);
      throw error; // Propagate the error if needed
    }
  }
}


  async updateAccount(accountData: IUpdateAccount, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { affectedCounts: number };
  }> {
    try {
      const repository = this.getAccountRepository();
      const {
        account_rid,
        account_name,
        comments,
        status_rid,
        annual_revenue,
        region_rid,
        data_storage,
        country_rid,
        currency_rid,
        industry_rid,
        industry_name_other,
        key_contacts,
        parent_account_rid,
        logo_url,
        organisation_name
      } = accountData;

      // Check if account name already exists before update
      const existingAccount = await repository.findOne({
        where: {
          account_name: { [Op.iLike]: account_name }, // Case insensitive comparison
          rid: { [Op.ne]: account_rid } // Exclude current account
        }
      });

       // Check if organisation name already exists before update
      const existingOrgAccount = await repository.findOne({
      where: {
        [Op.and]: [
          where(fn('LOWER', col('organisation_name')), Op.eq, organisation_name.toLowerCase()),
          { rid: { [Op.ne]: account_rid } }
        ]
        }
      });



      if (existingAccount) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `An account with the name "${account_name}" already exists. Please choose a different name.`
        };
      }
      if (existingOrgAccount) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `An account with the organisation name "${organisation_name}" already exists. Please choose a different name.`
        };
      }

      let parent_account: any = null;

      if (data_storage === "store_in_parent" && parent_account_rid !== null) {
        parent_account = await repository.findOne({
          where: {
            rid: parent_account_rid || "",
          },
        });
      }

      let professional_services_consultant = '';
      let finance_executive = '';
      let finance_lead = '';

      for (const contact of key_contacts) {
        const role = await this.schemaService.getKeyContactRoleById(contact.key_contact_role);
        const roleName = (role as any)?.role_name;

        if (contact.is_primary_contact) {
          if (roleName === 'Professional Services Consultant' && !professional_services_consultant) {
            professional_services_consultant = contact.key_contact_name;
          } else if (roleName === 'Client Finance Executive' && !finance_executive) {
            finance_executive = contact.key_contact_name;
          } else if (roleName === 'Client Finance Lead' && !finance_lead) {
            finance_lead = contact.key_contact_name;
          }
        }
        // Optional: Exit early if all 3 are found
        if (professional_services_consultant && finance_executive && finance_lead) {
          break;
        }
      }


      const [affectedCounts, affectedRows] = await repository.update(
        {
          account_name,
          comments: comments || "",
          status_rid,
          region_rid: region_rid,
          country_rid: country_rid,
          currency_rid: currency_rid,
          industry_rid: industry_rid,
          modified_by: userId,
          industry_name_other: industry_name_other,
          annual_revenue: annual_revenue || null,
          modified_datetime: new Date(),
          logo_url:logo_url,
          organisation_name,
          professional_services_consultant,
          finance_executive,
          finance_lead,
        },
        {
          where: {
            rid: account_rid,
          },
          returning: true,
        }
      );

      const default_parent_id = affectedRows[0].parent_account_rid;
      const default_r_number = affectedRows[0].r_number;

      if (default_parent_id && data_storage === "separate_db") {
        await this.schemaService.updateAccountDetails(
          account_rid,
          accountData,
          default_r_number || '',
          userId
        );
        await this.schemaService.manageKeyContacts(
          key_contacts,
          account_rid,
          userId,
          default_r_number || '',
        );
      }

      if (default_parent_id && data_storage === "store_in_parent") {
        await this.schemaService.updateAccountDetails(
          account_rid,
          accountData,
          parent_account?.r_number,
          userId
        );
        await this.schemaService.manageKeyContacts(
          key_contacts,
          account_rid,
          userId,
          parent_account?.r_number,
        );
      }

      if (default_parent_id === null) {
        this.schemaService.updateAccountDetails(
          account_rid,
          accountData,
          default_r_number || '',
          userId
        );
        this.schemaService.manageKeyContacts(
          key_contacts,
          account_rid,
          userId,
          default_r_number || '',
        );
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          affectedCounts,
        },
      };
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `An account with the name "${accountData.account_name}" already exists. Please choose a different name.`
        }
      }
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: (err as Error).message,
      };
    }
  }

  async globalAccounts(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { gloablAcconunt: any; count: number };
  }> {
    try {
      const repository = await this.getAccountRepository();
      const gloablAcconunt = await repository.findAll({
        where: {
          parent_account_rid: {
            [Op.is]: null,
          } as any,
        },
        attributes: ["rid", "account_name"],
         order: [["account_name", "ASC"]] 
      });
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          gloablAcconunt,
          count: gloablAcconunt.length,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

async accountById(account_id: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { accountById: any; accountDetails: any };
  }> {
    try {
      const repository = await this.getAccountRepository();
      let accountById = await repository.findOne({
        where: {
          rid: account_id,
        },
        include: [
          {
            model: Account,
            as: "child_accounts",
            required: false,
          },
          {
            model: Country,
            as: "country",
            attributes: ["country_name","country_code"],
            required: false,
          },
          {
            model: States,
            as: "region_details",
            attributes: ["state_name"],
            required: false,
          },
          {
            model: Currency,
            as: "currency",
            attributes: ["currency_code", "currency_symbol"],
            required: false,
          },
          {
            model: Industry,
            as: "industry",
            attributes: ["industry_name"],
            required: false,
          },
          {
            model: Account,
            as: "parent_account",
            attributes: ["account_name"],
            required: false,
          },
          {
            model: Industry,
            as: "industry",
            attributes: ["rid", "industry_name"],
            required: false,
          },
          {
            model: Status,
            as: 'status',
            attributes: [['status_description','status_name']],
            required: false,
        }
        ],
      });

      // Get USD currency_rid
      const usdCurrency = await this.getUSDCurrency();

      // If currency_rid is null or empty, assign USD currency
      if (!accountById?.currency_rid || accountById.currency_rid === '') {
        if (accountById) {
          accountById.currency_rid = usdCurrency?.rid;
          (accountById as any).setDataValue('currency', usdCurrency);
        }
      }

      let acconuntNumber = accountById?.r_number || "";
      if(accountById?.storage_type === "store_in_parent"){
        const parentAccount = await repository.findOne({
          where: {
            rid: accountById.parent_account_rid || ""
          }
        })
        acconuntNumber = parentAccount?.r_number || "";
      }

      const accountDetails = await this.schemaService.fetchAccountDetails(
        acconuntNumber,
        accountById?.rid || "",
      );

      // Fetch key contacts for the account
      const keyContacts = await this.schemaService.fetchKeyContacts(
        accountById?.rid || "",
        acconuntNumber
      );

      // Fetch attachments for the account
      const attachments = await this.schemaService.fetchAttachments(
        account_id,
      );

      let userNames;
      if(accountById)
      {
         userNames = await this.fetchUserNames({
            created_by: accountById?.created_by || "",
            modified_by: accountById?.modified_by || "",
          });
        (accountById as any).dataValues.created_by = userNames.created_by_name;
        (accountById as any).dataValues.modified_by = userNames.modified_by_name;
      }
    
      accountById = await this.schemaService.insertIndustyName(accountById);

      // Add key contacts and attachments to account details
      const accountData = {
        ...accountDetails.length > 0 ? accountDetails[0] : {},
        keyContacts: keyContacts.length > 0 ? keyContacts : [],
        attachments: attachments.length > 0 ? attachments : [],
        created_by: accountDetails.length > 0 ? userNames?.created_by_name || "" : "",
        modified_by: accountDetails.length > 0 ? userNames?.modified_by_name || "" : ""
      };

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          accountById,
          accountDetails: accountData,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async getKeyContactRoles(
    entity_type: string,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { keyContactRoles: any };
  }> {
    try {
      const keyContactRoles = await this.schemaService.fetchKeyContactRoles(entity_type);
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          keyContactRoles,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }
  
   /**
   * Fetches user names for user IDs from the main database
   * @param userIds - Object containing user IDs (created_by, modified_by)
   * @returns Promise resolving to object with user names
   */
  private async fetchUserNames(userIds: { created_by?: string, modified_by?: string }): Promise<{ created_by_name: string, modified_by_name: string }> {
    const result = {
      created_by_name: '',
      modified_by_name: ''
    };
    
    try {
      
      // Fetch created_by user name if ID exists
      if (userIds.created_by) {
        const [createdByUser] = await this.schemaService.fetchUserNames(userIds.created_by)
        if (createdByUser) {
          result.created_by_name = (createdByUser as any).full_name;
        }
      }
      
      // Fetch modified_by user name if ID exists
      if (userIds.modified_by) {
        const [modifiedByUser] = await this.schemaService.fetchUserNames(userIds.modified_by)    
        if (modifiedByUser) {
          result.modified_by_name = (modifiedByUser as any).full_name;
        }
      }
    } catch (error) {
      console.error('Error fetching user names:', error);
      // Return empty strings if there's an error
    }
    
    return result;
  }
  async listAllAccounts(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { accountData: any; orgData: any };
  }> {
    try {
      const repository = await this.getAccountRepository();
      const accountData = await repository.findAll({
        where: {
          organisation_name: {
            [Op.ne]: '',
          },
        },
        include: [
          {
            model: Status,
            as: 'status',
            where: {
              status_description: 'active',
            },
            attributes: [],
            required: true,
          },
        ],
        attributes: ['rid', 'account_name', 'organisation_name'],
        order: [['organisation_name', 'ASC']],
      });

      const orgData = await this.schemaService.getOrgInfo();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          accountData,
          orgData
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }
  
  async listGlobalAccounts(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { gloablAcconunt: any; count: number };
  }> {
    try {
      const repository = await this.getAccountRepository();
      const gloablAcconunt = await repository.findAll({
        where: {
          parent_account_rid: {
            [Op.is]: null,
          } as any,
        },
        attributes: ["rid", "account_name"],
        include: [
          {
            model: Account,
            as: "child_accounts",
            attributes: ["rid", "account_name"],
            required: false,
            separate: true,  // Ensures child ordering works
            order: [["account_name", "ASC"]]
          }
        ],
        order: [["account_name", "ASC"]]
      });
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          gloablAcconunt,
          count: gloablAcconunt.length,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  buildWhereClause(
    filters: Record<string, any>,
    search: string
  ): {
    whereClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};

    if (search) {
      whereClause = this.buildSearchCondition(search, whereClause);
    }
    whereClause = this.applyFilters(filters, whereClause);

    return { whereClause };
  }

  private buildSearchCondition(
    search: string,
    whereClause: Record<string, any>
  ): Record<string, any> {
    const searchCondition = {
      [Op.or]: [
        { account_name: { [Op.iLike]: `%${search}%` } },
        { r_number: { [Op.iLike]: `%${search}%` } },
        { industry: { [Op.iLike]: `%${search}%` } },
        { status: { [Op.iLike]: `%${search}%` } },
        { eid: { [Op.iLike]: `%${search}%` } }, // Added Account ID search
        { "$country.country_name$": { [Op.iLike]: `%${search}%` } },
        { "$currency.currency_code$": { [Op.iLike]: `%${search}%` } },
        ...(isNaN(parseInt(search))
          ? []
          : [{ annual_revenue: { [Op.eq]: parseInt(search) } }]),
      ],
    };

    return Object.keys(whereClause).length > 0
      ? { [Op.and]: [whereClause, searchCondition] }
      : searchCondition;
  }

  private applyFilters(
    filters: Record<string, any>,
    whereClause: Record<string, any>
  ): Record<string, any> {
    // Handle special filters first
    if (filters && filters.parent_account) {
      whereClause = this.applyParentAccountFilter(filters, whereClause);
    }

    if (filters.account_number) {
      whereClause = this.applyAccountNumberFilter(filters, whereClause);
    }

    // Handle standard filters
    if (filters.account_name) {
      whereClause.account_name = this.getFieldFilter(filters.account_name, "account_name");
    }

    if (filters.professional_services_consultant) {
      whereClause.professional_services_consultant = this.getFieldFilter(filters.professional_services_consultant, "professional_services_consultant");
    }

    if (filters.finance_lead) {
      whereClause.finance_lead = this.getFieldFilter(filters.finance_lead, "finance_lead");
    }

    if (filters.finance_executive) {
      whereClause.finance_executive = this.getFieldFilter(filters.finance_executive, "finance_executive");
    }

    if (filters.account_id) {
      whereClause.rid = this.getFieldFilter(filters.account_id, "rid");
    }

     if (filters.industry) {
      whereClause["$industry.industry_name$"] = this.getMultiValueFilter(filters.industry,"industry.industry_name");
    }

    if (filters.status) {
      whereClause.status = this.getFieldFilter(filters.status, "status");
    }

    if (filters.is_parent_account) {
      // Handle Yes/No filter for is_parent_account
      const isParent = filters.is_parent_account.toLowerCase() === 'yes';
      whereClause.is_parent = isParent;
    }

    if (filters.annual_revenue) {
      whereClause.annual_revenue = this.getNumericFilter(filters.annual_revenue,'annual_revenue');
    }

    if (filters.total_projects) {
      whereClause.total_projects = this.getNumericFilter(filters.total_projects,'total_projects');
    }
    if (filters.total_project_hours) {
      whereClause.total_project_hours = this.getNumericFilter(filters.total_project_hours,'total_project_hours');
    }
    if (filters.total_project_cost) {
      whereClause.total_project_cost = this.getNumericFilter(filters.total_project_cost,'total_project_cost');
    }
    if (filters.qualifying_project_hours_fed) {
      whereClause.qualifying_project_hours_fed = this.getNumericFilter(filters.qualifying_project_hours_fed,'qualifying_project_hours_fed');
    }
    if (filters.qualifying_project_qre_fed) {
      whereClause.qualifying_project_qre_fed = this.getNumericFilter(filters.qualifying_project_qre_fed,'qualifying_project_qre_fed');
    }
    if (filters.qualifying_project_rd_credits_fed) {
      whereClause.qualifying_project_rd_credits_fed = this.getNumericFilter(filters.qualifying_project_rd_credits_fed,'qualifying_project_rd_credits_fed');
    }
    if (filters.total_projects_rd_credits) {
      whereClause.total_projects_rd_credits = this.getNumericFilter(filters.total_projects_rd_credits,'total_projects_rd_credits');
    }

    // Handle multi-select filters
    if (filters.country) {
      whereClause["$country.country_name$"] = this.getMultiValueFilter(filters.country,"country.country_name");
    }

    if (filters.currency) {
      whereClause["$currency.currency_code$"] = this.getMultiValueFilter(filters.currency,'currency.currency_code');
    }

    return whereClause;
  }

  private getFieldFilter(fieldFilter: any, dbField: string): any {

     const isUuidField = ['rid', 'industry_rid'].includes(dbField);
    if (fieldFilter.equals) {
      if (isUuidField) {
        // For UUID fields, use direct equality without LOWER function
        return { [Op.eq]: fieldFilter.equals };
      } else {
        // For text fields, use case-insensitive comparison
        return Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col(`Account.${dbField}`)),
          Sequelize.fn('LOWER', fieldFilter.equals)
        );
      }
    }
    if (fieldFilter.not_equals) {
      if (isUuidField) {
        // For UUID fields, use direct equality without LOWER function
        return { [Op.ne]: fieldFilter.not_equals };
      } else {
        // For text fields, use case-insensitive comparisos
        return Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col(`Account.${dbField}`)),
          '!=',
          Sequelize.fn('LOWER', fieldFilter.not_equals)
        );
      }
    }
    
    if (fieldFilter.contains) {
      return Sequelize.where(
        Sequelize.cast(Sequelize.col(`Account.${dbField}`), 'TEXT'),
        'ILIKE',
        `%${fieldFilter.contains}%`
      );
    }
    if (fieldFilter.is_empty !== undefined) {
    if (fieldFilter.is_empty) {
      return {
        [Op.or]: [
          Sequelize.where(Sequelize.col(`Account.${dbField}`), { [Op.is]: null }),
          Sequelize.where(Sequelize.col(`Account.${dbField}`), '')
        ]
      };
    }
  }
    // Handle simple value (for dropdown selections like status)
    if (typeof fieldFilter === 'string') {
      return { [Op.iLike]: fieldFilter };
    }
    return null;
  }

 private getNumericFilter(revenueFilter: any, columnName: string): any {
  const { 
    greater_than, 
    less_than, 
    between, 
    equals, 
    not_equals, 
    is_empty 
  } = revenueFilter;

  // Always qualify the column with table name
  const qualifiedColumn = columnName.startsWith('Account.') ? 
    columnName : 
    `Account.${columnName}`;
  const column = Sequelize.col(qualifiedColumn);

if (is_empty !== undefined) {
    return {
      [Op.or]: [
        Sequelize.where(column, Op.is, null),
        Sequelize.where(column, Op.eq, 0)
      ]
    };
  }

  if (equals !== undefined) {
    return Sequelize.where(
      column,
      Op.eq,
      parseFloat(equals)
    );
  }

  if (not_equals !== undefined) {
    return {
      [Op.or]: [
        Sequelize.where(column, Op.ne, parseFloat(not_equals)),
        Sequelize.where(column, Op.is, null)
      ]
    };
  }

  if (greater_than !== undefined) {
    return Sequelize.where(
      column,
      Op.gt,
      parseFloat(greater_than)
    );
  }

  if (less_than !== undefined) {
    return Sequelize.where(
      column,
      Op.lt,
      parseFloat(less_than)
    );
  }
  if (between && Array.isArray(between) && between.length === 2) {
    const [min, max] = between.map(val => parseFloat(String(val)));
    return Sequelize.where(
      column,
      Op.between,
      [min, max]
    );
  }
  return null;
}
  private getMultiValueFilter(filter: any, fieldName: string): any {
  if (!filter) return null;

  const conditions: any[] = [];

  // Case-insensitive exact match
  if (typeof filter.equals === 'string') {
    conditions.push(Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col(fieldName)),
      '=',
      filter.equals.toLowerCase()
    ));
  }
 // Case-insensitive NOT EQUALS
  if (typeof filter.not_equals === 'string') {
    conditions.push(
      Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col(fieldName)),
        '!=',
        filter.not_equals.toLowerCase()
      )
    );
  }
  // Case-insensitive partial match
  if (typeof filter.contains === 'string') {
    conditions.push({
      [fieldName]: { [Op.iLike]: `%${filter.contains}%` },
    });
  }

  // Case-insensitive IN filter
  if (Array.isArray(filter.in) && filter.in.length > 0) {
    conditions.push({
      [Op.or]: filter.in.map((val: string) =>
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col(fieldName)),
          '=',
          val.toLowerCase()
        )
      ),
    });
  }

  // is_empty: match NULL or ''
  if (filter.is_empty === true) {
  conditions.push({
    [Op.or]: [
      Sequelize.where(Sequelize.col(fieldName), { [Op.is]: null }),
      Sequelize.where(Sequelize.col(fieldName), '')
    ]
  });
}

  if (conditions.length === 0) return null;

  return { [Op.and]: conditions };
}


  private applyParentAccountFilter(
    filters: Record<string, any>,
    whereClause: Record<string, any>
  ): Record<string, any> {
    if (filters.parent_account.contains) {
      whereClause["account_name"] = {
        [Op.iLike]: `%${filters.parent_account.contains}%`,
      };
      whereClause["is_parent"] = true;
    }
    if (filters.parent_account.equals) {
      whereClause["account_name"] = {
        [Op.iLike]: `${filters.parent_account.equals}`,
      };
      whereClause["is_parent"] = true;
    }
    return whereClause;
  }

  private applyAccountNumberFilter(
    filters: Record<string, any>,
    whereClause: Record<string, any>
  ): Record<string, any> {
    // Only search in the current account's r_number since child_accounts are fetched separately
    if (filters.account_number.contains) {
      whereClause.r_number = { [Op.iLike]: `%${filters.account_number.contains}%` };
    }
    if (filters.account_number.equals) {
      whereClause.r_number = Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col('Account.r_number')),
      filters.account_number.equals.toLowerCase()
  );
    }
    if (filters.account_number.not_equals) {
     whereClause.r_number = Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col('Account.r_number')),
      '!=',
      filters.account_number.not_equals.toLowerCase()
  );
      
    }
    return whereClause;
  }
 
  private applyAccountIDFilter(
    globalFilters: Record<string, string[]>,
    whereClause: Record<string, any>
  ): { parentWhereClause: Record<string, any>; childWhereClause: Record<string, any> } {
    // Parent: only get global filter and must have no parent_account
    let parentWhereClause: Record<string, any> = {
      parent_account_rid: { [Op.is]: null }
    };
  
    // Child: inherit original filters
    let childWhereClause: Record<string, any> = { ...whereClause };
  
    if (globalFilters && Object.keys(globalFilters).length > 0) {
      const parentIds = Object.keys(globalFilters);
      const childIds: string[] = Object.values(globalFilters).flat();
  
      // Parent account filtering
      parentWhereClause.rid = { [Op.in]: parentIds };
  
      // Child account filtering (on account_rid)
      if (childIds.length > 0) {
        childWhereClause.rid = { [Op.in]: childIds };
      }
    }
  
    return {
      parentWhereClause,
      childWhereClause
    };
  }  

  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "account_name",
      "status",
      "r_number",
      "industry",
      "is_parent",
      "country",
      "currency",
      "annual_revenue",
      "professional_services_consultant",
      "finance_lead",
      "finance_executive",
      "total_projects",
      "total_project_cost",
      "total_project_hours",
      "qualifying_project_hours_fed",
      "qualifying_project_qre_fed",
      "qualifying_project_rd_credits_fed",
      "total_projects_rd_credits"
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  private async checkIsAccounUnique(account_name: string): Promise<boolean> {
    const response = await Account.findOne({
      where: {
        account_name: {
          [Op.iLike]: account_name,
        },
      },
    });
    if (response && response.account_name) {
      return false;
    }
    return true;
  }

private async checkIsAccounOrgUnique(organisation_name: string): Promise<boolean> {
  const response = await Account.findOne({
    where: where(fn('LOWER', col('organisation_name')), Op.eq, organisation_name.toLowerCase())
  });

  return !response;
}
  

  private throwServiceError(err: Error): {
    statusCode: number;
    message: string;
    errorMessage: string;
  } {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }

  /**
   * Gets the USD currency record from the database
   * @returns USD currency record
   */
  private async getUSDCurrency() {
    return Currency.findOne({ where: { currency_code: 'USD' } });
  }
}


export default AccountService;
