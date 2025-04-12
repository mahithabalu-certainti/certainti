export interface INavItem {
  type: 'link' | 'divider';
  name: string;
  icon: string;
  link: string;
  matchLink: string;
}

export interface AdminNavItem {
  title: string;
  icon: string;
  openStatus: boolean;
  subItemTitle: SubItemTitle[];
}

export interface SubItemTitle {
  name: string;
  link: string;
  matchLink: string;
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
