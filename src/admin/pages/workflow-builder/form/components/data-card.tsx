import React, { ReactNode } from 'react';
import { CloseIcon } from '../../../../../assets';
import { getCategoryColor, getDynamicSvgIcon } from '../helper';

// Base interface that both Trigger and Action should extend
export interface BaseCardItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  badge?: string;
}

// Props for the generic DataCard
interface DataCardProps<T extends BaseCardItem> {
  item: T;
  onSelect: (item: T) => void;
  isSelected?: boolean;
  isAlreadyAdded?: boolean;
  showBadge?: boolean;
  onDelete?: () => void;
  type?: 'trigger' | 'action';
  iconRenderer?: (item: T) => ReactNode;
  disabled?: boolean; // New prop to disable the card
}

export default function DataCard<T extends BaseCardItem>({
  item,
  onSelect,
  isSelected = false,
  isAlreadyAdded = false,
  showBadge = false,
  onDelete,
  type = 'trigger',
  iconRenderer,
  disabled = false,
}: DataCardProps<T>) {
  const bgColor = getCategoryColor(item.category) || '#E5E7EB';

  // Handle click on the main card
  const handleCardClick = () => {
    if (disabled) return; // Don't trigger click if disabled
    onSelect(item);
  };

  // Handle delete button click (for actions only)
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.();
  };

  // Determine selection color based on type and state
  const getSelectionColor = () => {
    // For disabled items (already added in main list) - show same UI but disabled
    if (disabled) {
      return {
        border: 'border-[#CBD6E2]',
        bg: 'bg-gray-50',
        iconBg: 'bg-gray-100',
        selectionIcon: 'none',
        textColor: 'text-[#425A76]',
        descriptionColor: 'text-[#6B7A90]',
      };
    }

    // For added actions in "Added Actions" section
    if (type === 'action' && isAlreadyAdded) {
      return {
        border: 'border-green-300',
        bg: 'bg-green-50',
        iconBg: 'bg-green-200',
        selectionIcon: 'green',
        textColor: 'text-[#425A76]',
        descriptionColor: 'text-[#6B7A90]',
      };
    }

    // For selected items
    if (isSelected || isAlreadyAdded) {
      return {
        border: type === 'action' ? 'border-green-300' : 'border-blue-500',
        bg: type === 'action' ? 'bg-green-50' : 'bg-blue-50',
        iconBg: type === 'action' ? 'bg-green-200' : 'bg-blue-200',
        selectionIcon: type === 'action' ? 'green' : 'blue',
        textColor: 'text-[#425A76]',
        descriptionColor: 'text-[#6B7A90]',
      };
    }

    // Default styling (available items)
    return {
      border: 'border-[#CBD6E2]',
      bg: 'bg-gray-50',
      iconBg: 'bg-blue-100 group-hover:bg-blue-200',
      selectionIcon: 'blue',
      textColor: 'text-[#425A76]',
      descriptionColor: 'text-[#6B7A90]',
    };
  };

  const colors = getSelectionColor();

  return (
    <div className='relative'>
      {/* Main card as a button */}
      <button
        onClick={handleCardClick}
        disabled={disabled}
        className={`w-full flex items-start gap-3 p-3 rounded-md border transition-all 
                   text-left ${disabled ? 'cursor-default opacity-80 !bg-gray-100' : 'cursor-pointer group'}
                   ${colors.border} ${colors.bg} 
                   ${!disabled && 'hover:border-blue-500 hover:bg-blue-50'}`}
      >
        {/* Selection indicator - only show for non-disabled added items */}
        {type !== 'action' &&
          !disabled &&
          (isSelected || isAlreadyAdded) &&
          colors.selectionIcon !== 'none' && (
            <div
              className={`absolute -top-2 -right-2 w-5 h-5 ${
                colors.selectionIcon === 'green'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              } rounded-full flex items-center justify-center z-10`}
            >
              <svg
                className='w-3 h-3 text-white'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
          )}

        {/* Icon */}
        <div
          className={`mt-0.5 p-1.5 rounded-md flex items-center justify-center w-7 h-7 flex-shrink-0 ${colors.iconBg}`}
          style={{ backgroundColor: bgColor }}
        >
          {iconRenderer ? iconRenderer(item) : getDynamicSvgIcon(item.name)}
        </div>

        {/* Content */}
        <div className='flex-1 min-w-0'>
          <div className='font-medium text-sm leading-snug break-words'>
            <span className={`align-middle capitalize ${colors.textColor}`}>
              {item.name}
            </span>{' '}
            {showBadge && item.badge && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-semibold align-middle ${
                  item.badge === 'NEW'
                    ? 'bg-orange-100 text-orange-700'
                    : item.badge === 'POPULAR'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-[#425A76]'
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>
          <p className={`text-xs line-clamp-1 ${colors.descriptionColor}`}>
            {item.description}
          </p>
        </div>
      </button>

      {/* Delete button - show for selected triggers or added actions */}
      {onDelete &&
        !disabled &&
        ((type === 'trigger' && isSelected) ||
          (type === 'action' && isAlreadyAdded)) && (
          <button
            onClick={handleDeleteClick}
            className='absolute -top-2 -right-2 w-5 h-5 bg-red-100 border border-red-400 rounded-full flex items-center justify-center cursor-pointer z-10 hover:bg-red-200 transition-colors'
            title={type === 'trigger' ? 'Remove Trigger' : 'Remove Action'}
            type='button'
          >
            <React.Suspense fallback={null}>
              <CloseIcon className='w-[8px] h-[8px] [&>path]:stroke-[#eb5628]' />
            </React.Suspense>
          </button>
        )}

      {/* Remove the "Already Added" overlay - we'll just use opacity */}
    </div>
  );
}

// Type-safe wrapper for Trigger
interface TriggerCardProps
  extends Omit<DataCardProps<BaseCardItem>, 'item' | 'type'> {
  trigger: BaseCardItem;
}

export function TriggerCard({ trigger, ...props }: TriggerCardProps) {
  return <DataCard item={trigger} type='trigger' {...props} />;
}

// Type-safe wrapper for Action
interface ActionCardProps
  extends Omit<DataCardProps<BaseCardItem>, 'item' | 'type'> {
  action: BaseCardItem;
  disabled?: boolean;
}

export function ActionCard({ action, disabled, ...props }: ActionCardProps) {
  return (
    <DataCard item={action} type='action' disabled={disabled} {...props} />
  );
}
