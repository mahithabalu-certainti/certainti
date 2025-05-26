import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminSubmenuActiveIcon, backIcon } from '../../assets';

interface SideMenuPanelProps {
  menuItems: {
    name: string;
    key: string;
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
    <div className='w-full bg-white border-r border-[#CBD6E2] px-1 py-4'>
      {/* Header */}
      <div className='flex items-center gap-1.5 mb-6'>
        {showBackIcon && (
          <img src={backIcon} alt='Back' className='w-[18px] h-[18px]' />
        )}
        <span className='text-[15px] text-[#2D3E4F] font-medium'>
          {headerTitle}
        </span>
      </div>

      {/* List */}
      <ul className='space-y-2 px-3'>
        {menuItems.map((item) => (
          <li key={item.key}>
            <button
              onClick={() => handleSelect(item.key)}
              className={`group w-full flex items-center cursor-pointer text-[14px] font-normal gap-2 text-[#2D3E4F] text-left px-3 py-2 rounded hover:bg-[#0BBFB726] ${
                activeKey === item.key ? 'bg-[#0BBFB726]' : ''
              }`}
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
        ))}
      </ul>
    </div>
  );
};

export default SideMenuPanel;
