/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Checkbox,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { generatePath, useNavigate } from 'react-router-dom';
import { reshapeGlobalFilter } from '../../../../common-utils';
import { ACCOUNT, ACCOUNT_DETAILS } from '../../../../routes';
import { RootState } from '../../../../store/store';
import { useAccounts } from '../../../services/account';
import { FilterState } from '../../../types';
import { Account, AccountList, ConvertedAccount } from '../../../types/account';
import { convertAccounts } from '../helpers';
import './styles.css';
import { renderChildRows, renderRows } from './utils';
import { TablePagination } from '../../../../components/table';

const AccountTable: React.FC<Record<string, any>> = ({
  appliedFilters,
  setTotalCount,
  order, 
  setOrder,
  orderBy, 
  setOrderBy,
}) => {
  const navigate = useNavigate();
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [accounts, setAccounts] = useState<ConvertedAccount[]>();
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const { filters, fiscalYear } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);

  const { data: accountList, isLoading: loading } = useAccounts({
    page: page,
    limit: rowsPerPage,
    sortBy: orderBy,
    sortOrder: apiOrder,
    filters: appliedFilters,
    globalFilters: reshapeGlobalFilter(filters as FilterState),
    fiscalYear,
  });

  useEffect(() => {
    setAccounts(convertAccounts(accountList?.accounts ?? []));
    setTotalCount(accountList?.count ?? 0);
  }, [accountList]);

  // Add this handler in the AccountTable component
  const handleAccountNameClick = (account: Account) => {
    const path = generatePath(ACCOUNT_DETAILS, {
      accountid: account.accountId,
    });
    navigate(path, {
      state: { account },
    });
  };

  // Handler for edit and delete actions
  const handleEdit = (account: Account) => {
    navigate(ACCOUNT + '/edit/' + account.accountId, {
      state: { account },
    });
  };

  const handleDelete = (account: Account) => {
    console.log('Delete account', account.accountId);
  };

  // Toggle expand/collapse state for a row
  const handleRowClick = (accountName: string) => {
    const newOpenRows = new Set(openRows);
    if (newOpenRows.has(accountName)) {
      newOpenRows.delete(accountName);
    } else {
      newOpenRows.add(accountName);
    }
    setOpenRows(newOpenRows);
  };

  // Handle checkbox selection
  const handleSelectRow = (index: number) => {
    const newSelectedRows = new Set(selectedRows);
    const account = accounts?.[index];
    if (!account) return;

    const hasChildren = accounts.some(
      (acc) => acc.parentAccount === account.accountName
    );

    if (newSelectedRows.has(index)) {
      newSelectedRows.delete(index);
      if (hasChildren) {
        accounts
          .filter((acc) => acc.parentAccount === account.accountName)
          .forEach((child) => {
            const childIndex = accounts.findIndex(
              (acc) => acc.accountName === child.accountName
            );
            newSelectedRows.delete(childIndex);
          });
      } else if (account.parentAccount) {
        const parentIndex = accounts.findIndex(
          (acc) => acc.accountName === account.parentAccount
        );
        newSelectedRows.delete(parentIndex);
      }
    } else {
      newSelectedRows.add(index);
      if (hasChildren) {
        accounts
          .filter((acc) => acc.parentAccount === account.accountName)
          .forEach((child) => {
            const childIndex = accounts.findIndex(
              (acc) => acc.accountName === child.accountName
            );
            newSelectedRows.add(childIndex);
          });
      } else if (account.parentAccount) {
        const siblingAccounts = accounts.filter(
          (acc) => acc.parentAccount === account.parentAccount
        );
        const allSiblingsSelected = siblingAccounts.every((child) =>
          newSelectedRows.has(
            accounts.findIndex((acc) => acc.accountName === child.accountName)
          )
        );
        if (allSiblingsSelected) {
          const parentIndex = accounts.findIndex(
            (acc) => acc.accountName === account.parentAccount
          );
          newSelectedRows.add(parentIndex);
        }
      }
    }
    setSelectedRows(newSelectedRows);
  };

  const handleSelectAllRows = (selectAll: boolean) => {
    if (!accounts) return;

    const newSelectedRows = new Set<number>();

    if (selectAll) {
      accounts.forEach((account, index) => {
        const hasParent = !!account.parentAccount;

        if (!hasParent) {
          newSelectedRows.add(index);

          const children = accounts.filter(
            (acc) => acc.parentAccount === account.accountName
          );

          children.forEach((child) => {
            const childIndex = accounts.findIndex(
              (acc) => acc.accountName === child.accountName
            );
            newSelectedRows.add(childIndex);
          });
        }
      });
    }

    setSelectedRows(newSelectedRows);
  };  
  
  // Handle page change
  const handleChangePage = (newPage: number) => {
    setPage(newPage + 1);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setPage(1);
  };

  // Handle sorting
  const handleRequestSort = (
    _event: React.MouseEvent<unknown>,
    property: keyof AccountList
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler =
    (property: keyof AccountList) => (event: React.MouseEvent<unknown>) => {
      handleRequestSort(event, property);
    };

  const childRowsRenderer = (parentAccount: string | null) =>
    renderChildRows({
      accounts: accounts || [],
      parentAccount,
      selectedRows,
      handleSelectRow,
      handleEdit,
      handleDelete,
      openRows,
      handleAccountNameClick,
    });

  const getSortIcon =
    (orderBy: string, columnKey: string, order: 'asc' | 'desc') => () => {
      if (orderBy !== columnKey) {
        return <span className='ml-1 cursor-pointer text-gray-400'>↕</span>;
      }
      return order === 'asc' ?
        <span className='ml-1 cursor-pointer'>↑</span>
        :
        <span className='ml-1 cursor-pointer'>↓</span>
    };

  return (
    <div className='border border-[#CBD6E2]'>
      <Paper sx={{ overflowX: 'auto', boxShadow: 'none', borderBottom: '1px solid #CBD6E2', borderRadius: '0px' }}> 
        <Table
          sx={{
            borderCollapse: 'collapse',
            '& .MuiTableCell-root': {
              borderBottom: '1px solid #CBD6E2',
            },
          }}
        >
          <TableHead
            sx={{
              '& .MuiTableCell-root': {
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#2A2A2A',
                padding: '0px',
                pl: 1,
                height: '42px',
              },
            }}
          >
            <TableRow>
              <TableCell sx={{ maxWidth: '50px', padding: '0px !important' }}>
                <Box className='flex items-center justify-center'>
                  <Checkbox
                    disableRipple
                    checked={Boolean(
                      accounts?.length && selectedRows.size === accounts.length
                    )}
                    indeterminate={Boolean(
                      accounts?.length &&
                      selectedRows.size > 0 &&
                      selectedRows.size < accounts.length
                    )}
                    onChange={(e) => handleSelectAllRows(e.target.checked)}
                    disabled={!accounts?.length}
                    sx={{
                      color: '#CBD6E2',
                      '&.Mui-checked': {
                        color: '#1755E7',
                      },
                      '&.MuiCheckbox-indeterminate': {
                        color: '#1755E7',
                      },
                    }}
                  />
                </Box>
              </TableCell>
              <TableCell sx={{ minWidth: '300px' }}>
                <TableSortLabel
                  active={orderBy === 'account_name'}
                  direction={orderBy === 'account_name' ? order : 'asc'}
                  onClick={createSortHandler('account_name')}
                  IconComponent={getSortIcon(orderBy, 'account_name', order)}
                >
                  Account Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '200px' }}>
                <TableSortLabel
                  active={orderBy === 'is_parent'}
                  direction={orderBy === 'is_parent' ? order : 'asc'}
                  onClick={createSortHandler('is_parent')}
                  IconComponent={getSortIcon(orderBy, 'is_parent', order)}
                >
                  Parent Account
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '180px' }}>
                <TableSortLabel
                  active={orderBy === 'r_number'}
                  direction={orderBy === 'r_number' ? order : 'asc'}
                  onClick={createSortHandler('r_number')}
                  IconComponent={getSortIcon(orderBy, 'r_number', order)}
                >
                  Account Number
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '200px' }}>
                <TableSortLabel
                  active={orderBy === 'industry'}
                  direction={orderBy === 'industry' ? order : 'asc'}
                  onClick={createSortHandler('industry')}
                  IconComponent={getSortIcon(orderBy, 'industry', order)}
                >
                  Industries
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '150px' }}>
                <TableSortLabel
                  active={orderBy === 'country'}
                  direction={orderBy === 'country' ? order : 'asc'}
                  onClick={createSortHandler('country')}
                  IconComponent={getSortIcon(orderBy, 'country', order)}
                >
                  Country
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '100px' }}>
                <TableSortLabel
                  active={orderBy === 'currency'}
                  direction={orderBy === 'currency' ? order : 'asc'}
                  onClick={createSortHandler('currency')}
                  IconComponent={getSortIcon(orderBy, 'currency', order)}
                >
                  Currency
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '160px' }}>
                <TableSortLabel
                  active={orderBy === 'annual_revenue'}
                  direction={orderBy === 'annual_revenue' ? order : 'asc'}
                  onClick={createSortHandler('annual_revenue')}
                  IconComponent={getSortIcon(orderBy, 'annual_revenue', order)}
                >
                  Annual Revenue
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '100px' }}>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={createSortHandler('status')}
                  IconComponent={getSortIcon(orderBy, 'status', order)}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '180px' }}>
                <TableSortLabel
                  active={orderBy === 'primary_contact_name'}
                  direction={orderBy === 'primary_contact_name' ? order : 'asc'}
                  onClick={createSortHandler('primary_contact_name')}
                  IconComponent={getSortIcon(
                    orderBy,
                    'primary_contact_name',
                    order
                  )}
                >
                  Primary Contact
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '80px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody
            sx={{
              '& .MuiTableCell-root': {
                fontWeight: 300,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#425A76',
                padding: '0px',
                pl: 1,
                minHeight: '36px',
              },
            }}
          >
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align='center'>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : accounts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align='center'>
                  <Typography variant='body1'>No data available</Typography>
                </TableCell>
              </TableRow>
            ) : (
              renderRows({
                accounts: accounts || [],
                openRows,
                selectedRows,
                handleRowClick,
                handleSelectRow,
                handleEdit,
                handleDelete,
                renderChildRows: childRowsRenderer,
                handleAccountNameClick,
              })
            )}
          </TableBody>
        </Table>
      </Paper>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        count={accountList?.count ?? 0}
        rowsPerPage={rowsPerPage}
        page={(page ?? 1) - 1}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default AccountTable;
