/* eslint-disable @typescript-eslint/no-explicit-any */
interface ColumnDefinition {
  id: string;
  label: string;
  sortable: boolean;
  render: (value: any, row?: any) => JSX.Element;
}

interface ResourceColumnsProps {
  onResourceIdClick: (row: any) => void;
  view?: boolean;
  onClickId?: string;
}

// Helper function to display value or NA
const displayValue = (value: any) => {
  return value ? value : <span className='text-gray-400'>NA</span>;
};

const BASE_COLUMNS: ColumnDefinition[] = [
  {
    id: 'r_number',
    label: 'Resource Id',
    sortable: true,
    render: (value: string, row: any) => (
      <span
        className='text-[#425A76] font-normal text-sm hover:underline cursor-pointer'
        onClick={(e) => {
          e.stopPropagation();
          (row.onResourceIdClick || (() => {}))(row);
        }}
      >
        {displayValue(value)}
      </span>
    ),
  },
  {
    id: 'resource_ref_id',
    label: 'Resource Ref Id',
    sortable: true,
    render: (value: string) => (
      <span className='font-light text-sm text-[#425A76]'>
        {displayValue(value)}
      </span>
    ),
  },
  {
    id: 'resource_fullname',
    label: 'Resource Full Name',
    sortable: true,
    render: (value: string) => (
      <span className='font-light text-sm text-[#425A76]'>
        {displayValue(value)}
      </span>
    ),
  },
  {
    id: 'resource_type',
    label: 'Resource Type',
    sortable: true,
    render: (value: string) => (
      <span className='font-light text-sm text-[#425A76]'>
        {displayValue(value)}
      </span>
    ),
  },
  {
    id: 'designation',
    label: 'Resource Designation',
    sortable: true,
    render: (value: string) => (
      <span className='font-light text-sm text-[#425A76]'>
        {displayValue(value)}
      </span>
    ),
  },
  {
    id: 'total_years_experience',
    label: 'Total Experience',
    sortable: true,
    render: (value: string) => (
      <span className='font-light text-sm text-[#425A76]'>
        {displayValue(value)}
      </span>
    ),
  },
  {
    id: 'city_name',
    label: 'Resource City',
    sortable: true,
    render: (value: string) => (
      <span className='font-light text-sm text-[#425A76]'>
        {displayValue(value)}
      </span>
    ),
  },
  {
    id: 'state_name',
    label: 'Resource Region',
    sortable: true,
    render: (value: string) => (
      <span className='font-light text-sm text-[#425A76]'>
        {displayValue(value)}
      </span>
    ),
  },
  {
    id: 'country_name',
    label: 'Resource Country',
    sortable: true,
    render: (value: string) => (
      <span className='font-light text-sm text-[#425A76]'>
        {displayValue(value)}
      </span>
    ),
  },
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
      {displayValue(value)}
    </span>
  ),
});

export const getResourceColumns = ({
  onResourceIdClick,
  view = false,
  onClickId,
}: ResourceColumnsProps): ColumnDefinition[] => {
  // Apply click handler to the specified ID column
  const applyClickHandler = (columns: ColumnDefinition[]) => {
    return columns.map((column) =>
      column.id === (onClickId || 'r_number')
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
                {displayValue(value)}
              </span>
            ),
          }
        : column
    );
  };

  const columns = applyClickHandler([...BASE_COLUMNS]);
  columns.push(createStatusColumn(!view));

  return columns;
};
