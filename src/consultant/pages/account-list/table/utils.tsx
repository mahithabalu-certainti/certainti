import { Box, Checkbox, IconButton, TableCell, TableRow } from '@mui/material';
import React from 'react';
import { arrowDownIcon, childAccountIcon } from '../../../../assets';
import { Account, ConvertedAccount } from '../../../types';
import ActionButton from './action-button';

interface RenderRowsProps {
  accounts: ConvertedAccount[];
  openRows: Set<string>;
  selectedRows: Set<number>;
  handleRowClick: (accountName: string) => void;
  handleSelectRow: (index: number) => void;
  handleEdit: (account: Account) => void;
  handleDelete: (account: Account) => void;
  renderChildRows: (parentAccount: string | null) => React.ReactNode;
  handleAccountNameClick: (account: Account) => void;
}

interface RenderChildRowsProps {
  accounts: ConvertedAccount[];
  parentAccount: string | null;
  selectedRows: Set<number>;
  handleSelectRow: (index: number) => void;
  handleEdit: (account: Account) => void;
  handleDelete: (account: Account) => void;
  handleAccountNameClick: (account: Account) => void;
  openRows: Set<string>;
}

export const renderRows = ({
  accounts,
  openRows,
  selectedRows,
  handleRowClick,
  handleSelectRow,
  handleEdit,
  handleDelete,
  renderChildRows,
  handleAccountNameClick,
}: RenderRowsProps) => {
  const rows = accounts?.filter((account) => !account?.parentAccount);
  return rows?.map((account) => {
    const globalIndex = accounts?.findIndex(
      (acc) => acc.accountName === account.accountName
    );
    const hasChildren = accounts?.some(
      (acc) => acc.parentAccount === account.accountName
    );
    const allChildrenSelected = hasChildren
      ? accounts
          ?.filter((acc) => acc.parentAccount === account.accountName)
          ?.every((child) =>
            selectedRows?.has(
              accounts?.findIndex(
                (acc) => acc.accountName === child.accountName
              )
            )
          )
      : false;

    return (
      <React.Fragment key={account.accountName}>
        <TableRow
          hover
          className={`${openRows.has(account.accountName) ? 'bg-[#F2F2F2]' : '' }`}
          selected={selectedRows.has(globalIndex as number)}
          sx={{
            '&:hover td': {
              backgroundColor: '#F5F9FF',
            },
            '&.Mui-selected td': {
              backgroundColor: '#f5f7fa',
            },
            '&.Mui-selected:hover td': {
              backgroundColor: '#F5F9FF',
            },
            "& .MuiTableCell-root": {
              border: 'none',
              borderBottom: openRows.has(account.accountName) ? '1px solid #CBD6E2 !important' : 'none',
            },
          }}
        >
          <TableCell 
          sx={{
            position: 'sticky',
            left: 0,
            background: openRows.has(account.accountName) ? '#F2F2F2' : '#fff',
            zIndex: 7,
            maxWidth: '32px',
            minWidth: '32px',
            padding: '0 !important',
            borderRight: 'none',
          }}
          >
            <Box className='flex items-center justify-center !h-[32px] !w-[32px]'>
              <Checkbox
                size="small"
                disableRipple
                checked={
                  allChildrenSelected || selectedRows.has(globalIndex as number)
                }
                onChange={() => handleSelectRow(globalIndex as number)}
                sx={{
                  color: '#CBD6E2',
                  '&.Mui-checked': {
                    color: '#1755E7',
                  },
                }}
              />
            </Box>
          </TableCell>
          <TableCell
            sx={{
              position: 'sticky',
              left: '32px',
              background: openRows.has(account.accountName) ? '#F2F2F2' : '#fff',
              zIndex: 6,
              fontWeight: '400 !important',
              color: '#2D3E4F !important',
              minWidth: '300px',
            }}
          >
            {hasChildren ? ( // Only show the icon if there are children
              <IconButton
                aria-label='expand row'
                size='small'
                disableRipple
                className='!p-0 !pr-1'
                onClick={() => handleRowClick(account.accountName)}
              >
                {openRows.has(account.accountName) ? (
                  <img
                  src={arrowDownIcon}
                  alt="arrowUp"
                  style={{
                    filter:
                      "brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)",
                  }}
                  className="h-[18px] w-[18px] mb-1"
                />
              ) : (
                <img
                  src={arrowDownIcon}
                  alt="arrowDown"
                  style={{
                    transform: 'rotate(-90deg)',
                    filter:
                      "brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)",
                  }}
                  className="h-[18px] w-[18px] mb-1"
                />
              )}
              </IconButton>
            ) : null}
              <span
                className={`inline-flex items-center rounded-[4px] text-white text-[14px] px-2 font-semibold h-[26px] bg-[#FF6666] cursor-pointer no-underline hover:underline hover:text-[#1755E7]`}
                onClick={() => handleAccountNameClick(account)}
              >
                {account.accountName}
              </span>
          </TableCell>
          <TableCell sx={{ minWidth: '200px' }}>
            {account.parentAccount || '-'}
          </TableCell>
          <TableCell sx={{ minWidth: '180px' }}>
            {account.accountNumber}
          </TableCell>
          <TableCell sx={{ minWidth: '200px' }}>{account.industry}</TableCell>
          <TableCell sx={{ minWidth: '150px' }}>{account.country}</TableCell>
          <TableCell sx={{ minWidth: '100px' }}>{account.currency}</TableCell>
          <TableCell sx={{ minWidth: '160px' }}>{account.annualRevenue}</TableCell>
          <TableCell sx={{color: account.status === 'Active' ? '#199806 !important' : '#f44336 !important'}}>{account.status}</TableCell>
          <TableCell sx={{ padding: '0px !important' }}>
            <ActionButton
              onEdit={() => handleEdit(account)}
              onDelete={() => handleDelete(account)}
            />
          </TableCell>
        </TableRow>
        {openRows.has(account.accountName) &&
          renderChildRows(account.accountName)}
        <TableRow
          sx={{
            "& .MuiTableCell-root": {
              border: 'none',
              height: '12px !important',
              padding: 0,
            }
          }}>
          <TableCell colSpan={10} />
        </TableRow>
      </React.Fragment>
    );
  });
};

export const renderChildRows = ({
  accounts,
  parentAccount,
  selectedRows,
  handleSelectRow,
  handleEdit,
  handleDelete,
  handleAccountNameClick,
  openRows,
}: RenderChildRowsProps) => {
  return accounts
    ?.filter((account) => account.parentAccount === parentAccount)
    ?.map((account) => {
      const globalIndex = accounts.findIndex(
        (acc) => acc.accountName === account.accountName
      );
      return (
        <TableRow
          key={account.accountName}
          hover
          selected={selectedRows.has(globalIndex)}
          sx={{
            '&:hover td': {
              backgroundColor: '#F5F9FF',
            },
            '&.Mui-selected td': {
              backgroundColor: '#f5f7fa',
            },
            '&.Mui-selected:hover td': {
              backgroundColor: '#F5F9FF',
            },
          }}
        >
          <TableCell
            sx={{
            position: 'sticky',
            left: 0,
            background: '#fff',
            zIndex: 7,
            maxWidth: '32px',
            minWidth: '32px',
            padding: '0 !important',
            borderBottom: '1px solid #CBD6E2 !important',
          }}>
            <Box className='flex items-center justify-center !h-[32px] !w-[32px]'>
            <Checkbox
              size="small"
              disableRipple
              checked={selectedRows.has(globalIndex)}
              onChange={() => handleSelectRow(globalIndex)}
              sx={{
                color: '#CBD6E2',
                '&.Mui-checked': {
                  color: '#1755E7',
                },
              }}
            />
            </Box>
          </TableCell>
          <TableCell
           sx={{
            position: 'sticky',
            left: '32px',
            background: '#fff',
            zIndex: 6,
            fontWeight: '400 !important',
            color: '#2D3E4F !important',
            borderRight: '1px solid #CBD6E2',
            minWidth: '300px',
            borderBottom: '1px solid #CBD6E2 !important',
          }}
          >
          <Box className='inline-flex items-center gap-1 ml-5'>
            <div className='flex items-center justify-center w-[18px] h-[17px] bg-[#FF6666] rounded-[4px]'>
              <img
                  src={childAccountIcon}
                  alt='childAccountIcon'
                  className='w-[9px] h-[10px]'
                />
            </div>
            <span
              className={`cursor-pointer hover:underline hover:text-[#1755E7]`}
              onClick={() => handleAccountNameClick(account)}
            >
              {account.accountName}
            </span>
            </Box>
          </TableCell>
          <TableCell sx={{ minWidth: '200px' }}>
            {account.parentAccount || '-'}
          </TableCell>
          <TableCell sx={{ minWidth: '180px' }}>
            {account.accountNumber}
          </TableCell>
          <TableCell sx={{ minWidth: '200px' }}>{account.industry}</TableCell>
          <TableCell sx={{ minWidth: '150px' }}>{account.country}</TableCell>
          <TableCell
            sx={{ minWidth: '100px' }}
            className={`last-column ${
              openRows.has(account.accountName) ? 'no-border-right' : ''
            }`}
          >
            {account.currency}
          </TableCell>
          <TableCell sx={{ minWidth: '160px' }}>{account.annualRevenue}</TableCell>
          <TableCell sx={{color: account.status === 'Active' ? '#199806 !important' : '#f44336 !important', minWidth: '100px' }}>{account.status}</TableCell>
          <TableCell sx={{ minWidth: '80px' }}>
            <ActionButton
              onEdit={() => handleEdit(account)}
              onDelete={() => handleDelete(account)}
            />
          </TableCell>
        </TableRow>
      );
    });
};
