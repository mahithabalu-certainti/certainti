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

export interface FilterState {
  account: string[];
  child: string[];
}

export type FilterType = 'account' | 'child';
