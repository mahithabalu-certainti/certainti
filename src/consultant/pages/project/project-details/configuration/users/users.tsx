import React, { useEffect } from 'react';
import { AssignGroups, AssignUsers } from './tabs';
import { SectionHeaderTab } from '../../../../../../components';
import { useSearchParams } from 'react-router-dom';
import {
  ConfigAssignGroupsListParms,
  ConfigAssignUserListParms,
} from '../../../../../types';

interface UserProps {
  reFetchData: number;
  handleReset: () => void;
  setCount: (value: number) => void;
  filterParams: ConfigAssignGroupsListParms | ConfigAssignUserListParms;
}

const Users: React.FC<UserProps> = ({
  reFetchData,
  handleReset,
  setCount,
  filterParams,
}) => {
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
    handleReset();
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
        {tabParam === 'assign_users' && (
          <AssignUsers
            reFetchData={reFetchData}
            filterParams={filterParams}
            setCount={setCount}
          />
        )}
        {tabParam === 'assign_group' && (
          <AssignGroups
            reFetchData={reFetchData}
            filterParams={filterParams}
            setCount={setCount}
          />
        )}
      </div>
    </div>
  );
};

export default Users;
