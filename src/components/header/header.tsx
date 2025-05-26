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
  height: '32px',
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
          {actionItems.length > 0 && (
            <ActionsDropdown actions={actionItems} sx={{ fontWeight: 400 }} />
          )}

          {primaryButton && (
            <TextButton
              label={primaryButton.label}
              onClick={primaryButton.onClick}
              sx={{
                ...DEFAULT_BUTTON_STYLES,
                ...customStyles.button,
                width: '43px',
                minWidth: '43px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
          )}

          {(showRefresh || showDownload) && (
            <div className='flex items-center justify-center border border-[#EAF0F5] w-16 h-8'>
              {showRefresh && (
                <button
                  className='flex items-center justify-center w-1/2'
                  onClick={onRefreshClick}
                >
                  <img src={refreshIcon} alt='refresh-icon' className='h-4' />
                </button>
              )}
              {showDownload && showRefresh && (
                <div className='border-l border-[#EAF0F5] h-full'></div>
              )}
              {showDownload && (
                <button
                  className='flex items-center justify-center w-1/2'
                  onClick={onDownloadClick}
                >
                  <img src={downloadIcon} alt='download-icon' className='h-4' />
                </button>
              )}
            </div>
          )}

          {showActions && (
            <button
              onClick={onActionsClick}
              className='flex border border-[#CBD6E2] w-8 h-8 rounded-[2px] justify-center items-center cursor-pointer'
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              }}
            >
              <img src={actionIcon} alt='menu-icon' className='h-4' />
            </button>
          )}

          {showSettings && (
            <button
              onClick={onSettingsClick}
              className='flex border border-[#CBD6E2] w-8 h-8 rounded-[2px] justify-center items-center cursor-pointer'
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              }}
            >
              <img src={accountSettingsIcon} alt='menu-icon' className='h-4' />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
