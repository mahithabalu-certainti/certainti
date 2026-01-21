/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  FinancialHighlightsResponse,
  AustraliaComputedFields,
} from '../../../../../../types/dossier';

interface FinancialWorkingAustraliaProps {
  data: FinancialHighlightsResponse | null;
}

const FinancialWorkingAustralia: React.FC<FinancialWorkingAustraliaProps> = ({
  data,
}) => {
  // Check if data is present and has correct structure
  const computedFields = data?.data?.computed_fields as AustraliaComputedFields;
  
  if (!data?.data || !computedFields || !('R&D Expenditure' in computedFields)) {
      return <div className="p-8 text-center text-[#425A76] italic font-medium">No data available</div>;
  }

  const boldRows = (computedFields as any)?.BOLD || [];

  const currencyCode = (data?.data?.input_params?.currency as string) || 'AUD';

  const formatCurrency = (value: number | string | null | undefined) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
      }).format(value);
    }
    return value;
  };

  const formatLabel = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderValue = (value: number | string | null | undefined, isBold?: boolean) => {
    return (
      <div className='min-w-[150px] px-3 py-1 rounded-xs border border-[#CBD6E2] bg-[#F9FAFB] text-right inline-block'>
        <span className={`text-[13px] ${isBold ? 'font-bold text-[#1A2733]' : 'font-semibold text-[#2D3E4F]'}`}>
          {typeof value === 'number' ? formatCurrency(value) : (value ?? '--')}
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
        <div className='capitalize font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%]'>
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

  const renderKeyValuePairs = (
    obj: Record<string, number | string | null | undefined>
  ) => {
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

  // Special renderer for Tier of intensity array
  const renderTierTable = (
    tiers: Array<Record<string, any>>,
    headerLabel?: string
  ) => {
    if (!tiers || tiers.length === 0) return null;

    // Get all unique keys from all tiers (excluding 'name')
    const allKeys = new Set<string>();
    tiers.forEach((tier) => {
      Object.keys(tier).forEach((key) => {
        if (key !== 'name') {
          allKeys.add(key);
        }
      });
    });

    const columnKeys = Array.from(allKeys);

    return (
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse'>
          <thead>
            <tr className='bg-gray-50 border-b border-[#CBD6E2]'>
              <th
                scope='col'
                className='px-3 py-1.5 text-left text-[12px] font-bold text-[#2D3E4F] uppercase tracking-wider'
              >
                {headerLabel || ''}
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
            {tiers.map((tier, index) => {
              const rowName = tier.name || `${headerLabel} ${index + 1}`;
              const isBold = boldRows.includes(rowName);
              return (
                <tr
                  key={index}
                  className='border-b border-[#CBD6E2] last:border-0'
                >
                  <td className={`px-3 py-1.5 text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'}`}>
                    {rowName}
                  </td>
                  {columnKeys.map((key) => (
                    <td key={key} className='px-3 py-1.5 text-right'>
                      {renderValue(tier[key], isBold)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className='p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex flex-col gap-0'>
          {Object.entries(computedFields).map(([key, value]) => {
            const title = formatLabel(key);

            // Special handling for "Tier of intensity" array - render as table
            if (key === 'Tier of intensity' && Array.isArray(value)) {
              return (
                <React.Fragment key={key}>
                  {renderCard(title, renderTierTable(value, title))}
                </React.Fragment>
              );
            }

            // Handle other Arrays
            if (Array.isArray(value)) {
              return value.map((item, idx) => {
                const itemTitle = item?.name || `${title} ${idx + 1}`;
                return (
                  <React.Fragment key={`${key}-${idx}`}>
                    {renderCard(itemTitle, renderKeyValuePairs(item))}
                  </React.Fragment>
                );
              });
            }

            // Handle Objects (e.g., R&D Expenditure)
            if (typeof value === 'object' && value !== null) {
              return (
                <React.Fragment key={key}>
                  {renderCard(title, renderKeyValuePairs(value))}
                </React.Fragment>
              );
            }

            // Handle Primitives (e.g., Preliminary Calculation)
            return (
              <React.Fragment key={key}>
                {renderCard(
                  title,
                  <span className='font-bold text-[14px] text-[#2D3E4F]'>
                    {formatCurrency(value)}
                  </span>,
                  true
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FinancialWorkingAustralia;
