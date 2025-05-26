export type ManageProfile = {
  id: string;
  profileName: string;
  createdOn: string;
  createdBy: string;
};

export type ManageProfileList = {
  rid: string;
  r_number: string;
  profile_name: string;
  profile_description: string;
  profile_type: string;
  profile_status: string;
  created_datetime: string;
  modified_datetime: string;
  created_by: string | null;
  modified_by: string | null;
};
export interface ProfileTableColumn<T> {
  id: string;
  label: string;
  width: string | number;
  sortId: string;
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
}
