import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SectionHeaderTab } from '../../../../../../components';
import { AssignGroups, AssignUsers } from './tabs';

const Users: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'assign_users';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      searchParams.set('tab', 'assign_users');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const tabs = [
    { label: 'Assign Users', value: 'assign_users' },
    { label: 'Assign Group', value: 'assign_group' },
  ];

  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    setSearchParams(searchParams);
  };

  return (
    <div>
      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />

      <div className='border border-t-0 border-[#CBD6E2]'>
        {tabParam === 'assign_users' && <AssignUsers />}
        {tabParam === 'assign_group' && <AssignGroups />}
      </div>
    </div>
  );
};

export default Users;
