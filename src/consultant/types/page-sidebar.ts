import { AllModules } from "../../common-service";

export type MenuItem = {
  name: string;
  key: string;
  id: AllModules;
  hide?: boolean;
};

export type SidebarProps = {
  activeKey: string | null;
  onSelect: (key: string) => void;
};
