import React, { Suspense, useMemo, useState } from 'react';
import { FilterCondition } from '../../../types/manage-user';
import { DataMapperIcon, NewFilterIcon, RefreshIcon } from '../../../../assets';
import { ActionsDropdown, FilterModal } from '../../../../components';
import TextButton from '../../../../components/button/text-button';
import { useNavigate } from 'react-router-dom';
import { DataMapperListParams } from '../../../types';
import { DATA_MAPPER_CREATE } from '../../../../routes';
import { DataMapperTable } from './table/data-mapper-table';
import { getDataMapperFilterFields } from './helpers';
import {
  ExportDataMapperList,
  useGetDataMapperStatus,
} from '../../../service/data-mapper/data-mapper-service';
import {
  AllModules,
  AllPermissions,
  useGetAllCountries,
} from '../../../../common-service';
import { useFetchState } from '../../../../consultant/services/account';
import { FilterValue } from '../../../../consultant/types/account-filter';
import SearchBar from '../../../../components/search/search-bar';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission } from '../../../../common-utils';
import { AccessRestricted } from '../../../../components/account-restricted';

const DataMapper: React.FC = () => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterCondition>
  >({});
  const [page, setPage] = useState<number>(1);
  const [tableParams, setTableParams] = useState<DataMapperListParams>({
    page: page,
    limit: 100,
    sortBy: 'r_number',
    sortOrder: 'ASC',
  });
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>();
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [currentCountry, setCurrentCountry] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');

  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  //Permission Management
  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  const isDataMapperEnable = checkPermission(
    modules,
    AllModules.RD_FORM_DATA_MAPPER
  );

  const isDataMapperViewEnable = checkPermission(
    permission,
    AllPermissions.RD_FORM_DATA_MAPPER_VIEW_EDIT
  );

  const isDataMapperExportEnable = checkPermission(
    permission,
    AllPermissions.RD_FORM_DATA_MAPPER_EXPORT
  );

  const isDataMapperCreateEnable = checkPermission(
    permission,
    AllPermissions.RD_FORM_DATA_MAPPER_CREATE
  );

  const dataMapperEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.RD_FORM_DATA_MAPPER_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    dataMapperEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [dataMapperEditFields]);

  const dataMapperStatus = useGetDataMapperStatus();
  const allCountries = useGetAllCountries('Active');
  const regions = useFetchState(currentCountry?.toString() || '', 'active');

  const statusOptions = useMemo(
    () =>
      dataMapperStatus.data?.data?.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [dataMapperStatus.data?.data]
  );

  const countryOptions = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  const regionOptions = useMemo(
    () =>
      regions.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [regions.data?.data.states]
  );

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'data-mapper-column-visibility-popover'
    : undefined;

  const onRefreshClick = () => {
    setRefreshTrigger(Date.now());
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'data-mapper-filter-popover' : undefined;

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
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

  const handleExport = () => {
    const params = {
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      search: searchText,
    };
    ExportDataMapperList(params);
  };

  const menuItems = [
    {
      label: 'Export',
      onClick: () => handleExport(),
      hide: !isDataMapperExportEnable,
    },
  ];

  const dataMapperFilterFields = getDataMapperFilterFields(
    statusOptions,
    countryOptions,
    regionOptions,
    permissionMap
  );

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const handleFilterChange = (fieldName: string, value: FilterValue) => {
    if (fieldName === 'country_rid' && value) {
      setCurrentCountry(String(value));
    }
  };

  if (!isDataMapperEnable || !isDataMapperViewEnable)
    return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <React.Suspense fallback={null}>
              <DataMapperIcon
                alt='data-mapper-icon'
                className='h-7 w-7 p-1.5 rounded [&>path]:stroke-[#fff] bg-[#82BA8B]'
              />
            </React.Suspense>
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Configure Settings
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                RD Forms
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <ActionsDropdown actions={menuItems} />
          <button
            className='flex border border-[#CBD6E2] rounded-[2px] w-[24px] h-[23px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </button>
          {isDataMapperCreateEnable && (
            <TextButton
              label='Create RD Form'
              onClick={() => navigate(DATA_MAPPER_CREATE)}
              sx={{
                width: '120px',
                minWidth: '120px',
                maxWidth: '120px',
              }}
            />
          )}
        </div>
      </div>

      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
          All RD Forms
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
                filterFields={dataMapperFilterFields}
                setAppliedFilters={(filters) =>
                  setAppliedFilters(filters as Record<string, FilterCondition>)
                }
                setPage={setPage}
                handleCloseFilter={handleCloseFilter}
                handleSorting={handleSorting}
                onFilterChange={handleFilterChange}
              />
            </Suspense>
          </div>
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <DataMapperTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={setTableParams}
          refreshTrigger={refreshTrigger}
          setColumnAnchorEl={setColumnAnchorEl}
          columnAnchorEl={columnAnchorEl}
          searchValue={searchText}
          countryOptions={countryOptions}
          regionOptions={regionOptions}
          regionLoading={regions.isLoading}
          setCurrentCountry={setCurrentCountry}
        />
      </div>
    </div>
  );
};

export default DataMapper;
