import { AllMenus, AllModules } from '../../common-service';

export type MenuItem = {
  name: string;
  key: string;
  id: AllModules | AllMenus;
  hide?: boolean;
  disabled?: boolean;
  icon?: React.ElementType;
};

export type SidebarProps = {
  activeKey: string | null;
  onSelect: (key: string) => void;
  disble?: boolean;
};
