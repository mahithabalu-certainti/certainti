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
  color: 'secondary.main',
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
  iconClasses?: string;
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
  iconClasses = 'h-[32px] w-[32px]  p-2.5 rounded',
  iconBackgroundColor,
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
      className='flex w-full border-b-2 border-[#CBD6E2] p-4'
      style={customStyles.header}
    >
      <div className='flex justify-between w-full'>
        <div className='flex w-[80%] max-w-[80%]'>
          <div className='flex items-center gap-3 w-full'>
            <img
              src={icon}
              alt='menu-icon'
              className={iconClasses}
              style={{ backgroundColor: iconBackgroundColor }}
            />
            <div className='flex flex-col w-[90%]'>
              {variant === 'sub' && placeholder ? (
                <div className='font-semibold text-[#7D98B6] text-[11px]'>
                  {placeholder}
                </div>
              ) : (
                <>
                  {subtitle && (
                    <div className='font-medium text-[#7D98B6] bg-amber-400 text-[11px]'>
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
              <div className='font-semibold text-[20px] -mt-1 text-[#2D3E4F] overflow-ellipsis truncate'>
                {title}
              </div>
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
              variant='outlined'
              sx={{
                ...DEFAULT_BUTTON_STYLES,
                ...customStyles.button,
                width: '57px', minWidth: '57px', fontSize:'13px', fontWeight: 400,
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
