import {
  Box,
  Checkbox,
  IconButton,
  SxProps,
  TableCell,
  TableRow,
  Theme,
  Tooltip,
} from '@mui/material';
import React, { Fragment, Suspense } from 'react';
import {
  ArrowDownIcon,
  ChildAccountIcon,
  CloseIcon,
  ErrorInfoIcon,
  NewTickIcon,
} from '../../../../assets';
import {
  Account,
  AccountColumn,
  AccountList,
  ConvertedAccount,
} from '../../../types';
import ActionButton from './action-button';
import { TruncateWithTooltip } from '../../../../components';
import { costDisplay } from '../../../../common-utils';
import { renderFields } from '../../../../components/table/table-utils';

const formatNumberWithCommas = (num: number | string): string => {
  if (num !== null && num !== undefined && num !== '') {
    const parsed = typeof num === 'string' ? parseFloat(num) : num;
    if (!isNaN(parsed)) {
      return parsed.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }
  return '-';
};

function cleanCellValue(raw: string | undefined | null): string {
  if (raw == null || raw === '-' || raw === '--') return '';
  return String(raw);
}

export interface EditingCell {
  rowId: string;
  columnId: string;
  originalValue: string;
  value: string;
  error?: string | null;
}

interface RenderRowsProps {
  accounts: ConvertedAccount[];
  openRows: Set<string>;
  selectedRows: Set<number>;
  handleRowClick: (accountId: string) => void;
  handleSelectRow: (index: number) => void;
  handleEdit: (account: Account) => void;
  handleDelete: (account: Account) => void;
  renderChildRows: (parentAccount: string | null) => React.ReactNode;
  handleAccountNameClick: (account: Account) => void;
  isAccountEditEnable?: boolean;
  isAccountDeleteEnable?: boolean;
  columns: AccountColumn<AccountList>[];
  editingCell: EditingCell | null;
  setEditingCell: (cell: EditingCell | null) => void;
  handleValueChange: (value: string | number) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isSaving: boolean;
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
  openChildRows: Set<string>;
  handleChildRowClick: (accountId: string) => void;
  isAccountEditEnable?: boolean;
  isAccountDeleteEnable?: boolean;
  columns: AccountColumn<AccountList>[];
  editingCell: EditingCell | null;
  setEditingCell: (cell: EditingCell | null) => void;
  handleValueChange: (value: string | number) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isSaving: boolean;
}

interface RenderEditableCellProps {
  rowId: string;
  columnId: string;
  value: string | undefined;
  width: string | number;
  sx?: SxProps<Theme>;
  editingCell: EditingCell | null;
  setEditingCell: (cell: EditingCell | null) => void;
  handleValueChange: (value: string | number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isSaving: boolean;
  handleSave: () => void;
  handleCancel: () => void;
  columns: AccountColumn<AccountList>[];
  isAccountName?: boolean;
  hasChildren?: boolean;
  handleRowClick?: (accountId: string) => void;
  account?: ConvertedAccount;
  handleAccountNameClick?: (account: Account) => void;
  openRows?: Set<string>;
  isChildAccount?: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
const RenderEditableCell = ({
  rowId,
  columnId,
  value,
  width,
  sx,
  openRows,
  editingCell,
  setEditingCell,
  handleValueChange,
  handleKeyDown,
  isSaving,
  handleSave,
  handleCancel,
  columns,
  isAccountName = false,
  hasChildren = false,
  handleRowClick,
  account,
  handleAccountNameClick,
  isChildAccount,
}: RenderEditableCellProps) => {
  const column = columns.find((c) => c.id === columnId);
  const isEditing =
    editingCell?.rowId === rowId && editingCell?.columnId === columnId;

  return (
    <TableCell
      key={columnId}
      data-editing={isEditing ? `${rowId}-${columnId}` : undefined}
      sx={{
        width: width,
        minWidth: width,
        maxWidth: width,
        outline:
          isEditing && column?.field?.type !== 'textarea'
            ? `1px solid ${editingCell?.error ? '#ef4444' : '#60A5FA'}`
            : undefined,
        outlineOffset: isEditing ? '-2px' : undefined,
        ...(isEditing &&
          editingCell?.error && {
            backgroundColor: '#FEF2F2',
          }),
        ...sx,
      }}
      onDoubleClick={() => {
        if (!column?.editable) return;
        if (editingCell && editingCell.value !== editingCell.originalValue) {
          return;
        }
        setEditingCell({
          rowId,
          columnId,
          value: cleanCellValue(value),
          originalValue: cleanCellValue(value),
          error: null,
        });
      }}
    >
      {isEditing ? (
        <div className='box-border !h-[31px] relative'>
          {renderFields({
            column: column!,
            editingCell,
            handleValueChange,
            handleKeyDown,
            isSaving,
          })}
          {editingCell?.error && column?.field?.type !== 'select' && (
            <Tooltip
              title={editingCell?.error}
              arrow
              placement='top'
              slotProps={{
                tooltip: {
                  sx: { backgroundColor: '#FEF2F2', mr: 1 },
                },
              }}
            >
              <span className='h-[28px] w-5 flex items-center justify-center absolute top-[3px] bg-[#FEF2F2] right-[2px] cursor-pointer'>
                <ErrorInfoIcon alt='error' className='w-5 h-3.5' />
              </span>
            </Tooltip>
          )}
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translate(120%, -50%)',
              zIndex: 999,
              display: 'flex',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <button
              onClick={handleSave}
              disabled={isSaving || !!editingCell?.error}
              className='w-7 h-7 flex items-center justify-center bg-[#A9E3A2] rounded-[2px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] cursor-pointer outline-none focus:outline-none'
            >
              <NewTickIcon
                className='w-3 h-3'
                style={{
                  filter: 'brightness(0) saturate(100%)',
                }}
              />
            </button>

            <button
              onClick={handleCancel}
              disabled={isSaving}
              className='w-7 h-7 flex items-center justify-center bg-[#FBB6AE] rounded-[2px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] cursor-pointer outline-none focus:outline-none'
            >
              <CloseIcon
                className='w-2.5 h-2.5'
                style={{
                  filter: 'brightness(0) saturate(100%)',
                }}
              />
            </button>
          </Box>
        </div>
      ) : (
        <>
          {isAccountName ? (
            <div
              className={
                isChildAccount ? `inline-flex items-center gap-1 ml-[15px]` : ''
              }
            >
              {hasChildren && (
                <IconButton
                  aria-label='expand row'
                  size='small'
                  disableRipple
                  className='!p-0 !pr-1'
                  onClick={() => handleRowClick?.(account?.accountId || '')}
                >
                  <ArrowDownIcon
                    alt={
                      openRows && openRows.has(account?.accountId || '')
                        ? 'arrowUp'
                        : 'arrowDown'
                    }
                    style={{
                      transform:
                        openRows && openRows.has(account?.accountId || '')
                          ? ''
                          : 'rotate(-90deg)',
                      filter:
                        'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
                    }}
                    className='h-[18px] w-[18px] mb-1'
                  />
                </IconButton>
              )}
              {!hasChildren && (
                <div className='h-[10px] w-[22px] inline-flex'></div>
              )}
              {isChildAccount && (
                <div className='flex items-center justify-center w-[18px] h-[17px] bg-[#425A76] rounded-[4px]'>
                  <ChildAccountIcon
                    alt='childAccountIcon'
                    className='w-[9px] h-[10px]'
                  />
                </div>
              )}
              <TruncateWithTooltip
                text={String(value)}
                maxWidth={width || 200}
                className={
                  !isChildAccount
                    ? `inline-flex items-center rounded-[4px] text-[14px] px-2 font-semibold h-[26px] cursor-pointer group-hover:underline`
                    : 'text-[13px] font-semibold cursor-pointer underline text-[#1755E7]'
                }
                style={
                  !isChildAccount
                    ? {
                        background: `linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)), ${account?.bgColor}`,
                        color: account?.color,
                      }
                    : {}
                }
              >
                <span onClick={() => handleAccountNameClick?.(account!)}>
                  {value || '-'}
                </span>
              </TruncateWithTooltip>
            </div>
          ) : (
            <TruncateWithTooltip text={String(value)} maxWidth={width || 200}>
              {value || '-'}
            </TruncateWithTooltip>
          )}
        </>
      )}
    </TableCell>
  );
};

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
  columns,
  editingCell,
  setEditingCell,
  handleValueChange,
  handleKeyDown,
  isSaving,
  handleSave,
  handleCancel,
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

    const rowId = account.accountId;

    return (
      <React.Fragment key={account.accountName}>
        <TableRow
          hover
          className={`${openRows.has(account.accountId) ? 'bg-[#ECECEC]' : ''} group`}
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
              borderBottom: openRows.has(account.accountId)
                ? '1px solid #CBD6E2 !important'
                : 'none',
            },
          }}
        >
          <TableCell
            sx={{
              position: 'sticky',
              left: 0,
              background: openRows.has(account.accountId) ? '#ECECEC' : '#fff',
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
          <RenderEditableCell
            rowId={rowId}
            columnId='account_name'
            value={account.accountName}
            width={250}
            openRows={openRows}
            sx={{
              position: 'sticky',
              left: '32px',
              background: openRows.has(account.accountId) ? '#ECECEC' : '#fff',
              zIndex: 6,
              fontWeight: '400 !important',
              color: '#2D3E4F !important',
              minWidth: '250px',
              width: '250px',
              maxWidth: '250px',
            }}
            editingCell={editingCell}
            setEditingCell={setEditingCell}
            handleValueChange={handleValueChange}
            handleKeyDown={handleKeyDown}
            isSaving={isSaving}
            handleSave={handleSave}
            handleCancel={handleCancel}
            columns={columns}
            isAccountName={true}
            hasChildren={hasChildren}
            handleRowClick={handleRowClick}
            account={account}
            handleAccountNameClick={handleAccountNameClick}
          />
          <RenderEditableCell
            rowId={rowId}
            columnId='industry'
            value={account.industry}
            width={200}
            editingCell={editingCell}
            setEditingCell={setEditingCell}
            handleValueChange={handleValueChange}
            handleKeyDown={handleKeyDown}
            isSaving={isSaving}
            handleSave={handleSave}
            handleCancel={handleCancel}
            columns={columns}
          />
          <RenderEditableCell
            rowId={rowId}
            columnId='country'
            value={account.country}
            width={150}
            editingCell={editingCell}
            setEditingCell={setEditingCell}
            handleValueChange={handleValueChange}
            handleKeyDown={handleKeyDown}
            isSaving={isSaving}
            handleSave={handleSave}
            handleCancel={handleCancel}
            columns={columns}
          />
          <TableCell
            sx={{
              width: '150px',
              maxWidth: '150px',
              minWidth: '150px',
              textAlign: 'right',
            }}
          >
            <TruncateWithTooltip
              text={String(account.totalProjects)}
              maxWidth={150}
            >
              {account.totalProjects}
            </TruncateWithTooltip>
          </TableCell>

          <TableCell
            sx={{
              width: '180px',
              maxWidth: '180px',
              minWidth: '180px',
              textAlign: 'right',
            }}
          >
            <TruncateWithTooltip
              text={formatNumberWithCommas(account.totalProjectHours)}
              maxWidth={180}
            >
              {formatNumberWithCommas(account.totalProjectHours)}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{
              width: '150px',
              maxWidth: '150px',
              minWidth: '150px',
              textAlign: 'right',
            }}
          >
            {account.totalProjectCost
              ? costDisplay(account.totalProjectCost, account.currency)
              : '-'}
          </TableCell>
          <TableCell
            sx={{
              width: '200px',
              maxWidth: '200px',
              minWidth: '200px',
              textAlign: 'right',
            }}
          >
            {account.estimatedHours}
          </TableCell>
          <TableCell
            sx={{
              width: '140px',
              maxWidth: '140px',
              minWidth: '140px',
              textAlign: 'right',
            }}
          >
            {account.qre ? costDisplay(account.qre, account.currency) : '-'}
          </TableCell>
          <TableCell
            sx={{
              width: '200px',
              maxWidth: '200px',
              minWidth: '200px',
              textAlign: 'right',
            }}
          >
            {account.estimatedCredits
              ? costDisplay(account.estimatedCredits, account.currency)
              : '-'}
          </TableCell>
          <TableCell
            sx={{
              width: '180px',
              maxWidth: '180px',
              minWidth: '180px',
              textAlign: 'right',
            }}
          >
            {account.actualCredits
              ? costDisplay(account.actualCredits, account.currency)
              : '-'}
          </TableCell>
          <TableCell
            sx={{ width: '200px', maxWidth: '200px', minWidth: '200px' }}
          >
            <TruncateWithTooltip
              text={String(account.financeExecutive)}
              maxWidth={200}
            >
              {account.financeExecutive || '-'}
            </TruncateWithTooltip>
          </TableCell>

          <TableCell
            sx={{ width: '160px', maxWidth: '160px', minWidth: '160px' }}
          >
            <TruncateWithTooltip
              text={String(account.financeHead)}
              maxWidth={160}
            >
              {account.financeHead || '-'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ width: '250px', maxWidth: '250px', minWidth: '240px' }}
          >
            <TruncateWithTooltip
              text={String(account.professionalConsultant)}
              maxWidth={250}
            >
              {account.professionalConsultant || '-'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ width: '120px', maxWidth: '120px', minWidth: '120px' }}
          >
            <TruncateWithTooltip
              text={String(account.accountNumber)}
              maxWidth={180}
            >
              {account.accountNumber || '-'}
            </TruncateWithTooltip>
          </TableCell>
          {(isAccountEditEnable || isAccountDeleteEnable) && (
            <TableCell
              sx={{
                width: '60px',
                minWidth: '60px',
                maxWidth: '60px',
                padding: '0px !important',
              }}
            >
              <ActionButton
                onEdit={() => handleEdit(account)}
                onDelete={() => handleDelete(account)}
                editCustomOption={{
                  hide: !isAccountEditEnable,
                }}
                deleteCustomOption={{
                  hide: !isAccountDeleteEnable,
                }}
              />
            </TableCell>
          )}
        </TableRow>
        <Suspense fallback={null}>
          {openRows.has(account.accountId) &&
            renderChildRows(account.accountName)}
        </Suspense>
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
  // openRows,
  openChildRows,
  handleChildRowClick,
  isAccountEditEnable,
  isAccountDeleteEnable,
  columns,
  editingCell,
  setEditingCell,
  handleValueChange,
  handleKeyDown,
  isSaving,
  handleSave,
  handleCancel,
}: RenderChildRowsProps) => {
  return accounts
    ?.filter((account) => account.parentAccount === parentAccount)
    ?.map((account) => {
      const globalIndex = accounts.findIndex(
        (acc) => acc.accountName === account.accountName
      );
      const hasProjects =
        account.projectsByYear && account.projectsByYear.length > 0;

      const rowId = account.accountId;

      return (
        <Fragment key={account.accountName}>
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
            <RenderEditableCell
              rowId={rowId}
              columnId='account_name'
              value={account.accountName}
              width={250}
              openRows={openChildRows}
              sx={{
                position: 'sticky',
                left: '32px',
                background: '#fff',
                zIndex: 6,
                fontWeight: '400 !important',
                color: '#2D3E4F !important',
                borderRight: '1px solid #CBD6E2',
                width: '250px',
                maxWidth: '250px',
                minWidth: '250px',
                borderBottom: '1px solid #CBD6E2 !important',
              }}
              editingCell={editingCell}
              setEditingCell={setEditingCell}
              handleValueChange={handleValueChange}
              handleKeyDown={handleKeyDown}
              isSaving={isSaving}
              handleSave={handleSave}
              handleCancel={handleCancel}
              columns={columns}
              isAccountName={true}
              hasChildren={hasProjects}
              handleRowClick={handleChildRowClick}
              account={account}
              handleAccountNameClick={handleAccountNameClick}
              isChildAccount={true}
            />
            <RenderEditableCell
              rowId={rowId}
              columnId='industry'
              value={account.industry}
              width={200}
              editingCell={editingCell}
              setEditingCell={setEditingCell}
              handleValueChange={handleValueChange}
              handleKeyDown={handleKeyDown}
              isSaving={isSaving}
              handleSave={handleSave}
              handleCancel={handleCancel}
              columns={columns}
            />
            <RenderEditableCell
              rowId={rowId}
              columnId='country'
              value={account.country}
              width={150}
              editingCell={editingCell}
              setEditingCell={setEditingCell}
              handleValueChange={handleValueChange}
              handleKeyDown={handleKeyDown}
              isSaving={isSaving}
              handleSave={handleSave}
              handleCancel={handleCancel}
              columns={columns}
            />
            <TableCell
              sx={{
                width: '150px',
                maxWidth: '150px',
                minWidth: '150px',
                textAlign: 'right',
              }}
            >
              <TruncateWithTooltip
                text={String(account.totalProjects)}
                maxWidth={150}
              >
                {account.totalProjects}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell
              sx={{
                width: '180px',
                maxWidth: '180px',
                minWidth: '180px',
                textAlign: 'right',
              }}
            >
              <TruncateWithTooltip
                text={formatNumberWithCommas(account.totalProjectHours)}
                maxWidth={180}
              >
                {formatNumberWithCommas(account.totalProjectHours)}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell
              sx={{
                width: '150px',
                maxWidth: '150px',
                minWidth: '150px',
                textAlign: 'right',
              }}
            >
              {account.totalProjectCost
                ? costDisplay(account.totalProjectCost, account.currency)
                : '-'}
            </TableCell>
            <TableCell
              sx={{
                width: '200px',
                maxWidth: '200px',
                minWidth: '200px',
                textAlign: 'right',
              }}
            >
              {account.estimatedHours}
            </TableCell>
            <TableCell
              sx={{
                width: '140px',
                maxWidth: '140px',
                minWidth: '140px',
                textAlign: 'right',
              }}
            >
              {account.qre ? costDisplay(account.qre, account.currency) : '-'}
            </TableCell>
            <TableCell
              sx={{
                width: '200px',
                maxWidth: '200px',
                minWidth: '200px',
                textAlign: 'right',
              }}
            >
              {account.estimatedCredits
                ? costDisplay(account.estimatedCredits, account.currency)
                : '-'}
            </TableCell>
            <TableCell
              sx={{
                width: '180px',
                maxWidth: '180px',
                minWidth: '180px',
                textAlign: 'right',
              }}
            >
              {account.actualCredits
                ? costDisplay(account.actualCredits, account.currency)
                : '-'}
            </TableCell>
            <TableCell
              sx={{ width: '200px', maxWidth: '200px', minWidth: '200px' }}
            >
              <TruncateWithTooltip
                text={String(account.financeExecutive)}
                maxWidth={200}
              >
                {account.financeExecutive || '-'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell
              sx={{ width: '160px', maxWidth: '160px', minWidth: '160px' }}
            >
              <TruncateWithTooltip
                text={String(account.financeHead)}
                maxWidth={160}
              >
                {account.financeHead || '-'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell
              sx={{ width: '250px', maxWidth: '250px', minWidth: '250px' }}
            >
              <TruncateWithTooltip
                text={String(account.professionalConsultant)}
                maxWidth={250}
              >
                {account.professionalConsultant || '-'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell
              sx={{ width: '120px', maxWidth: '120px', minWidth: '120px' }}
            >
              <TruncateWithTooltip
                text={String(account.accountNumber)}
                maxWidth={180}
              >
                {account.accountNumber || '-'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell
              sx={{
                width: '60px',
                minWidth: '60px',
                maxWidth: '60px',
                padding: '0px !important',
              }}
            >
              <ActionButton
                onEdit={() => handleEdit(account)}
                onDelete={() => handleDelete(account)}
                editCustomOption={{
                  hide: !isAccountEditEnable,
                }}
                deleteCustomOption={{
                  hide: !isAccountDeleteEnable,
                }}
              />
            </TableCell>
          </TableRow>
          {hasProjects && openChildRows.has(account.accountId) && (
            <>
              {account.projectsByYear?.map((project) => (
                <TableRow
                  key={project.account_rid}
                  hover
                  // selected={selectedRows.has(globalIndex)}
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
                        // checked={selectedRows.has(globalIndex)}
                        // onChange={() => handleSelectRow(globalIndex)}
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
                      width: '250px',
                      maxWidth: '250px',
                      minWidth: '250px',
                      borderBottom: '1px solid #CBD6E2 !important',
                    }}
                  >
                    <Box className='inline-flex items-center gap-1 ml-[55px]'>
                      <div className='flex items-center justify-center w-[18px] h-[17px] bg-[#425A76] rounded-[4px]'>
                        <ChildAccountIcon
                          alt='childAccountIcon'
                          className='w-[9px] h-[10px]'
                        />
                      </div>
                      <span className='text-[13px] font-semibold'>
                        {project.fiscal_year || '-'}
                      </span>
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '200px',
                      maxWidth: '200px',
                      minWidth: '200px',
                    }}
                  >
                    {'-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '150px',
                      maxWidth: '150px',
                      minWidth: '150px',
                    }}
                  >
                    {'-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '150px',
                      maxWidth: '150px',
                      minWidth: '150px',
                      textAlign: 'right',
                    }}
                  >
                    {project.total_projects || '-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '180px',
                      maxWidth: '180px',
                      minWidth: '180px',
                      textAlign: 'right',
                    }}
                  >
                    {formatNumberWithCommas(project.total_project_hours)}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '150px',
                      maxWidth: '150px',
                      minWidth: '150px',
                      textAlign: 'right',
                    }}
                  >
                    {project.total_project_cost
                      ? costDisplay(
                          project.total_project_cost,
                          account.currency
                        )
                      : '-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '200px',
                      maxWidth: '200px',
                      minWidth: '200px',
                      textAlign: 'right',
                    }}
                  >
                    {project.qualifying_project_hours_fed || '-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '140px',
                      maxWidth: '140px',
                      minWidth: '140px',
                      textAlign: 'right',
                    }}
                  >
                    {project.qualifying_project_qre_fed
                      ? costDisplay(
                          project.qualifying_project_qre_fed,
                          account.currency
                        )
                      : '-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '200px',
                      maxWidth: '200px',
                      minWidth: '200px',
                      textAlign: 'right',
                    }}
                  >
                    {project.qualifying_project_rd_credits_fed
                      ? costDisplay(
                          project.qualifying_project_rd_credits_fed,
                          account.currency
                        )
                      : '-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '180px',
                      maxWidth: '180px',
                      minWidth: '180px',
                      textAlign: 'right',
                    }}
                  >
                    {project.total_projects_rd_credits
                      ? costDisplay(
                          project.total_projects_rd_credits,
                          account.currency
                        )
                      : '-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '200px',
                      maxWidth: '200px',
                      minWidth: '200px',
                    }}
                  >
                    {'-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '160px',
                      maxWidth: '160px',
                      minWidth: '160px',
                    }}
                  >
                    {'-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '250px',
                      maxWidth: '250px',
                      minWidth: '250px',
                    }}
                  >
                    {'-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '120px',
                      maxWidth: '120px',
                      minWidth: '120px',
                    }}
                  >
                    {'-'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '60px',
                      minWidth: '60px',
                      maxWidth: '60px',
                      padding: '0px !important',
                      textAlign: 'center',
                    }}
                  >
                    {'-'}
                  </TableCell>
                </TableRow>
              ))}
            </>
          )}
        </Fragment>
      );
    });
};
