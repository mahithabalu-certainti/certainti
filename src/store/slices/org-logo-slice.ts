import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OrgLogoState } from '../type/org-logo-slice-type';

const initialState = {
  orgName: '',
  logoUrl: '',
  profileURL: '',
};

export const orgLogoSlice = createSlice({
  name: 'org-logo',
  initialState,
  reducers: {
    UpdateOrgLogo(
      state,
      { payload: { orgName, logoUrl } }: PayloadAction<OrgLogoState>
    ) {
      state.orgName = orgName;
      state.logoUrl = logoUrl;
    },
    UpdateProfileURL(state, action: PayloadAction<string>) {
      state.profileURL = action.payload;
    },
  },
});

export const { UpdateOrgLogo, UpdateProfileURL } = orgLogoSlice.actions;
