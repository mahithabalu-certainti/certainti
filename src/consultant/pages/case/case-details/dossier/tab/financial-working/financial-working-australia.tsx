/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { FinancialHighlightsResponse, AustraliaComputedFields } from '../../../../../../types/dossier';

interface FinancialWorkingAustraliaProps {
    data: FinancialHighlightsResponse | null;
}

const FinancialWorkingAustralia: React.FC<FinancialWorkingAustraliaProps> = ({ data }) => {
    
  // Check if data is present and has correct structure
  if (!data?.data?.computed_fields || !('R&D Expenditure' in data.data.computed_fields)) {
      return <div className="p-4 text-center text-gray-500">No data available or invalid format</div>;
  }

  const computedFields = data.data.computed_fields as AustraliaComputedFields;
  const currencyCode = (data.data.input_params?.currency as string) || 'AUD';

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
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderValue = (value: number | string | null | undefined) => {
    return (
      <div className="min-w-[140px] px-3 py-1.5 rounded-md border border-gray-300 bg-gray-50 text-right">
        <span className="text-[13px] font-semibold text-[#2D3E4F]">
          {typeof value === 'number' ? formatCurrency(value) : value ?? '--'}
        </span>
      </div>
    );
  };

  const renderCard = (
    title: string,
    content: React.ReactNode,
    isPrimitive: boolean = false
  ) => (
    <div className='bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow h-full'>
      <div className='flex items-center mb-3'>
        <div className='capitalize font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle'>
          {title}
        </div>
      </div>
      {isPrimitive ? (
        <div className='text-center py-2'>{content}</div>
      ) : (
        <div className='space-y-1'>{content}</div>
      )}
    </div>
  );

  const renderKeyValuePairs = (obj: Record<string, number | string | null | undefined>) => {
    const entries = Object.entries(obj);
    
    return entries.map(([key, value]) => {
      // Skip nested objects, arrays, and 'name' property
      if (
        (typeof value === 'object' && value !== null && !Array.isArray(value)) ||
        Array.isArray(value) ||
        key === 'name'
      )
        return null;

      return (
        <div
          key={key}
          className='flex justify-between items-center py-2 border-b border-gray-100 last:border-0'
        >
          <span className='text-sm text-gray-600 font-medium'>
            {formatLabel(key)}
          </span>
          {renderValue(value)}
        </div>
      );
    });
  };

  // Special renderer for Tier of intensity array
  const renderTierTable = (tiers: Array<Record<string, any>>) => {
    if (!tiers || tiers.length === 0) return null;

    // Get all unique keys from all tiers (excluding 'name')
    const allKeys = new Set<string>();
    tiers.forEach(tier => {
      Object.keys(tier).forEach(key => {
        if (key !== 'name') {
          allKeys.add(key);
        }
      });
    });

    const columnKeys = Array.from(allKeys);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Tier of intensity
              </th>
              {columnKeys.map(key => (
                <th 
                  key={key} 
                  scope="col" 
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  {formatLabel(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tiers.map((tier, index) => (
              <tr key={index}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {tier.name || `Tier ${index + 1}`}
                </td>
                {columnKeys.map(key => (
                  <td key={key} className="px-4 py-3 text-right">
                    <div className="min-w-[140px] px-3 py-1.5 rounded-md border border-gray-300 bg-gray-50 text-right inline-block">
                      <span className="text-[13px] font-semibold text-[#2D3E4F]">
                        {typeof tier[key] === 'number' ? formatCurrency(tier[key]) : tier[key] ?? '--'}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className='bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg'>
      <div className='max-w-7xl mx-auto'>
        {/* Main Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-1 gap-4'>
          {Object.entries(computedFields).map(([key, value]) => {
            const title = formatLabel(key);

            // Special handling for "Tier of intensity" array - render as table
            if (key === 'Tier of intensity' && Array.isArray(value)) {
              return (
                <React.Fragment key={key}>
                  {renderCard(title, renderTierTable(value))}
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