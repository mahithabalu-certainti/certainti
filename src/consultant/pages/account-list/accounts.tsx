/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  accountHomeIcon,
  accountSettingsIcon,
  actionIcon,
  downloadIcon,
  filterIcon,
  refreshIcon,
} from '../../../assets';
import { Filter } from '../../../components';
import ActionsDropdown from '../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../components/button/text-button';
import { ACCOUNT_CREATE } from '../../../routes';
import { getAccountFilterfields } from './helpers';
import AccountTable from './table/account-table';
import { useGetAllCountries } from '../../../common-service';
import { exportAccountList, useFetchCurrency } from '../../services/account';
import { CircularProgress } from '@mui/material';
import { AccountList } from '../../types';

// const BUTTON_STYLES = {
//   height: '32px',
//   color: '#F15A29',
// };

export const Accounts: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<keyof AccountList>('createdAt');
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const [page, setPage] = useState<number>(1);

  const menuItems = [
    {
      label: 'Manage user',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Export',
      onClick: () => exportAccountList({
        sortBy: orderBy,
        sortOrder: apiOrder,
        filters: appliedFilters,
      }),
    },
  ];

  const navigate = useNavigate();

  const handleCreateAcount = () => {
    navigate(ACCOUNT_CREATE);
  };

  const countriesList = useGetAllCountries();
  const currencyList = useFetchCurrency();

  const allCountries = useMemo(() => {
    return countriesList.data?.data.country.map(item => item.country_name) || [];
  }, [countriesList]);

  const allCurrencies = useMemo(() => {
    return currencyList.data?.data.currency.map(item => item.currency_code) || [];
  }, [currencyList]);

  const accountFilterfields = getAccountFilterfields(allCountries, allCurrencies);

  const [totalCount, setTotalCount] = useState<number>(0);
  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex justify-between w-full border-b-2 border-[#CBD6E2] p-6'>
        <div className='flex'>
          <div className='flex items-center justify-center'>
            <img
              src={accountHomeIcon}
              alt='menu-icon'
              className='h-8 w-8 bg-[#d16dd3] p-[9px] rounded'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[20px] text-[#2D3E4F]'>
                All Accounts
              </div>
              <div className='font-medium text-[#7D98B6] text-[11px] -mt-1'>
                Total Accounts -{' '}
                <span className='font-semibold text-[#2D3E4F]'>
                  {totalCount}
                </span>
              </div>
            </div>
            <div
              className={`flex items-center justify-center border mt-0.5 ml-2 rounded-xs w-8 h-8 cursor-pointer transition-colors duration-300 ${isFilterOpen ? 'bg-[#EAF0F6] border-[#CBD6E2]' : 'border-[#EAF0F5]'}`}
              onClick={() => setIsFilterOpen((prev) => !prev)}
            >
              <img src={filterIcon} alt='menu-icon' className='h-[12px]' />
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <ActionsDropdown actions={menuItems} />
          <TextButton
            label='Create Account'
            onClick={handleCreateAcount}
            sx={{
              // ...BUTTON_STYLES,
              // backgroundColor: '#F16137',
              // color: '#fff',
              // borderRadius: '2px',
              // fontSize: '13px',
              fontWeight: 700,
            }}
          />
          <div className='flex items-center justify-center border border-[#EAF0F5] w-16 h-8'>
            <div className='flex items-center justify-center w-1/2'>
              <img src={refreshIcon} alt='refresh-icon' className='h-4' />
            </div>
            <div className='border-l border-[#EAF0F5] h-full'></div>
            <div className='flex items-center justify-center w-1/2'>
              <img
                src={downloadIcon}
                alt='download-icon'
                className='h-4'
              />
            </div>
          </div>
          <div className='flex border border-[#CBD6E2] w-8 h-8 justify-center items-center bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'>
            <img src={actionIcon} alt='menu-icon' className='h-4' />
          </div>
          <div className='flex border border-[#CBD6E2] w-8 h-8 justify-center items-center bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'>
            <img
              src={accountSettingsIcon}
              alt='menu-icon'
              className='h-4'
            />
          </div>
        </div>
      </div>
      <div className='flex flex-1 transition-all duration-300 ease-in-out'>
        <div
          className={`flex flex-1 transition-all duration-300 ease-in-out overflow-hidden ${isFilterOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0'
            }`}
        >
          {countriesList.isLoading || currencyList.isLoading ?
            <div className='w-full flex flex-1 justify-center items-center'>
              <CircularProgress />
            </div>
            :
            <Filter
              setAppliedFilters={setAppliedFilters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterFields={accountFilterfields}
              filterLabel='Filter Accounts by'
              setPage={setPage}
            />}
        </div>

        <div
          className={`transition-all duration-300 ease-in-out flex flex-1 flex-col border-l-2 border-[#CBD6E2] bg-[#FCFCFC] ${isFilterOpen ? 'w-[calc(100%-260px)]' : 'w-full'
            } p-5 -ml-[2px]`}
        >
          <div className='font-semibold text-[16px] leading-5 text-[#2D3E4F] mb-3.5'>
            All Accounts
            <span className='font-normal'> • {totalCount} items</span>
          </div>
          <AccountTable
            appliedFilters={appliedFilters}
            searchTerm={searchTerm}
            setTotalCount={setTotalCount}
            order={order}
            setOrder={setOrder}
            orderBy={orderBy}
            setOrderBy={setOrderBy}
            setPage={setPage}
            page={page}
          />
        </div>
      </div>
    </div>
  );
};
