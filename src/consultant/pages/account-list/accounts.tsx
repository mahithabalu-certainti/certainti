/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  accountHomeIcon,
  accountSettingsIcon,
  actionIcon,
  downloadIcon,
  filterIcon,
  newFilterIcon,
  refreshIcon,
} from '../../../assets';
import { Filter, FilterModal } from '../../../components';
import ActionsDropdown from '../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../components/button/text-button';
import { ACCOUNT_CREATE } from '../../../routes';
import { getAccountFilterfields } from './helpers';
import AccountTable from './table/account-table';
import { useGetAllCountries } from '../../../common-service';
import { exportAccountList, useFetchCurrency } from '../../services/account';
import { CircularProgress } from '@mui/material';
import { AccountList } from '../../types';

const BUTTON_STYLES = {
  height: '32px',
  color: '#F15A29',
};

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

  const handleCreateAccount = () => {
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
      <div className="flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4">
        <div className="flex h-[33px]">
          <div className="flex items-center justify-center">
            <img
              src={accountHomeIcon}
              alt="menu-icon"
              className="h-7 w-7 bg-[#d16dd3] p-[7px] rounded"
            />
            <div className="flex flex-col mx-2.5 pb-1">
              <div className="font-bold text-[16px] text-[#2D3E4F]">
                All Accounts
              </div>
              <div className="font-semibold text-[#7D98B6] text-[12px] -mt-1">
                {`All Accounts • ${totalCount} items`}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-center items-center">
          <ActionsDropdown
            actions={menuItems}
            sx={{
              height: "32px",
              background: "linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)",
              border: '1px solid #CBD6E2',
              color: "#425A76",
              borderRadius: "2px",
              fontSize: "13px",
              fontWeight: 700,
              '&:hover': {
                color: "#425A76 !important",
              },
            }}
          />
          <TextButton
            label="Create Account"
            onClick={handleCreateAccount}
            sx={{
              height: "32px",
              background: "linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)",
              border: '1px solid #CBD6E2',
              color: "#425A76",
              borderRadius: "2px",
              fontSize: "13px",
              fontWeight: 700,
              '&:hover': {
                color: "#425A76 !important",
              },
            }}
          />
          <div className="flex items-center justify-center border border-[#EAF0F5] w-16 h-8">
            <div className="flex items-center justify-center w-1/2">
              <img src={refreshIcon} alt="refresh-icon" className="h-4" />
            </div>
            <div className="border-l border-[#EAF0F5] h-full"></div>
            <div className="flex items-center justify-center w-1/2">
              <img src={downloadIcon} alt="download-icon" className="h-4" />
            </div>
          </div>
          <div
            className="flex border border-[#CBD6E2] w-8 h-8 rounded-[2px] justify-center items-center"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)",
            }}
          >
            <img src={actionIcon} alt="menu-icon" className="h-4" />
          </div>
          <div
            className="flex border border-[#CBD6E2] w-8 h-8 rounded-[2px] justify-center items-center"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)",
            }}
          >
            <img src={accountSettingsIcon} alt="menu-icon" className="h-4" />
          </div>
        </div>
      </div>
      <div className='flex items-center justify-end h-[45px] min-h-[45px] px-4'>
        <div className='relative'>
          <button
            className='w-[64px] h-[26px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] border border-[#CBD6E2]'
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <img src={newFilterIcon} alt="filter-icon" />
            Filter
          </button>
          {isFilterOpen &&
            <div className='absolute mt-1 right-0 z-50'>
              <FilterModal />
            </div>
          }
        </div>
      </div>
      <div>
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
  );
};
