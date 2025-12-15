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
    fiscalYear: number | "FY-All",userId:string
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
    fiscalYear: number | "FY-All",
    userId:string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { account: any };
  }>;

  createAccount(accountData: IAccount, userId: string,file?:Express.Multer.File): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { account: any };
  }>;
  listAllAccounts(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    filters?: Record<string, any>;
  }): Promise<{
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
    data?: { globalAccount: any; count: number };
  }>;

  accountById(account_id: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { accountById: any; accountDetails: any };
  }>;

  listGlobalAccounts(
    userId:string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: string,
     globalFilters?: Record<string, string[]>,
  
  ): Promise<{
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
  // provisionMonitoredAccount(
  //   account_name: string
  // ): void;
}

export interface GeoDataResponse<T> {
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: T;
}

export interface IGeoDataService {
  countries(statusScope: string): Promise<
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
  >;
  status(): Promise<
  GeoDataResponse<{
    status: any;
    count: number;
  }>
  >;
  resourceType(): Promise<
  GeoDataResponse<{
    resouceType: any;
    count: number;
  }>
  >;
  resourceType(): Promise<
  GeoDataResponse<{
    resouceType: any;
    count: number;
  }>
  >;
  projectTypes(): Promise<
  GeoDataResponse<{
    projectType: any;
    count: number;
  }>
  >;
  skillLevel(): Promise<
  GeoDataResponse<{
    skillLevel: any;
    count: number;
  }>
  >;
  resourceStatus(): Promise<
  GeoDataResponse<{
    resourceStatus: any;
    count: number;
  }>
  >;
  importEntityTypes():Promise<any>
}

export interface IAccountGraphQlServices {
  inlineEditAccount(data : any) : Promise<{
    statusCode: number;
    statusMessage: string} | undefined>
}
