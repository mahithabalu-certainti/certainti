/* eslint-disable @typescript-eslint/no-explicit-any */
interface ColumnDefinition {
  id: string;
  label: string;
  sortable: boolean;
  render?: (value: any, row?: any) => React.ReactNode;
}

interface ResourceColumnsProps {
  onResourceIdClick: (row: any) => void; // Now mandatory
  view?: boolean;
}

const BASE_COLUMNS: ColumnDefinition[] = [
  {
    id: 'rid',
    label: 'Resource Id',
    sortable: true,
    render: (value: string, row: any) => (
      <span
        className='text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
        onClick={(e) => {
          e.stopPropagation();
          // Handler will be replaced in getResourceColumns
          (row.onResourceIdClick || (() => {}))(row);
        }}
      >
        {value}
      </span>
    ),
  },
  { id: 'r_number', label: 'Resource Number', sortable: true },
  { id: 'resource_ref_id', label: 'Resource Ref Id', sortable: true },
  { id: 'resource_fullname', label: 'Resource Full Name', sortable: true },
  { id: 'resource_type', label: 'Resource Type', sortable: true },
];

const EXTENDED_COLUMNS: ColumnDefinition[] = [
  ...BASE_COLUMNS,
  { id: 'mobile', label: 'Resource Mobile', sortable: true },
  { id: 'email', label: 'Resource Email', sortable: true },
  { id: 'role', label: 'Resource Role', sortable: true },
];

const createStatusColumn = (activeOnly: boolean = false): ColumnDefinition => ({
  id: 'resource_status',
  label: 'Status',
  sortable: true,
  render: (value: string) => (
    <span
      className={`font-medium ${
        activeOnly
          ? 'text-green-600'
          : value === 'Active'
            ? 'text-green-600'
            : 'text-red-600'
      }`}
    >
      {value}
    </span>
  ),
});

const resourceColumnsAll: ColumnDefinition[] = [
  ...EXTENDED_COLUMNS,
  createStatusColumn(),
];

export const getResourceColumns = ({
  onResourceIdClick,
  view = false,
}: ResourceColumnsProps): ColumnDefinition[] => {
  // Common function to apply click handler to ID column
  const applyClickHandler = (columns: ColumnDefinition[]) => {
    return columns.map((column) =>
      column.id === 'id'
        ? {
            ...column,
            render: (value: string, row: any) => (
              <span
                className='text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                onClick={(e) => {
                  e.stopPropagation();
                  onResourceIdClick(row);
                }}
              >
                {value}
              </span>
            ),
          }
        : column
    );
  };

  if (view) {
    return applyClickHandler([...resourceColumnsAll]);
  }

  const columns = applyClickHandler([...BASE_COLUMNS]);
  columns.push(createStatusColumn(true));

  return columns;
};
