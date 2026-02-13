/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import ListTable from '../../../../../../../components/table/list-table';
import { ListTableColumn } from '../../../../../../../components/table/types';
import {
  FinancialHighlightsResponse,
  USAComputedFields,
} from '../../../../../../types/dossier';

import { MenuItem, Select } from '@mui/material';
import { COMMON_MENU_PROPS, getSelectStyles } from '../rd-form/helper';
import { useParams, useSearchParams } from 'react-router-dom';
import { costDisplay } from '../../../../../../../common-utils';
import { useUserPreference } from '../../../../../../services/case-dossier/cases-financial-services';
import {
  formatLabel,
  extractPrefix,
  renderTableSection,
  renderFederalTable,
  renderValue,
  renderCard,
} from './financial-working-helper';

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
const find280CValues = (
  fields: any
): { asc_credit_280_c?: string; rrc_credit_280_c?: string } => {
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
        borderRadius: '4px',
        height: '24px',
        '.MuiSelect-select': {
          textAlign: 'center',
          paddingTop: '0 !important',
          paddingBottom: '0 !important',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '& .MuiSelect-icon': {
          color: '#2D3E4F',
        },
        '& fieldset': {
          borderColor: 'transparent',
        },
        '&:hover fieldset': {
          borderColor: 'transparent',
        },
        '&.Mui-focused fieldset': {
          borderColor: 'transparent',
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
  currencySymbol: string;
}

const FinancialWorkingUSA: React.FC<FinancialWorkingUSAProps> = ({
  data,
  onSuccess,
  currencySymbol,
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
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const otherValues = React.useMemo(
    () => find280CValues(computedFields),
    [computedFields]
  );

  const boldRows = (computedFields as any)?.BOLD || [];

  // Extract and validate input_params safely
  const rawInputParams = data?.data?.input_params;
  const inputParams: Record<string, any> =
    typeof rawInputParams === 'string'
      ? JSON.parse(rawInputParams)
      : (rawInputParams as Record<string, any>);

  const qreSummary = inputParams?.qreSummary;

  const formatValue = (value: string | number | null | undefined) => {
    if (value === 0 || value === '0') {
      return '-';
    }
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (typeof value === 'number') {
      return costDisplay(value, currencySymbol as string);
    }
    return value;
  };

  const renderKeyValuePairs = (
    obj: Record<string, any>,
    enablePrefixSplit: boolean = false
  ) => {
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
              if (enablePrefixSplit) {
                const { prefix: valPrefix, label: valLabel } = extractPrefix(
                  value as string
                );
                return (
                  <tr
                    key={key}
                    className='border-b border-[#CBD6E2] last:border-0'
                  >
                    <td className='px-2 py-0 text-sm text-[#425A76] font-medium w-[130px] align-middle border-r border-[#CBD6E2] whitespace-nowrap text-right'>
                      {valPrefix}
                    </td>
                    <td className='px-2 py-0 text-sm text-[#425A76] font-medium align-middle'>
                      {formatValue(valLabel)}
                    </td>
                  </tr>
                );
              }
              return (
                <tr
                  key={key}
                  className='border-b border-[#CBD6E2] last:border-0'
                >
                  <td
                    colSpan={2}
                    className='px-2 py-1 text-sm text-[#425A76] font-medium'
                  >
                    {formatValue(value)}
                  </td>
                </tr>
              );
            }

            const isBold = boldRows.includes(key);
            const { prefix, label } = extractPrefix(formatLabel(key));

            if (enablePrefixSplit) {
              return (
                <tr
                  key={key}
                  className='h-[28px] border-b border-[#CBD6E2] last:border-0'
                >
                  <td className='px-2 py-0 text-sm text-[#425A76] font-medium w-[130px] align-middle border-r border-[#CBD6E2] whitespace-nowrap text-right'>
                    {prefix}
                  </td>
                  <td className='align-middle px-2 py-0'>
                    <div className='flex justify-between items-center w-full'>
                      <div
                        className={`text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'}`}
                      >
                        {label}
                      </div>
                      <div className='text-right'>
                        {renderValue(value, isBold, formatValue)}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <tr
                key={key}
                className='h-[28px] border-b border-[#CBD6E2] last:border-0'
              >
                <td
                  className={`px-2 py-0 text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'} align-middle w-1/2`}
                >
                  {formatLabel(key)}
                </td>
                <td className='px-2 py-0 text-right align-middle'>
                  {renderValue(value, isBold, formatValue)}
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
          {/* <thead>
            <tr className='bg-gray-50 border-b border-[#CBD6E2]'>
              <th
                scope='col'
                className='px-2 py-0 text-left text-[12px] font-bold text-[#2D3E4F] uppercase tracking-wider'
              >
                {formatLabel(title)}
              </th>
              {columnKeys.map((key) => (
                <th
                  key={key}
                  scope='col'
                  className='px-2 py-0 text-right text-[12px] font-bold text-[#2D3E4F] uppercase tracking-wider'
                >
                  {formatLabel(key)}
                </th>
              ))}
            </tr>
          </thead> */}
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
                const { prefix, label } = extractPrefix(formatLabel(rowKey));
                return (
                  <tr
                    key={rowKey}
                    className='h-[28px] border-b border-[#CBD6E2] last:border-0'
                  >
                    <td className='px-2 py-0 text-sm text-[#425A76] font-medium w-[130px] align-middle border-r border-[#CBD6E2] whitespace-nowrap text-right'>
                      {prefix}
                    </td>
                    <td
                      className={`px-2 py-0 text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'} align-middle`}
                    >
                      {label}
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
                          <td key={colKey} className='px-2 py-0 text-right'>
                            <div className='w-[180px] h-[24px] inline-flex items-center justify-end'>
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
                        <td key={colKey} className='px-2 py-0 text-right'>
                          {renderValue(
                            reduction280c[colKey][rowKey],
                            isBold,
                            formatValue
                          )}
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

  const renderIllinoisTable = (illinoisData: any[]) => {
    if (!Array.isArray(illinoisData) || illinoisData.length === 0) return null;

    // Build header objects
    const table_headers = [
      { id: 'Prefix', label: '', width: '10%' }, // Much smaller width for the prefix column
      { id: 'Description', label: '', width: '25%' }, // Adjusted width for the description
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

    // Create rows with prefix and label split
    const table_rows = Array.from(rowKeysSet).map((rowKey) => {
      const { prefix, label } = extractPrefix(rowKey); // Extract prefix and label
      const rowItem: any = {
        Prefix: prefix, // First column
        Description: label, // Second column
      };
      illinoisData.forEach((colObj) => {
        const colId = colObj['Column Name'] || '';
        rowItem[colId] = colObj[rowKey];
      });
      return rowItem;
    });

    return renderTableSection(
      {
        table_headers,
        table_rows,
      },
      boldRows,
      formatValue,
      '450px',
      [1] // Left align columns at index 0 (Prefix) and 1 (Description)
    );
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
        label: (<div className='text-left w-full'>Year</div>) as any,
        sortId: 'year',
        width: '20%',
        sticky: true,
        render: (row: any) => {
          // Find the actual key that matches 'year' case-insensitively
          const yearKey = Object.keys(row).find(
            (k) => k.toLowerCase() === 'year'
          );
          const val = yearKey ? row[yearKey] : '-';
          return (
            <div className='px-2 py-0 w-full flex justify-end text-sm font-bold text-[#1A2733]'>
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
        label: (<div className='text-left w-full'>{label}</div>) as any,
        sortId: key,
        width: '20%',
        render: (row: any) => {
          const val = row[key];
          // Check if it looks like a "Total" column
          const isTotal =
            key.toLowerCase() === 'total' || key.toLowerCase() === 'sum';

          return (
            <div
              className={`px-2 w-full flex justify-end  text-right ${isTotal ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'}`}
            >
              {formatValue(val) || '-'}
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

  const renderCardContent = (
    value: any,
    key?: string,
    enablePrefixSplit: boolean = false
  ) => {
    if (typeof value !== 'object' || value === null) {
      if (key) {
        if (enablePrefixSplit) {
          return (
            <table className='w-full border-collapse'>
              <tbody>
                <tr className='h-[28px] border-b border-[#CBD6E2] last:border-0'>
                  <td className='px-2 py-0 text-sm text-[#425A76] font-medium w-[130px] align-middle border-r border-[#CBD6E2] whitespace-nowrap text-right'>
                    {extractPrefix(formatLabel(key)).prefix}
                  </td>
                  <td className='align-middle px-2 py-0'>
                    <div className='flex justify-between items-center w-full'>
                      <div className='text-sm text-[#425A76] font-medium'>
                        {extractPrefix(formatLabel(key)).label}
                      </div>
                      <div className='text-right'>
                        {renderValue(value, false, formatValue)}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          );
        }

        return (
          <table className='w-full border-collapse'>
            <tbody>
              <tr className='h-[28px] border-b border-[#CBD6E2] last:border-0'>
                <td className='px-2 py-0 text-sm text-[#425A76] font-medium w-1/2 align-middle'>
                  {formatLabel(key)}
                </td>
                <td className='px-2 py-0 text-right align-middle'>
                  {renderValue(value, false, formatValue)}
                </td>
              </tr>
            </tbody>
          </table>
        );
      }
      return (
        <div className='h-[28px] flex justify-start items-center p-0 px-1.5'>
          {renderValue(value, false, formatValue)}
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
      return renderKeyValuePairs(value, enablePrefixSplit);
    }

    return (
      <div className='w-full'>
        {entries.map(([k, v]) => {
          if (k === 'name') return null;

          if (k === 'text') {
            if (enablePrefixSplit) {
              const { prefix: valPrefix, label: valLabel } = extractPrefix(
                v as string
              );
              return (
                <div
                  key={k}
                  className='min-h-[28px] px-0 py-0 flex items-stretch border-b border-[#CBD6E2] last:border-0'
                >
                  <div className='w-[130px] flex-shrink-0 text-sm text-[#425A76] font-medium border-r border-[#CBD6E2] px-2 flex items-center justify-end whitespace-nowrap'>
                    {valPrefix}
                  </div>
                  <div className='flex-1 flex items-center pl-2 pr-2 py-1 text-sm text-[#425A76] font-medium'>
                    {formatValue(valLabel)}
                  </div>
                </div>
              );
            }
            return (
              <div
                key={k}
                className='min-h-[28px] px-2 py-1 flex items-center text-sm text-[#425A76] font-medium border-b border-[#CBD6E2] last:border-0'
              >
                {formatValue(v as string)}
              </div>
            );
          }

          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            if ((v as any).reduction280c) return render280C(k, v);
            return (
              <div key={k} className='border-b border-[#CBD6E2] last:border-0'>
                <div className='h-[28px] bg-[#F9FAFB] border-b border-[#CBD6E2] flex items-stretch'>
                  {enablePrefixSplit ? (
                    <div className='flex items-center w-full'>
                      <div className='w-[130px] flex-shrink-0 font-semibold text-[13px] text-[#2D3E4F] border-r border-[#CBD6E2] pl-2 flex items-center h-full whitespace-nowrap'>
                        {/* Assuming sub-headers don't have prefixes usually, but if they do: */}
                        {formatLabel(k)}
                      </div>
                      <div className='pl-2 font-semibold text-[13px] text-[#2D3E4F] flex items-center h-full flex-1'>
                        {/* Label part if split needed, or just full label if not perfectly handled here. 
                                              User said "header section line is not tocted". This is a sub-header. 
                                              I'll stick to simple full width unless prefix detected. 
                                              But for consistency with "computed fields" enablePrefixSplit, I should probably respect it.
                                              However, usually these sub-headers are just "Wages" etc. 
                                              Let's keep it simple: if enabled, show the line? Or just use full width?
                                              The user said "line effect run inside only computed fields". 
                                              If I apply it here, I need to split k.
                                           */}
                        {/* Reverting to simple block for sub-header to avoid complexity unless requested specifically for sub-headers. 
                                            Actually, let's just make it look like the main header if enabled.
                                           */}
                        {/* Wait, k is the key (e.g. "Wages").  */}
                        {/* Let's just render it simply but ensure height matching if we wanted. 
                             Actually, for now I will just use the original div but ensure 60px alignment if I split it.
                             I will NOT split sub-headers for now to avoid breaking "Wages" etc. unless they come with []. 
                             The user example "qreSummary" had "Wages". "Average Annual..." had [].
                             So I will check if k has prefix.
                          */}
                        {formatLabel(k)}
                        {/* Wait, the code below calls renderKeyValuePairs(v). That will handle the rows. 
                             This div is just the TITLE of the section inside the card.
                          */}
                      </div>
                    </div>
                  ) : (
                    <div className='px-2 py-0 font-semibold text-[13px] text-[#2D3E4F] flex items-center h-full'>
                      {formatLabel(k)}
                    </div>
                  )}
                </div>
                {renderKeyValuePairs(v, enablePrefixSplit)}
              </div>
            );
          }

          const isBold = k && boldRows.includes(k);
          const { prefix, label } = extractPrefix(formatLabel(k));

          if (enablePrefixSplit) {
            return (
              <div
                key={k}
                className='h-[28px] px-0 py-0 flex items-center border-b border-[#CBD6E2] last:border-0'
              >
                <div className='w-[130px] flex-shrink-0 text-sm text-[#425A76] font-medium border-r border-[#CBD6E2] px-2 self-stretch flex items-center justify-end whitespace-nowrap'>
                  {prefix}
                </div>
                <div className='flex-1 flex justify-between items-center pl-2 pr-2'>
                  <span
                    className={`text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'}`}
                  >
                    {label}
                  </span>
                  {renderValue(v, isBold, formatValue)}
                </div>
              </div>
            );
          }

          return (
            <div
              key={k}
              className='h-[28px] px-2 py-0 flex justify-between items-center border-b border-[#CBD6E2] last:border-0'
            >
              <span
                className={`text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'}`}
              >
                {formatLabel(k)}
              </span>
              {renderValue(v, isBold, formatValue)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className='p-1.5'>
      <div>
        <div className='flex flex-col gap-0'>
          {/* Dynamic Input Params Sections */}
          {/* QRE Summary Section */}
          {qreSummary && (
            <React.Fragment>
              {renderCard('QRE Summary', renderKeyValuePairs(qreSummary))}
            </React.Fragment>
          )}
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
                  <div key={key} className='mb-2'>
                    {renderCard(key, renderDynamicArrayTable(value))}
                  </div>
                );
              }
              return null;
            })}

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
                      <div key={`${key}_${index}`} className='mb-2'>
                        {renderCard(
                          tableName,
                          renderTableSection(tableData, boldRows, formatValue),
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
                <div key={key} className='mb-2'>
                  {renderCard(
                    'NoTitle', // Empty title for Illinois table
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
              return (
                <div key={key} className='mb-2'>
                  {renderCard(
                    'State Credit Summary',
                    renderFederalTable(value, boldRows, formatValue),
                    false
                  )}
                </div>
              );
            }

            const isYesSpilt = key === 'yesSpilt' || key === 'yes_spilt';
            const cardTitle = isYesSpilt ? 'NoTitle' : formatLabel(key);

            const disbleRowSplit = ['Input Information', 'NoTitle']; // Content (rows) split disabled for these
            const disbleHeaderSplit = [
              'Input Information',
              'NoTitle',
              'Yes Spilt',
              'yesSpilt',
            ]; // Header split disabled for these

            const isContentSplitEnabled =
              isYesSpilt || !disbleRowSplit.includes(cardTitle);
            const isHeaderSplitEnabled =
              !isYesSpilt && !disbleHeaderSplit.includes(cardTitle);

            return (
              <div key={key} className='mb-2'>
                {renderCard(
                  cardTitle,
                  renderCardContent(value, key, isContentSplitEnabled), // Enable split for computed fields
                  false,
                  isHeaderSplitEnabled // Conditionally enable split for header
                )}
              </div>
            );
          })}

          {/* Top-level final_credit summary if present */}
          {(data?.data as any)?.final_credit !== undefined && (
            <div className='mb-2'>
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
