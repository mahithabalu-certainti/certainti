/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { NewFilterIcon, UserIcon } from '../../../../assets';
import { ManageAccountTable } from './table';
import { ProjectListParams } from '../../../../consultant/types/project';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UserTab from './tab';
import { BUTTON_STYLES } from '../../manage-user-detail/styles';
import TextButton from '../../../../components/button/text-button';
import { useUpdateProjectAccesseDetails } from '../../../service/manage-account-access/manage-account-service';
import { useToast } from '../../../../hooks';

const AccountList = () => {
  const [tableParams, setTableParams] = useState<ProjectListParams>({
    page: 1,
    limit: 100,
    sortBy: 'account_name',
    sortOrder: 'ASC',
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handleBack = () => {
    searchParams.delete('accountList');
    searchParams.delete('username');
    searchParams.delete('groupname');
    navigate({ search: searchParams.toString() });
  };

  const accountList = searchParams.get('accountList');
  const accountId = searchParams.get('accountid');
  const accountname = searchParams.get('accountname');
  const username = searchParams.get('username');
  const groupname = searchParams.get('groupname');

  const name = username || groupname || '';
  const type = username ? 'USER' : groupname ? 'GROUP' : '';

  const projectListAccess = useUpdateProjectAccesseDetails();
  const commonSuccess = projectListAccess.isSuccess;
  const [addedProjects, setAddedProjects] = useState<{
    [rid: string]: boolean;
  }>({});
  const { successToast } = useToast();
  useEffect(() => {
    if (commonSuccess) {
      successToast('projects updated successfully');
      handleBack();
    }
  }, [commonSuccess]);
  const handleSubmit = () => {
    const constructData: Partial<any> = {
      account_rid: accountId,
      projects: addedProjects,
      ...(type === 'USER'
        ? { user_rid: accountList }
        : { group_rid: accountList }),
    };

    projectListAccess.mutate(constructData);
  };

  return (
    <div>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <UserIcon
              alt='manage user'
              className='h-7 w-7 rounded bg-[#BE3EB5] p-[7px]'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Admin Permission
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Manage Account Access
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'></div>
      </div>

      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='flex flex-col'>
          <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
            All Accounts
          </div>
          {accountname && (
            <div className='font-semibold text-[#7D98B6] text-[12px] -mt-2'>
              {` ${accountname}  ${name ? ` > ${name}` : ''}`}
            </div>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <div className='relative h-[32px]'>
            <button
              className={`w-[64px] h-[24px] text-[13px] mt-[5px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative `}
            >
              <NewFilterIcon alt='filter-icon' />
              Filter
            </button>
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
      </div>

      {!accountId && (
        <div className='border border-[#CBD6E2]'>
          <ManageAccountTable
            tableParams={tableParams}
            setTableParams={setTableParams}
          />
        </div>
      )}
      {accountId && (
        <div>
          <UserTab type={type} setAddedProjects={setAddedProjects} />
        </div>
      )}
    </div>
  );
};

export default AccountList;
