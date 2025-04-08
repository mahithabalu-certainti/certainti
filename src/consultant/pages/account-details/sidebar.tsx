import React from 'react';

type MenuItem = {
  name: string;
  key: string;
};

type SidebarProps = {
  activeKey: string;
  onSelect: (key: string) => void;
};

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
  return (
    <div className='w-[20%] bg-white border-r border-gray-300 p-4'>
      <h2 className='text-xl font-semibold mb-6'>Related List</h2>
      <ul className='space-y-2'>
        {menuItems.map((item) => (
          <li key={item.key}>
            <button
              onClick={() => onSelect(item.key)}
              className={`w-full text-left px-3 py-2 rounded hover:bg-blue-100 ${
                activeKey === item.key
                  ? 'bg-blue-200 font-semibold'
                  : 'font-normal'
              }`}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
