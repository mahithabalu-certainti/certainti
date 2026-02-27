import React from 'react';
import {
  getPriorityBadge,
  getPriorityColor,
  getStatusBadge,
  getInitials,
  getAvatarColor,
} from '../../helpers';
import CardList from './card-list';
import { ExportReportType } from '../../../../types';

interface DefaultItemData {
  title: string;
  description?: string;
  assignee?: string;
  priority?: string;
  status?: string;
  date?: string;
  isOverdue?: boolean;
  isToday?: boolean;
  highlightDate?: boolean;
  account?: string;
  fiscalYear?: number;
  avatar?: string;
  attachedTo?: string;
}

interface TaskCardProps<T> {
  title: string;
  subtitle?: string;
  items: T[];
  mapItem?: (item: T) => DefaultItemData;
  renderItem?: (item: T) => React.ReactNode;
  maxHeight?: number;
  className?: string;
  isLoading?: boolean;
  exportEnable?: boolean;
  exportKey?: ExportReportType;
  handleExport?: (key: ExportReportType) => void;
  onItemClick?: (item: T) => void;
  disabled?: boolean;
  tooltipMessage?: string;
  isItemDisabled?: (item: T) => boolean;
  getItemTooltipMessage?: (item: T) => string;
}

const TaskCard = <T,>({
  title,
  subtitle,
  items,
  renderItem,
  mapItem,
  maxHeight = 400,
  className = '',
  isLoading = false,
  exportEnable = false,
  exportKey,
  handleExport,
  onItemClick,
  disabled = false,
  tooltipMessage = '',
  isItemDisabled,
  getItemTooltipMessage,
}: TaskCardProps<T>) => {
  const itemRenderer = (item: T) => {
    if (renderItem) return renderItem(item);
    if (!mapItem) return null;

    const data = mapItem(item);
    const priorityBadge = getPriorityBadge(data.priority);
    const statusBadge = getStatusBadge(data.status);

    return (
      <div>
        {/* Row 1: Avatar + Name + Badges */}
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            {data.avatar ? (
              <img
                src={data.avatar}
                alt='User avatar'
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid #E2E8F0',
                }}
              />
            ) : (
              <div
                className='flex items-center justify-center rounded-full text-[10px] font-bold text-[#2D3E4F]'
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: getAvatarColor(data.assignee),
                }}
              >
                {data.assignee?.toLowerCase() === 'unassigned'
                  ? 'UA'
                  : getInitials(data.assignee) || 'UA'}
              </div>
            )}
            <span className='text-sm font-medium text-[#2A2A2A]'>
              {data.assignee || 'Unassigned'}
            </span>
          </div>

          <div className='flex gap-1 whitespace-nowrap'>
            {data.priority && (
              <span
                className='text-[10px] px-2 py-0.5 rounded capitalize'
                style={{
                  backgroundColor: priorityBadge.bg,
                  color: priorityBadge.text,
                }}
              >
                {data.priority}
              </span>
            )}

            {data.status && (
              <span
                className='text-[10px] px-2 py-0.5 rounded capitalize'
                style={{
                  backgroundColor: statusBadge.bg,
                  color: statusBadge.text,
                }}
              >
                {data.status}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Title +  Description + Date */}
        <div className='flex justify-between'>
          <div className='flex flex-col text-sm font-semibold text-[#2A2A2A]'>
            {data.title}
            {data.attachedTo && (
              <p className='pr-2 truncate flex-1 text-[11px] text-[#425a76cf]'>
                <span className='font-semibold text-[#239ee6]'>
                  Attached To:{' '}
                </span>{' '}
                {data.attachedTo}
              </p>
            )}
          </div>
          <div className='text-[11px] whitespace-nowrap flex-shrink-0 flex flex-col items-end'>
            <span
              style={{
                color:
                  data.highlightDate && data.isOverdue
                    ? '#FF0000'
                    : data.highlightDate && data.isToday
                      ? '#D97706'
                      : '#425a76cf',
                fontWeight:
                  data.highlightDate && (data.isOverdue || data.isToday)
                    ? 600
                    : 400,
              }}
            >
              {data.highlightDate && data.isOverdue
                ? `Overdue On: ${data.date}`
                : data.highlightDate && data.isToday
                  ? `Due Today: (${data.date})`
                  : data.date}
            </span>
            <div className='text-[11px] font-semibold text-[#425a76cf]'>
              {data.account} / FY-{`${data.fiscalYear}`}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getItemStyle = (item: T) => {
    if (!mapItem) return {};
    const data = mapItem(item);
    const priority = getPriorityColor(data.priority);
    return {
      borderLeftColor: priority.border,
    };
  };

  return (
    <CardList
      title={title}
      subtitle={subtitle}
      items={items}
      isLoading={isLoading}
      maxHeight={maxHeight}
      className={className}
      itemRenderer={itemRenderer}
      getItemStyle={getItemStyle}
      exportEnable={exportEnable}
      exportKey={exportKey}
      handleExport={handleExport}
      onItemClick={onItemClick ? (item) => onItemClick(item) : undefined}
      disabled={disabled}
      tooltipMessage={tooltipMessage}
      isItemDisabled={isItemDisabled}
      getItemTooltipMessage={getItemTooltipMessage}
    />
  );
};

export default TaskCard;
