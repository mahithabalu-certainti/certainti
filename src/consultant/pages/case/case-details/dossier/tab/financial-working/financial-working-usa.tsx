/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  FinancialHighlightsResponse,
  USAComputedFields,
} from '../../../../../../types/dossier';

interface FinancialWorkingUSAProps {
  data: FinancialHighlightsResponse | null;
}

const FinancialWorkingUSA: React.FC<FinancialWorkingUSAProps> = ({ data }) => {
  // Check if data is present
  if (!data?.data?.computed_fields) {
    return (
      <div className='p-4 text-center text-gray-500'>
        No data available or invalid format
      </div>
    );
  }

  // Handle both old and new structure for USA
  const rawComputedFields = data.data.computed_fields as USAComputedFields;
  const computedFields = rawComputedFields.computed_fields || rawComputedFields;
  const inputParams = data.data.input_params as Record<string, any>;
  const qreSummary = inputParams?.qreSummary;
  const currencyCode =
    (inputParams?.metadata?.currency as string) ||
    (inputParams?.currency as string) ||
    'USD';

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '--';

    // Check if it's a percentage (string ending with %)
    if (typeof value === 'string' && value.trim().endsWith('%')) {
      return value;
    }

    const numValue =
      typeof value === 'string'
        ? parseFloat(value.replace(/[^0-9.-]/g, ''))
        : value;
    if (typeof numValue === 'number' && !isNaN(numValue)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
      }).format(numValue);
    }
    return value;
  };

  const formatLabel = (key: string) => {
    if (key.includes(' ')) return key;
    return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderValue = (value: any) => {
    if (value === null || value === undefined) return '--';

    const isPercentage = typeof value === 'string' && value.endsWith('%');
    const isNumeric =
      !isPercentage &&
      (typeof value === 'number' ||
        (typeof value === 'string' &&
          !isNaN(parseFloat(value.replace(/[^0-9.-]/g, ''))) &&
          isFinite(Number(value.replace(/[^0-9.-]/g, '')))));

    return (
      <div className='min-w-[150px] px-3 py-1 rounded-xs border border-[#CBD6E2] bg-[#F9FAFB] text-right inline-block'>
        <span className='text-[13px] font-semibold text-[#2D3E4F]'>
          {isNumeric ? formatCurrency(value) : (value ?? '--')}
        </span>
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
              key === 'name' ||
              key.toLowerCase().includes('280c')
            )
              return null;

            return (
              <tr key={key} className='border-b border-[#CBD6E2] last:border-0'>
                <td className='px-3 py-1.5 text-sm text-[#425A76] font-medium w-1/2'>
                  {formatLabel(key)}
                </td>
                <td className='px-3 py-1.5 text-right'>{renderValue(value)}</td>
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

              return Array.from(allRowKeys).map((rowKey) => (
                <tr
                  key={rowKey}
                  className='border-b border-[#CBD6E2] last:border-0'
                >
                  <td className='px-3 py-1.5 text-sm font-medium text-[#425A76]'>
                    {formatLabel(rowKey)}
                  </td>
                  {columnKeys.map((colKey) => (
                    <td key={colKey} className='px-3 py-1.5 text-right'>
                      {renderValue(reduction280c[colKey][rowKey])}
                    </td>
                  ))}
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className='p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex flex-col gap-0'>
          {/* QRE Summary Section */}
          {qreSummary && (
            <React.Fragment>
              {renderCard('QRE Summary', renderKeyValuePairs(qreSummary))}
            </React.Fragment>
          )}

          {/* ASC Credit Section */}
          {(computedFields['ASC Credit'] || computedFields.asc) && (
            <React.Fragment>
              <div className='mb-4'>
                {renderCard(
                  'ASC Credit',
                  <div className='w-full'>
                    {renderKeyValuePairs(
                      computedFields['ASC Credit']?.creditASC ||
                        computedFields.asc?.creditASC
                    )}
                    {render280C(
                      'Reduction 280C',
                      computedFields['ASC Credit']?.asc280C ||
                        computedFields.asc?.asc280C
                    )}
                  </div>
                )}
              </div>
            </React.Fragment>
          )}

          {/* Regular Credit Section */}
          {(computedFields['Regular Credit'] || computedFields.rrc) && (
            <React.Fragment>
              <div className='mb-4'>
                {renderCard(
                  'Regular Credit',
                  <div className='w-full'>
                    {renderKeyValuePairs(
                      computedFields['Regular Credit']?.creditRRC ||
                        computedFields.rrc?.creditRRC
                    )}
                    {render280C(
                      'Reduction 280C',
                      computedFields['Regular Credit']?.rrc280C ||
                        computedFields.rrc?.rrc280C
                    )}
                  </div>
                )}
              </div>
            </React.Fragment>
          )}

          {/* Bottom Summary Section */}
          {Object.entries(computedFields).map(([key, value]) => {
            if (typeof value !== 'object' && key !== 'computed_fields') {
              return (
                <div key={key} className='mb-4'>
                  {renderCard(
                    formatLabel(key),
                    <div className='flex justify-start items-center'>
                      {renderValue(value as any)}
                    </div>,
                    true
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};

export default FinancialWorkingUSA;
