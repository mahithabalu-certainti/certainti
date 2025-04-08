/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { ACCOUNT, ACCOUNT_DETAILS } from '../../../../routes';
import { useAccounts } from '../../../services/account';
import { Account, AccountList, ConvertedAccount } from '../../../types/account';
import { convertAccounts } from '../helpers';
import { renderChildRows, renderRows } from './helpers';
import './styles.css';

const AccountTable: React.FC<Record<string, any>> = ({ appliedFilters }) => {
  const navigate = useNavigate();
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<keyof AccountList>('account_name');
  const [accounts, setAccounts] = useState<ConvertedAccount[]>();
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const { data: accountList, isLoading: loading } = useAccounts({
    page: page,
    limit: rowsPerPage,
    sortBy: orderBy,
    sortOrder: apiOrder,
    filters: appliedFilters,
  });

  useEffect(() => {
    setAccounts(convertAccounts(accountList?.accounts ?? []));
  }, [accountList]);

  // Handler for edit and delete actions
  const handleEdit = (account: Account) => {
    navigate(ACCOUNT + '/edit/' + account.accountId, {
      state: { account },
    });
  };

  const handleDelete = (account: Account) => {
    console.log('Delete account', account.accountId);
  };
  const handleView = (account: Account) => {
    const path = generatePath(ACCOUNT_DETAILS, {
      accountid: account.accountId,
    });
    navigate(path, {
      state: { account },
    });
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

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
      handleView,
      openRows,
    });

  return (
    <Paper sx={{ overflowX: 'auto', boxShadow: 'none' }}>
      <Table className='border border-[#E0E0E0]'>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell sx={{ minWidth: '300px' }}>
              <TableSortLabel
                active={orderBy === 'account_name'}
                direction={orderBy === 'account_name' ? order : 'asc'}
                onClick={createSortHandler('account_name')}
              >
                Account Name
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'account_id'}
                direction={orderBy === 'account_id' ? order : 'asc'}
                onClick={createSortHandler('account_id')}
              >
                Account ID
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'parent_account'}
                direction={orderBy === 'parent_account' ? order : 'asc'}
                onClick={createSortHandler('parent_account')}
              >
                Parent Account
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'account_number'}
                direction={orderBy === 'account_number' ? order : 'asc'}
                onClick={createSortHandler('account_number')}
              >
                Account Number
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'industry'}
                direction={orderBy === 'industry' ? order : 'asc'}
                onClick={createSortHandler('industry')}
              >
                Industry
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'country'}
                direction={orderBy === 'country' ? order : 'asc'}
                onClick={createSortHandler('country')}
              >
                Country
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'currency'}
                direction={orderBy === 'currency' ? order : 'asc'}
                onClick={createSortHandler('currency')}
              >
                Currency
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'status'}
                direction={orderBy === 'status' ? order : 'asc'}
                onClick={createSortHandler('status')}
              >
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'primary_contact'}
                direction={orderBy === 'primary_contact' ? order : 'asc'}
                onClick={createSortHandler('primary_contact')}
              >
                Primary Contact
              </TableSortLabel>
            </TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
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
              handleView,
              renderChildRows: childRowsRenderer,
            })
          )}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component='div'
        count={accountList?.count ?? 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default AccountTable;
