import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { IAuthDetails } from '../type/auth-slice-type';

const initialState: IAuthDetails = {
  isAuthenticated: false,
  authToken: null,
  userId: null,
  azureId: null,
  email: null,
  name: null,
  role: null,
};

const authSlice = createSlice({
  name: 'authDetails',
  initialState,
  reducers: {
    setAuthDetail: (state, action: PayloadAction<IAuthDetails>) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.authToken = action.payload.authToken;
      state.userId = action.payload.userId;
      state.azureId = action.payload.azureId;
      state.email = action.payload.email;
      state.name = action.payload.name;
      state.role = action.payload.role;
    },
    clearAuthDetail: () => {
      return initialState;
    },
  },
});

export const { setAuthDetail, clearAuthDetail } = authSlice.actions;
export default authSlice.reducer;
