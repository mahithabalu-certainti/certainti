import React from 'react';
import { adminSubmenuActiveIcon, backIcon } from '../../../assets';
import { MenuItem, SidebarProps } from '../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';

const menuItems: MenuItem[] = [
  { name: 'Financial Highlights', key: 'financial' },
  { name: 'Details', key: 'details' },
  { name: 'Resources', key: 'resources' },
  { name: 'Projects', key: 'projects' },
  { name: 'Cases', key: 'cases' },
  { name: 'Activities', key: 'activities' },
  { name: 'Notes', key: 'notes' },
  { name: 'Attachments', key: 'attachments' },
  { name: 'Checklist', key: 'checklist' },
  { name: 'Timesheet', key: 'timesheet' },
  { name: 'Imports', key: 'imports' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeKey, onSelect }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
        {menuItems.map((item) => (
          <li key={item.key} className='min-h-[32px] min-w-[181px] mb-0'>
            <button
              onClick={() => handleSelect(item.key)}
              className={`${activeKey === item.key ? 'bg-[#0BBFB726] !font-bold' : ''
                } group w-full flex items-center cursor-pointer text-[14px] font-semibold gap-2 text-[#2D3E4F] text-left px-3 py-2 rounded hover:bg-[#0BBFB726]`}
            >
              <span>{item.name}</span>
              <img
                src={adminSubmenuActiveIcon}
                alt='active'
                className={`w-[12px] h-[12px] transition-opacity duration-150 ${activeKey === item.key
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100'
                  }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
