import { Op, Sequelize,UniqueConstraintError  } from "sequelize";
import { HttpStatus } from "../utils/constant";
import { IAccount, IUpdateAccount,IKeyContactDetail } from "../utils/types";
import { getTableSchemaByEntity, uploadToAzureBlob} from  "../utils/helpers";
import SchemaService from "./schemaService";
import { models } from "../models";
import Decimal from "decimal.js";
import { States } from "../models/stateModel";
import currency from "currency.js";

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
    
    const {allWhereClause, childClause} = this.applyAccountIDFilter(globalFilters, whereClause);
    
    const offset = (page - 1) * limit;

    const [finalSortBy, finalSortOrder] = this.getSortParameters(
      sortBy,
      sortOrder
    );

    // Optimized order clause construction
    const order = this.buildOrderClause(
      finalSortBy, 
      finalSortOrder, 
      ['country', 'currency', 'industry', 'professional_services_consultant', 'finance_executive', 'finance_lead'],
      ["total_projects", "total_project_cost", "total_project_hours", "qualifying_project_hours_fed", "qualifying_project_qre_fed", "qualifying_project_rd_credits_fed", "total_projects_rd_credits"]
    );

    // Determine base where clause
    const baseWhereClause = { ...allWhereClause };
    if (!parsedFilters.is_parent_account || parsedFilters.is_parent_account.toLowerCase() !== 'no') {
      baseWhereClause.parent_account_rid = { [Op.is]: null } as any;
    }

    // Check for key contact filters
    const hasKeyContactFilter = !!(parsedFilters?.finance_executive || parsedFilters?.professional_services_consultant || parsedFilters?.finance_lead) ||
         ['professional_services_consultant', 'financial_lead', 'finance_executive'].includes(finalSortBy || '');

    // Optimized query options
    const queryOptions: any = {
      where: baseWhereClause,
      order,
      include: this.buildBaseIncludes(),
      attributes: ['rid', 'account_name', 'currency_rid', 'total_project_hours', 'total_projects', 'total_project_cost','total_projects_rd_credits', 'qualifying_project_hours_fed', 'qualifying_project_qre_fed', 'qualifying_project_rd_credits_fed','r_number','storage_type'] // Only select needed fields initially
    };

    // Only apply pagination if key_contact filter is NOT present
    if (!hasKeyContactFilter) {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    // Get parent accounts with minimal data first
    const parentAccounts = await repository.findAll(queryOptions);

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
          ...(Object.keys(childClause).length > 0 ? childClause : {}),
        },
        include: this.buildChildIncludes(),
        order: [["account_name", "ASC"]],
        attributes: ['rid', 'account_name', 'parent_account_rid', 'currency_rid', 'total_project_hours', 
          'total_projects', 'total_project_cost','total_projects_rd_credits', 'qualifying_project_hours_fed', 'qualifying_project_qre_fed', 'qualifying_project_rd_credits_fed','r_number','storage_type','parent_account_rid'
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

    // Attach child accounts to parents
    parentAccounts.forEach((account: any) => {
      account.setDataValue('child_accounts', childAccountsByParent.get(account.rid) || []);
    });

    // Get full account data only for the needed records
    const updatedAccount = await this.schemaService.insertKeyContactInfo(
      parentAccounts,
      filters,
      limit,
      offset,
      finalSortBy,
      finalSortOrder,
      'create'
    );

    // Optimize count query
    const totalCount = await this.getOptimizedCount(repository, baseWhereClause);

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
  sortBy: string,
  sortOrder: string,
  excludedFields: string[],
  numericFields: string[]
): any[] {
  const order: any[] = [];
  
  if (!sortBy || excludedFields.includes(sortBy)) return order;

  if (numericFields.includes(sortBy)) {
    order.push([
      Sequelize.cast(Sequelize.col(sortBy), 'DECIMAL'),
      sortOrder
    ]);
  } else {
    order.push([sortBy, sortOrder]);
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
        
        // Parse filters if it's a string
        const parsedFilters = typeof filters === 'string' ? 
          (filters === '{}' ? {} : JSON.parse(filters)) : filters;
              
        const { whereClause } = this.buildWhereClause(parsedFilters, search);
        
        const {allWhereClause, childClause} = this.applyAccountIDFilter(globalFilters, whereClause);
  
        const [finalSortBy, finalSortOrder] = this.getSortParameters(
          sortBy,
          sortOrder
        );

      const order: any[] = [];
      const excludedSortFields = [
        'country',
        'currency',
        'industry',
        'finance_lead',
        'finance_executive',
        'professional_services_consultant'
      ];
      const numericFields = [
        "total_projects",
        "total_project_cost",
        "total_project_hours",
        "qualifying_project_hours_fed",
        "qualifying_project_qre_fed",
        "qualifying_project_rd_credits_fed",
        "total_projects_rd_credits"
      ];
      if (finalSortBy && !excludedSortFields.includes(finalSortBy)) {
        if (numericFields.includes(finalSortBy)) {
        order.push([
          Sequelize.cast(Sequelize.col(finalSortBy), 'DECIMAL'),
          finalSortOrder
        ]);
      } else {
        order.push([finalSortBy, finalSortOrder]);
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
  
        // Determine if we should include the parent_account_rid filter
        // Only apply this filter if is_parent_account is not set to "NO"
        const baseWhereClause = { ...allWhereClause };
        
        // If is_parent_account filter is not "NO", only get accounts with null parent_account_rid
        if (!parsedFilters.is_parent_account || parsedFilters.is_parent_account.toLowerCase() !== 'no') {
          baseWhereClause.parent_account_rid = { [Op.is]: null } as any;
        }
  
        // First, get accounts based on the filters
        const parentAccounts = await repository.findAll({
          where: baseWhereClause,
          order,
          include: [
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
          ],
        });
  
        // Then, for each account, fetch its child accounts separately
        const accountIds = parentAccounts.map((account: any) => account.rid);
        
        if(accountIds.length > 0) {
          const childAccounts = await repository.findAll({
            where: {
              parent_account_rid: {
                [Op.in]: accountIds,
              },
              ...(Object.keys(childClause).length > 0 ? childClause : {}),
            },
            include: [
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
                model: Industry,
                as: "industry",
                attributes: ["rid", "industry_name"],
              },
              {
                model: Account,
                as: "parent_account",
                attributes: ["rid", "account_name"],
              },
            ],
            order: [["account_name", "ASC"]]
          });
  
          // Group child accounts by parent_account_rid
          const childAccountsByParent = childAccounts.reduce((acc: any, child: any) => {
            if (!acc[child.parent_account_rid]) {
              acc[child.parent_account_rid] = [];
            }
            acc[child.parent_account_rid].push(child);
            return acc;
          }, {});
  
          // Attach child accounts to their respective parent accounts
          parentAccounts.forEach((account: any) => {
            account.setDataValue('child_accounts', childAccountsByParent[account.rid] || []);
          });
        } else {
          // If no parent accounts found, set empty child_accounts array
          parentAccounts.forEach((account: any) => {
            account.setDataValue('child_accounts', []);
          });
        }
        const updatedAccount = await this.schemaService.insertKeyContactInfo(parentAccounts,filters,0,0,finalSortBy,finalSortOrder,'download');
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
          const num = Number(value);
          if (isNaN(num)) return '-';
          // Use currency.js to format the number with the provided currency symbol
          return currency(num, {
            symbol: currency_symbol? currency_symbol : '$',
            precision: 2,
            pattern: '! #',
            separator: ',',
            decimal: '.'
          }).format();
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
                      "Industry": child?.industry?.industry_name || "-",
                      "Country": child?.country?.country_name || "-",
                      "Total Projects": fiscalData?.total_projects || '-',
                      "Total Project Hours": fiscalData?.total_project_hours || "-",
                      "Total Cost": formatNumberForExport(fiscalData?.total_project_cost, child_currency_symbol) || "-",
                      "Estimated R&D Hours": fiscalData?.qualifying_project_hours_fed || "-",
                      "QRE": formatNumberForExport(fiscalData?.qualifying_project_qre_fed, child_currency_symbol) || "-",
                      "Estimated R&D Credits": formatNumberForExport(fiscalData?.qualifying_project_rd_credits_fed, child_currency_symbol) || "-",
                      "Actual R&D Credits": formatNumberForExport(fiscalData?.total_projects_rd_credits, child_currency_symbol) || "-",
                      "Finance Executive":child?.finance_executive || '-',
                      "Finance Lead":child?.finance_lead || '-',
                      "Professional Services Consultant":child?.professional_services_consultant || '-',
                      "Account ID": child?.r_number || "-"        
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
        account_country_rid,
        account_currency_rid,
        industry_rid,
        industry_name_other,
        account_country_region_rid,
        data_storage,
        status,
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

      const account = await repository.create({
        account_name,
        comments: comments || "",
        // r_number: "fnfdfn",
        region: account_country_region_rid,
        is_parent: parent_account_rid ? false : true,
        parent_account_rid: parent_account_rid || null,
        storage_type: data_storage,
        country_rid:account_country_rid,
        currency_rid:account_currency_rid,
        industry_rid: industry_rid,
        industry_name_other: industry_name_other,
        status,
        created_by: userId,
        modified_by: userId,
        annual_revenue: annual_revenue ? new Decimal(annual_revenue).toNumber().toString() : "",
        organisation_name
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
        status,
        annual_revenue,
        account_country_region_rid,
        data_storage,
        account_country_rid,
        account_currency_rid,
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
          organisation_name: { [Op.iLike]: organisation_name }, // Case insensitive comparison
          rid: { [Op.ne]: account_rid } // Exclude current account
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

      const [affectedCounts, affectedRows] = await repository.update(
        {
          account_name,
          comments: comments || "",
          status,
          region: account_country_region_rid,
          country_rid: account_country_rid,
          currency_rid: account_currency_rid,
          industry_rid: industry_rid,
          modified_by: userId,
          industry_name_other: industry_name_other,
          annual_revenue: annual_revenue ? new Decimal(annual_revenue).toNumber().toString() : "",
          modified_datetime: new Date(),
          logo_url:logo_url,
          organisation_name
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

      // Add key contacts to account details
      const accountData = {
        ...accountDetails.length > 0 ? accountDetails[0] : {},
        keyContacts: keyContacts.length > 0 ? keyContacts : [],
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
          status: 'active',
           organisation_name: {
          [Op.ne]: '',
        },    
        },
        attributes: ["rid", "account_name","organisation_name"],
        order: [['organisation_name', 'ASC']]
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

  // Handle empty strings and invalid values by casting to NULL first
   const column = Sequelize.literal(`
    CAST(
      NULLIF("${columnName}", '') 
      AS DOUBLE PRECISION
    )
  `);

  if (is_empty !== undefined) {
    return {
      [Op.or]: [
        { [columnName]: null },
        { [columnName]: '' },
        Sequelize.where(column, Op.is, null)
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
    allIds: Record<string, string[]>,
    whereClause: Record<string, any>
  ): { allWhereClause: Record<string, any>; childClause: Record<string, any> } {
    let newWhereClause = whereClause;
    let childClause: Record<string, any> = {};
  
    if (allIds && Object.keys(allIds).length > 0) {
      const parentIds = Object.keys(allIds);
      const childIds = Object.values(allIds).flat();
  
      newWhereClause = {
        ...whereClause,
        [Op.or]: [
          { rid: { [Op.in]: parentIds } }
        ]
      };
  
      childClause = { rid: { [Op.in]: childIds } };
    }
  
    return {
      allWhereClause: newWhereClause,
      childClause
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
      where: {
        organisation_name: {
          [Op.eq]: organisation_name,
        },
      },
    });
    if (response && response.organisation_name) {
      return false;
    }
    return true;
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
