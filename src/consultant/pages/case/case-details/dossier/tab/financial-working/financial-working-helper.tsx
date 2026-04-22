/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import ListTable from '../../../../../../../components/table/list-table';
import { ListTableColumn } from '../../../../../../../components/table/types';
import TruncateWithTooltip from '../../../../../../../components/truncate-with-tooltip/truncate-with-tooltip';

export const formatLabel = (key: string) => {
  if (key.includes(' ')) return key;
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export const extractPrefix = (str: string) => {
  const bracketMatch = str.match(/^\[(.*?)\]\s*(.*)/);
  if (bracketMatch) return { prefix: bracketMatch[1], label: bracketMatch[2] };

  const parenMatch = str.match(/^\((.*?)\)\s*(.*)/);
  if (parenMatch) return { prefix: parenMatch[1], label: parenMatch[2] };

  return { prefix: '', label: str };
};

export const renderValue = (
  value: any,
  isBold?: boolean,
  formatCurrency?: (value: any) => string | any
) => {
  const isEmpty = value === null || value === undefined || value === '';

  const rawStr = typeof value === 'string' ? value.trim() : '';
  const isParenWrapped = rawStr.startsWith('(') && rawStr.endsWith(')');
  const displayValue = isParenWrapped ? rawStr.slice(1, -1) : value;

  const isNumeric =
    isParenWrapped ||
    typeof value === 'number' ||
    (typeof value === 'string' &&
      value.trim() !== '' &&
      (!isNaN(Number(value)) || value.endsWith('%')));

  return (
    <div
      className={`w-[180px] h-[24px] px-2 py-0 align-middle my-[2px] rounded-xs border border-[#CBD6E2] bg-[#F9FAFB] inline-flex items-center ${isNumeric ? 'justify-end' : 'justify-start'}`}
    >
      {!isEmpty && (
        <span
          className={`text-[12px] ${isBold ? 'font-bold text-[#1A2733]' : 'font-semibold text-[#2D3E4F]'}`}
        >
          {isParenWrapped
            ? displayValue
            : formatCurrency
              ? formatCurrency(value)
              : value}
        </span>
      )}
      {isEmpty && <span>&nbsp;</span>}
    </div>
  );
};

export const renderCard = (
  title: string,
  content: React.ReactNode,
  isPrimitive: boolean = false,
  enablePrefixSplit: boolean = false
) => {
  const { prefix, label } = extractPrefix(title);
  return (
    <div className='w-full border border-[#CBD6E2] mb-2'>
      {title !== 'NoTitle' && (
        <div className='bg-[#ECECEC] border-b border-[#CBD6E2] flex items-stretch min-h-[30px]'>
          <div className='font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] w-full'>
            {enablePrefixSplit ? (
              <div className='flex items-stretch h-full'>
                <div className='w-[130px] flex-shrink-0 border-r border-[#CBD6E2] pl-2 flex items-center py-1 whitespace-nowrap overflow-hidden'>
                  {prefix}
                </div>
                <div className='pl-2 flex items-center flex-1 py-1'>
                  {label}
                </div>
              </div>
            ) : (
              <div className='px-2 flex items-center h-full py-1'>{title}</div>
            )}
          </div>
        </div>
      )}
      <div className={`p-0 bg-white`}>
        {isPrimitive ? (
          <div className='px-2 py-1 text-left'>{content}</div>
        ) : (
          <div className='w-full'>{content}</div>
        )}
      </div>
    </div>
  );
};

export const renderTableSection = (
  tableData: any,
  boldRows: string[] = [],
  formatCurrency: (value: any) => string | any,
  maxHeight: string = '450px',
  leftAlignColumnIndices: number[] = []
) => {
  if (!tableData || typeof tableData !== 'object') return null;

  const { table_headers, table_rows, Total } = tableData;

  if (!table_headers || !Array.isArray(table_headers)) return null;

  // Define interface for table row
  interface TableRow {
    id: string;
    [key: string]: string | number | boolean | undefined;
  }

  // Create columns dynamically from table_headers
  const columns: ListTableColumn<TableRow>[] = table_headers.map(
    (headerItem: any, index: number) => {
      const isFirstColumn = index === 0;
      const headerId =
        typeof headerItem === 'string' ? headerItem : headerItem.id;
      const headerLabel =
        typeof headerItem === 'string' ? headerItem : headerItem.label;
      const subLabel =
        typeof headerItem === 'object' ? headerItem.subLabel : null;

      return {
        id: headerId,
        label: (
          <div className='flex flex-col items-start w-full min-w-0 overflow-hidden'>
            <TruncateWithTooltip
              text={headerLabel}
              enableCopy={false}
              className='font-bold'
            />
            {subLabel && (
              <span className='text-[11px] font-normal text-[#425A76] mt-0.5 leading-tight'>
                {subLabel}
              </span>
            )}
          </div>
        ) as React.ReactNode as string,
        width: (headerItem as any)?.width || (isFirstColumn ? '20%' : '12%'),
        sortId: headerId,
        sticky: isFirstColumn,
        sx: isFirstColumn
          ? {
              position: 'sticky',
              left: 0,
              background: '#fff',
              zIndex: 10,
              borderRight: '1px solid #CBD6E2 !important',
              borderBottom: '1px solid #CBD6E2 !important',
            }
          : {
              textAlign: 'right',
            },
        render: (row: TableRow) => {
          const value = row[headerId];
          const firstColHeaderId =
            typeof table_headers[0] === 'string'
              ? table_headers[0]
              : table_headers[0].id;
          const rowLabel = row[firstColHeaderId] as string;
          const isRowBold =
            (rowLabel && boldRows.includes(rowLabel)) || rowLabel === 'Total';
          const isBold = isFirstColumn || isRowBold;

          // Check if this column is exactly "Fiscal Year" (case-insensitive)
          // If so, display the raw value without number formatting
          const isYearColumn =
            headerId.toLowerCase() === '3 previous years' ||
            headerLabel.toLowerCase() === '3 previous years';

          const formattedValue =
            value === 0 || value === '0'
              ? '-'
              : isYearColumn
                ? (value ?? '')
                : formatCurrency(value as string | number | null | undefined);

          const shouldLeftAlign =
            typeof value === 'string' &&
            value.trim() !== '' &&
            isNaN(Number(value)) &&
            !value.endsWith('%');

          return (
            <div
              className={`w-full ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'} ${shouldLeftAlign ? 'text-left' : 'flex justify-end text-right'} ${leftAlignColumnIndices ? 'flex  text-right font-medium' : ''}`}
            >
              {leftAlignColumnIndices ? value : formattedValue}
            </div>
          );
        },
      };
    }
  );

  const tableDataRows: TableRow[] =
    table_rows && Array.isArray(table_rows)
      ? table_rows.map((rowObj: any, index: number) => {
          const row: TableRow = {
            id: `row_${index}`,
          };

          table_headers.forEach((headerItem: any) => {
            const headerId =
              typeof headerItem === 'string' ? headerItem : headerItem.id;
            row[headerId] = rowObj[headerId];
          });

          return row;
        })
      : [];

  if (Total !== undefined && Total !== null && table_headers.length > 0) {
    const firstHeaderId =
      typeof table_headers[0] === 'string'
        ? table_headers[0]
        : table_headers[0].id;
    const lastHeader = table_headers[table_headers.length - 1];
    const lastHeaderId =
      typeof lastHeader === 'string' ? lastHeader : lastHeader.id;

    const totalRow: TableRow = {
      id: 'row_total',
      [firstHeaderId]: 'Total',
      [lastHeaderId]: Total,
    };

    tableDataRows.push(totalRow);
  }

  const getRowId = (row: TableRow) => row.id;

  return (
    <div className='w-full h-full overflow-hidden flex flex-col'>
      <div className='flex-1 overflow-auto'>
        <ListTable
          data={tableDataRows}
          columns={columns}
          getRowId={getRowId}
          showEmptyRow={true}
          actionMenuItems={[]}
          actionWidth={80}
          stickyColumnsCount={1}
          tableStyle={{
            height: '100%',
            maxHeight: maxHeight,
            overflow: 'auto',
          }}
        />
      </div>
    </div>
  );
};

export const renderFederalTable = (
  federalData: Record<string, any>,
  boldRows: string[] = [],
  formatCurrency: (value: any) => string | any
) => {
  if (!federalData || Object.keys(federalData).length === 0) return null;

  const entries = Object.entries(federalData);
  const firstValue = entries[0]?.[1];
  const isObjectData =
    typeof firstValue === 'object' &&
    firstValue !== null &&
    !Array.isArray(firstValue);

  let table_headers: any[] = [];
  let table_rows: any[] = [];

  if (isObjectData) {
    const allKeys = new Set<string>();
    entries.forEach(([, value]) => {
      if (value && typeof value === 'object') {
        Object.keys(value).forEach((key) => allKeys.add(key));
      }
    });

    const dynamicColumns = Array.from(allKeys).map((key) => ({
      id: key,
      label: formatLabel(key),
    }));

    table_headers = [{ id: 'state', label: 'State' }, ...dynamicColumns];

    table_rows = entries.map(([state, value]) => ({
      id: state,
      state: state,
      ...value,
    }));
  } else {
    table_headers = [
      { id: 'state', label: 'State' },
      { id: 'credit_benefit', label: 'Credit Benefit' },
    ];

    table_rows = entries.map(([state, value]) => {
      const numValue = Number(value);
      return {
        id: state,
        state: state,
        credit_benefit: !isNaN(numValue) ? numValue : value,
      };
    });
  }

  return renderTableSection(
    {
      table_headers,
      table_rows,
    },
    boldRows,
    formatCurrency,
    '600px',
    [0]
  );
};
