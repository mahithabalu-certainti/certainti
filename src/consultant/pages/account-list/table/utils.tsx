import { Box, Checkbox, IconButton, TableCell, TableRow } from '@mui/material';
import React from 'react';
import { allAccountIcon, arrowDownIcon, arrowUpIcon } from '../../../../assets';
import { Account, ConvertedAccount } from '../../../types';
import ActionButton from './action-button';
import { TruncateWithTooltip } from '../../../../components';
import { DONT_HAVE_ACCESS } from '../../../../common-utils';

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
  isAccountEditEnable?: boolean;
  isAccountDeleteEnable?: boolean;
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
  isAccountEditEnable,
  isAccountDeleteEnable,
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
          selected={selectedRows.has(globalIndex as number)}
          sx={{
            '&:hover td': {
              backgroundColor: '#f5f7fa',
            },
            '&.Mui-selected td': {
              backgroundColor: '#f5f7fa',
            },
            '&.Mui-selected:hover td': {
              backgroundColor: '#f5f7fa',
            },
          }}
        >
          <TableCell 
          sx={{
            position: 'sticky',
            left: 0,
            background: '#fff',
            zIndex: 7,
            maxWidth: '50px',
            minWidth: '50px',
            width: '50px',
            padding: '0 !important',
            borderBottom: '1px solid #CBD6E2 !important',
          }}
          className={`${openRows.has(account.accountName) ? 'no-border' : '' }`}
          >
            <Box className='flex items-center justify-center'>
              <Checkbox
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
              left: '50px',
              background: '#fff',
              zIndex: 6,
              fontWeight: '400 !important',
              color: '#2D3E4F !important',
              borderRight: '1px solid #CBD6E2',
              borderBottom: '1px solid #CBD6E2 !important',
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
                    src={arrowUpIcon}
                    alt='arrowUp'
                    style={{
                      filter:
                        'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
                    }}
                    className='h-[18px] w-[18px] mb-2'
                  />
                ) : (
                  <img
                    src={arrowDownIcon}
                    alt='arrowDown'
                    style={{
                      filter:
                        'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
                    }}
                    className='h-[18px] w-[18px] mb-2'
                  />
                )}
              </IconButton>
            ) : null}
            <TruncateWithTooltip text={account.accountName} maxWidth={250} className='inline-flex items-center gap-1'>
            <Box className='inline-flex items-center gap-1'>
              <img
                src={allAccountIcon}
                alt='accountIcon'
                style={{
                  filter:
                    'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
                }}
                className='w-[18px] h-4'
              />
              <span
                className={`pt-1 cursor-pointer max-w-[250px] truncate overflow-ellipsis no-underline hover:underline hover:text-[#1755E7]`}
                onClick={() => handleAccountNameClick(account)}
              >
                {account.accountName || "NA"}
              </span>
            </Box>
            </TruncateWithTooltip>
          </TableCell>
          <TableCell sx={{ width: '180px', maxWidth: '180px', minWidth: '180px' }}>
            <TruncateWithTooltip text={account.accountNumber || 'NA'} maxWidth={180}>
             {account.accountNumber || 'NA'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell sx={{ width: '200px', maxWidth: '200px', minWidth: '200px' }}>
            <TruncateWithTooltip text={account.industry || 'NA'} maxWidth={200}>
             {account.industry || 'NA'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell sx={{ width: '150px', maxWidth: '150px', minWidth: '150px' }}>
            <TruncateWithTooltip text={account.country || 'NA'} maxWidth={150}>
             {account.country || 'NA'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell sx={{ width: '100px', maxWidth: '100px', minWidth: '100px' }}>{account.currency || 'NA'}</TableCell>
          <TableCell sx={{ width: '160px', maxWidth: '160px', minWidth: '160px' }}>
            <TruncateWithTooltip text={formatNumberWithCommas(account.annualRevenue) || 'NA'} maxWidth={160}>
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
          <TableCell sx={{ padding: '0px !important' }}>
            <ActionButton
              onEdit={() => handleEdit(account)}
              onDelete={() => handleDelete(account)}
              editCustomOption={{
                tooltip: isAccountEditEnable ? '' : DONT_HAVE_ACCESS,
                disabled: !isAccountEditEnable,
              }}
              deleteCustomOption={{
                tooltip: isAccountDeleteEnable ? '' : DONT_HAVE_ACCESS,
                disabled: !isAccountDeleteEnable,
              }}
            />
          </TableCell>
        </TableRow>
        {openRows.has(account.accountName) &&
          renderChildRows(account.accountName)}
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
              backgroundColor: '#f5f7fa',
            },
            '&.Mui-selected td': {
              backgroundColor: '#f5f7fa',
            },
            '&.Mui-selected:hover td': {
              backgroundColor: '#f5f7fa',
            },
          }}
        >
          <TableCell
            sx={{
            position: 'sticky',
            left: 0,
            background: '#fff',
            zIndex: 7,
            maxWidth: '50px',
            minWidth: '50px',
            width: '50px',
            padding: '0 !important',
            borderBottom: '1px solid #CBD6E2 !important',
          }}
           className='no-border' />
          <TableCell
           sx={{
            position: 'sticky',
            left: '50px',
            background: '#fff',
            zIndex: 6,
            fontWeight: '400 !important',
            color: '#2D3E4F !important',
            borderRight: '1px solid #CBD6E2',
            minWidth: '300px',
            width: '300px',
            maxWidth: '300px',
            borderBottom: '1px solid #CBD6E2 !important',
          }}
          >
            <Box className='inline-flex items-center -ml-2.5'>
              <Checkbox
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
              <img
                src={allAccountIcon}
                alt='accountIcon'
                style={{
                  filter:
                    'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
                }}
                className='w-[18px] h-4 mr-1'
              />
              <TruncateWithTooltip text={account.parentAccount || 'NA'} maxWidth={250} className={`pt-1 cursor-pointer hover:underline hover:text-[#1755E7]`}>
                <span  onClick={() => handleAccountNameClick(account)}>
                  {account.accountName || 'NA'}
                </span>
              </TruncateWithTooltip>
            </Box>
          </TableCell>
          <TableCell sx={{ minWidth: '180px', maxWidth: '180px', width: '180px' }}>
            <TruncateWithTooltip text={account.accountNumber || 'NA'} maxWidth={180}>
             {account.accountNumber || 'NA'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell sx={{ minWidth: '200px', maxWidth: '200px', width: '200px' }}>
            <TruncateWithTooltip text={account.industry || 'NA'} maxWidth={200}>
             {account.industry}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell sx={{ minWidth: '150px',maxWidth: '150px', width: '150px' }}>
            <TruncateWithTooltip text={account.country || 'NA'} maxWidth={150}>
             {account.country}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ minWidth: '100px',maxWidth: '100px', width: '100px' }}
            className={`last-column ${
              openRows.has(account.accountName) ? 'no-border-right' : ''
            }`}
          >
            {account.currency}
          </TableCell>
          <TableCell sx={{ minWidth: '160px',maxWidth: '160px', width: '160px' }}>
            <TruncateWithTooltip text={formatNumberWithCommas(account.annualRevenue)|| ''} maxWidth={160}>
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
            {account.status}
          </TableCell>
          <TableCell sx={{ padding: '0px !important' }}>
            <ActionButton
              onEdit={() => handleEdit(account)}
              onDelete={() => handleDelete(account)}
            />
          </TableCell>
        </TableRow>
      );
    });
};
