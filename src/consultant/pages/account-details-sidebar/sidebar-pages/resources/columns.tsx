/* eslint-disable @typescript-eslint/no-explicit-any */
interface ColumnDefinition {
  id: string;
  label: string;
  sortable: boolean;
  width?: string;
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
    label: 'Resource ID',
    sortable: true,
    width: '130px',
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
    label: 'Resource Ref ID',
    sortable: true,
    width: '150px',
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
    width: '200px',
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
    width: '140px',
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
    width: '200px',
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
    width: '160px',
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
    width: '150px',
    render: (value: string) => (
      <span className='font-light text-sm text-[#425A76]'>
        {displayValue(value)}
      </span>
    ),
  },
];

const createStatusColumn = (): ColumnDefinition => ({
  id: 'resource_status',
  label: 'Resource Status',
  sortable: true,
  width: '150px',
  render: (value: string) => (
    <span
      className={`font-normal text-[14px] ${
        value === 'Active' ? 'text-[#199806]' : 'text-[#f44336]'
      }`}
    >
      {value === 'Active' ? 'Active' : 'In-Active'}
    </span>
  ),
});

export const getResourceColumns = ({
  onResourceIdClick,
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
                className='text-[#425A76] text-[14px] font-normal cursor-pointer no-underline hover:underline hover:text-[#1755E7]'
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
  columns.push(createStatusColumn());

  return columns;
};
