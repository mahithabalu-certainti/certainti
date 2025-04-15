import { IAccount, IUpdateAccount } from "../../utils/types";

export interface IAccountService {
  accountList(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string>,
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

  createAccount(accountData: IAccount): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { account: any };
  }>;

  updateAccount(accountData: IUpdateAccount): Promise<{
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
    }>
  >;
  currencies(): Promise<
    GeoDataResponse<{
      currency: any;
    }>
  >;
  regions(): Promise<
    GeoDataResponse<{
      regions: any;
    }>
  >;
  states(): Promise<
    GeoDataResponse<{
      states: any;
    }>
  >;
}
