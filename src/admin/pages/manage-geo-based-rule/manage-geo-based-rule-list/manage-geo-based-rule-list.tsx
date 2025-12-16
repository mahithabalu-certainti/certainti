import React, { Suspense, useMemo, useState } from 'react';
import { NewFilterIcon, RefreshIcon, ManageGeoIcon } from '../../../../assets';
import TextButton from '../../../../components/button/text-button';
import { useNavigate } from 'react-router-dom';
import { ActionsDropdown, FilterModal } from '../../../../components';
import { FilterType } from '../../../types';
import SearchBar from '../../../../components/search/search-bar';
import { ManageGeoBasedRuleTable } from '../table';
import { GeoBasedRuleListParams } from '../../../types/geo-based-rule';
import { MANAGE_GEO_BASED_RULE_CREATE } from '../../../../routes';
import { checkPermission } from '../../../../common-utils';
import {
  AllPermissions,
  useGetAllCountries,
  useGetStatus,
} from '../../../../common-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { ExportConfigRuleList } from '../../../service/manage-geo-based-access/geo-based-group-service';
import { getGeoBasedRuleFilterFields } from './helpers';
import { SelectOption } from '../../../../consultant/types';

const BUTTON_STYLES = {
  height: '24px',
  fontSize: '13px',
};

export const ManageGeoBasedRuleList: React.FC = () => {
  // hooks
  const navigate = useNavigate();

  // UseStates
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterType>
  >({});
  const [page, setPage] = useState<number>(1);
  const [tableParams, setTableParams] = useState<GeoBasedRuleListParams>({
    page: page,
    limit: 100,
    sortBy: 'r_number', // Assumed default sort
    sortOrder: 'ASC',
  });
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const [refreshTrigger, setRefreshTrigger] = useState<number>();
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const { permission } = useSelector((state: RootState) => state.permission);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'geo-rule-visibility-popover' : undefined;

  // Service Hooks
  const statusOptions = useGetStatus();
  const allCountries = useGetAllCountries('Active');

  // Variables
  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'geo-rule-filter-popover' : undefined;

  // Memoized Options
  const countryOptions: SelectOption[] = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  const memoizedStatus: SelectOption[] = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        label: status?.status_name,
        value: status?.rid,
        desc: status?.status_description,
      })) || [],
    [statusOptions?.data?.data?.status]
  );

  // Permission Map
  const configEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.CONFIGURE_SETTINGS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  //   const permissionMap = useMemo(() => {
  //     const map: Record<string, { read: boolean; edit: boolean }> = {};
  //     configEditFields.forEach((item) => {
  //       map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
  //     });
  //     return map;
  //   }, [configEditFields]);

  const permissionMap = {};

  // Filter Fields
  const filterFields = useMemo(
    () =>
      getGeoBasedRuleFilterFields(
        permissionMap,
        memoizedStatus,
        countryOptions,
        [] // Region options - can be populated based on selected country if needed
      ),
    [permissionMap, memoizedStatus, countryOptions]
  );
  console.log('filterFields', filterFields);
  // Functions
  const onRefreshClick = () => {
    setRefreshTrigger(Date.now());
  };
  const handleCloseFilter = () => {
    setAnchorEl(null);
  };
  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'rule_name';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setTableParams((prev) => ({
        ...prev,
        sortBy: defaultSortField,
        sortOrder: defaultSortOrder,
      }));
    } else {
      setSortFilterCount(1);
      setTableParams((prev) => ({
        ...prev,
        sortBy,
        sortOrder: apiOrder,
      }));
    }
  };

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };
  const isCreateEnable = checkPermission(
    permission || [],
    AllPermissions.CREATE_TASK_TEMPLATE
  );
  const isExportEnable = checkPermission(
    permission || [],
    AllPermissions.TASK_TEMPLATE_EXPORT
  );
  const MENU_ITEMS = [
    {
      label: 'Export',
      hide: !isExportEnable,
      onClick: () =>
        ExportConfigRuleList({
          ...tableParams,
          filters: appliedFilters as any,
        }),
    },
  ];
  return (
    <div className='flex flex-col h-full w-full'>
      {/* Header Section */}
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <ManageGeoIcon
              alt='Manage Jurisdiction Rules '
              className='h-7 w-7 rounded [&>path:first-child]:fill-[#BE3EB5]'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Admin Permission
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Manage Jurisdiction Rules
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <ActionsDropdown actions={MENU_ITEMS} />
          <button
            className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </button>
          <TextButton
            label='Create Rule'
            onClick={() => navigate(MANAGE_GEO_BASED_RULE_CREATE)}
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
          All Geo Based Rules
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex gap-1 relative'>
            <SearchBar
              initialSearchText={searchText}
              onSearch={(value) => {
                setSearchText(value);
              }}
              placeholder='Search'
              disabled={false}
              hide={false}
              setCurrentPage={(pageNo) => {
                setPage(pageNo + 1);
                setTableParams((prev) => ({
                  ...prev,
                  page: pageNo + 1,
                }));
              }}
            />
            <button
              aria-describedby={modalId}
              className={`w-[120px] h-[24px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1  rounded-[2px] relative border border-[#CBD6E2] px-0 py-0 normal-case ${isModalOpen ? 'bg-[#F3F3F3]' : 'bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'} hover:text-[#425A76] transition-colors duration-150`}
              style={{
                boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
              }}
              onClick={handleColumnVisibility}
            >
              Show/Hide Fields
            </button>
            <button
              aria-describedby={filterId}
              className={`w-[64px] h-[24px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
              ${isFilterOpen || (appliedFilters && Object.keys(appliedFilters).length > 0) || sortFilterCount > 0 ? 'bg-[#F3F3F3]' : ''}`}
              onClick={handleFilterModal}
            >
              <NewFilterIcon alt='filter-icon' />
              Filter
              {(appliedFilters && Object.keys(appliedFilters).length > 0) ||
                sortFilterCount > 0 ? (
                <div className='absolute -top-[5px] -right-2 w-4 h-4 flex items-center justify-center text-xs'>
                  <span className='absolute w-full h-full bg-[#FF6666] rounded-full animate-ping opacity-75 z-0'></span>
                  <span className='w-4 h-4 bg-[#FF6666] text-white rounded-full flex items-center justify-center z-10 font-semibold'>
                    {(appliedFilters ? Object.keys(appliedFilters).length : 0) +
                      sortFilterCount}
                  </span>
                </div>
              ) : null}
            </button>
            <Suspense fallback={null}>
              <FilterModal
                isOpen={isFilterOpen}
                filterAnchorEl={anchorEl}
                filterId={filterId}
                filterFields={filterFields}
                setAppliedFilters={setAppliedFilters}
                setPage={(pageNo) => {
                  setPage(pageNo);
                  setTableParams((prev) => ({
                    ...prev,
                    page: pageNo,
                  }));
                }}
                handleCloseFilter={handleCloseFilter}
                handleSorting={handleSorting}
              />
            </Suspense>
          </div>
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <Suspense fallback={null}>
          <ManageGeoBasedRuleTable
            // appliedFilters={appliedFilters} // removed unsafe cast
            tableParams={tableParams}
            setTableParams={setTableParams}
            onSelectionChange={() => { }}
            refreshTrigger={refreshTrigger}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            // searchValue={searchText}
            isEditable={true}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default ManageGeoBasedRuleList;
