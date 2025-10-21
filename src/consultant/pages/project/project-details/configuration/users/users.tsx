import React, { useEffect } from 'react';
import { AssignGroups, AssignUsers } from './tabs';
import { SectionHeaderTab } from '../../../../../../components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ConfigAssignGroupsListParms,
  ConfigAssignUserListParms,
} from '../../../../../types';
import { RootState } from '../../../../../../store/store';
import { useSelector } from 'react-redux';
import { checkPermission } from '../../../../../../common-utils';
import { AllModules, AllPermissions } from '../../../../../../common-service';
import { AccessRestricted } from '../../../../../../components/account-restricted';

interface UserProps {
  reFetchData: number;
  handleReset: () => void;
  setCount: (value: number) => void;
  filterParams: ConfigAssignGroupsListParms | ConfigAssignUserListParms;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
}

const Users: React.FC<UserProps> = ({
  reFetchData,
  handleReset,
  setCount,
  filterParams,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab') || 'assign_users';
  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  const accessPageIsEnable = checkPermission(
    modules,
    AllModules.MANAGE_ACCOUNT_ACCESS
  );
  const accessPageViewEnable = checkPermission(
    permission,
    AllPermissions.MANAGE_ACCOUNT_ACCESS_VIEW_EDIT
  );

  useEffect(() => {
    if (
      !searchParams.get('tab') &&
      searchParams.get('list') === 'configuration' &&
      searchParams.get('subMenu') === 'users'
    ) {
      searchParams.set('tab', 'assign_users');
      navigate(`?${searchParams.toString()}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const tabs = [
    { label: 'Assign Users', value: 'assign_users' },
    { label: 'Assign Group', value: 'assign_group' },
  ];

  const handleTabChange = (value: string) => {
    handleReset();
    searchParams.set('tab', value);
    navigate(`?${searchParams.toString()}`, { replace: true });
  };

  if (!accessPageIsEnable || !accessPageViewEnable) return <AccessRestricted />;

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
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            searchValue={searchValue}
          />
        )}
        {tabParam === 'assign_group' && (
          <AssignGroups
            reFetchData={reFetchData}
            filterParams={filterParams}
            setCount={setCount}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            searchValue={searchValue}
          />
        )}
      </div>
    </div>
  );
};

export default Users;
