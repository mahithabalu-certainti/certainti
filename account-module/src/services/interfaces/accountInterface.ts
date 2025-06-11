import { IAccount, IColorCodeType, IUpdateAccount } from "../../utils/types";

export interface IAccountService {
  accountList(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    globalFilters: Record<string, string[]>,
    fiscalYear: number | "FY-All"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { account: any; count: number };
  }>;

  exportAccountList(
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    globalFilters: Record<string, string[]>,
    fiscalYear: number | "FY-All"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { account: any };
  }>;

  createAccount(accountData: IAccount, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { account: any };
  }>;
  listAllAccounts(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { accountData: any; orgData: any };
  }>;
  updateAccount(accountData: IUpdateAccount, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { affectedCounts: number };
  }>;

  globalAccounts(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { gloablAcconunt: any; count: number };
  }>;

  accountById(account_id: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { accountById: any; accountDetails: any };
  }>;

  listGlobalAccounts(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { gloablAcconunt: any; count: number };
  }>;

  getKeyContactRoles(
    entity_type: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { keyContactRoles: any };
  }>;
}

export interface GeoDataResponse<T> {
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: T;
}

export interface IGeoDataService {
  countries(): Promise<
    GeoDataResponse<{
      country: any;
      count: number;
    }>
  >;
  currencies(): Promise<
    GeoDataResponse<{
      currency: any;
      count: number;
    }>
  >;
  regions(): Promise<
    GeoDataResponse<{
      regions: any;
      count: number;
    }>
  >;
  states(countryIds?: string[]): Promise<
    GeoDataResponse<{
      states: any;
      count: number;
    }>
  >;
  cities(stateIds?: string[]): Promise<
    GeoDataResponse<{
      cities: any;
      count: number;
    }>
  >;
  industries(): Promise<
  GeoDataResponse<{
    industries: any;
    count: number;
  }>
  >;
  colorCodes(status: IColorCodeType): Promise<
  GeoDataResponse<{
    colors: any;
    count: number;
  }>
  >
}
