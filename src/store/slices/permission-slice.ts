import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PermissionState } from '../type';

const initialState: PermissionState = {
  menus: [],
  modules: [],
  permission: [],
};

export const permissionSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    updatePermissions(
      state,
      {
        payload: { menus, modules, permission },
      }: PayloadAction<PermissionState>
    ) {
      state.menus = menus;
      state.modules = modules;
      state.permission = permission;
    },
  },
});

export const { updatePermissions } = permissionSlice.actions;
