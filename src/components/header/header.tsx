import React from 'react';
import {
  accountHomeIcon,
  accountSettingsIcon,
  actionIcon,
  downloadIcon,
  filterIcon,
  refreshIcon,
} from '../../assets';
import { ActionsDropdown } from '../actions-dropdown';
import TextButton from '../button/text-button';

const DEFAULT_BUTTON_STYLES = {
  height: '35px',
  color: '#F15A29',
};

interface HeaderProps {
  title: string;
  subtitle?: string;
  placeholder?: string;
  totalRecords?: number;
  icon?: string;
  iconBackgroundColor?: string;
  actionItems?: Array<{
    label: string;
    onClick: () => void;
  }>;
  primaryButton?: {
    label: string;
    onClick: () => void;
    navigateTo?: string;
    variant?: 'create' | 'edit'; // To distinguish between create/edit button styles if needed
  };
  showFilter?: boolean;
  showRefresh?: boolean;
  showDownload?: boolean;
  showActions?: boolean;
  showSettings?: boolean;
  customStyles?: {
    button?: React.CSSProperties;
    header?: React.CSSProperties;
  };
  onFilterClick?: () => void;
  onRefreshClick?: () => void;
  onDownloadClick?: () => void;
  onActionsClick?: () => void;
  onSettingsClick?: () => void;
  variant?: 'main' | 'sub'; // To distinguish between main page and sub-page headers
}

export const PageHeader: React.FC<HeaderProps> = ({
  title,
  subtitle,
  placeholder,
  totalRecords,
  icon = accountHomeIcon,
  iconBackgroundColor = '#d16dd3',
  actionItems = [],
  primaryButton,
  showFilter = false,
  showRefresh = false,
  showDownload = false,
  showActions = true,
  showSettings = true,
  customStyles = {},
  onFilterClick,
  onRefreshClick,
  onDownloadClick,
  onActionsClick,
  onSettingsClick,
  variant = 'main', // Default to main variant
}) => {
  return (
    <div
      className='flex w-full border-b-1 border-gray-300 p-4'
      style={customStyles.header}
    >
      <div className='flex justify-between w-full'>
        <div className='flex'>
          <div className='flex items-center gap-4 justify-center'>
            <img
              src={icon}
              alt='menu-icon'
              className='h-10 w-10 p-2.5 rounded'
              style={{ backgroundColor: iconBackgroundColor }}
            />
            <div className='flex flex-col'>
              {variant === 'sub' && placeholder ? (
                <div className='font-medium text-[#7D98B6] text-[11px]'>
                  {placeholder}
                </div>
              ) : (
                <>
                  {subtitle && (
                    <div className='font-medium text-[#7D98B6] text-[11px]'>
                      {subtitle}
                    </div>
                  )}
                  {!subtitle && totalRecords !== undefined && (
                    <div className='font-medium text-[#7D98B6] text-[11px]'>
                      Total Records found - {totalRecords}
                    </div>
                  )}
                </>
              )}
              <div className='font-semibold text-[20px]'>{title}</div>
            </div>
            {showFilter && (
              <button
                className='border border-gray-300 p-2'
                onClick={onFilterClick}
              >
                <img src={filterIcon} alt='menu-icon' className='h-[15px]' />
              </button>
            )}
          </div>
        </div>
        <div className='flex gap-2 justify-center items-center'>
          {actionItems.length > 0 && <ActionsDropdown actions={actionItems} />}

          {primaryButton && (
            <TextButton
              label={primaryButton.label}
              onClick={primaryButton.onClick}
              sx={{
                ...DEFAULT_BUTTON_STYLES,
                backgroundColor: '#F15A29',
                color: '#fff',
                ...customStyles.button,
              }}
            />
          )}

          {(showRefresh || showDownload) && (
            <div className='flex'>
              {showRefresh && (
                <button
                  className='flex border border-gray-300 p-2 h-[35px] justify-center items-center'
                  onClick={onRefreshClick}
                >
                  <img src={refreshIcon} alt='menu-icon' className='h-[15px]' />
                </button>
              )}
              {showDownload && (
                <button
                  className='flex border border-gray-300 p-2 h-[35px] justify-center items-center'
                  onClick={onDownloadClick}
                >
                  <img
                    src={downloadIcon}
                    alt='menu-icon'
                    className='h-[18px]'
                  />
                </button>
              )}
            </div>
          )}

          {showActions && (
            <button
              className='flex border border-gray-300 p-2 h-[35px] justify-center items-center bg-[#EAF0F6]'
              onClick={onActionsClick}
            >
              <img src={actionIcon} alt='menu-icon' className='h-[13px]' />
            </button>
          )}

          {showSettings && (
            <button
              className='flex border border-gray-300 p-2 h-[35px] justify-center items-center bg-[#EAF0F6]'
              onClick={onSettingsClick}
            >
              <img
                src={accountSettingsIcon}
                alt='menu-icon'
                className='h-[13px]'
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
