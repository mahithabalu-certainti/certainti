/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AccountHomeIcon,
  AccountSettingsIcon,
  ActionIcon,
  NewFilterIcon,
  RefreshIcon,
} from '../../../assets';
import { FilterModal } from '../../../components';
import ActionsDropdown from '../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../components/button/text-button';
import { ACCOUNT_CREATE } from '../../../routes';
import { getAccountFilterFields } from './helpers';
import AccountTable from './table/account-table';
import {
  AllModules,
  AllPermissions,
  useGetAllCountries,
} from '../../../common-service';
import { exportAccountList, useFetchIndustrys } from '../../services/account';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import {
  ActionsDropdownItem,
  checkPermission,
  reshapeGlobalFilter,
} from '../../../common-utils';
import { AccessRestricted } from '../../../components/account-restricted';
import { AccountList, FilterEntry, SelectOption } from '../../types';
import {
  formatFilterForApi,
  getStoredFilters,
} from '../../../components/filter-component/utils';
import { FilterState } from '../../types/account-filter';

const BUTTON_STYLES = {
  height: '24px',
  fontSize: '13px',
  fontWeight: 600,
};

export const Accounts: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>();
  // const [searchTerm, setSearchTerm] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<keyof AccountList>('account_name');
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const [page, setPage] = useState<number>(1);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [refreshAccountTrigger, setRefreshAccountTrigger] = useState<number>(
    Date.now()
  );

  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const onRefreshClick = () => {
    setRefreshAccountTrigger(Date.now()); // unique on every click
  };
  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'account-filter-popover' : undefined;

  useEffect(() => {
    const saved = getStoredFilters();
    if (saved) {
      setAppliedFilters(
        formatFilterForApi(saved as Record<string, FilterState>)
      );
    }
  }, []);

  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const accountIsEnable = checkPermission(modules, AllModules.ACCOUNTS);
  const isAccountViewAllEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_VIEW_ALL
  );
  const isAccountCreateEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_CREATE
  );
  const isAccountEditEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_EDIT
  );
  // Delete functionality will be implemented later
  // const isAccountDeleteEnable = checkPermission(
  //   permission,
  //   AllPermissions.ACCOUNT_DELETE
  // );
  const isAccountDeleteEnable = false;
  const isAccountExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_EXPORT
  );

  const menuItems: ActionsDropdownItem[] = [
    {
      label: 'Manage user',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Export',
      hide: !isAccountExportEnable,
      onClick: () =>
        exportAccountList({
          sortBy: orderBy,
          sortOrder: apiOrder,
          filters: appliedFilters,
          globalFilters: reshapeGlobalFilter(filters as FilterEntry[]),
          fiscalYear,
        }),
    },
  ];

  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate(ACCOUNT_CREATE);
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'account_name';
    const defaultSortOrder = 'asc';

    if (!sortBy) {
      setSortFilterCount(0);
      setOrder(defaultSortOrder);
      setOrderBy(defaultSortField as keyof AccountList);
    } else {
      setSortFilterCount(1);
      setOrder(sortOrder);
      setOrderBy(sortBy as keyof AccountList);
    }
  };

  const countriesList = useGetAllCountries();
  // const currencyList = useFetchCurrency();
  const industry = useFetchIndustrys();

  const allCountries = useMemo(() => {
    return (
      countriesList.data?.data.country.map((item) => ({
        label: item.country_name,
        value: item.country_name,
      })) || []
    );
  }, [countriesList]);

  // const allCurrencies = useMemo(() => {
  //   return (
  //     currencyList.data?.data.currency.map((item) => item.currency_code) || []
  //   );
  // }, [currencyList]);

  const allIndustries: SelectOption[] = useMemo(
    () =>
      industry.data?.data.industries.map((industry) => ({
        label: industry.industry_name,
        value: industry.industry_name,
      })) || [],
    [industry.data?.data.industries]
  );

  const accountFilterFields = getAccountFilterFields(
    allCountries,
    allIndustries
  );

  const [totalCount, setTotalCount] = useState<number>(0);

  if (!accountIsEnable || !isAccountViewAllEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <AccountHomeIcon
              alt='menu-icon'
              className='h-7 w-7 bg-[#d16dd3] p-[7px] rounded'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-bold text-[16px] text-[#2D3E4F]'>
                Accounts
              </div>
              <div className='font-semibold text-[#7D98B6] text-[12px] -mt-1'>
                {`${totalCount} items`}
              </div>
            </div>
          </div>
        </div>
        <div className='flex items-center justify-center gap-3'>
          <ActionsDropdown actions={menuItems} />
          <div
            className='flex items-center justify-center border border-[#CBD6E2] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] w-[24px] h-[23px] cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </div>
          {isAccountCreateEnable && (
            <TextButton
              label='Create Account'
              onClick={handleCreateAccount}
              sx={{
                ...BUTTON_STYLES,
                width: '114px',
                minWidth: '114px',
                maxWidth: '114px',
              }}
            />
          )}

          <div className='hidden border border-[#CBD6E2] w-[24px] h-[24px] justify-center items-center bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'>
            <ActionIcon alt='menu-icon' className='h-4' />
          </div>
          <div className='hidden border border-[#CBD6E2] w-[24px] h-[24px]  justify-center items-center bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'>
            <AccountSettingsIcon alt='menu-icon' className='h-4' />
          </div>
        </div>
      </div>

      <div className='flex items-center justify-end h-[34px] min-h-[34px] px-4'>
        <div className='relative'>
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
              filterFields={accountFilterFields}
              setAppliedFilters={setAppliedFilters}
              setPage={setPage}
              handleCloseFilter={handleCloseFilter}
              handleSorting={handleSorting}
            />
          </Suspense>
        </div>
      </div>
      <div className='flex-1'>
        <AccountTable
          appliedFilters={appliedFilters}
          setTotalCount={setTotalCount}
          order={order}
          setOrder={setOrder}
          orderBy={orderBy}
          setOrderBy={setOrderBy}
          setPage={setPage}
          page={page}
          isAccountEditEnable={isAccountEditEnable}
          isAccountDeleteEnable={isAccountDeleteEnable}
          refreshAccountTrigger={refreshAccountTrigger}
        />
      </div>
    </div>
  );
};

export default Accounts;
