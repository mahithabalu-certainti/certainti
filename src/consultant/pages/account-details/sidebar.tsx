import React, { useEffect, useState } from 'react';
import { adminSubmenuActiveIcon, backIcon } from '../../../assets';
import { MenuItem, SidebarProps } from '../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AllModules } from '../../../common-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

const menuItems: MenuItem[] = [
  {
    name: 'Financial Highlights',
    key: 'financial',
    id: AllModules.FINANCIAL_HIGHLIGHTS,
  },
  { name: 'Details', key: 'details', id: AllModules.DETAILS },
  { name: 'Resources', key: 'resources', id: AllModules.RESOURCES },
  { name: 'Projects', key: 'projects', id: AllModules.PROJECTS },
  { name: 'Cases', key: 'cases', id: AllModules.CASES },
  { name: 'Activities', key: 'activities', id: AllModules.ACTIVITIES },
  { name: 'Notes', key: 'notes', id: AllModules.NOTES },
  { name: 'Attachments', key: 'attachments', id: AllModules.ATTACHMENTS },
  { name: 'Checklist', key: 'checklist', id: AllModules.CHECKLISTS },
  { name: 'Timesheet', key: 'timesheet', id: AllModules.TIMESHEETS },
  { name: 'Imports', key: 'imports', id: AllModules.IMPORTS },
];

const Sidebar: React.FC<SidebarProps> = ({ activeKey, onSelect }) => {
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
    <div className='w-full bg-white border-r border-gray-300 px-1 py-4'>
      {/* Header */}
      <div className='flex items-center gap-2 mb-6 '>
        <img src={backIcon} alt='Back' className='w-[18px] h-[18px]' />
        <span className='text-[15px] text-[#2D3E4F] font-medium'>
          Related List
        </span>
      </div>

      {/* List */}
      <ul className='space-y-2 pl-3'>
        {accountMenus.map((item) => {
          if (item.hide) return null;
          return (
            <li key={item.key}>
              <button
                onClick={() => handleSelect(item.key)}
                className={`group w-full flex items-center text-[14px] font-normal gap-2 text-left px-3 py-2 rounded cursor-pointer text-[#2D3E4F] hover:bg-[#0BBFB726] ${activeKey === item.key ? 'bg-[#0BBFB726]' : ''}`}
              >
                <span>{item.name}</span>
                <img
                  src={adminSubmenuActiveIcon}
                  alt='active'
                  className={`w-[14px] h-[14px] transition-opacity duration-150 ${
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
