import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  getFiltersFromStorage,
  saveFiltersToStorage,
} from '../../common-utils';
import { fetchGlobalAccounts } from '../../consultant/services/account';
import {
  FilterState,
  FinancialHighlightsResponse,
} from '../../consultant/types';
import { AccountState } from '../type';

const initialState: AccountState = {
  userId: '',
  accounts: [],
  count: 0,
  filters: [],
  loading: false,
  error: null,
  fiscalYear: 'FY-All',
  refetchGlobalAccounts: false,
  dossierFinancialStatus: '',
  financialData: null,
};

export const fetchAccountsThunk = createAsyncThunk(
  'account/fetchGlobalAccounts',
  async () => {
    return await fetchGlobalAccounts();
  }
);

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setUserId(state, action: PayloadAction<string>) {
      state.userId = action.payload;
      const { filters, fiscalYear } = getFiltersFromStorage(action.payload);
      state.filters = filters;
      state.fiscalYear = fiscalYear;
    },
    setFilters(state, action: PayloadAction<FilterState>) {
      state.filters = action.payload;
      if (state.userId) {
        saveFiltersToStorage(state.userId, state.filters, state.fiscalYear);
      }
    },
    setFiscalYear(state, action: PayloadAction<string>) {
      state.fiscalYear = action.payload;
      if (state.userId) {
        saveFiltersToStorage(state.userId, state.filters, state.fiscalYear);
      }
    },
    resetFilters(state) {
      state.filters = initialState.filters;
      if (state.userId) {
        saveFiltersToStorage(state.userId, state.filters, state.fiscalYear);
      }
    },
    setRefetchGlobalAccounts: (state, action: PayloadAction<boolean>) => {
      state.refetchGlobalAccounts = action.payload;
    },
    setTemporaryFiscalYear(state, action: PayloadAction<string>) {
      state.fiscalYear = action.payload;
    },
    setDossierFinancialStatus(state, action: PayloadAction<string>) {
      state.dossierFinancialStatus = action.payload;
    },
    setFinancialData(
      state,
      action: PayloadAction<FinancialHighlightsResponse | null>
    ) {
      state.financialData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload.accounts;
        state.count = action.payload.count;
      })
      .addCase(fetchAccountsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Something went wrong';
      });
  },
});

export const {
  setUserId,
  setFilters,
  setFiscalYear,
  resetFilters,
  setRefetchGlobalAccounts,
  setTemporaryFiscalYear,
  setDossierFinancialStatus,
  setFinancialData,
} = accountSlice.actions;
