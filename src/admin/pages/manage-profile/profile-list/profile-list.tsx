import { useState } from 'react';
import { newFilterIcon, userIcon } from '../../../../assets';
import TextButton from '../../../../components/button/text-button';
import { useNavigate } from 'react-router-dom';
import { MANAGE_PROFILE_CREATE } from '../../../../routes';
import { FilterModal } from '../../../../components';
import { getManageProfileFilterfields } from './';
import { UserListParams } from '../../../types/manage-user';
import { ProfileTable } from '../';
import { FilterType } from '../../../types';
import { exportProfileList } from '../../../service';

const BUTTON_STYLES = {
  height: '32px',
  background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
  border: '1px solid #CBD6E2',
  color: '#425A76',
  borderRadius: '2px',
  fontSize: '13px',
  fontWeight: 700,
  padding: '0px',
  '&:hover': {
    color: '#425A76 !important',
  },
};

export const ProfileList: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterType>
  >({});
  const [page, setPage] = useState<number>(1);
  const [tableParams, setTableParams] = useState<UserListParams>({
    page: page,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'profile-filter-popover' : undefined;

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
    <div className='flex flex-col h-full w-full'>
      {/* Header Section */}
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <img
              src={userIcon}
              alt='manage user'
              className='h-7 w-7 rounded bg-[#BE3EB5] p-[7px]'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Admin Permission
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Manage Profile
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <TextButton
            label='Create Profile'
            onClick={() => navigate(MANAGE_PROFILE_CREATE)}
            sx={{
              ...BUTTON_STYLES,
              width: '119px',
              minWidth: '119px',
              maxWidth: '119px',
            }}
          />
        </div>
      </div>

      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
          All Profiles
        </div>
        <div className='flex items-center gap-3'>
          <div className='relative h-[32px]'>
            <button
              aria-describedby={filterId}
              className={`w-[64px] h-[26px] text-[13px] mt-[3px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
              ${isFilterOpen || (appliedFilters && Object.keys(appliedFilters).length > 0) ? 'bg-[#F3F3F3]' : ''}`}
              onClick={handleFilterModal}
            >
              <img src={newFilterIcon} alt='filter-icon' />
              Filter
              {appliedFilters && Object.keys(appliedFilters).length > 0 && (
                <div className='absolute -top-[5px] -right-2 w-4 h-4 flex items-center justify-center text-xs'>
                  <span className='absolute w-full h-full bg-[#FF6666] rounded-full animate-ping opacity-75 z-0'></span>
                  <span className='w-4 h-4 bg-[#FF6666] text-white rounded-full flex items-center justify-center z-10 font-semibold'>
                    {Object.keys(appliedFilters).length}
                  </span>
                </div>
              )}
            </button>
            <FilterModal
              isOpen={isFilterOpen}
              filterAnchorEl={anchorEl}
              filterId={filterId}
              filterFields={getManageProfileFilterfields()}
              setAppliedFilters={setAppliedFilters}
              setPage={setPage}
              handleCloseFilter={handleCloseFilter}
            />
          </div>
          <TextButton
            label='Export'
            variant='outlined'
            sx={{
              ...BUTTON_STYLES,
              width: '74px',
              minWidth: '74px',
              maxWidth: '74px',
            }}
            onClick={handleExport}
            loading={isExporting}
          />
        </div>
      </div>

      {/* Profile Table Section */}
      <div className='border border-[#CBD6E2]'>
        <ProfileTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={setTableParams}
        />
      </div>
    </div>
  );
};
