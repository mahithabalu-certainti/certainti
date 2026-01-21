import { AccountList, FilterState, FinancialHighlightsResponse } from '../../consultant/types';

export interface AccountState {
  userId: string;
  accounts: AccountList[];
  count: number;
  filters: FilterState;
  loading: boolean;
  error: string | null;
  fiscalYear: string;
  refetchGlobalAccounts: boolean;
  dossierFinancialStatus: string;
  financialData: FinancialHighlightsResponse | null;
}
