import { Checkbox, IconButton, TableCell, TableRow } from '@mui/material';
import React from 'react';
import { arrowDownIcon, arrowUpIcon } from '../../../../assets';
import { Account, ConvertedAccount } from '../../../types';
import ActionButton from './Icon-button';

interface RenderRowsProps {
  accounts: ConvertedAccount[];
  openRows: Set<string>;
  selectedRows: Set<number>;
  handleRowClick: (accountName: string) => void;
  handleSelectRow: (index: number) => void;
  handleEdit: (account: Account) => void;
  handleDelete: (account: Account) => void;
  renderChildRows: (parentAccount: string | null) => React.ReactNode;
}

interface RenderChildRowsProps {
  accounts: ConvertedAccount[];
  parentAccount: string | null;
  selectedRows: Set<number>;
  handleSelectRow: (index: number) => void;
  handleEdit: (account: Account) => void;
  handleDelete: (account: Account) => void;
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
}: RenderRowsProps) => {
  console.log('accounts', accounts);
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
          <TableCell>
            <Checkbox
              checked={
                allChildrenSelected || selectedRows.has(globalIndex as number)
              }
              onChange={() => handleSelectRow(globalIndex as number)}
            />
          </TableCell>
          <TableCell>
            {hasChildren ? ( // Only show the icon if there are children
              <IconButton
                aria-label='expand row'
                size='small'
                onClick={() => handleRowClick(account.accountName)}
              >
                {openRows.has(account.accountName) ? (
                  <img src={arrowUpIcon} alt='arrowUp' />
                ) : (
                  <img src={arrowDownIcon} alt='arrowDown' />
                )}
              </IconButton>
            ) : null}
            {account.accountName}
          </TableCell>
          <TableCell>{account.accountId}</TableCell>
          <TableCell>{account.parentAccount || '-'}</TableCell>
          <TableCell>{account.accountNumber}</TableCell>
          <TableCell>{account.industry}</TableCell>
          <TableCell>{account.country}</TableCell>
          <TableCell>{account.currency}</TableCell>
          <TableCell>{account.status}</TableCell>
          <TableCell>{account.primaryContact}</TableCell>
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
          <TableCell>
            <Checkbox
              checked={selectedRows.has(globalIndex)}
              onChange={() => handleSelectRow(globalIndex)}
            />
            {account.accountName}
          </TableCell>
          <TableCell>{account.accountId}</TableCell>
          <TableCell>{account.parentAccount || '-'}</TableCell>
          <TableCell>{account.accountNumber}</TableCell>
          <TableCell>{account.industry}</TableCell>
          <TableCell>{account.country}</TableCell>
          <TableCell
            className={`last-column ${
              openRows.has(account.accountName) ? 'no-border-right' : ''
            }`}
          >
            {account.currency}
          </TableCell>
          <TableCell>{account.status}</TableCell>
          <TableCell>{account.primaryContact}</TableCell>
          <TableCell>
            <ActionButton
              onEdit={() => handleEdit(account)}
              onDelete={() => handleDelete(account)}
            />
          </TableCell>
        </TableRow>
      );
    });
};
