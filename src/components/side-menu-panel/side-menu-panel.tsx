import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminSubmenuActiveIcon, BackIcon } from '../../assets';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { MenuItem } from '../../consultant/types';
import { Tooltip } from '@mui/material';

interface SideMenuPanelProps {
  menuItems: MenuItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  headerTitle?: string;
  showBackIcon?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SideMenuPanel: React.FC<SideMenuPanelProps> = ({
  menuItems,
  activeKey,
  onSelect,
  headerTitle = 'Menu',
  showBackIcon = true,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [accountMenus, setAccountMenus] = useState<MenuItem[]>(menuItems);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Permission Mangement
  const { modules } = useSelector((state: RootState) => state.permission);
  useEffect(() => {
    const updatedItems = menuItems.map((item) => {
      const menu = modules.find((menu) => menu.name === item.id);
      return {
        ...item,
        hide: menu && !menu.is_enabled,
      };
    });
    setAccountMenus(updatedItems);
  }, [modules, menuItems]);

  useEffect(() => {
    if (!activeKey) {
      //set current active key
      const activeItem = accountMenus.find((item) => item.hide === false);
      handleSelect(activeItem?.key as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountMenus, activeKey]);

  const handleSelect = (key: string) => {
    if (searchParams.get('list') !== key) {
      searchParams.delete('res_id');
      searchParams.delete('tab');
      searchParams.delete('attachment_entity');
      searchParams.delete('file_id');
      searchParams.delete('view_type');
      searchParams.set('list', key);
    } else {
      searchParams.set('list', key);
    }
    navigate({ search: searchParams.toString() }, { replace: true });
    onSelect(key);
  };

  const getShortName = (name: string): string => {
    const words = name.split(' ').filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return words
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div
      className='w-full h-full bg-white border-r border-[#CBD6E2] py-2 overflow-hidden'
      style={{
        transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: isCollapsed ? '300ms' : '500ms',
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center h-[30px] mb-1  ${
          isCollapsed ? 'justify-center' : ''
        } ${isCollapsed ? 'px-3 ml-4' : 'px-7 pr-3'}`}
      >
        <div
          className={`flex items-center ${
            !isCollapsed ? 'justify-between w-full' : 'gap-0'
          }`}
        >
          <div className='flex items-center'>
            <span
              className='text-[15px] text-[#2D3E4F] font-bold whitespace-nowrap'
              style={{
                opacity: isCollapsed ? 0 : 1,
                transform: isCollapsed ? 'translateX(-10px)' : 'translateX(0)',
                transition:
                  'opacity 300ms ease-in-out, transform 300ms ease-in-out, max-width 400ms ease-in-out',
                transitionDelay: isCollapsed ? '0ms' : '100ms',
                maxWidth: isCollapsed ? 0 : '150px',
                overflow: 'hidden',
              }}
            >
              {headerTitle}
            </span>
            <span
              className='text-[15px] text-[#2D3E4F] font-bold whitespace-nowrap'
              style={{
                marginLeft: isCollapsed ? '5px' : '0',
                opacity: isCollapsed ? 1 : 0,
                maxWidth: isCollapsed ? '150px' : 0,
                overflow: 'hidden',
              }}
            >
              {getShortName(headerTitle)}
            </span>
          </div>
          {showBackIcon && (
            <div
              className='w-[18px] h-[18px] cursor-pointer flex-shrink-0'
              style={{
                transform: `rotate(${isCollapsed ? 180 : 0}deg)`,
                transition: 'transform 300ms ease-in-out',
              }}
              onClick={onToggleCollapse}
            >
              <BackIcon alt='Back' className='w-[18px] h-[18px]' />
            </div>
          )}
        </div>
      </div>
      {/* List */}
      <ul className='space-y-2'>
        {accountMenus.map((item) => {
          if (item.hide) return null;
          return (
            <li key={item.key} className='min-h-[32px] mb-1'>
              <button
                onClick={() => handleSelect(item.key)}
                disabled={item.disabled}
                className={`${
                  activeKey === item.key ? 'bg-[#0BBFB726] !font-bold' : ''
                } group w-full flex items-center text-[14px] font-semibold gap-2 text-[#2D3E4F] text-left hover:bg-[#0BBFB726] ${
                  item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${isCollapsed ? 'pl-[19px] py-1.5' : 'pl-6 py-1.5 pr-3'} justify-start`}
                style={{
                  transition: `background-color 0.3s ease-in-out, padding-left ${
                    isCollapsed ? '300ms' : '500ms'
                  } ease-in-out`,
                }}
              >
                <Tooltip
                  title={isCollapsed ? item.name : ''}
                  placement='right'
                  arrow
                  disableHoverListener={!isCollapsed}
                >
                  <span
                    className={`flex items-center justify-center w-[22px] h-[22px] flex-shrink-0`}
                  >
                    {item.icon ? (
                      <span className='flex items-center justify-center w-4 h-4'>
                        <item.icon alt='icon' className='w-4 h-4 text-black' />
                      </span>
                    ) : (
                      <span className='uppercase text-[12px]'>
                        {getShortName(item.name)}
                      </span>
                    )}
                  </span>
                </Tooltip>
                {/* Show text only in expanded view - Same transition as Sidebar */}
                <span
                  className={`truncate flex-1`}
                  style={{
                    opacity: isCollapsed ? 0 : 1,
                    maxWidth: isCollapsed ? 0 : '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transform: isCollapsed
                      ? 'translateX(-10px)'
                      : 'translateX(0)',
                    transition: `opacity ${
                      isCollapsed ? '200ms' : '400ms'
                    } ease-in-out ${isCollapsed ? '0ms' : '100ms'}, transform ${
                      isCollapsed ? '200ms' : '400ms'
                    } ease-in-out ${isCollapsed ? '0ms' : '100ms'}, max-width ${
                      isCollapsed ? '300ms' : '500ms'
                    } ease-in-out`,
                  }}
                >
                  {item.name}
                </span>

                {!isCollapsed && (
                  <AdminSubmenuActiveIcon
                    alt='active'
                    className={`w-[12px] h-[12px] flex-shrink-0 ${
                      activeKey === item.key
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                    style={{
                      transition: `opacity ${
                        isCollapsed ? '250ms ease-in-out' : '400ms ease-in-out'
                      }`,
                    }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SideMenuPanel;
