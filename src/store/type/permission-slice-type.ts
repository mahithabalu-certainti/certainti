import { Permissions } from '../../common-service';

export interface PermissionState {
  menus: Permissions[];
  modules: Permissions[];
  permission: Permissions[];
  isAdminEnable?: boolean;
}
