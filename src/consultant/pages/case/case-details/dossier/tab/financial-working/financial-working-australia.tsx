/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  FinancialHighlightsResponse,
  AustraliaComputedFields,
} from '../../../../../../types/dossier';
import { costDisplay, valueDisplay } from '../../../../../../../common-utils';

interface FinancialWorkingAustraliaProps {
  data: FinancialHighlightsResponse | null;
  currencySymbol: string;
}

const FinancialWorkingAustralia: React.FC<FinancialWorkingAustraliaProps> = ({
  data,
  currencySymbol,
}) => {
  // Check if data is present and has correct structure
  const computedFields = data?.data?.computed_fields as AustraliaComputedFields;
  console.log('computedFields', computedFields);
  if (
    !data?.data ||
    !computedFields
    // !('R&D Expenditure' in computedFields)
  ) {
    return (
      <div className='p-8 text-center text-[#425A76] italic font-medium'>
        No data available
      </div>
    );
  }

  const boldRows = (computedFields as any)?.BOLD || [];

  const formatValue = (
    value: string | number
    // currency?: string
  ) => {
    if (value === 0 || value === '0') {
      return '-';
    }
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (typeof value === 'number') {
      return costDisplay(value.toFixed(2), currencySymbol as string);
    }
    if (
      typeof value === 'string' &&
      !isNaN(Number(value)) &&
      value.trim() !== '' &&
      !/[a-zA-Z]/.test(value)
    ) {
      return valueDisplay(value);
    }
    return value;
  };
  const formatLabel = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const extractPrefix = (str: string) => {
    const bracketMatch = str.match(/^\[(.*?)\]\s*(.*)/);
    if (bracketMatch)
      return { prefix: bracketMatch[1], label: bracketMatch[2] };

    const parenMatch = str.match(/^\((.*?)\)\s*(.*)/);
    if (parenMatch) return { prefix: parenMatch[1], label: parenMatch[2] };

    return { prefix: '', label: str };
  };

  const renderValue = (
    value: number | string | null | undefined,
    isBold?: boolean
  ) => {
    const isNumeric =
      typeof value === 'number' ||
      (typeof value === 'string' &&
        value.trim() !== '' &&
        (!isNaN(Number(value)) || value.endsWith('%')));

    return (
      <div
        className={`min-w-[150px] px-3 py-1 flex items-center rounded-xs border border-[#CBD6E2] bg-[#F9FAFB] ${isNumeric ? 'justify-end text-right' : 'justify-start text-left'} inline-block`}
      >
        <span
          className={`text-[13px] ${isBold ? 'font-bold text-[#1A2733]' : 'font-semibold text-[#2D3E4F]'}`}
        >
          {typeof value === 'number' ? formatValue(value) : (value ?? '--')}
        </span>
      </div>
    );
  };

  const renderCard = (
    title: string,
    content: React.ReactNode,
    isPrimitive: boolean = false
  ) => {
    const { prefix, label } = extractPrefix(title);
    return (
      <div className='w-full border border-[#CBD6E2] mb-4'>
        <div className='bg-[#ECECEC] border-b border-[#CBD6E2] flex items-stretch min-h-[30px]'>
          <div className='font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] w-full'>
            <div className='flex items-stretch h-full'>
              <div className='w-[130px] flex-shrink-0 border-r border-[#CBD6E2] pl-2 flex items-center py-1 whitespace-nowrap overflow-hidden'>
                {prefix}
              </div>
              <div className='pl-2 flex items-center flex-1 py-1'>{label}</div>
            </div>
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
  };

  const renderKeyValuePairsRows = (
    obj: Record<string, any>,
    depth: number = 0
  ): React.ReactNode => {
    const entries = Object.entries(obj);

    return entries.map(([key, value]) => {
      // Basic filtering
      if (key === 'name' || key === 'Title' || key === 'BOLD') return null;

      // Handle nested object - Render a sub-header row
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Object.keys(value).length > 0
      ) {
        const { prefix, label } = extractPrefix(formatLabel(key));
        const hasVisibleHeader = prefix || label.trim() !== '';

        return (
          <React.Fragment key={key}>
            {hasVisibleHeader && (
              <tr className='bg-[#F9FAFB] border-y border-[#CBD6E2]'>
                <td className='px-2 py-1 text-[13px] font-bold text-[#2D3E4F] w-[130px] border-r border-[#CBD6E2] text-right bg-[#f3f4f6]'>
                  {prefix}
                </td>
                <td className='px-2 py-1 text-[13px] font-bold text-[#2D3E4F] bg-[#f3f4f6]'>
                  {label}
                </td>
              </tr>
            )}
            {renderKeyValuePairsRows(value, depth + 1)}
          </React.Fragment>
        );
      }

      // Handle primitive values or empty objects as regular rows
      const isBold = boldRows.includes(key);
      const { prefix, label } = extractPrefix(formatLabel(key));

      return (
        <tr
          key={key}
          className='h-[28px] border-b border-[#CBD6E2] last:border-0'
        >
          <td className='px-2 py-0 text-sm text-[#425A76] font-medium w-[130px] align-middle border-r border-[#CBD6E2] whitespace-nowrap text-right'>
            {prefix}
          </td>
          <td className='align-middle px-2 py-0'>
            <div className='flex justify-between items-center py-[1.5px] w-full'>
              <div
                className={`text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76]  font-medium'}`}
              >
                {label}
              </div>
              <div className='text-right '>{renderValue(value, isBold)}</div>
            </div>
          </td>
        </tr>
      );
    });
  };

  const renderKeyValuePairs = (obj: Record<string, any>) => {
    return (
      <table className='w-full border-collapse'>
        <tbody>{renderKeyValuePairsRows(obj)}</tbody>
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
                className='px-2 py-1 text-left text-[12px] font-bold text-[#2D3E4F] uppercase tracking-wider'
              >
                {headerLabel || ''}
              </th>
              {columnKeys.map((key) => (
                <th
                  key={key}
                  scope='col'
                  className='px-2 py-1 text-right text-[12px] font-bold text-[#2D3E4F] uppercase tracking-wider'
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
                  className='h-[28px] border-b border-[#CBD6E2] last:border-0'
                >
                  <td
                    className={`px-2 py-0 align-middle text-sm ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76] font-medium'}`}
                  >
                    {rowName}
                  </td>
                  {columnKeys.map((key) => (
                    <td
                      key={key}
                      className='px-2 py-0 align-middle py-[1.5px] text-right'
                    >
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
      <div>
        <div className='flex flex-col gap-0'>
          {Object.entries(computedFields).map(([key, value]) => {
            if (key === 'Title') return null;
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

            // Handle Objects (e.g., R&D Expenditure, PART E, etc.)
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
                    {formatValue(value)}
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
