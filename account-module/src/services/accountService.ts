import { Op } from "sequelize";
import { HttpStatus } from "../utils/constant";
import { IAccount, IUpdateAccount } from "../utils/types";
import SchemaService from "./schemaService";
import { models } from "../models";

const { Account, Country, Currency } = models;

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

  private _childNameFilter: any = null;

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
      
      // Parse filters if it's a string
      const parsedFilters = typeof filters === 'string' ? 
        (filters === '{}' ? {} : JSON.parse(filters)) : filters;
      
      console.log("Filters:", parsedFilters);

      // Check if we need to filter child accounts by name
      this._childNameFilter = null;
      if (parsedFilters.account_name && parsedFilters.parent_account) {
        this._childNameFilter = parsedFilters.account_name;
        delete parsedFilters.account_name; // Remove from parent filters
      }
      
      const { whereClause } = this.buildWhereClause(parsedFilters, search);
      console.log("Where Clause:", JSON.stringify(whereClause, this.symbolReplacer));
      
      const {allWhereClause, childClause} = this.applyAccountIDFilter(globalFilters, whereClause);
      console.log("All Where Clause:", JSON.stringify(allWhereClause, this.symbolReplacer));
      
      const offset = (page - 1) * limit;

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );

      const order: any[] = [];

      if (finalSortBy !== "country" && finalSortBy !== "currency") {
        order.push([finalSortBy, finalSortOrder]);
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

      // Determine if we should include the parent_account_rid filter
      // Only apply this filter if is_parent_account is not set to "NO"
      const baseWhereClause = { ...allWhereClause };
      
      // Only filter for parent accounts if explicitly requested with is_parent_account=yes
      // or if parent_account filter is provided
      if (parsedFilters.is_parent_account && parsedFilters.is_parent_account.toLowerCase() === 'yes' || 
          parsedFilters.parent_account) {
        baseWhereClause.parent_account_rid = { [Op.is]: null } as any;
      }

      // First, get accounts based on the filters
      const parentAccounts = await repository.findAll({
        where: baseWhereClause,
        limit,
        offset,
        order,
        include: [
          {
            model: Country,
            as: "country",
            attributes: ["rid", "country_name"],
            required: true,
          },
          {
            model: Currency,
            as: "currency",
            attributes: ["rid", "currency_code"],
            required: true,
          }
        ],
      });

      // Then, for each account, fetch its child accounts separately
      const accountIds = parentAccounts.map((account: any) => account.rid);
      
      if(accountIds.length > 0) {

        // Build child where clause
        let childWhereClause: any = {
          parent_account_rid: {
            [Op.in]: accountIds,
          }
        };
        
        // Apply child name filter if it exists
        if (this._childNameFilter) {
          const childNameFilter = this.getFieldFilter(this._childNameFilter, "account_name");
          if (childNameFilter) {
            childWhereClause.account_name = childNameFilter;
          }
        }
        
        // Apply other child filters
        if (Object.keys(childClause).length > 0) {
          childWhereClause = {
            ...childWhereClause,
            ...childClause
          };
        }

        const childAccounts = await repository.findAll({
          where: childWhereClause,  // Use the childWhereClause here instead
          include: [
            {
              model: Country,
              as: "country",
              attributes: ["rid", "country_name"]
            },
            {
              model: Currency,
              as: "currency",
              attributes: ["rid", "currency_code"]
            },
            {
              model: Account,
              as: "parent_account",
              attributes: ["rid", "account_name"],
            },
          ]
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

        if (this._childNameFilter) {
          const filteredParents = parentAccounts.filter((account: any) => {
            const children = account.getDataValue('child_accounts') || [];
            return children.length > 0;
          });
          
          // Update the parent accounts list
          parentAccounts.length = 0;
          filteredParents.forEach((account: any) => {
            parentAccounts.push(account);
          });
        }
      } else {
        // If no parent accounts found, set empty child_accounts array
        parentAccounts.forEach((account: any) => {
          account.setDataValue('child_accounts', []);
        });
      }
      
      let totalCount = 0;
      if (this._childNameFilter && parentAccounts.length > 0) {
        // If we filtered by child name, count should be the number of filtered parents
        totalCount = parentAccounts.length;
      } else {
        // Check if we have country or currency filters that need joins
        const needsJoins = whereClause["$country.country_name$"] || whereClause["$currency.currency_code$"];
        
        if (needsJoins) {
          // Use findAndCountAll with the same joins when we have country/currency filters
          const countResult = await repository.findAndCountAll({
            where: baseWhereClause,
            include: [
              {
                model: Country,
                as: "country",
                attributes: [],
                required: true,
              },
              {
                model: Currency,
                as: "currency",
                attributes: [],
                required: true,
              }
            ],
            distinct: true,
            limit: 1, // We only need the count
          });
          totalCount = countResult.count;
        } else {
          // Use simple count for queries without joins
          totalCount = await repository.count({
            where: baseWhereClause,
            distinct: true
          });
        }
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          account: parentAccounts,
          count: totalCount,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async createAccount(accountData: IAccount): Promise<{
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
        account_description,
        parent_account_rid,
        account_country_rid,
        account_currency_rid,
        industry,
        primary_contact_name,
        account_country_region_rid,
        data_storage,
        status,
        annual_revenue,
      } = accountData;

      if (data_storage === "store_in_parent" && !parent_account_rid) {
        throw new Error(
          "Please select global account to store in parent account"
        );
      }

      const isUnique = await this.checkIsAccounUnique(account_name);
      if(!isUnique){
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `An account with the name "${account_name}" already exists. Please choose a different name.`
        };
      }

      if (parent_account_rid !== null) {
        const parent_account = await repository.findOne({
          where: {
            rid: parent_account_rid,
          },
        });
        if (!parent_account) {
          throw new Error("Invalid parent account");
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
        account_description: account_description || "",
        r_number: "fnfdfn",
        region: parent_account
          ? parent_account.region
          : account_country_region_rid,
        is_parent: parent_account_rid ? false : true,
        parent_account_rid: parent_account_rid || null,
        storage_type: data_storage,
        country_rid: parent_account
          ? parent_account.country_rid
          : account_country_rid,
        currency_rid: parent_account
          ? parent_account.currency_rid
          : account_currency_rid,
        industry,
        primary_contact_name,
        status,
        annual_revenue,
      });

      if (parent_account && data_storage === "store_in_parent") {
        await this.schemaService.insertAccountDetails(
          parent_account?.r_number,
          accountData,
          account.rid
        );
      } else {
        await this.schemaService.createNewSchema(account.r_number);
        await this.schemaService.insertAccountDetails(
          account.r_number,
          accountData,
          account.rid
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
      return this.throwServiceError(err as Error);
    }
  }

  async updateAccount(accountData: IUpdateAccount): Promise<{
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
        account_description,
        status,
        annual_revenue,
        account_country_region_rid,
        data_storage,
        account_country_rid,
        account_currency_rid,
        industry,
        primary_contact_name
      } = accountData;

      const [affectedCounts, affectedRows] = await repository.update(
        {
          account_name,
          account_description: account_description || "",
          status,
          region: account_country_region_rid,
          country_rid: account_country_rid,
          currency_rid: account_currency_rid,
          industry,
          primary_contact_name,
          annual_revenue,
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
        this.schemaService.updateAccountDetails(
          account_rid,
          accountData,
          default_r_number
        );
      }

      if (default_parent_id === "store_in_parent") {
        this.schemaService.updateAccountDetails(
          default_parent_id,
          accountData,
          default_r_number
        );
      }

      if (default_parent_id === null) {
        this.schemaService.updateAccountDetails(
          account_rid,
          accountData,
          default_r_number
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
      const accountById = await repository.findOne({
        where: {
          rid: account_id,
        },
        include: [
          {
            model: Account,
            as: "child_accounts",
          },
          {
            model: Country,
            as: "country",
            attributes: ["country_name"],
            required: true,
          },
          {
            model: Currency,
            as: "currency",
            attributes: ["currency_code"],
            required: true,
          },
          {
            model: Account,
            as: "parent_account",
            attributes: ["account_name"],
          },
        ],
      });

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
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          accountById,
          accountDetails: accountDetails.length > 0 ? accountDetails[0] : {},
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
        { primary_contact_name: { [Op.iLike]: `%${search}%` } },
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
      whereClause.eid = this.getFieldFilter(filters.account_id, "eid");
    }

    if (filters.industry) {
      whereClause.industry = this.getFieldFilter(filters.industry, "industry");
    }

    if (filters.status) {
      whereClause.status = this.getFieldFilter(filters.status, "status");
    }

    if (filters.primary_contact) {
      whereClause.primary_contact_name = this.getFieldFilter(filters.primary_contact, "primary_contact_name");
    }

    if (filters.is_parent_account) {
      // Handle Yes/No filter for is_parent_account
      const isParent = filters.is_parent_account.toLowerCase() === 'yes';
      whereClause.is_parent = isParent;
    }

    if (filters.annual_revenue) {
      whereClause.annual_revenue = this.getAnnualRevenueFilter(filters.annual_revenue);
    }

    // Handle multi-select filters
    if (filters.country) {
      whereClause["$country.country_name$"] = this.getMultiValueFilter(filters.country);
    }

    if (filters.currency) {
      whereClause["$currency.currency_code$"] = this.getMultiValueFilter(filters.currency);
    }

    return whereClause;
  }



  private symbolReplacer(key: string, value: any): any {
    if (typeof value === "symbol") {
      return value.toString(); // Converts Symbol(Op.or) to "Symbol(Op.or)"
    }
    return value;
  }

  private getFieldFilter(fieldFilter: any, dbField: string): any {
    if (fieldFilter.equals) {
      return { [Op.iLike]: fieldFilter.equals };
    }
    if (fieldFilter.contains) {
      return { [Op.iLike]: `%${fieldFilter.contains}%` };
    }
    // Handle simple value (for dropdown selections like status)
    if (typeof fieldFilter === 'string') {
      return { [Op.iLike]: fieldFilter };
    }
    return null;
  }

  private getAnnualRevenueFilter(revenueFilter: any): any {
    if (revenueFilter.greater_than) {
      return { [Op.gt]: parseFloat(revenueFilter.greater_than) };
    }
    if (revenueFilter.less_than) {
      return { [Op.lt]: parseFloat(revenueFilter.less_than) };
    }
    if (
      revenueFilter.between &&
      Array.isArray(revenueFilter.between) &&
      revenueFilter.between.length === 2
    ) {
      const [min, max] = revenueFilter.between.map((val: string | number) => parseFloat(String(val)));
      return { [Op.between]: [min, max] };
    }
    return null;
  }

  private getMultiValueFilter(filter: any): any {
    if (Array.isArray(filter)) {
      return {
        [Op.or]: filter.map((value: string) => ({ [Op.iLike]: `%${value}%` })),
      };
    }
    // Handle single value case
    if (typeof filter === 'string') {
      return { [Op.iLike]: `%${filter}%` };
    }
    return null;
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
      whereClause.r_number = { [Op.iLike]: `${filters.account_number.equals}` };
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
      "primary_contact_name",
      "is_parent",
      "country",
      "currency",
      "annual_revenue",
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  private getAccountIncludeOptions(
    childClause: Record < string, any > ,
    globalFilters: Record < string, string[] >
  ) {
    const isGlobalFiltersEmpty = !globalFilters || Object.keys(globalFilters).length === 0;
  
    const childAccountsInclude: any = {
      model: Account,
      as: "child_accounts",
      include: [{
          model: Country,
          as: "country",
          attributes: ["country_name"]
        },
        {
          model: Currency,
          as: "currency",
          attributes: ["currency_code"]
        },
        {
          model: Account,
          as: "parent_account",
          attributes: ["account_name"],
        },
      ],
    };
  
    if (!isGlobalFiltersEmpty) {
      childAccountsInclude.where = childClause;
    }
  
    return [
      childAccountsInclude,
      {
        model: Country,
        as: "country",
        attributes: ["country_name"],
        required: true,
      },
      {
        model: Currency,
        as: "currency",
        attributes: ["currency_code"],
        required: true,
      },
    ];
  }

  private async checkIsAccounUnique(account_name: string): Promise<boolean> {
    const response = await Account.findOne({
      where: {
        account_name,
      },
    });
    if (response && response.account_name) {
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
}

export default AccountService;
