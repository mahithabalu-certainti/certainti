/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import ListTable from '../../../../../../../components/table/list-table';
import { ListTableColumn } from '../../../../../../../components/table/types';
import TruncateWithTooltip from '../../../../../../../components/truncate-with-tooltip/truncate-with-tooltip';
import {
  FinancialHighlightsResponse,
  USAComputedFields,
} from '../../../../../../types/dossier';

import { MenuItem, Select } from '@mui/material';
import { COMMON_MENU_PROPS, getSelectStyles } from '../rd-form/helper';
import { useParams, useSearchParams } from 'react-router-dom';
import { useUserPreference } from '../../../../../../services/case-dossier/cases-financial-services';


// Helper to extract Yes/No value from reduction280c object
const extractVal = (reduction280c: any) => {
  const columnKeys = Object.keys(reduction280c).filter(
    (k) => typeof reduction280c[k] === 'object'
  );
  for (const colKey of columnKeys) {
    const col = reduction280c[colKey];
    for (const rowKey in col) {
      if (rowKey.includes('Electing reduced credit under 280C')) {
        const v = col[rowKey];
        if (typeof v === 'string') {
          const trimmed = v.trim();
          if (trimmed === 'Yes') return 'Yes';
          if (trimmed === 'No') return 'No';
        }
      }
    }
  }
  return undefined;
};

// Helper to traverse computedFields and find current 280C values
const find280CValues = (fields: any): { asc_credit_280_c?: string; rrc_credit_280_c?: string } => {
  let asc_credit_280_c: string | undefined;
  let rrc_credit_280_c: string | undefined;

  Object.entries(fields || {}).forEach(([key, val]: any) => {
    if (key === 'asc280C' && val?.reduction280c) {
      asc_credit_280_c = extractVal(val.reduction280c);
    }
    if (key === 'rrc280C' && val?.reduction280c) {
      rrc_credit_280_c = extractVal(val.reduction280c);
    }

    if (
      typeof val === 'object' &&
      val !== null &&
      !val.reduction280c &&
      !Array.isArray(val)
    ) {
      Object.entries(val).forEach(([subKey, subVal]: any) => {
        if (subKey === 'asc280C' && subVal?.reduction280c) {
          asc_credit_280_c = extractVal(subVal.reduction280c);
        }
        if (subKey === 'rrc280C' && subVal?.reduction280c) {
          rrc_credit_280_c = extractVal(subVal.reduction280c);
        }
      });
    }
  });

  return { asc_credit_280_c, rrc_credit_280_c };
};

interface Selection280CProps {
  value: string;
  logKey: string;
  onSuccess: () => void;
  otherValues: { asc_credit_280_c?: string; rrc_credit_280_c?: string };
}

const Selection280C: React.FC<Selection280CProps> = ({
  value,
  logKey,
  onSuccess,
  otherValues,
}) => {
  const [currentValue, setCurrentValue] = React.useState(value);
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountid = searchParams.get('accountID') ?? '';
  const { mutate: updateUserPreference } = useUserPreference();

  const handleSelect = (event: any) => {
    const val = event.target.value;
    setCurrentValue(val);

    const payload: any = {
      case_rid: caseId ?? '',
      account_rid: accountid,
      asc_credit_280_c:
        logKey === 'asc_credit_280_c'
          ? val
          : otherValues.asc_credit_280_c || 'No',
      rrc_credit_280_c:
        logKey === 'rrc_credit_280_c'
          ? val
          : otherValues.rrc_credit_280_c || 'No',
    };

    updateUserPreference(payload, {
      onSuccess: () => {
        onSuccess();
      },
      onError: (error) => {
        console.error('Failed to update user preference', error);
      },
    });
  };

  return (
    <Select
      value={currentValue}
      onChange={handleSelect}
      displayEmpty
      size='small'
      MenuProps={COMMON_MENU_PROPS}
      sx={{
        ...getSelectStyles(false, false),
        color: '#2D3E4F',
        width: '100%',
        bgcolor: '#f4989c',
        height: '32px',
        '.MuiSelect-select': {
          textAlign: 'center',
          paddingRight: '14px !important', // Adjust for icon if present or force center
        },
        '& .MuiSelect-icon': {
          display: 'none', // mimicking "custom-select-no-arrow" if needed, or keeping it
        },
      }}
    >
      <MenuItem value='Yes'>Yes</MenuItem>
      <MenuItem value='No'>No</MenuItem>
    </Select>
  );
};

interface FinancialWorkingUSAProps {
  data: FinancialHighlightsResponse | null;
  onSuccess: () => void;
}

const FinancialWorkingUSA: React.FC<FinancialWorkingUSAProps> = ({
  data,
  onSuccess,
}) => {
  // Check if data is present
  const rawComputedFields = data?.data?.computed_fields as USAComputedFields;
  const computedFields =
    rawComputedFields?.computed_fields || rawComputedFields;

  if (
    !data?.data ||
    !computedFields ||
    Object.keys(computedFields).length === 0
  ) {
    return (
      <div className='p-8 text-center text-[#425A76] italic font-medium'>
        No data available
      </div>
    );
  }

  // Calculate current 280C values from data
  // Using useMemo to avoid re-calculation on every render unless computedFields changes
  const otherValues = React.useMemo(() => find280CValues(computedFields), [
    computedFields,
  ]);

  const boldRows = (computedFields as any)?.BOLD || [];

  // Extract and validate input_params safely
  const rawInputParams = data?.data?.input_params;
  const inputParams: Record<string, any> =
    typeof rawInputParams === 'string'
      ? JSON.parse(rawInputParams)
      : (rawInputParams as Record<string, any>);

  const qreSummary = inputParams?.qreSummary;

  const isValidCurrencyCode = (code: string): boolean => {
    // Common ISO 4217 currency codes
    const validCurrencyCodes = [
      'USD',
      'EUR',
      'GBP',
      'JPY',
      'AUD',
      'CAD',
      'CHF',
      'CNY',
      'SEK',
      'NZD',
      'MXN',
      'SGD',
      'HKD',
      'NOK',
      'KRW',
      'TRY',
      'INR',
      'RUB',
      'BRL',
      'ZAR',
    ];
    return validCurrencyCodes.includes(code.toUpperCase());
  };

  // Extract and validate currency code
  const rawCurrencyCode =
    (inputParams?.metadata?.currency as string) ||
    (inputParams?.currency as string) ||
    'USD';

  // Validate currency code - if invalid, default to USD
  const currencyCode = isValidCurrencyCode(rawCurrencyCode)
    ? rawCurrencyCode.toUpperCase()
    : 'USD';

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '';

    // Check if it's a percentage (string ending with %)
    if (typeof value === 'string' && value.trim().endsWith('%')) {
      return value;
    }

    // Check if it's a strictly numeric string (no non-numeric chars other than dot/minus)
    // AND it doesn't look like a date or other code.
    // The previous implementation was:
    /*
      const numValue =
        typeof value === 'string'
          ? parseFloat(value.replace(/[^0-9.-]/g, ''))
          : value;
    */
    // This is too aggressive for strings like "Tier 1".

    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 20,
      }).format(value);
    }

    // If it's a string, we usually just return it, UNLESS we know for sure it's meant to be a number.
    // The user said: "values comes number show $ symbol... string menas show text"
    // So we should NOT try to parse strings as numbers unless they are purely numeric strings.

    return value;
  };

  const formatLabel = (key: string) => {
    if (key.includes(' ')) return key;
    return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderValue = (value: any, isBold?: boolean) => {
    const isEmpty = value === null || value === undefined || value === '';

    return (
      <div className='w-[180px] min-h-[32px] px-3 py-1 rounded-xs border border-[#CBD6E2] bg-[#F9FAFB] inline-flex items-center justify-end'>
        {!isEmpty && (
          <span
            className={`text-[13px] ${isBold ? 'font-bold text-[#1A2733]' : 'font-semibold text-[#2D3E4F]'}`}
          >
            {(() => {
              // Only format strict numbers as currency
              const isStrictNumber = typeof value === 'number';
              return isStrictNumber ? formatCurrency(value) : value;
            })()}
          </span>
        )}
        {isEmpty && <span>&nbsp;</span>}
      </div>
    );
  };

  const renderCard = (
    title: string,
    content: React.ReactNode,
    isPrimitive: boolean = false
  ) => (
    <div className='w-full border border-[#CBD6E2] mb-4'>
      <div className='bg-[#ECECEC] border-b border-[#CBD6E2] px-3 py-1'>
        <div className='font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%]'>
          {title}
        </div>
      </div>
      <div className={`p-0 bg-white`}>
        {isPrimitive ? (
          <div className='px-3 py-2 text-left'>{content}</div>
        ) : (
          <div className='w-full'>{content}</div>
        )}
      </div>
    </div>
  );

  const renderKeyValuePairs = (obj: Record<string, any>) => {
    if (!obj) return null;
    const entries = Object.entries(obj);

    return (
      <table className='w-full border-collapse'>
        <tbody>
          {entries.map(([key, value]) => {
            if (
              (typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value)) ||
              Array.isArray(value) ||
              key === 'name'
            )
              return null;

            if (key === 'text') {
              return (
                <tr
                  key={key}
                  className='border-b border-[#CBD6E2] last:border-0'
                >
                  <td
                    colSpan={2}
                    className='px-3 py-1.5 text-sm text-[#425A76] font-medium'
                  >
                    {value}
                  </td>
                </tr>
              );
            }

            const isBold = boldRows.includes(key);
            return (
              <tr key={key} className='border-b border-[#CBD6E2] last:border-0'>
                <td
                  className={`px-3 py-1.5 text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'} w-1/2`}
                >
                  {formatLabel(key)}
                </td>
                <td className='px-3 py-1.5 text-right'>
                  {renderValue(value, isBold)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const render280C = (title: string, data: any) => {
    const reduction280c = data?.reduction280c;
    if (!reduction280c) return null;

    // Detect available columns (elect280c, no_elect280c, etc.)
    const columnKeys = Object.keys(reduction280c).filter(
      (k) => typeof reduction280c[k] === 'object'
    );
    if (columnKeys.length === 0) return null;

    return (
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse'>
          <thead>
            <tr className='bg-gray-50 border-b border-[#CBD6E2]'>
              <th
                scope='col'
                className='px-3 py-1.5 text-left text-[12px] font-bold text-[#2D3E4F] uppercase tracking-wider'
              >
                {formatLabel(title)}
              </th>
              {columnKeys.map((key) => (
                <th
                  key={key}
                  scope='col'
                  className='px-3 py-1.5 text-right text-[12px] font-bold text-[#2D3E4F] uppercase tracking-wider'
                >
                  {formatLabel(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Get unique keys from all columns to render rows
              const allRowKeys = new Set<string>();
              columnKeys.forEach((colKey) => {
                Object.keys(reduction280c[colKey]).forEach((rowKey) => {
                  allRowKeys.add(rowKey);
                });
              });

              return Array.from(allRowKeys).map((rowKey) => {
                const isBold = boldRows.includes(rowKey);
                return (
                  <tr
                    key={rowKey}
                    className='border-b border-[#CBD6E2] last:border-0'
                  >
                    <td
                      className={`px-3 py-1.5 text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'}`}
                    >
                      {formatLabel(rowKey)}
                    </td>
                    {columnKeys.map((colKey) => {
                      const cellValue = reduction280c[colKey][rowKey];
                      const isReductionRow = rowKey.includes(
                        'Electing reduced credit under 280C'
                      );

                      if (
                        isReductionRow &&
                        (cellValue === 'Yes' || cellValue === 'No')
                      ) {
                        const logKey =
                          title === 'asc280C'
                            ? 'asc_credit_280_c'
                            : title === 'rrc280C'
                              ? 'rrc_credit_280_c'
                              : title;
                        return (
                          <td key={colKey} className='px-3 py-1.5 text-right'>
                            <div className='w-[180px] min-h-[32px] inline-flex items-center justify-end'>
                              <Selection280C
                                value={cellValue}
                                logKey={logKey}
                                onSuccess={onSuccess}
                                otherValues={otherValues}
                              />
                            </div>
                          </td>
                        );
                      }
                      return (
                        <td key={colKey} className='px-3 py-1.5 text-right'>
                          {renderValue(reduction280c[colKey][rowKey], isBold)}
                        </td>
                      );
                    })}
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    );
  };

  // New function to render table sections from tables object structure using ListTable
  const renderTableSection = (tableData: any) => {
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
            <div
              className={`flex flex-col items-center w-full min-w-0 overflow-hidden ${isFirstColumn ? 'items-start' : 'items-center'}`}
            >
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
          width: isFirstColumn ? 350 : 180,
          sortId: headerId,
          sticky: isFirstColumn,
          sx: isFirstColumn
            ? {
              position: 'sticky',
              left: 0,
              background: '#fff',
              padding: '0px 8px 0px 14px !important',
              zIndex: 10,
              borderRight: '1px solid #CBD6E2 !important',
              borderBottom: '1px solid #CBD6E2 !important',
            }
            : undefined,
          render: (row: TableRow) => {
            const value = row[headerId];
            // The value to check for bolding is the label in the first column
            const firstColHeaderId =
              typeof table_headers[0] === 'string'
                ? table_headers[0]
                : table_headers[0].id;
            const rowLabel = row[firstColHeaderId] as string;
            const isRowBold =
              (rowLabel && boldRows.includes(rowLabel)) || rowLabel === 'Total';
            const isBold = isFirstColumn || isRowBold;

            // Format value: 0 becomes '-', numbers become currency, strings stay as is
            const formattedValue =
              value === 0 || value === '0'
                ? '-'
                : formatCurrency(value as string | number | null | undefined);

            return (
              <TruncateWithTooltip
                text={String(formattedValue || '')}
                enableCopy={false}
                className={`w-full ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'}`}
              />
            );
          },
        };
      }
    );

    // Transform table_rows into ListTable data format
    const tableDataRows: TableRow[] =
      table_rows && Array.isArray(table_rows)
        ? table_rows.map((rowObj: any, index: number) => {
          const row: TableRow = {
            id: `row_${index}`,
          };

          // Map each header ID to its value from the row object
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

    // Always render the table with headers, even if there's no data
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
              maxHeight: '450px',
              overflow: 'auto',
            }}
          />
        </div>
      </div>
    );
  };

  const renderIllinoisTable = (illinoisData: any[]) => {
    if (!Array.isArray(illinoisData) || illinoisData.length === 0) return null;

    // Build header objects
    const table_headers = [
      { id: 'Description', label: '' },
      ...illinoisData.map((col) => ({
        id: col['Column Name'] || '',
        label: col['Column Name'] || '',
        subLabel: col['SubColumn Name'] || '',
      })),
    ];

    // Identify row keys (excluding header meta keys)
    const metaKeys = ['Column Name', 'SubColumn Name'];
    const rowKeysSet = new Set<string>();
    illinoisData.forEach((colObj) => {
      Object.keys(colObj).forEach((key) => {
        if (!metaKeys.includes(key)) {
          rowKeysSet.add(key);
        }
      });
    });

    // Create rows
    const table_rows = Array.from(rowKeysSet).map((rowKey) => {
      const rowItem: any = { Description: rowKey };
      illinoisData.forEach((colObj) => {
        const colId = colObj['Column Name'] || '';
        rowItem[colId] = colObj[rowKey];
      });
      return rowItem;
    });

    return renderTableSection({
      table_headers,
      table_rows,
    });
  };

  const renderFederalTable = (
    federalData: Record<string, any>,
    totalValue?: any
  ) => {
    if (!federalData || Object.keys(federalData).length === 0) return null;

    const table_headers = [
      { id: 'state', label: 'State' },
      { id: 'credit_benefit', label: 'Credit Benefit' },
    ];

    const table_rows = Object.entries(federalData).map(([state, value]) => {
      const numValue = Number(value);
      return {
        id: state,
        state: state,
        credit_benefit: !isNaN(numValue) ? numValue : value,
      };
    });

    return renderTableSection({
      table_headers,
      table_rows,
      Total: totalValue,
    });
  };

  const renderDynamicArrayTable = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) return null;

    // Helper to check if a specific key has data in any of the rows
    const hasDataForKey = (key: string) =>
      data.some(
        (row) => row[key] !== undefined && row[key] !== null && row[key] !== ''
      );

    // Identify all unique keys across all objects
    const allKeys = Array.from(
      new Set(data.flatMap((row) => (row ? Object.keys(row) : [])))
    );

    // Filter keys that have at least one non-empty value
    // Exclude 'year' as we handle it specifically, and 'id' if present
    const dataKeys = allKeys
      .filter(
        (key) =>
          key.toLowerCase() !== 'year' &&
          key.toLowerCase() !== 'id' &&
          hasDataForKey(key)
      )
      .sort((a, b) => {
        const isATotal =
          a.toLowerCase() === 'sum' || a.toLowerCase() === 'total';
        const isBTotal =
          b.toLowerCase() === 'sum' || b.toLowerCase() === 'total';
        if (isATotal && !isBTotal) return 1;
        if (!isATotal && isBTotal) return -1;
        return 0;
      });

    // Transform data to ensure it has ids
    const tableDataRows = data.map((row, index) => ({
      ...row,
      id: `row_${index}`,
    }));

    const columns: ListTableColumn<any>[] = [];

    // Always add Year column first if 'year' exists in keys (checked from raw data keys)
    if (allKeys.some((k) => k.toLowerCase() === 'year')) {
      columns.push({
        id: 'year',
        label: 'Year' as any,
        sortId: 'year',
        width: 120,
        sticky: true,
        render: (row: any) => {
          // Find the actual key that matches 'year' case-insensitively
          const yearKey = Object.keys(row).find(
            (k) => k.toLowerCase() === 'year'
          );
          const val = yearKey ? row[yearKey] : '-';
          return (
            <div className='px-4 py-2 text-sm font-bold text-[#1A2733]'>
              {val || '-'}
            </div>
          );
        },
      });
    }

    // Add other columns
    dataKeys.forEach((key) => {
      // Determine label
      let label = formatLabel(key);
      if (key === 'wages') label = 'QRE Wages';
      if (key === 'contract') label = 'QRE Contract';
      if (key === 'grossReceipts') label = 'Gross Receipts';
      if (key === 'sum') label = 'Total';

      columns.push({
        id: key,
        label: label as any,
        sortId: key,
        width: 180,
        render: (row: any) => {
          const val = row[key];
          // Check if it looks like a "Total" column
          const isTotal =
            key.toLowerCase() === 'total' || key.toLowerCase() === 'sum';
          const isCurrency =
            typeof val === 'number'
              ? !isNaN(val)
              : typeof val === 'string' &&
              val.trim() !== '' &&
              !isNaN(Number(val));

          return (
            <div
              className={`px-3 py-1.5 text-right ${isTotal ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'}`}
            >
              {val !== undefined && val !== null && val !== ''
                ? isCurrency
                  ? formatCurrency(val)
                  : val
                : '-'}
            </div>
          );
        },
      });
    });

    return (
      <div className='w-full border border-[#CBD6E2] rounded-sm overflow-hidden'>
        <ListTable
          data={tableDataRows}
          columns={columns}
          getRowId={(row: any) => row.id}
          showEmptyRow={false}
          actionMenuItems={[]}
          actionWidth={0}
          stickyHeader={true}
          tableStyle={{
            maxHeight: '400px',
            overflow: 'auto',
          }}
        />
      </div>
    );
  };

  const renderCardContent = (value: any, key?: string) => {
    if (typeof value !== 'object' || value === null) {
      if (key) {
        return (
          <table className='w-full border-collapse'>
            <tbody>
              <tr className='border-b border-[#CBD6E2] last:border-0'>
                <td className='px-3 py-1.5 text-sm text-[#425A76] font-medium w-1/2'>
                  {formatLabel(key)}
                </td>
                <td className='px-3 py-1.5 text-right'>{renderValue(value)}</td>
              </tr>
            </tbody>
          </table>
        );
      }
      return (
        <div className='flex justify-start items-center p-3'>
          {renderValue(value)}
        </div>
      );
    }

    if ((value as any).reduction280c) {
      return render280C('Reduction 280C', value);
    }

    const entries = Object.entries(value);
    const hasObjects = entries.some(
      ([, v]) => typeof v === 'object' && v !== null && !Array.isArray(v)
    );

    if (!hasObjects) {
      return renderKeyValuePairs(value);
    }

    return (
      <div className='w-full'>
        {entries.map(([k, v]) => {
          if (k === 'name') return null;

          if (k === 'text') {
            return (
              <div
                key={k}
                className='px-3 py-1.5 text-sm text-[#425A76] font-medium border-b border-[#CBD6E2] last:border-0'
              >
                {v as string}
              </div>
            );
          }

          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            if ((v as any).reduction280c) return render280C(k, v);
            return (
              <div key={k} className='border-b border-[#CBD6E2] last:border-0'>
                <div className='bg-[#F9FAFB] px-3 py-1 font-semibold text-[13px] text-[#2D3E4F] border-b border-[#CBD6E2]'>
                  {formatLabel(k)}
                </div>
                {renderKeyValuePairs(v)}
              </div>
            );
          }

          const isBold = k && boldRows.includes(k);
          return (
            <div
              key={k}
              className='px-3 py-1.5 flex justify-between items-center border-b border-[#CBD6E2] last:border-0'
            >
              <span
                className={`text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'}`}
              >
                {formatLabel(k)}
              </span>
              {renderValue(v, isBold)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className='p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex flex-col gap-0'>
          {/* Dynamic Input Params Sections */}
          {inputParams &&
            Object.entries(inputParams).map(([key, value]) => {
              if (
                key === 'metadata' ||
                key === 'qreSummary' ||
                key === 'currency'
              )
                return null;

              if (Array.isArray(value) && value.length > 0) {
                return (
                  <div key={key} className='mb-4'>
                    {renderCard(key, renderDynamicArrayTable(value))}
                  </div>
                );
              }
              return null;
            })}

          {/* QRE Summary Section */}
          {qreSummary && (
            <React.Fragment>
              {renderCard('QRE Summary', renderKeyValuePairs(qreSummary))}
            </React.Fragment>
          )}

          {/* Dynamic Computed Fields Section */}
          {Object.entries(computedFields).map(([key, value]) => {
            if (
              key === 'computed_fields' ||
              key === 'qreSummary' ||
              key === 'BOLD' ||
              key === 'total'
            )
              return null;

            // Special handling for "tables" - don't render it as a card
            // Instead, render each table inside it directly
            if (
              key === 'tables' &&
              typeof value === 'object' &&
              value !== null
            ) {
              return (
                <React.Fragment key={key}>
                  {Object.entries(value).map(
                    ([tableName, tableData], index) => (
                      <div key={`${key}_${index}`} className='mb-4'>
                        {renderCard(
                          tableName,
                          renderTableSection(tableData),
                          false
                        )}
                      </div>
                    )
                  )}
                </React.Fragment>
              );
            }

            // Special handling for "illinois"
            if (key === 'illinois' && Array.isArray(value)) {
              return (
                <div key={key} className='mb-4'>
                  {renderCard(
                    formatLabel(key),
                    renderIllinoisTable(value),
                    false
                  )}
                </div>
              );
            }

            // Special handling for "federal"
            if (
              key === 'federal' &&
              typeof value === 'object' &&
              value !== null &&
              !Array.isArray(value)
            ) {
              const totalValue = (computedFields as any)?.total;
              return (
                <div key={key} className='mb-4'>
                  {renderCard(
                    formatLabel(key),
                    renderFederalTable(value, totalValue),
                    false
                  )}
                </div>
              );
            }

            return (
              <div key={key} className='mb-4'>
                {renderCard(
                  formatLabel(key),
                  renderCardContent(value, key),
                  false // Content handles padding via tables/rows
                )}
              </div>
            );
          })}

          {/* Top-level final_credit summary if present */}
          {(data?.data as any)?.final_credit !== undefined && (
            <div className='mb-4'>
              {renderCard(
                'Final Credit',
                renderCardContent(
                  (data?.data as any)?.final_credit,
                  'Final Credit'
                ),
                false
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialWorkingUSA;
