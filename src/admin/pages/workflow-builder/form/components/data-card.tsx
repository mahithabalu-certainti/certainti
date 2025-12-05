import { ReactNode } from 'react';
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
}: DataCardProps<T>) {
  const bgColor = getCategoryColor(item.category) || '#E5E7EB';

  // Handle click on the main card
  const handleCardClick = () => {
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
    if (type === 'action' && isAlreadyAdded) {
      return {
        border: 'border-green-300',
        bg: 'bg-green-50',
        iconBg: 'bg-green-200',
        selectionIcon: 'green',
      };
    }
    if (isSelected || isAlreadyAdded) {
      return {
        border: type === 'action' ? 'border-green-300' : 'border-blue-500',
        bg: type === 'action' ? 'bg-green-50' : 'bg-blue-50',
        iconBg: type === 'action' ? 'bg-green-200' : 'bg-blue-200',
        selectionIcon: type === 'action' ? 'green' : 'blue',
      };
    }
    return {
      border: 'border-[#CBD6E2]',
      bg: 'bg-gray-50',
      iconBg: 'bg-blue-100 group-hover:bg-blue-200',
      selectionIcon: 'blue',
    };
  };

  const colors = getSelectionColor();

  return (
    <div className='relative'>
      {/* Main card as a button */}
      <button
        onClick={handleCardClick}
        className={`w-full flex items-start gap-3 p-3 rounded-md border transition-all 
                   text-left cursor-pointer group
                   ${colors.border} ${colors.bg} hover:border-blue-500 hover:bg-blue-50`}
      >
        {/* Selection indicator */}
        {(isSelected || isAlreadyAdded) && (
          <div
            className={`absolute -top-2 -right-2 w-5 h-5 ${
              colors.selectionIcon === 'green' ? 'bg-green-500' : 'bg-blue-500'
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
          <div className='font-medium text-sm text-[#425A76] leading-snug break-words'>
            <span className='align-middle capitalize'>{item.name}</span>{' '}
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
          <p className='text-xs text-[#6B7A90] line-clamp-1'>
            {item.description}
          </p>
        </div>
      </button>

      {/* Delete button for actions (only when already added) */}
      {type === 'action' && isAlreadyAdded && onDelete && (
        <button
          onClick={handleDeleteClick}
          className='absolute -top-2 -right-2 w-5 h-5 bg-red-100 !boder-none rounded-full flex items-center justify-center cursor-pointer z-20 hover:bg-red-200 transition-colors'
          title='Remove Action'
          type='button'
        >
          <CloseIcon className='w-[8px] h-[8px] [&>path]:stroke-[#F16137]' />
        </button>
      )}
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
}

export function ActionCard({ action, ...props }: ActionCardProps) {
  return <DataCard item={action} type='action' {...props} />;
}
