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
  const rawComputedFields = data?.data?.computed_fields as USAComputedFields;
  const computedFields = rawComputedFields?.computed_fields || rawComputedFields;

  if (!data?.data || !computedFields || Object.keys(computedFields).length === 0) {
    return <div className="p-8 text-center text-[#425A76] italic font-medium">No data available</div>;
  }

  const boldRows = (computedFields as any)?.BOLD || [];

  const inputParams = data?.data?.input_params as Record<string, any>;
  const qreSummary = inputParams?.qreSummary;
  const currencyCode =
    (inputParams?.metadata?.currency as string) ||
    (inputParams?.currency as string) ||
    'USD';

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '';
    
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

  const renderValue = (value: any, isBold?: boolean) => {
    const isEmpty = value === null || value === undefined || value === '';
    
    return (
      <div className="w-[180px] min-h-[32px] px-3 py-1 rounded-xs border border-[#CBD6E2] bg-[#F9FAFB] inline-flex items-center justify-end">
        {!isEmpty && (
          <span className={`text-[13px] ${isBold ? 'font-bold text-[#1A2733]' : 'font-semibold text-[#2D3E4F]'}`}>
            {(() => {
              const isPercentage = typeof value === 'string' && value.endsWith('%');
              const isNumeric = !isPercentage && (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value.replace(/[^0-9.-]/g, ''))) && isFinite(Number(value.replace(/[^0-9.-]/g, '')))));
              return isNumeric ? formatCurrency(value) : value;
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
              key === 'name' ||
              key.toLowerCase().includes('280c')
            )
              return null;

            const isBold = boldRows.includes(key);
            return (
              <tr key={key} className='border-b border-[#CBD6E2] last:border-0'>
                <td className={`px-3 py-1.5 text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'} w-1/2`}>
                  {formatLabel(key)}
                </td>
                <td className='px-3 py-1.5 text-right'>{renderValue(value, isBold)}</td>
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
                    <td className={`px-3 py-1.5 text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'}`}>
                      {formatLabel(rowKey)}
                    </td>
                    {columnKeys.map((colKey) => (
                      <td key={colKey} className='px-3 py-1.5 text-right'>
                        {renderValue(reduction280c[colKey][rowKey], isBold)}
                      </td>
                    ))}
                  </tr>
                );
              });
            })()}

          </tbody>
        </table>
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
                <td className='px-3 py-1.5 text-right'>
                  {renderValue(value)}
                </td>
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
      return render280C("Reduction 280C", value);
    }

    const entries = Object.entries(value);
    const hasObjects = entries.some(([, v]) => typeof v === 'object' && v !== null && !Array.isArray(v));

    if (!hasObjects) {
      return renderKeyValuePairs(value);
    }

    return (
      <div className="w-full">
        {entries.map(([k, v]) => {
          if (k === 'name') return null;
          
          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            if ((v as any).reduction280c) return render280C(k, v);
            return (
              <div key={k} className="border-b border-[#CBD6E2] last:border-0">
                <div className="bg-[#F9FAFB] px-3 py-1 font-semibold text-[13px] text-[#2D3E4F] border-b border-[#CBD6E2]">
                  {formatLabel(k)}
                </div>
                {renderKeyValuePairs(v)}
              </div>
            );
          }
          
          const isBold = k && boldRows.includes(k);
          return (
            <div key={k} className="px-3 py-1.5 flex justify-between items-center border-b border-[#CBD6E2] last:border-0">
              <span className={`text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'}`}>{formatLabel(k)}</span>
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
          {/* QRE Summary Section */}
          {qreSummary && (
            <React.Fragment>
              {renderCard('QRE Summary', renderKeyValuePairs(qreSummary))}
            </React.Fragment>
          )}

          {/* Dynamic Computed Fields Section */}
          {Object.entries(computedFields).map(([key, value]) => {
            if (key === 'computed_fields' || key === 'qreSummary') return null;
            
            return (
              <div key={key} className="mb-4">
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
            <div className="mb-4">
              {renderCard(
                "Final Credit",
                renderCardContent((data?.data as any)?.final_credit, "Final Credit"),
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
