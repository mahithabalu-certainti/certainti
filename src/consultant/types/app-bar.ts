import { MenuOption } from '../../common-service';

export interface INavItem {
  id: MenuOption | '';
  type: 'link' | 'divider';
  name: string;
  icon: string;
  link: string;
  matchLink: string;
  disabled?: boolean;
  tooltip?: string;
}

export interface AdminNavItem {
  title: string;
  icon: string;
  openStatus: boolean;
  disabled?: boolean;
  tooltip?: string;
  subItemTitle: SubItemTitle[];
}

export interface SubItemTitle {
  id: MenuOption;
  name: string;
  icon: string;
  link: string;
  matchLink: string;
  disabled?: boolean;
  tooltip?: string;
}

export interface SideBarProps {
  showAdminSidebar: boolean;
  sidebarExpand: boolean;
  mobileView: boolean;
}

export interface GlobalModalProps {
  isGlobalModalOpen: boolean;
  handleCloseGlobalModal: () => void;
}

export interface FilterEntry {
  account: string;
  child: string[];
}

export type FilterState = FilterEntry[];

export type FilterType = 'account' | 'child';

export interface AccountFilter {
  rid: string;
  account_name: string;
  child_accounts?: {
    rid: string;
    account_name: string;
  }[];
}
