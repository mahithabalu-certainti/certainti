import { MenuOption } from '../../common-service';

export interface INavItem {
  id: MenuOption | '';
  type: 'link' | 'divider';
  name: string;
  icon: React.ElementType | string;
  link: string;
  matchLink: string;
  hide?: boolean;
  noRedirect?: boolean;
  activePath?: string;
}

export interface AdminNavItem {
  title: string;
  icon: React.ElementType;
  openStatus: boolean;
  hide?: boolean;
  subItemTitle: SubItemTitle[];
  noRedirect?: boolean;
}

export interface SubItemTitle {
  id: MenuOption;
  name: string;
  icon: React.ElementType;
  link: string;
  matchLink: string;
  hide?: boolean;
  noRedirect?: boolean;
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

export interface GlobalFilterModalProps {
  isOpen: boolean;
  filterId: string | undefined;
  filterAnchorEl: HTMLButtonElement | null;
  handleClose: () => void;
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
