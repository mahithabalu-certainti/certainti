import { TruncateWithTooltip } from '../../../../../components';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ColumnDefinition {
  id: string;
  sortId?: string;
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
  return value ? value : "NA";
};

const BASE_COLUMNS: ColumnDefinition[] = [
  {
    id: 'resource_code',
    sortId: 'resource_code',
    label: 'Resource Code',
    sortable: true,
    width: '150px',
    render: (value: string) => (
      <TruncateWithTooltip
        text={String(value)}
        // className='font-medium text-[18px] text-[#2D3E4F] '
      >
        <span className='font-light text-sm text-[#425A76]'>
          {displayValue(value)}
        </span>
      </TruncateWithTooltip>
    ),
  },
  {
    id: 'resource_name',
    sortId: 'resource_name',
    label: 'Name',
    sortable: true,
    width: '200px',
    render: (value: string) => (
      <TruncateWithTooltip
        text={String(value)}
        // className='font-medium text-[18px] text-[#2D3E4F] '
      >
        <span className='font-light text-sm text-[#425A76]'>
          {displayValue(value)}
        </span>
      </TruncateWithTooltip>
    ),
  },
  {
    id: 'resource_type',
    sortId: 'resource_type',
    label: 'Resource Type',
    sortable: true,
    width: '140px',
    render: (value: string) => (
      <TruncateWithTooltip
        text={String(value)}
        // className='font-medium text-[18px] text-[#2D3E4F] '
      >
        <span className='font-light text-sm text-[#425A76]'>
          {displayValue(value)}
        </span>
      </TruncateWithTooltip>
    ),
  },
  {
    id: 'resource_designation',
    sortId: 'resource_designation',
    label: 'Designation',
    sortable: true,
    width: '200px',
    render: (value: string) => (
      <TruncateWithTooltip
        text={String(value)}
        // className='font-medium text-[18px] text-[#2D3E4F] '
      >
        <span className='font-light text-sm text-[#425A76]'>
          {displayValue(value)}
        </span>
      </TruncateWithTooltip>
    ),
  },
  {
    id: 'country_name',
    sortId: 'resource_country',
    label: 'Country',
    sortable: true,
    width: '160px',
    render: (value: string) => (
      <TruncateWithTooltip
        text={String(value)}
        // className='font-medium text-[18px] text-[#2D3E4F] '
      >
        <span className='font-light text-sm text-[#425A76]'>
          {displayValue(value)}
        </span>
      </TruncateWithTooltip>
    ),
  },
  {
    id: 'region_name',
    sortId: 'resource_region',
    label: 'Region',
    sortable: true,
    width: '150px',
    render: (value: string) => (
      <TruncateWithTooltip
        text={String(value)}
        // className='font-medium text-[18px] text-[#2D3E4F] '
      >
        <span className='font-light text-sm text-[#425A76]'>
          {displayValue(value)}
        </span>
      </TruncateWithTooltip>
    ),
  },
];

const createStatusColumn = (): ColumnDefinition => ({
  id: 'resource_status',
  sortId: 'resource_status',
  label: 'Status',
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
              <TruncateWithTooltip
                text={String(value)}
              >
              <span
                className='text-[#425A76] text-[14px] font-normal cursor-pointer no-underline hover:underline hover:text-[#1755E7]'
                onClick={(e) => {
                  e.stopPropagation();
                  onResourceIdClick(row);
                }}
              >
                {displayValue(value)}
              </span>
              </TruncateWithTooltip>
            ),
          }
        : column
    );
  };

  const columns = applyClickHandler([...BASE_COLUMNS]);
  columns.push(createStatusColumn());

  return columns;
};
