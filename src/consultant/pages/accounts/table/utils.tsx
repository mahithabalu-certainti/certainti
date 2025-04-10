import { Box, Checkbox, IconButton, TableCell, TableRow } from '@mui/material';
import React from 'react';
import { arrowDownIcon, arrowUpIcon } from '../../../../assets';
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
        <TableRow>
          <TableCell sx={{ maxWidth: '50px' }}>
            <Box className='flex items-center justify-center'>
              <Checkbox
                checked={
                  allChildrenSelected || selectedRows.has(globalIndex as number)
                }
                onChange={() => handleSelectRow(globalIndex as number)}
              />
            </Box>
          </TableCell>
          <TableCell
            sx={{
              fontWeight: '400 !important',
              color: '#2D3E4F !important',
            }}
          >
            {hasChildren ? ( // Only show the icon if there are children
              <IconButton
                aria-label='expand row'
                size='small'
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
                  />
                ) : (
                  <img
                    src={arrowDownIcon}
                    alt='arrowDown'
                    style={{
                      filter:
                        'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
                    }}
                  />
                )}
              </IconButton>
            ) : null}
            <span
              className={`cursor-pointer ${hasChildren ? '' : 'ml-8'} no-underline hover:underline`}
              onClick={() => handleAccountNameClick(account)}
            ></span>
            {account.accountName}
          </TableCell>
          <TableCell sx={{ minWidth: '350px' }}>{account.accountId}</TableCell>
          <TableCell sx={{ minWidth: '200px' }}>
            {account.parentAccount || '-'}
          </TableCell>
          <TableCell sx={{ minWidth: '180px' }}>
            {account.accountNumber}
          </TableCell>
          <TableCell sx={{ minWidth: '200px' }}>{account.industry}</TableCell>
          <TableCell sx={{ minWidth: '150px' }}>{account.country}</TableCell>
          <TableCell sx={{ minWidth: '100px' }}>{account.currency}</TableCell>
          <TableCell>{account.status}</TableCell>
          <TableCell sx={{ minWidth: '180px' }}>
            {account.primaryContact}
          </TableCell>
          <TableCell>
            <ActionButton
              onEdit={() => handleEdit(account)}
              onDelete={() => handleDelete(account)}
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
        <TableRow key={account.accountName}>
          <TableCell className='no-border' />
          <TableCell
            sx={{
              fontWeight: '400 !important',
              color: '#2D3E4F !important',
            }}
          >
            <Checkbox
              checked={selectedRows.has(globalIndex)}
              onChange={() => handleSelectRow(globalIndex)}
            />
            <span
              className={`cursor-pointer no-underline hover:underline`}
              onClick={() => handleAccountNameClick(account)}
            >
              {account.accountName}
            </span>
          </TableCell>
          <TableCell sx={{ minWidth: '350px' }}>{account.accountId}</TableCell>
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
          <TableCell sx={{ minWidth: '100px' }}>{account.status}</TableCell>
          <TableCell sx={{ minWidth: '180px' }}>
            {account.primaryContact}
          </TableCell>
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
