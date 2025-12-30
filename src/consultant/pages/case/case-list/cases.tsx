import React, { Suspense, useMemo, useState } from 'react';
import {
  AllModules,
  AllPermissions,
  FilterTypes,
  useGetAllCountries,
} from '../../../../common-service';
import { CaseListParams, colorCode, FilterState } from '../../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import {
  ExportCaseList,
  useGetCaseFilingTypes,
  useGetCaseOwners,
  useGetCaseStatuses,
} from '../../../services/cases/case-service';
import { checkPermission, reshapeGlobalFilter } from '../../../../common-utils';
import { getGlobalCasesFilterFields } from '../helper';
import { AccessRestricted } from '../../../../components/account-restricted';
import {
  AccountSettingsIcon,
  ActionIcon,
  CaseIcon,
  NewFilterIcon,
  RefreshIcon,
} from '../../../../assets';
import { ActionsDropdown } from '../../../../components';
import SearchBar from '../../../../components/search/search-bar';
import Filter from '../../account-details-sidebar/components/filter/filter';
import { CaseListTable } from './table/case-table';
import { useNavigate } from 'react-router-dom';
import { CASE_CREATE } from '../../../../routes';
import TextButton from '../../../../components/button/text-button';

const Cases: React.FC = () => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<FilterTypes>({});
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());
  const [searchText, setSearchText] = useState<string>('');
  const [tableParams, setTableParams] = useState<CaseListParams>({
    page: page,
    limit: 100,
    sortBy: 'r_number',
    sortOrder: 'ASC',
    fiscalYear: 0,
    isGlobal: true,
  });
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const caseFillingTypes = useGetCaseFilingTypes();
  const caseStatus = useGetCaseStatuses();
  const allCountries = useGetAllCountries();
  const caseOwners = useGetCaseOwners();

  const caseOwnersOptions = useMemo(() => {
    return (
      caseOwners?.data?.data?.caseOwners?.map((item) => ({
        value: item.rid,
        label: item.name || '',
      })) || []
    );
  }, [caseOwners]);

  const caseFilingTypesOptions = useMemo(() => {
    return (
      caseFillingTypes?.data?.data?.caseFilingType?.map((item) => ({
        value: item.rid,
        label: item.filing_type_name,
      })) || []
    );
  }, [caseFillingTypes]);

  const caseStatusOptions = useMemo(() => {
    return (
      caseStatus?.data?.data?.caseStatus?.map((item) => ({
        value: item.rid,
        label: item.status_name,
      })) || []
    );
  }, [caseStatus]);

  const memoizedContry = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  // Permissions
  const casesEnable = checkPermission(modules, AllModules.CASES);

  const isCasesViewEnable = checkPermission(
    permission,
    AllPermissions.CASES_VIEW_EDIT
  );

  // const isCaseCreateEnable = checkPermission(
  //   permission,
  //   AllPermissions.CASES_CREATE
  // );

  const isCasesExportEnable = checkPermission(
    permission,
    AllPermissions.CASES_EXPORT
  );

  const casesEditFields = useMemo(
    () =>
      permission?.find((item) => item.name === AllPermissions.CASES_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    casesEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [casesEditFields]);

  const accountViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const accountPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    accountViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [accountViewEditFields]);

  const onRefreshClick = () => {
    setRefreshTrigger(Date.now());
  };

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'all-cases-filter-popover' : undefined;

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'global-cases-list-column-visibility-popover'
    : undefined;

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

  const handleCreateNewCase = () => {
    navigate(`${CASE_CREATE}?sourceType=global`);
  };

  const handleExport = () => {
    const allCasesParams = {
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      fiscalYear: newFiscalYear,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
      isGlobal: true,
      search: searchText,
    };
    ExportCaseList(allCasesParams);
  };

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const menuItems = [
    {
      label: 'Export',
      onClick: () => handleExport(),
      hide: !isCasesExportEnable,
    },
  ];

  const filterFields = getGlobalCasesFilterFields(
    caseStatusOptions,
    caseFilingTypesOptions,
    caseOwnersOptions,
    memoizedContry,
    permissionMap,
    accountPermissionMap
  );

  if (!casesEnable || !isCasesViewEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full  h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[55px] max-h-[55px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <CaseIcon
              alt='case-icon'
              className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${colorCode.caseTextColor}] bg-[${colorCode.caseBgColor}]`}
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-bold text-[16px] text-[#2D3E4F]'>Cases</div>
              <div className='font-semibold text-[#7D98B6] text-[12px] -mt-1'>
                {`${totalCount} items`}
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <TextButton label='New' onClick={handleCreateNewCase} />
          <ActionsDropdown actions={menuItems} />
          <div
            className='flex items-center justify-center border border-[#CBD6E2] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] w-[24px] h-[23px] cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </div>
          <div className='hidden border border-[#CBD6E2] w-[24px] h-[24px] justify-center items-center bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'>
            <ActionIcon alt='menu-icon' className='h-4' />
          </div>
          <div className='hidden border border-[#CBD6E2] w-[24px] h-[24px]  justify-center items-center bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'>
            <AccountSettingsIcon alt='menu-icon' className='h-4' />
          </div>
        </div>
      </div>
      <div className='flex items-center justify-end h-[34px] min-h-[34px] px-4'>
        <div className='flex gap-1 relative'>
          <SearchBar
            initialSearchText={searchText}
            onSearch={(value) => {
              setSearchText(value);
              setTableParams((prevParams) => {
                const newParams = { ...prevParams };
                if (value) {
                  newParams.search = value;
                } else {
                  delete newParams.search;
                }
                return newParams;
              });
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
            className={`w-[120px] h-[24px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative border border-[#CBD6E2] px-0 py-0 normal-case ${isModalOpen ? 'bg-[#F3F3F3]' : 'bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'} hover:text-[#425A76] transition-colors duration-150`}
            style={{
              boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
            }}
            onClick={handleColumnVisibility}
          >
            Show/Hide Fields
          </button>
          <button
            aria-describedby={filterId}
            className={`w-[64px] h-[26px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
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
            <Filter
              value='global-cases'
              isOpen={isFilterOpen}
              filterAnchorEl={anchorEl}
              filterId={filterId}
              filterMenu={filterFields}
              setAppliedFilters={setAppliedFilters}
              handleCloseFilter={handleCloseFilter}
              setCurrentPage={(pageNo) => {
                setPage(pageNo + 1);
                setTableParams((prev) => ({
                  ...prev,
                  page: pageNo + 1,
                }));
              }}
              handleSorting={handleSorting}
            />
          </Suspense>
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <CaseListTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={setTableParams}
          setTotalCount={setTotalCount}
          refreshTrigger={refreshTrigger}
          setColumnAnchorEl={setColumnAnchorEl}
          columnAnchorEl={columnAnchorEl}
          searchText={searchText}
          caseFilingTypesOptions={caseFilingTypesOptions}
          caseOwnersOptions={caseOwnersOptions}
        />
      </div>
    </div>
  );
};

export default Cases;
