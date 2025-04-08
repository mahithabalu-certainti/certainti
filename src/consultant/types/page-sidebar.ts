export type MenuItem = {
  name: string;
  key: string;
};

export type SidebarProps = {
  activeKey: string;
  onSelect: (key: string) => void;
};
