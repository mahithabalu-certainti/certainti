import { useState } from 'react';
import { filterIcon, userIcon } from '../../../../assets';
import TextButton from '../../../../components/button/text-button';
import { useNavigate } from 'react-router-dom';
import { MANAGE_PROFILE_CREATE } from '../../../../routes';
import { Filter } from '../../../../components';
import { getManageProfileFilterfields } from './';
import { UserListParams } from '../../../types/manage-user';
import { ProfileTable } from '../';
import { FilterType } from '../../../types';

const BUTTON_STYLES = {
  height: '35px',
  color: '#F15A29',
};

const HEADER_STYLES = {
  adminPermission: 'font-medium text-[#7D98B6] text-[11px]',
  manageUser: 'font-semibold text-[20px] text-[#2D3E4F]',
};

export const ProfileList: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(true);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterType>
  >({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tableParams, setTableParams] = useState<UserListParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const navigate = useNavigate();

  return (
    <div className='flex flex-col h-[calc(100vh-64px)] overflow-y-auto w-full p-4 gap-3'>
      {/* Header Section */}
      <div className='flex h-[12%] w-full p-4 items-center justify-between border border-[#EAF0F5] rounded'>
        <div className='flex items-center gap-2'>
          <img
            src={userIcon}
            alt='menu-icon'
            className='h-10 w-10 bg-[#BE3EB5] p-2.5 rounded'
          />
          <div className='flex flex-col'>
            <div className={HEADER_STYLES.adminPermission}>
              Admin Permission
            </div>
            <div className={HEADER_STYLES.manageUser}>Manage Profile</div>
          </div>
          <div
            className={`flex items-center justify-center border mt-0.5 ml-2 rounded-xs w-9 h-9 cursor-pointer transition-colors duration-300 ${isFilterOpen ? 'bg-[#EAF0F6] border-[#CBD6E2]' : 'border-[#EAF0F5]'}`}
            onClick={() => setIsFilterOpen((prev) => !prev)}
          >
            <img src={filterIcon} alt='menu-icon' className='h-[13px]' />
          </div>
        </div>
        <div className='flex gap-2 items-center'>
          <TextButton
            label='Create Profile'
            variant='filled'
            onClick={() => navigate(MANAGE_PROFILE_CREATE)}
            sx={{
              ...BUTTON_STYLES,
              backgroundColor: '#F16137',
              color: '#fff',
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>

      {/* User Table Section */}
      <div className='border border-[#EAF0F5] rounded'>
        <div className='flex justify-between items-center border-b border-[#EAF0F5] p-4'>
          <div className='font-semibold text-[20px] leading-5 text-[#2D3E4F]'>
            All Profiles
          </div>
          <div className='flex gap-3'>
            <TextButton
              label='Export'
              variant='outlined'
              sx={{
                ...BUTTON_STYLES,
                borderRadius: '2px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
          </div>
        </div>
        <div className='flex flex-1 transition-all duration-300 ease-in-out'>
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden h-full min-h-[calc(100vh-144px)] ${
              isFilterOpen ? 'w-[20%] opacity-100' : 'w-0 opacity-0'
            }`}
          >
            <Filter
              setAppliedFilters={setAppliedFilters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterFields={getManageProfileFilterfields()}
            />
          </div>

          <div
            className={`transition-all duration-300 ease-in-out ${isFilterOpen ? 'w-[80%]' : 'w-full'}`}
          >
            <ProfileTable
              appliedFilters={appliedFilters}
              tableParams={tableParams}
              setTableParams={setTableParams}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
