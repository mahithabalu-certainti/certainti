/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  accountHomeIcon,
  accountSettingsIcon,
  actionIcon,
  downloadIcon,
  newFilterIcon,
  refreshIcon,
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
import { exportAccountList, useFetchCurrency } from '../../services/account';
import { AccountList } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import {
  ActionsDropdownItem,
  checkPermission,
} from '../../../common-utils';
import { AccessRestricted } from '../../../components/account-restricted';
import {
  formatFilterForApi,
  getStoredFilters,
} from '../../../components/filter-component/utils';
import { FilterState } from '../../types/account-filter';

const BUTTON_STYLES = {
  height: '32px',
  fontSize: '13px',
  fontWeight: 700,
};

export const Accounts: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>();
  // const [searchTerm, setSearchTerm] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<keyof AccountList>('createdAt');
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const [page, setPage] = useState<number>(1);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
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
  const isAccountCreateEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_CREATE
  );
  const isAccountEditEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_EDIT
  );
  const isAccountDeleteEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_DELETE
  );
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
        }),
    },
  ];

  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate(ACCOUNT_CREATE);
  };

  const countriesList = useGetAllCountries();
  const currencyList = useFetchCurrency();

  const allCountries = useMemo(() => {
    return (
      countriesList.data?.data.country.map((item) => item.country_name) || []
    );
  }, [countriesList]);

  const allCurrencies = useMemo(() => {
    return (
      currencyList.data?.data.currency.map((item) => item.currency_code) || []
    );
  }, [currencyList]);

  const accountFilterFields = getAccountFilterFields(
    allCountries,
    allCurrencies
  );

  const [totalCount, setTotalCount] = useState<number>(0);

  if (!accountIsEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <img
              src={accountHomeIcon}
              alt='menu-icon'
              className='h-7 w-7 bg-[#d16dd3] p-[7px] rounded'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-bold text-[16px] text-[#2D3E4F]'>
                All Accounts
              </div>
              <div className='font-semibold text-[#7D98B6] text-[12px] -mt-1'>
                {`All Accounts • ${totalCount} items`}
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <ActionsDropdown actions={menuItems} />
          {isAccountCreateEnable && <TextButton
            label='Create Account'
            onClick={handleCreateAccount}
            sx={{
              ...BUTTON_STYLES,
              width: '114px',
              minWidth: '114px',
              maxWidth: '114px',
            }}
          />}
          <div className='flex items-center justify-center border border-[#EAF0F5] w-16 h-8'>
            <div className='flex items-center justify-center w-1/2'>
              <img src={refreshIcon} alt='refresh-icon' className='h-4' />
            </div>
            <div className='border-l border-[#EAF0F5] h-full'></div>
            <div className='flex items-center justify-center w-1/2'>
              <img src={downloadIcon} alt='download-icon' className='h-4' />
            </div>
          </div>
          <div
            className='flex border border-[#CBD6E2] w-8 h-8 rounded-[2px] justify-center items-center'
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
            }}
          >
            <img src={actionIcon} alt='menu-icon' className='h-4' />
          </div>
          <div
            className='flex border border-[#CBD6E2] w-8 h-8 rounded-[2px] justify-center items-center'
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
            }}
          >
            <img src={accountSettingsIcon} alt='menu-icon' className='h-4' />
          </div>
        </div>
      </div>
      <div className='flex items-center justify-end h-[34px] min-h-[34px] px-4'>
        <div className='relative'>
          <button
            aria-describedby={filterId}
            className={`w-[64px] h-[26px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
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
            filterFields={accountFilterFields}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
            handleCloseFilter={handleCloseFilter}
          />
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
        />
      </div>
    </div>
  );
};
