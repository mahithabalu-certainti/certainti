import {
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  // TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  convertResourceCost,
  RenderCostRowProps,
  ResourceCostType,
} from './resource-cost-type';
import React from 'react';
import { useNavigate } from "react-router-dom";
import { ResourceCostList } from "../../../../../types/resource-cost";
import { useResourceCost } from "../../../../../services/resource-cost/resource-cost-service";
import { RESOURCECOST } from "../../../../../../routes";
import ActionButton from '../../../../account-list/table/action-button';
import { arrowDownIcon, arrowUpIcon } from '../../../../../../assets';
import { TablePagination } from '../../../../../../components/table';

interface ResourceCostTableProps {
  fiscalYear?: number;
  appliedFilters?: Record<string, any>;
  accountDetails?: Record<string, any>;
  resourceRid: string;
}

const ResourceCostTable: React.FC<ResourceCostTableProps> = ({ fiscalYear, appliedFilters, accountDetails, resourceRid }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<keyof ResourceCostList>('created_datetime');
  const [resourceCostList, setResourceCostList] = useState<ResourceCostType[]>([]);
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const { data: costList, isLoading: loading } = useResourceCost({
    page: page,
    limit: rowsPerPage,
    sortBy: orderBy,
    sortOrder: apiOrder,
    filters: appliedFilters,
    accountNumber: accountDetails?.data?.accountById?.r_number,
    fiscalYear,
    resourceRid
  });

  useEffect(() => {
    setResourceCostList(convertResourceCost(costList?.resourceCost || []));
  }, [costList]);

  const handleEdit = (cost: ResourceCostType) => {
    navigate(RESOURCECOST + '/edit/' + cost.resourceCostNumber, {
      state: { ...accountDetails, costInfo: cost, cost: true },
    });
  };

  // const handleDelete = (cost: ResourceCostType) => {
  //   console.log('Delete account', cost.resourceCostNumber);
  // };

  const handleChangePage = (newPage: number) => {
    setPage(newPage + 1);
  };

  // handles page limit change
  const handleChangeRowsPerPage = (newPageSize: number) => {
    setRowsPerPage(newPageSize)
    setPage(1);
  };

  const handleRequestSort = (
    _event: React.MouseEvent<unknown>,
    property: keyof ResourceCostList
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler =
    (property: keyof ResourceCostList) =>
      (event: React.MouseEvent<unknown>) => {
        handleRequestSort(event, property);
      };

  const CostDisplay = (cost: string | number) => {
    const formattedCost = Number(cost).toLocaleString('en-US', { minimumFractionDigits: 2 });
    return <>{formattedCost}</>;
  }

  const renderRows = ({ resourceCost }: RenderCostRowProps) => {
    return resourceCost?.map((cost) => {
      return (
        <React.Fragment key={cost.resourceCostNumber}>
          <TableRow sx={{
            '.MuiTableCell-root': {
              fontWeight: 300,
              color: '#425A76',
              borderRight: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '140px',
            }
          }}>
            <TableCell sx={{ minWidth: '160px' }}>
              {cost.resourceFullName}
            </TableCell>
            <TableCell sx={{ minWidth: '100px' }}>
              {cost.currency}
            </TableCell>
            <TableCell sx={{ minWidth: '130px' }}>{cost.startDate}</TableCell>
            <TableCell sx={{ minWidth: '130px' }}>{cost.endDate}</TableCell>
            <TableCell sx={{ minWidth: '130px' }}>{cost.hourlyCost ? CostDisplay(cost.hourlyCost) : '-'}</TableCell>
            <TableCell sx={{ minWidth: '130px' }}>{cost.dailyCost ? CostDisplay(cost.dailyCost) : "-"}</TableCell>
            <TableCell sx={{ minWidth: '130px' }}>{cost.biWeeklyCost ? CostDisplay(cost.biWeeklyCost) : "-"}</TableCell>
            <TableCell sx={{ minWidth: '130px' }}>{cost.weeklyCost ? CostDisplay(cost.weeklyCost) : "-"}</TableCell>
            <TableCell sx={{ minWidth: '130px' }}>{cost.monthlyCost ? CostDisplay(cost.monthlyCost) : "-"}</TableCell>
            <TableCell sx={{ minWidth: '140px' }}>{cost.semiAnnualCost ? CostDisplay(cost.semiAnnualCost) : "-"}</TableCell>
            <TableCell sx={{ minWidth: '130px' }}>{cost.annualCost ? CostDisplay(cost.annualCost) : "-"}</TableCell>
            <TableCell sx={{ minWidth: '80px' }}>
              <ActionButton
                onEdit={() => handleEdit(cost)}
                onDelete={() => { }}
              // onView={() => { }}
              />
            </TableCell>
          </TableRow>
        </React.Fragment>
      );
    });
  };

  const getSortIcon =
    (orderBy: string, columnKey: keyof ResourceCostList, order: 'asc' | 'desc') => () => {

      if (orderBy !== columnKey) {
        return (
          <div
            className='inline-flex flex-col justify-center items-center pl-0.5 cursor-pointer mt-0.5'
            onClick={createSortHandler(columnKey)}
          >
            <img
              src={arrowUpIcon}
              alt='sort-up'
              className='w-4 h-4 filter grayscale brightness-0 opacity-50'
            />
            <img
              src={arrowDownIcon}
              alt='sort-down'
              className='w-4 h-4 filter grayscale brightness-0 opacity-50 mt-[-9px]'
            />
          </div>
        );
      }
      return order === 'asc' ? (
        <div
          className='inline-flex flex-col justify-center items-center pl-0.5 cursor-pointer mt-0.5'
          onClick={createSortHandler(columnKey)}
        >
          <img
            src={arrowUpIcon}
            alt='sort-up-active'
            className='w-4 h-4'
            style={{
              filter: 'brightness(0) saturate(100%)',
            }}
          />
          <img
            src={arrowDownIcon}
            alt='sort-down-inactive'
            className='w-4 h-4 filter grayscale brightness-0 opacity-50 mt-[-9px]'
          />
        </div>
      ) : (
        <div
          className='inline-flex flex-col justify-center items-center pl-0.5 cursor-pointer mt-0.5'
          onClick={createSortHandler(columnKey)}
        >
          <img
            src={arrowUpIcon}
            alt='sort-up-inactive'
            className='w-4 h-4 filter grayscale brightness-0 opacity-50'
          />
          <img
            src={arrowDownIcon}
            alt='sort-down-active'
            className='w-4 h-4 mt-[-9px]'
            style={{
              filter: 'brightness(0) saturate(100%)',
            }}
          />
        </div>
      )
    };

  return (
    <div className='border border-[#CBD6E2]'>
      <Paper sx={{ overflowX: 'scroll', boxShadow: 'none', borderBottom: '1px solid #CBD6E2', borderRadius: '0px' }}>
        <Table sx={{
          borderCollapse: 'collapse',
          '& .MuiTableCell-root': {
            borderBottom: '1px solid #CBD6E2',
          },
        }}>
          <TableHead sx={{
            '& .MuiTableCell-root': {
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '21px',
              color: '#2A2A2A',
              padding: '0px',
              pl: 1,
              height: '50px',
              borderRight: 'none',
              bgcolor: '#FCFCFC',
            },
            '& .MuiTableSortLabel-root': {
              '&:hover': {
                color: 'inherit',
                cursor: 'auto',
              },
            }
          }}>
            <TableRow>
              <TableCell sx={{ minWidth: '160px' }}>
                <TableSortLabel
                  active={orderBy === 'resource_fullname'}
                  direction={orderBy === 'resource_fullname' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'resource_fullname', order)}
                // onClick={createSortHandler('resource_cost_number')}
                >
                  Resource Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '100px' }}>
                <TableSortLabel
                  active={orderBy === 'currency'}
                  direction={orderBy === 'currency' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'currency', order)}
                >
                  Currency
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={orderBy === 'effective_date'}
                  direction={orderBy === 'effective_date' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'effective_date', order)}
                >
                  Start Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={orderBy === 'end_date'}
                  direction={orderBy === 'end_date' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'end_date', order)}
                >
                  End Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={orderBy === 'hourly_cost'}
                  direction={orderBy === 'hourly_cost' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'hourly_cost', order)}
                >
                  Hourly
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={orderBy === 'daily_cost'}
                  direction={orderBy === 'daily_cost' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'daily_cost', order)}
                >
                  Daily
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={orderBy === 'bi_weekly_cost'}
                  direction={orderBy === 'bi_weekly_cost' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'bi_weekly_cost', order)}
                >
                  Bi-Weekly
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={orderBy === 'weekly_cost'}
                  direction={orderBy === 'weekly_cost' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'weekly_cost', order)}
                >
                  Weekly
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={orderBy === 'monthly_cost'}
                  direction={orderBy === 'monthly_cost' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'monthly_cost', order)}
                >
                  Monthly
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '140px' }}>
                <TableSortLabel
                  active={orderBy === 'semi_annual_cost'}
                  direction={orderBy === 'semi_annual_cost' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'semi_annual_cost', order)}
                >
                  Semi Annual
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={orderBy === 'annual_cost'}
                  direction={orderBy === 'annual_cost' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'annual_cost', order)}
                >
                  Annual
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '80px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{
            '& .MuiTableCell-root': {
              fontWeight: 300,
              fontSize: '14px',
              lineHeight: '21px',
              color: '#425A76',
              padding: '0px',
              pl: 1,
              minHeight: '42px',
              maxHeight: '42px',
              borderRight: 'none',
              height: '42px',
            },
          }}>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align='center'>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : resourceCostList?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align='center'>
                  <Typography variant='body1'>No cost information found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              renderRows({
                resourceCost: resourceCostList || [],
              })
            )}
          </TableBody>
        </Table>
      </Paper>
      <TablePagination
        rowsPerPageOptions={[25, 30, 40, 50]}
        // component='div'
        count={costList?.count ?? 0}
        rowsPerPage={rowsPerPage}
        page={(page ?? 1) - 1}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>

  );
};

export default ResourceCostTable;
