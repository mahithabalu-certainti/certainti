export interface INavItem {
  type: 'link' | 'divider';
  name: string;
  icon: string;
  link: string;
}

export interface AdminNavItem {
  title: string;
  icon: string;
  openStatus: boolean;
  subItemTitle: { name: string; link: string }[];
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
