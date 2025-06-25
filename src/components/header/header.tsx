import React from 'react';
import {
  AccountSettingsIcon,
  ActionIcon,
  DownloadIcon,
  FilterIcon,
  RefreshIcon,
} from '../../assets';
import { ActionsDropdown } from '../actions-dropdown';
import TextButton from '../button/text-button';
import { ActionsDropdownItem } from '../../common-utils';

const DEFAULT_BUTTON_STYLES = {
  height: '24px',
};

interface HeaderProps {
  title: string;
  subtitle?: string;
  placeholder?: string;
  totalRecords?: number;
  icon?: React.ReactNode;
  actionItems?: ActionsDropdownItem[];
  primaryButton?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
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
  goBack?: () => void
}

export const PageHeader: React.FC<HeaderProps> = ({
  title,
  subtitle,
  placeholder,
  totalRecords,
  icon,
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
  goBack,
}) => {
  return (
    <div
      className='flex w-full border-b-1 h-[60px] border-box border-[#CBD6E2] px-4 py-2'
      style={customStyles.header}
    >
      <div className='flex justify-between w-full'>
        <div className='flex w-[80%] max-w-[80%]'>
          <div className='flex items-center gap-3 w-full'>
            {icon}
            <div className='flex flex-col w-[90%]'>
              {variant === 'sub' && placeholder ? (
                <div className='font-semibold text-[#7D98B6] text-[12px]'>
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
              <div className='font-bold text-[16px] -mt-1 text-[#2D3E4F] overflow-ellipsis truncate'>
                {title}
              </div>
            </div>
            {showFilter && (
              <button
                className='border border-gray-300 p-2'
                onClick={onFilterClick}
              >
                <FilterIcon alt='menu-icon' className='h-[15px]' />
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
              disabled={primaryButton.disabled}
              sx={{
                ...DEFAULT_BUTTON_STYLES,
                ...customStyles.button,
                width: '48px',
                minWidth: '48px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
          )}

          {(showRefresh || showDownload) && (
            <div className='flex items-center justify-center border border-[#EAF0F5] w-[48px] h-[24px]'>
              {showRefresh && (
                <button
                  className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center'
                  onClick={onRefreshClick}
                >
                  <RefreshIcon alt='refresh-icon' className='h-4' />
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
                  <DownloadIcon alt='download-icon' className='h-4' />
                </button>
              )}
            </div>
          )}

          {showActions && (
            <button
              onClick={onActionsClick}
              className='flex border border-[#CBD6E2] w-[24px] h-[24px] rounded-[2px] justify-center items-center cursor-pointer'
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              }}
            >
              <ActionIcon alt='menu-icon' className='h-4' />
            </button>
          )}

          {showSettings && (
            <button
              onClick={onSettingsClick}
              className='flex border border-[#CBD6E2] w-[24px] h-[24px] rounded-[2px] justify-center items-center cursor-pointer'
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              }}
            >
              <AccountSettingsIcon alt='menu-icon' className='h-4' />
            </button>
          )}

          {goBack && <TextButton
            label='Back'
            onClick={goBack}
            sx={{
              fontSize: '12px',
              fontWeight: 400,
            }}
          />}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
