/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { generatePath, useNavigate } from 'react-router-dom';
import { reshapeGlobalFilter } from '../../../../common-utils';
import { TableSkeleton, TableSortHeader } from '../../../../components/table';
import { ACCOUNT, ACCOUNT_DETAILS } from '../../../../routes';
import { RootState } from '../../../../store/store';
import { useAccounts } from '../../../services/account';
import { FilterState } from '../../../types';
import { Account, ConvertedAccount } from '../../../types/account';
import { convertAccounts } from '../helpers';
import './styles.css';
import { renderChildRows, renderRows } from './utils';
import { accountColumns } from './columns';

const AccountTable: React.FC<Record<string, any>> = ({
  appliedFilters,
  setTotalCount,
  order,
  setOrder,
  orderBy,
  setOrderBy,
  page,
  // setPage
}) => {
  const navigate = useNavigate();
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // const [rowsPerPage, setRowsPerPage] = useState<number>(1000);
  const [accounts, setAccounts] = useState<ConvertedAccount[]>();
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const { filters, fiscalYear } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);

  const { data: accountList, isLoading: loading } = useAccounts({
    page: page,
    limit: 1000,
    sortBy: orderBy,
    sortOrder: apiOrder,
    filters: appliedFilters,
    globalFilters: reshapeGlobalFilter(filters as FilterState),
    fiscalYear,
  });

  useEffect(() => {
    if (!loading && accountList) {
      const convertedData = convertAccounts(accountList.accounts || []);
      setAccounts(convertedData);
      setTotalCount(accountList.count || 0);
      setIsDataLoaded(true);
    } else {
      setIsDataLoaded(false);
    }
  }, [loading, accountList]);

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

  // const handleSelectAllRows = (selectAll: boolean) => {
  //   if (!accounts) return;

  //   const newSelectedRows = new Set<number>();

  //   if (selectAll) {
  //     accounts.forEach((account, index) => {
  //       const hasParent = !!account.parentAccount;

  //       if (!hasParent) {
  //         newSelectedRows.add(index);

  //         const children = accounts.filter(
  //           (acc) => acc.parentAccount === account.accountName
  //         );

  //         children.forEach((child) => {
  //           const childIndex = accounts.findIndex(
  //             (acc) => acc.accountName === child.accountName
  //           );
  //           newSelectedRows.add(childIndex);
  //         });
  //       }
  //     });
  //   }

  //   setSelectedRows(newSelectedRows);
  // };

  // // Handle page change
  // const handleChangePage = (newPage: number) => {
  //   setPage(newPage + 1);
  // };

  // // Handle rows per page change
  // const handleChangeRowsPerPage = (newPageSize: number) => {
  //   setRowsPerPage(newPageSize);
  //   setPage(1);
  // };

  // Handle sorting
  const handleSortChange = (property: string, direction: 'asc' | 'desc') => {
    setOrderBy(property);
    setOrder(direction);
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

  return (
    <div className='border-t border-[#CBD6E2] h-full'>
      <Paper
        sx={{
          boxShadow: 'none',
          borderRadius: '0px',
          height: '100%',
        }}
      >
        <TableContainer
          sx={{
            height: '100%',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          }}
        >
          <Table stickyHeader>
            <TableHead
              sx={{
                '& .MuiTableCell-root': {
                  fontWeight: 700,
                  fontSize: '13px',
                  lineHeight: '21px',
                  color: '#2A2A2A',
                  padding: '0px',
                  px: '8px',
                  height: '28px',
                },
              }}
            >
              <TableRow>
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    background: '#fff',
                    zIndex: 11,
                    width: '32px',
                    maxWidth: '32px',
                    minWidth: '32px',
                    padding: '0px !important',
                    borderRight: 'none',
                    borderBottom: '1px solid #CBD6E2 !important',
                  }}
                >
                  {/* <Box className='flex items-center justify-center !h-[28px] !w-[32px]'>
                    <Checkbox
                      size="small"
                      disableRipple
                      checked={Boolean(
                        accounts?.length &&
                        selectedRows.size === accounts.length
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
                  </Box> */}
                </TableCell>
                {accountColumns.map((column) =>
                  column.sortable ? (
                    <TableSortHeader
                      key={column.id}
                      columnId={column.sortId}
                      label={column.label}
                      orderBy={orderBy}
                      order={order}
                      onSortChange={handleSortChange}
                      sx={{
                        width: column.width || 160,
                        minWidth: column.width || 160,
                        maxWidth: column.width || 160,
                        ...(column.sx || {}),
                      }}
                    />
                  ) : (
                    <TableCell
                      key={column.id}
                      sx={{
                        width: column.width || 160,
                        minWidth: column.width || 160,
                        maxWidth: column.width || 160,
                        ...(column.sx || {}),
                      }}
                    >
                      {column.label}
                    </TableCell>
                  )
                )}
                <TableCell
                  sx={{
                    width: '100px',
                    minWidth: '100px',
                    maxWidth: '100px',
                    borderRight: 'none',
                  }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody
              sx={{
                '& .MuiTableCell-root': {
                  fontWeight: 500,
                  fontSize: '13px',
                  lineHeight: '21px',
                  color: '#425A76',
                  padding: '0px',
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  height: '32px',
                },
              }}
            >
              {loading && !isDataLoaded ? (
                <TableSkeleton
                  rowsPerPage={15}
                  columnsCount={accountColumns.length}
                  selectable={true}
                  hasActions={true}
                  borderHide={true}
                  stickyColumnsCount={2}
                />
              ) : !loading && isDataLoaded && accounts?.length === 0 ? (
                <TableRow
                  sx={{
                    height: '32px',
                    '& .MuiTableCell-root': {
                      border: 'none',
                    },
                  }}
                >
                  <TableCell colSpan={9} align='center'>
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
        </TableContainer>
      </Paper>
      {/* <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        count={accountList?.count ?? 0}
        rowsPerPage={rowsPerPage}
        page={(page ?? 1) - 1}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      /> */}
    </div>
  );
};

export default AccountTable;
