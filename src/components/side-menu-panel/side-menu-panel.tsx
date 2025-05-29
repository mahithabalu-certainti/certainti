import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminSubmenuActiveIcon, backIcon } from '../../assets';

interface SideMenuPanelProps {
  menuItems: {
    name: string;
    key: string;
    disabled?: boolean;
  }[];
  activeKey: string;
  onSelect: (key: string) => void;
  headerTitle?: string;
  showBackIcon?: boolean;
}

const SideMenuPanel: React.FC<SideMenuPanelProps> = ({
  menuItems,
  activeKey,
  onSelect,
  headerTitle = 'Menu',
  showBackIcon = true,
}) => {
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
      <div className='flex items-center gap-1.5 mb-1'>
        {showBackIcon && (
          <img src={backIcon} alt='Back' className='w-[18px] h-[18px]' />
        )}
        <span className='text-[15px] text-[#2D3E4F] font-bold'>
          {headerTitle}
        </span>
      </div>

      {/* List */}
      <ul className='space-y-2'>
        {menuItems.map((item) => (
          <li key={item.key} className='min-h-[32px] min-w-[181px] mb-1'>
            <button
              onClick={() => handleSelect(item.key)}
              disabled={item.disabled}
              className={`${
                activeKey === item.key ? 'bg-[#0BBFB726] !font-bold' : ''
              } group w-full flex items-center text-[14px] font-semibold gap-2 text-[#2D3E4F] text-left pl-6 pr-3 py-2 hover:bg-[#0BBFB726] ${item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}  `}
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
        ))}
      </ul>
    </div>
  );
};

export default SideMenuPanel;
