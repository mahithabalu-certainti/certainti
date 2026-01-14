/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { FinancialHighlightsResponse, USAComputedFields } from '../../../../../../types/dossier';

interface FinancialWorkingUSAProps {
  data: FinancialHighlightsResponse | null;
}

const FinancialWorkingUSA: React.FC<FinancialWorkingUSAProps> = ({ data }) => {
  // Check if data is present and has correct structure
  if (!data?.data?.computed_fields || !('computed_fields' in data.data.computed_fields)) {
    return <div className="p-4 text-center text-gray-500">No data available or invalid format</div>;
  }

  const computedFieldsRoot = (data.data.computed_fields as USAComputedFields).computed_fields;
  const currencyCode = (data.data.input_params?.currency as string) || 'USD';

  const formatCurrency = (value: number | string | null | undefined) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
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
    return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderValue = (value: number | string | null | undefined) => {
    const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(Number(value)));
    
    return (
      <div className="min-w-[150px] px-3 py-1 rounded-xs border border-[#CBD6E2] bg-[#F9FAFB] text-right inline-block">
        <span className="text-[13px] font-semibold text-[#2D3E4F]">
          {isNumeric ? formatCurrency(value) : value ?? '--'}
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

  const renderKeyValuePairs = (obj: Record<string, any>) => {
    const entries = Object.entries(obj);

    return (
      <table className='w-full border-collapse'>
        <tbody>
          {entries.map(([key, value]) => {
            if (
              (typeof value === 'object' && value !== null && !Array.isArray(value)) ||
              Array.isArray(value) ||
              key === 'name'
            )
              return null;

            return (
              <tr key={key} className='border-b border-[#CBD6E2] last:border-0'>
                <td className='px-3 py-1.5 text-sm text-[#425A76] font-medium w-1/2'>
                  {formatLabel(key)}
                </td>
                <td className='px-3 py-1.5 text-right'>
                  {renderValue(value)}
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

    const columnKeys = ['elect280c', 'no_elect280c'];

    return (
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse'>
          <thead>
            <tr className='bg-gray-50 border-b border-[#CBD6E2]'>
              <th scope='col' className='px-3 py-1.5 text-left text-[12px] font-bold text-[#2D3E4F] uppercase tracking-wider'>
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
             {/* We need to extract the properties from the options */}
             {/* Typically rate/credit or credit/factor */}
             {(() => {
                const sampleOption = reduction280c[columnKeys[0]];
                const keysToRender = Object.keys(sampleOption);
                
                return keysToRender.map((propKey) => (
                  <tr key={propKey} className='border-b border-[#CBD6E2] last:border-0'>
                    <td className='px-3 py-1.5 text-sm font-medium text-[#425A76]'>
                      {formatLabel(propKey)}
                    </td>
                    {columnKeys.map((optionKey) => (
                      <td key={optionKey} className='px-3 py-1.5 text-right'>
                        {renderValue(reduction280c[optionKey][propKey])}
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
          {/* RRC Section */}
          {computedFieldsRoot.rrc && (
            <>
              {renderCard("Regular credit", renderKeyValuePairs(computedFieldsRoot.rrc.creditRRC))}
              {renderCard("RRC 280C", render280C("reduction280c", computedFieldsRoot.rrc.rrc280C))}
            </>
          )}

          {/* ASC Section */}
          {computedFieldsRoot.asc && (
            <>
              {renderCard("ASC credit", renderKeyValuePairs(computedFieldsRoot.asc.creditASC))}
              {renderCard("ASC 280C", render280C("reduction280c", computedFieldsRoot.asc.asc280C))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialWorkingUSA;
