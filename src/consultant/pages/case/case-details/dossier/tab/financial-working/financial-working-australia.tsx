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

  const formatCurrency = (value: any) => {
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

  const renderValue = (value: any) => {
    if (typeof value === 'number') {
      return <span className="font-bold text-[14px] text-[#2D3E4F]">{formatCurrency(value)}</span>;
    }
    return <span className="font-bold text-[14px] text-[#2D3E4F]">{value}</span>;
  };

  const renderCard = (
    title: string,
    content: React.ReactNode,
    isPrimitive: boolean = false
  ) => (
    <div className='bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow h-full'>
      <div className='flex items-center mb-2'>
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

  const renderKeyValuePairs = (obj: Record<string, any>) => {
    return Object.entries(obj).map(([key, value]) => {
      // Skip nested objects, arrays, and 'name' property (used as title)
      if (
        (typeof value === 'object' && value !== null && !Array.isArray(value)) ||
        Array.isArray(value) ||
        key === 'name'
      )
        return null;

      return (
        <div
          key={key}
          className='flex justify-between items-center py-1 border-b border-gray-100 last:border-0'
        >
          <span className='text-sm text-gray-600 font-medium'>
            {formatLabel(key)}
          </span>
          {renderValue(value)}
        </div>
      );
    });
  };

  return (
    <div className='bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg'>
      <div className='max-w-7xl mx-auto'>
        {/* Main Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {Object.entries(computedFields).map(([key, value]) => {
            const title = formatLabel(key);

            // Handle Arrays (e.g., Tier of intensity)
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
