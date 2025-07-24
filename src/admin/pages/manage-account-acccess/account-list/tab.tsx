/* eslint-disable @typescript-eslint/no-explicit-any */
import TextButton from '../../../../components/button/text-button';
import { BUTTON_STYLES } from '../../manage-user-detail/styles';
import { ManageAccountUserGroupTable } from '../user-group/table';
import { ManageAccountUserListTable } from '../user-list/table';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ManageAccountListTable } from '../project-list/table';
import Users from '../../../../consultant/pages/account-details-sidebar/sidebar-pages/configuration/users/users';
import { useUpdateProjectAccesseDetails } from '../../../service/manage-account-access/manage-account-service';
import { useState } from 'react';

const UserTab = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleBack = () => {
    searchParams.delete('accountList');
    searchParams.delete('type');
    navigate({ search: searchParams.toString() });
  };

  const accountList = searchParams.get('accountList');
  const usertype = searchParams.get('type');
  const accountId = searchParams.get('userid');
  const projectListAccess = useUpdateProjectAccesseDetails();
  const [addedProjects, setAddedProjects] = useState<{
    [rid: string]: boolean;
  }>({});
  const handleSubmit = () => {
    const constructData: Partial<any> = {
      account_rid: accountId,
      projects: addedProjects,
      ...(usertype === 'user'
        ? { user_rid: accountList }
        : { group_rid: accountList }),
    };

    projectListAccess.mutate(constructData);
  };
  return (
    <div>
      {/* Header Section */}
      <div className='flex justify-between  pb-1 px-4 border-b border-[#CBD6E2]'>
        <div className='flex flex-col '>
          <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
            Account
          </div>
          <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
            Zoho UK
          </div>
        </div>
        {accountList && (
          <div className='flex items-center gap-3'>
            <div className='relative h-[32px]'></div>
            <TextButton
              label='Cancel'
              onClick={handleBack}
              sx={{
                ...BUTTON_STYLES,
                width: '74px',
                minWidth: '74px',
                maxWidth: '74px',
              }}
            />
            <TextButton
              label='Save'
              onClick={handleSubmit}
              loading={projectListAccess.isPending}
              sx={{
                ...BUTTON_STYLES,
                width: '100px',
                minWidth: '100px',
                maxWidth: '100px',
              }}
            />
          </div>
        )}
      </div>
      {!accountList && (
        <div className=''>
          <Users
            tabs={[
              {
                label: 'Users',
                content: <ManageAccountUserListTable />,
              },
              {
                label: 'Group',
                content: <ManageAccountUserGroupTable />,
              },
            ]}
          />
        </div>
      )}
      {accountList && (
        <div>
          <ManageAccountListTable
            type={usertype || undefined}
            setAddedProjects={setAddedProjects}
          />
        </div>
      )}
    </div>
  );
};

export default UserTab;
