import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  totalRecords?: number;
  icon?: string;
  iconBackgroundColor?: string;
  actionItems?: Array<{
    label: string;
    onClick: () => void;
  }>;
  createButton?: {
    label: string;
    onClick: () => void;
    navigateTo?: string;
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
}

export const MainPageHeader: React.FC<HeaderProps> = ({
  title,
  subtitle,
  totalRecords,
  icon = accountHomeIcon,
  iconBackgroundColor = '#d16dd3',
  actionItems = [],
  createButton,
  showFilter = true,
  showRefresh = true,
  showDownload = true,
  showActions = true,
  showSettings = true,
  customStyles = {},
}) => {
  const navigate = useNavigate();

  const handleCreateClick = () => {
    if (createButton?.navigateTo) {
      navigate(createButton.navigateTo);
    } else if (createButton?.onClick) {
      createButton.onClick();
    }
  };

  return (
    <div
      className='flex w-full h-[15%] border-b-2 border-gray-300 p-4'
      style={customStyles.header}
    >
      <div className='flex justify-between w-full'>
        <div className='flex'>
          <div className='flex items-center justify-center'>
            <img
              src={icon}
              alt='menu-icon'
              className='h-10 w-10 p-2.5 rounded'
              style={{ backgroundColor: iconBackgroundColor }}
            />
            <div className='flex flex-col mx-2'>
              <div className='font-semibold text-[20px]'>{title}</div>
              {subtitle ? (
                <div className='font-medium text-[#7D98B6] text-[11px]'>
                  {subtitle}
                </div>
              ) : (
                totalRecords !== undefined && (
                  <div className='font-medium text-[#7D98B6] text-[11px]'>
                    Total Records found - {totalRecords}
                  </div>
                )
              )}
            </div>
            {showFilter && (
              <div className='border border-gray-300 p-2'>
                <img src={filterIcon} alt='menu-icon' className='h-[15px]' />
              </div>
            )}
          </div>
        </div>
        <div className='flex gap-2 justify-center items-center'>
          {actionItems.length > 0 && <ActionsDropdown actions={actionItems} />}

          {createButton && (
            <TextButton
              label={createButton.label}
              onClick={handleCreateClick}
              sx={{
                ...DEFAULT_BUTTON_STYLES,
                backgroundColor: '#F15A29',
                color: '#fff',
                ...customStyles.button,
              }}
            />
          )}

          <div className='flex'>
            {showRefresh && (
              <div className='flex border border-gray-300 p-2 h-[35px] justify-center items-center'>
                <img src={refreshIcon} alt='menu-icon' className='h-[15px]' />
              </div>
            )}
            {showDownload && (
              <div className='flex border border-gray-300 p-2 h-[35px] justify-center items-center'>
                <img src={downloadIcon} alt='menu-icon' className='h-[18px]' />
              </div>
            )}
          </div>

          {showActions && (
            <div className='flex border border-gray-300 p-2 h-[35px] justify-center items-center bg-[#EAF0F6]'>
              <img src={actionIcon} alt='menu-icon' className='h-[13px]' />
            </div>
          )}

          {showSettings && (
            <div className='flex border border-gray-300 p-2 h-[35px] justify-center items-center bg-[#EAF0F6]'>
              <img
                src={accountSettingsIcon}
                alt='menu-icon'
                className='h-[13px]'
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainPageHeader;
