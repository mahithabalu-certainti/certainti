import { AccountList, FilterState } from "../../consultant/types";

export interface AccountState {
  userId: string;
  accounts: AccountList[];
  count: number;
  filters: FilterState;
  loading: boolean;
  error: string | null;
  fiscalYear: string;
}