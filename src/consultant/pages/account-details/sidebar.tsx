import React, { useEffect, useState } from 'react';
import { adminSubmenuActiveIcon, backIcon } from '../../../assets';
import { MenuItem, SidebarProps } from '../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AllModules } from '../../../common-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

const Sidebar: React.FC<SidebarProps> = ({ activeKey, onSelect, disble }) => {
  const menuItems: MenuItem[] = [
    {
      name: 'Financial Highlights',
      key: 'financial',
      id: AllModules.FINANCIAL_HIGHLIGHTS,
      disabled: false,
    },
    {
      name: 'Details',
      key: 'details',
      id: AllModules.DETAILS,
      disabled: false,
    },
    {
      name: 'Resources',
      key: 'resources',
      id: AllModules.RESOURCES,
      disabled: false,
    },
    {
      name: 'Projects',
      key: 'projects',
      id: AllModules.PROJECTS,
      disabled: disble,
    },
    { name: 'Cases', key: 'cases', id: AllModules.CASES, disabled: false },
    {
      name: 'Activities',
      key: 'activities',
      id: AllModules.ACTIVITIES,
      disabled: false,
    },
    { name: 'Notes', key: 'notes', id: AllModules.NOTES, disabled: false },
    {
      name: 'Attachments',
      key: 'attachments',
      id: AllModules.ATTACHMENTS,
      disabled: false,
    },
    {
      name: 'Checklist',
      key: 'checklist',
      id: AllModules.CHECKLISTS,
      disabled: false,
    },
    {
      name: 'Timesheet',
      key: 'timesheet',
      id: AllModules.TIMESHEETS,
      disabled: false,
    },
    {
      name: 'Imports',
      key: 'imports',
      id: AllModules.IMPORTS,
      disabled: false,
    },
  ];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules]);

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

  return (
    <div className='w-full bg-white border-r border-[#CBD6E2] py-2'>
      {/* Header */}
      <div className='flex items-center gap-2 mb-1 px-1'>
        <img src={backIcon} alt='Back' className='w-[18px] h-[18px]' />
        <span className='text-[15px] text-[#2D3E4F] font-bold'>
          Related List
        </span>
      </div>

      {/* List */}
      <ul className='space-y-2'>
        {menuItems.map((item) => {
          if (item.hide) return null;
          return (
            <li key={item.key} className='min-h-[32px] min-w-[181px] mb-0'>
              <button
                onClick={() => handleSelect(item.key)}
                disabled={item.disabled}
                className={`${
                  activeKey === item.key ? 'bg-[#0BBFB726] !font-bold' : ''
                } group w-full flex items-center  text-[14px] font-semibold gap-2 text-[#2D3E4F] text-left pl-7.5 pr-3 py-2 rounded hover:bg-[#0BBFB726] ${item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}  `}
              >
                <span>{item.name}</span>
                <img
                  src={adminSubmenuActiveIcon}
                  alt='active'
                  className={`w-[12px] h-[12px] transition-opacity duration-150 ${
                    activeKey === item.key
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;
