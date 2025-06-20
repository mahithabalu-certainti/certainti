import { Box, Checkbox, IconButton, TableCell, TableRow } from '@mui/material';
import React, { Fragment, Suspense } from 'react';
import { ArrowDownIcon, ChildAccountIcon } from '../../../../assets';
import { Account, ConvertedAccount } from '../../../types';
import ActionButton from './action-button';
import { TruncateWithTooltip } from '../../../../components';
import { costDisplay } from '../../../../common-utils';

// const formatNumberWithCommas = (num: number | string): string => {
//   if (num) {
//     if (typeof num === 'string') {
//       num = parseFloat(num);
//     }
//     return num.toLocaleString('en-US');
//   }
//   return '-';
// };

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
          <TableCell
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
          >
            {hasChildren ? ( // Only show the icon if there are children
              <IconButton
                aria-label='expand row'
                size='small'
                disableRipple
                className='!p-0 !pr-1'
                onClick={() => handleRowClick(account.accountId)}
              >
                {openRows.has(account.accountId) ? (
                  <ArrowDownIcon
                    alt='arrowUp'
                    style={{
                      filter:
                        'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
                    }}
                    className='h-[18px] w-[18px] mb-1'
                  />
                ) : (
                  <ArrowDownIcon
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
            ) : (
              <div className='h-[10px] w-[22px] inline-flex'></div>
            )}
            <TruncateWithTooltip
              text={String(account.accountName)}
              maxWidth={200}
              className={`inline-flex items-center rounded-[4px] text-[14px] px-2 font-semibold h-[26px] cursor-pointer group-hover:underline`}
              style={{
                background: `linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)), ${account.bgColor}`,
                color: account.color,
              }}
            >
              <span onClick={() => handleAccountNameClick(account)}>
                {account.accountName || '-'}
              </span>
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ width: '200px', maxWidth: '200px', minWidth: '200px' }}
          >
            <TruncateWithTooltip text={String(account.industry)} maxWidth={200}>
              {account.industry || '-'}
            </TruncateWithTooltip>
          </TableCell>
          <TableCell
            sx={{ width: '150px', maxWidth: '150px', minWidth: '150px' }}
          >
            <TruncateWithTooltip text={String(account.country)} maxWidth={150}>
              {account.country || '-'}
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
              text={String(account.totalProjectHours)}
              maxWidth={180}
            >
              {account.totalProjectHours}
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
            sx={{ width: '160px', maxWidth: '160px', minWidth: '160px' }}
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
}: RenderChildRowsProps) => {
  return accounts
    ?.filter((account) => account.parentAccount === parentAccount)
    ?.map((account) => {
      const globalIndex = accounts.findIndex(
        (acc) => acc.accountName === account.accountName
      );
      const hasProjects =
        account.projectsByYear && account.projectsByYear.length > 0;
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
              <Box className='inline-flex items-center gap-1 ml-[15px]'>
                {hasProjects ? (
                  <IconButton
                    aria-label='expand projects'
                    size='small'
                    disableRipple
                    className='!p-0 !mr-0'
                    onClick={() => handleChildRowClick(account.accountId)}
                  >
                    {openChildRows.has(account.accountId) ? (
                      <ArrowDownIcon
                        alt='arrowUp'
                        style={{
                          filter:
                            'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
                        }}
                        className='h-[18px] w-[18px]'
                      />
                    ) : (
                      <ArrowDownIcon
                        alt='arrowDown'
                        style={{
                          transform: 'rotate(-90deg)',
                          filter:
                            'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
                        }}
                        className='h-[18px] w-[18px]'
                      />
                    )}
                  </IconButton>
                ) : (
                  <div className='w-[18px] h-[18px]'></div>
                )}
                <div className='flex items-center justify-center w-[18px] h-[17px] bg-[#425A76] rounded-[4px]'>
                  <ChildAccountIcon
                    alt='childAccountIcon'
                    className='w-[9px] h-[10px]'
                  />
                </div>
                <TruncateWithTooltip
                  text={String(account.accountName)}
                  maxWidth={155}
                  className={`text-[13px] font-semibold cursor-pointer underline text-[#1755E7]`}
                >
                  <span onClick={() => handleAccountNameClick(account)}>
                    {account.accountName || '-'}
                  </span>
                </TruncateWithTooltip>
              </Box>
            </TableCell>
            <TableCell
              sx={{ width: '200px', maxWidth: '200px', minWidth: '200px' }}
            >
              <TruncateWithTooltip
                text={String(account.industry)}
                maxWidth={200}
              >
                {account.industry || '-'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell
              sx={{ width: '150px', maxWidth: '150px', minWidth: '150px' }}
            >
              <TruncateWithTooltip
                text={String(account.country)}
                maxWidth={150}
              >
                {account.country || '-'}
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
                text={String(account.totalProjectHours)}
                maxWidth={180}
              >
                {account.totalProjectHours}
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
              sx={{ width: '160px', maxWidth: '160px', minWidth: '160px' }}
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
                    {project.total_project_hours || '-'}
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
                      width: '160px',
                      maxWidth: '160px',
                      minWidth: '160px',
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
                    }}
                  >
                    <ActionButton
                      onEdit={() => handleEdit(account)}
                      onDelete={() => handleDelete(account)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </>
          )}
        </Fragment>
      );
    });
};
