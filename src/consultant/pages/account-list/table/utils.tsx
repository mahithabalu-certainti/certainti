import { Box, Checkbox, IconButton, TableCell, TableRow } from '@mui/material';
import React from 'react';
import { arrowDownIcon, childAccountIcon } from '../../../../assets';
import { Account, ConvertedAccount } from '../../../types';
import ActionButton from './action-button';
import { TruncateWithTooltip } from '../../../../components';

const formatNumberWithCommas = (num: number | string): string => {
  if (num) {
    if (typeof num === 'string') {
      num = parseFloat(num);
    }
    return num.toLocaleString('en-US');
  }
  return 'NA';
};

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
          className={`${openRows.has(account.accountName) ? 'bg-[#F2F2F2]' : ''}`}
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
            '& .MuiTableCell-root': {
              border: 'none',
              borderBottom: openRows.has(account.accountName)
                ? '1px solid #CBD6E2 !important'
                : 'none',
            },
          }}
        >
          <TableCell
            sx={{
              position: 'sticky',
              left: 0,
              background: openRows.has(account.accountName)
                ? '#F2F2F2'
                : '#fff',
              zIndex: 7,
              width: '32px',
              maxWidth: '32px',
              minWidth: '32px',
              padding: '0 !important',
              borderRight: 'none',
            }}
          >
            <Box className='flex items-center justify-center !h-[32px] !w-[32px]'>
              <Checkbox
                size='small'
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
              background: openRows.has(account.accountName)
                ? '#F2F2F2'
                : '#fff',
              zIndex: 6,
              fontWeight: '400 !important',
              color: '#2D3E4F !important',
              minWidth: '300px',
              width: '300px',
              maxWidth: '300px',
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
                    alt='arrowUp'
                    style={{
                      filter:
                        'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
                    }}
                    className='h-[18px] w-[18px] mb-1'
                  />
                ) : (
                  <img
                    src={arrowDownIcon}
                    alt='arrowDown'
                    style={{
                      transform: 'rotate(-90deg)',
                      filter:
                        'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
                    }}
                    className='h-[18px] w-[18px] mb-1'
                  />
                )}
              </IconButton>
            ) : null}
            <TruncateWithTooltip
              text={String(account.accountName)}
              maxWidth={250}
              className={`inline-flex items-center rounded-[4px] text-white text-[14px] px-2 font-semibold h-[26px] bg-[#00B7A8] cursor-pointer no-underline hover:underline`}
            >
              <span onClick={() => handleAccountNameClick(account)}>
                {account.accountName || 'NA'}
              </span>
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ width: '180px', maxWidth: '180px', minWidth: '180px' }}
          >
            <TruncateWithTooltip
              text={String(account.accountNumber)}
              maxWidth={180}
            >
              {account.accountNumber || 'NA'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ width: '200px', maxWidth: '200px', minWidth: '200px' }}
          >
            <TruncateWithTooltip text={String(account.industry)} maxWidth={200}>
              {account.industry || 'NA'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ width: '150px', maxWidth: '150px', minWidth: '150px' }}
          >
            <TruncateWithTooltip text={String(account.country)} maxWidth={150}>
              {account.country || 'NA'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ width: '100px', maxWidth: '100px', minWidth: '100px' }}
          >
            {account.currency || 'NA'}
          </TableCell>
          <TableCell
            sx={{ width: '160px', maxWidth: '160px', minWidth: '160px' }}
          >
            <TruncateWithTooltip
              text={formatNumberWithCommas(account.annualRevenue)}
              maxWidth={160}
            >
              {formatNumberWithCommas(account.annualRevenue)}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{
              width: '100px',
              maxWidth: '100px',
              minWidth: '100px',
              color:
                account.status === 'Active'
                  ? '#199806 !important'
                  : '#f44336 !important',
            }}
          >
            {account.status === 'Active' ? 'Active' : 'In-Active'}
          </TableCell>
          <TableCell
            sx={{
              width: '100px',
              minWidth: '100px',
              maxWidth: '100px',
              padding: '0px !important',
            }}
          >
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
            '& .MuiTableCell-root': {
              border: 'none',
              height: '6px !important',
              padding: 0,
            },
          }}
        >
          <TableCell colSpan={9} />
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
              width: '32px',
              maxWidth: '32px',
              minWidth: '32px',
              padding: '0 !important',
              borderBottom: '1px solid #CBD6E2 !important',
            }}
          >
            <Box className='flex items-center justify-center !h-[32px] !w-[32px]'>
              <Checkbox
                size='small'
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
              width: '300px',
              maxWidth: '300px',
              minWidth: '300px',
              borderBottom: '1px solid #CBD6E2 !important',
            }}
          >
            <Box className='inline-flex items-center gap-1 ml-[22px]'>
              <div className='flex items-center justify-center w-[18px] h-[17px] bg-[#425A76] rounded-[4px]'>
                <img
                  src={childAccountIcon}
                  alt='childAccountIcon'
                  className='w-[9px] h-[10px]'
                />
              </div>
              <TruncateWithTooltip
                text={String(account.accountName)}
                maxWidth={250}
                className={`text-[13px] font-semibold cursor-pointer hover:underline hover:text-[#1755E7]`}
              >
                <span onClick={() => handleAccountNameClick(account)}>
                  {account.accountName || 'NA'}
                </span>
              </TruncateWithTooltip>
            </Box>
          </TableCell>
          <TableCell
            sx={{ minWidth: '180px', maxWidth: '180px', width: '180px' }}
          >
            <TruncateWithTooltip
              text={String(account.accountNumber)}
              maxWidth={180}
            >
              {account.accountNumber || 'NA'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ minWidth: '200px', maxWidth: '200px', width: '200px' }}
          >
            <TruncateWithTooltip text={String(account.industry)} maxWidth={200}>
              {account.industry || 'NA'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ minWidth: '150px', maxWidth: '150px', width: '150px' }}
          >
            <TruncateWithTooltip text={String(account.country)} maxWidth={150}>
              {account.country || 'NA'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ minWidth: '100px', maxWidth: '100px', width: '100px' }}
            className={`last-column ${
              openRows.has(account.accountName) ? 'no-border-right' : ''
            }`}
          >
            <TruncateWithTooltip text={String(account.currency)} maxWidth={100}>
              {account.currency || 'NA'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ minWidth: '160px', maxWidth: '160px', width: '160px' }}
          >
            <TruncateWithTooltip
              text={formatNumberWithCommas(account.annualRevenue)}
              maxWidth={160}
            >
              {formatNumberWithCommas(account.annualRevenue)}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{
              color:
                account.status === 'Active'
                  ? '#199806 !important'
                  : '#f44336 !important',
              minWidth: '100px',
              maxWidth: '100px',
              width: '100px',
            }}
          >
            {account.status === 'Active' ? 'Active' : 'In-Active'}
          </TableCell>
          <TableCell
            sx={{
              width: '100px',
              minWidth: '100px',
              maxWidth: '100px',
              padding: '0px !important',
            }}
          >
            <ActionButton
              onEdit={() => handleEdit(account)}
              onDelete={() => handleDelete(account)}
            />
          </TableCell>
        </TableRow>
      );
    });
};
