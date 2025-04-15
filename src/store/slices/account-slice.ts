import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  getFiltersFromStorage,
  saveFiltersToStorage,
} from '../../common-utils';
import { fetchAccounts } from '../../consultant/services/account';
import { AccountList, FilterState } from '../../consultant/types';

export interface AccountState {
  userId: string;
  accounts: AccountList[];
  count: number;
  filters: FilterState;
  loading: boolean;
  error: string | null;
  fiscalYear: string;
}

const initialState: AccountState = {
  userId: '',
  accounts: [],
  count: 0,
  filters: [],
  loading: false,
  error: null,
  fiscalYear: 'FY-All',
};

export const fetchAccountsThunk = createAsyncThunk(
  'account/fetchAccounts',
  async () => {
    return await fetchAccounts();
  }
);

const accountSlice = createSlice({
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

export const { setUserId, setFilters, setFiscalYear, resetFilters } =
  accountSlice.actions;
export default accountSlice.reducer;
