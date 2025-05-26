export type MenuItem = {
  name: string;
  key: string;
  disabled?: boolean;
};

export type SidebarProps = {
  activeKey: string;
  onSelect: (key: string) => void;
  disble?: boolean;
};
