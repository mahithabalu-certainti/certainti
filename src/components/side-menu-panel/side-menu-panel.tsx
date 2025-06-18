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
      searchParams.set('list', key);
    } else {
      searchParams.set('list', key);
    }
    navigate({ search: searchParams.toString() });
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
    <div className='w-full h-full bg-white border-r border-[#CBD6E2] py-2'>
      {/* Header */}
      <div
        className={`relative h-[30px] flex items-center ${isCollapsed ? 'justify-end' : 'justify-between'} gap-1.5 mb-1`}
      >
        <span
          className={`text-[15px] text-[#2D3E4F] font-bold ${!isCollapsed ? 'pl-6.5' : 'absolute right-[19px]'}`}
        >
          {!isCollapsed ? headerTitle : getShortName(headerTitle)}
        </span>
        {showBackIcon && (
          <div
            className={`w-[18px] h-[18px] cursor-pointer transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            onClick={onToggleCollapse}
          >
            <BackIcon alt='Back' className='w-[18px] h-[18px]' />
          </div>
        )}
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
                } ${isCollapsed ? 'px-2 py-1.5 justify-center' : 'pl-6 py-1.5 pr-3 justify-start'}`}
              >
                <Tooltip
                  title={isCollapsed ? item.name : ''}
                  placement='right'
                  arrow
                  disableHoverListener={!isCollapsed}
                >
                  <span
                    className={
                      'flex items-center justify-center w-[22px] h-[22px]'
                    }
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
                {/* Show text only in expanded view */}
                {!isCollapsed && (
                  <span className='flex-1 truncate'>{item.name}</span>
                )}
                {!isCollapsed && (
                  <AdminSubmenuActiveIcon
                    alt='active'
                    className={`w-[12px] h-[12px] transition-opacity duration-150 ${
                      activeKey === item.key
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
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
