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
import { exportProfileList } from '../../../service';

const BUTTON_STYLES = {
  height: '35px',
  color: '#F15A29',
};

const HEADER_STYLES = {
  adminPermission: 'font-medium text-[#7D98B6] text-[11px] leading-5 tracking-normal',
  manageUser: 'font-semibold text-[20px] text-[#2D3E4F] leading-5 tracking-normal',
};

export const ProfileList: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(true);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterType>
  >({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [tableParams, setTableParams] = useState<UserListParams>({
    page: page,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportProfileList(tableParams);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className='flex flex-col h-full w-full p-4 gap-3'>
      {/* Header Section */}
      <div className='w-full min-h-[75px] h-[75px] px-4 flex items-center justify-between border border-[#CBD6E2] rounded-[4px]'>
        <div className='flex items-center gap-2'>
          <img
            src={userIcon}
            alt='menu-icon'
            className='h-8 w-8 bg-[#BE3EB5] p-2.5 rounded'
          />
          <div className='flex flex-col mb-1'>
            <div className={HEADER_STYLES.adminPermission}>
              Admin Permission
            </div>
            <div className={HEADER_STYLES.manageUser}>Manage Profile</div>
          </div>
          <div
            className={`flex items-center justify-center border mt-0.5 ml-2 rounded-xs w-8 h-8 cursor-pointer transition-colors duration-300 ${isFilterOpen ? 'bg-[#EAF0F6] border-[#CBD6E2]' : 'border-[#EAF0F5]'}`}
            onClick={() => setIsFilterOpen((prev) => !prev)}
          >
            <img src={filterIcon} alt='menu-icon' className='h-[12px]' />
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
      <div className='flex flex-col flex-1 border border-[#CBD6E2] rounded-[4px]'>
        <div className='flex justify-between items-center border-b border-[#CBD6E2] h-[50px] px-4'>
          <div className='font-semibold text-base leading-[32px] tracking-[0%] align-middle text-[#2D3E4F]'>
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
              onClick={handleExport}
              loading={isExporting}
            />
          </div>
        </div>
        <div className='flex flex-1 transition-all duration-300 ease-in-out'>
          <div
            className={`flex flex-1 transition-all duration-300 ease-in-out overflow-hidden ${isFilterOpen ? 'w-[20%] opacity-100' : 'w-0 opacity-0'
            }`}
          >
            <Filter
              setAppliedFilters={setAppliedFilters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterFields={getManageProfileFilterfields()}
              filterLabel="Filter User by"
              setPage={setPage}
            />
          </div>

          <div className={`transition-all duration-300 ease-in-out border-l border-[#CBD6E2] ${isFilterOpen ? 'w-[80%]' : 'w-full border-none'}`}>
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
