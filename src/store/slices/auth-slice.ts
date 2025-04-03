import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { IAuthDetails } from '../type/auth-slice-type';

const initialState: IAuthDetails = {
  isAuthenticated: false,
  authToken: null,
  userId: null,
  email: null,
  name: null,
};

const authSlice = createSlice({
  name: 'authDetails',
  initialState,
  reducers: {
    setAuthDetail: (state, action: PayloadAction<IAuthDetails>) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.authToken = action.payload.authToken;
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.name = action.payload.name;
    },
    clearAuthDetail: () => {
      return initialState;
    },
  },
});

export const { setAuthDetail, clearAuthDetail } = authSlice.actions;
export default authSlice.reducer;
