import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PermissionState } from '../type';

const initialState: PermissionState = {
  menus: [],
  modules: [],
  permission: [],
  isAdminEnable: false,
};

export const permissionSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    updatePermissions(
      state,
      {
        payload: { menus, modules, permission, isAdminEnable },
      }: PayloadAction<PermissionState>
    ) {
      state.menus = menus;
      state.modules = modules;
      state.permission = permission;
      state.isAdminEnable = isAdminEnable;
    },
  },
});

export const { updatePermissions } = permissionSlice.actions;
