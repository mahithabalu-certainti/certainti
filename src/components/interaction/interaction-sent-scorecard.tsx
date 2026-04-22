import React from 'react';
import { blendWithWhite } from '../../consultant/pages/home/helpers';

interface InteractionSentScorecardProps {
  totalProjects: number | string | null | undefined;
  interactionsSent: number | string | null | undefined;
  interactionDraftProjects?: number | string | null;
  interactionResponseReceivedProjects?: number | string | null;
  totalResources?: number | string | null;
  totalCases?: number | string | null;
  totalProjectHours?: number | string | null;
  totalCost?: number | string | null;
  currencySymbol?: string;
  showExtendedMetrics?: boolean;
  loading?: boolean;
}

const ScorecardIcon = ({
  icon,
  color,
  size = 18,
}: {
  icon:
    | 'projects'
    | 'interactions'
    | 'resources'
    | 'cases'
    | 'hours'
    | 'cost'
    | 'draft'
    | 'response';
  color: string;
  size?: number;
}) => {
  switch (icon) {
    case 'projects':
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2' strokeLinecap='round'>
          <rect x='3' y='4' width='20' height='16' rx='2' />
          <path d='M8 4v16M16 4v16M3 10h18' />
        </svg>
      );
    case 'interactions':
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2' strokeLinecap='round'>
          <path d='M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z' />
          <path d='M8 9h8M8 13h5' />
        </svg>
      );
    case 'resources':
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2' strokeLinecap='round'>
          <circle cx='9' cy='8' r='3' />
          <circle cx='17' cy='9' r='2.5' />
          <path d='M3 20c0-3.5 3-6 6-6s6 2.5 6 6' />
          <path d='M14 20c0-2.4 1.8-4.1 4-4.6' />
        </svg>
      );
    case 'cases':
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2' strokeLinecap='round'>
          <rect x='4' y='3' width='16' height='18' rx='2' />
          <path d='M8 8h8M8 12h8M8 16h5' />
        </svg>
      );
    case 'hours':
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2' strokeLinecap='round'>
          <circle cx='12' cy='12' r='9' />
          <path d='M12 7v6l4 2' />
        </svg>
      );
    case 'draft':
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2' strokeLinecap='round'>
          <path d='M12 20h9' />
          <path d='M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z' />
        </svg>
      );
    case 'response':
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2' strokeLinecap='round'>
          <path d='M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z' />
          <path d='m9 11 2 2 4-4' />
        </svg>
      );
    case 'cost':
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2' strokeLinecap='round'>
          <rect x='2' y='6' width='20' height='12' rx='2' />
          <circle cx='12' cy='12' r='2.5' />
          <path d='M6 12h.01M18 12h.01' />
        </svg>
      );
    default:
      return null;
  }
};

const InteractionSentScorecard: React.FC<InteractionSentScorecardProps> = ({
  totalProjects,
  interactionsSent,
  interactionDraftProjects = 0,
  interactionResponseReceivedProjects = 0,
  totalResources = 0,
  totalCases = 0,
  totalProjectHours = 0,
  totalCost = 0,
  currencySymbol = '$',
  showExtendedMetrics = false,
  loading = false,
}) => {
  const toNumber = (
    value: number | string | null | undefined
  ): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const sanitized = value.replace(/,/g, '');
      const parsed = Number(sanitized);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const formatValue = (
    value: number | string | null | undefined,
    format: 'number' | 'currency' = 'number'
  ) => {
    if (loading) return '...';
    const parsedValue = toNumber(value);
    if (format === 'currency') {
      return `${currencySymbol}${parsedValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    }
    return parsedValue.toLocaleString('en-US');
  };

  const scorecardItems = [
    {
      key: 'total-projects',
      label: 'Total Projects',
      value: formatValue(totalProjects),
      color: '#1E4D8B',
      icon: 'projects' as const,
    },
    {
      key: 'interaction-sent-projects',
      label: 'interaction sent (Projects)',
      value: formatValue(interactionsSent),
      color: '#0F766E',
      icon: 'interactions' as const,
    },
    ...(showExtendedMetrics
      ? [
          {
            key: 'interaction-draft-projects',
            label: 'Interaction draft (Projects)',
            value: formatValue(interactionDraftProjects),
            color: '#7E22CE',
            icon: 'draft' as const,
          },
          {
            key: 'interaction-response-received-projects',
            label: (
              <>
                Interactions response
                <br />
                received (Projects)
              </>
            ),
            value: formatValue(interactionResponseReceivedProjects),
            color: '#15803D',
            icon: 'response' as const,
          },
          {
            key: 'total-resources',
            label: 'Total Resources',
            value: formatValue(totalResources),
            color: '#2563EB',
            icon: 'resources' as const,
          },
          {
            key: 'total-cases',
            label: 'Total Cases',
            value: formatValue(totalCases),
            color: '#B45309',
            icon: 'cases' as const,
          },
          {
            key: 'total-project-hours',
            label: 'Total Project Hours',
            value: formatValue(totalProjectHours),
            color: '#0F766E',
            icon: 'hours' as const,
          },
          {
            key: 'total-cost',
            label: 'Total Project Cost',
            value: formatValue(totalCost, 'currency'),
            color: '#7C3AED',
            icon: 'cost' as const,
          },
        ]
      : []),
  ];

  return (
    <div className='w-full px-3 py-1 border-b border-[#E5EAF0] bg-[#F8FBFF]'>
      <div className='flex items-stretch gap-3 overflow-x-auto whitespace-nowrap pb-1'>
        {scorecardItems.map((item) => (
          <div
            key={item.key}
            className='rounded-md border border-[#CBD6E2] bg-white p-3.5 min-h-[86px] min-w-[203px] max-w-[203px] flex flex-col justify-between shrink-0 hover:shadow-md transition-shadow duration-200'
          >
            <p className='text-[13px] font-bold text-[#1E3A5F] leading-4'>
              {item.label}
            </p>
            <div className='flex items-center justify-between mt-0.5 gap-1'>
              <p className='text-[17px] leading-5 font-semibold text-[#2A2A2A] truncate'>
                {item.value}
              </p>
              <div
                className='h-9 w-9 flex items-center justify-center rounded-md text-lg flex-shrink-0'
                style={{ backgroundColor: blendWithWhite(item.color, 0.9) }}
              >
                <ScorecardIcon icon={item.icon} color={item.color} size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InteractionSentScorecard;
