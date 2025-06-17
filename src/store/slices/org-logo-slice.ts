import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OrgLogoState } from '../type/org-logo-slice-type';

const initialState = {
  orgName: '',
  logoUrl: '',
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
  },
});

export const { UpdateOrgLogo } = orgLogoSlice.actions;
