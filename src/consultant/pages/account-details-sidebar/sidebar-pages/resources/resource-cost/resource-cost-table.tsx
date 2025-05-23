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
import { useNavigate } from 'react-router-dom';
import { ResourceCostList } from '../../../../../types/resource-cost';
import { useResourceCost } from '../../../../../services/resource-cost/resource-cost-service';
import { RESOURCECOST } from '../../../../../../routes';
import ActionButton from '../../../../account-list/table/action-button';
import { arrowDownIcon, arrowUpIcon } from '../../../../../../assets';
import { TablePagination } from '../../../../../../components/table';
import { formatDateToMMDDYYYY } from '../utils';
import { TruncateWithTooltip } from '../../../../../../components';

interface ResourceCostTableProps {
  fiscalYear?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appliedFilters?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accountDetails?: Record<string, any>;
  resourceRid: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  costOrder: 'asc' | 'desc';
  setCostOrder: (costOrder: 'asc' | 'desc') => void;
  costorderBy: string;
  setCostorderBy: (field: keyof ResourceCostList) => void;
  isResourceCostDeleteEnable?: boolean;
  isResourceCostEditEnable?: boolean;
}

const ResourceCostTable: React.FC<ResourceCostTableProps> = ({
  fiscalYear,
  appliedFilters,
  accountDetails,
  resourceRid,
  currentPage,
  setCurrentPage,
  costOrder,
  setCostOrder,
  costorderBy,
  setCostorderBy,
  isResourceCostDeleteEnable,
  isResourceCostEditEnable,
}) => {
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [resourceCostList, setResourceCostList] = useState<ResourceCostType[]>(
    []
  );
  const accountInActive =
    accountDetails?.data?.accountById?.status === 'inactive';
  const apiOrder = costOrder.toUpperCase() as 'ASC' | 'DESC';
  const { data: costList, isLoading: loading } = useResourceCost({
    page: currentPage + 1,
    limit: rowsPerPage,
    sortBy: costorderBy,
    sortOrder: apiOrder,
    filters: appliedFilters,
    accountNumber: accountDetails?.data?.accountById?.r_number,
    fiscalYear,
    resourceRid,
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
    setCurrentPage(newPage);
  };

  // handles page limit change
  const handleChangeRowsPerPage = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(0);
  };

  const handleRequestSort = (
    _event: React.MouseEvent<unknown>,
    property: keyof ResourceCostList
  ) => {
    const isAsc = costorderBy === property && costOrder === 'asc';
    setCostOrder(isAsc ? 'desc' : 'asc');
    setCostorderBy(property);
  };

  const createSortHandler =
    (property: keyof ResourceCostList) =>
    (event: React.MouseEvent<unknown>) => {
      handleRequestSort(event, property);
    };

  const CostDisplay = (cost: string | number) => {
    const formattedCost = Number(cost).toLocaleString('en-US', {
      minimumFractionDigits: 2,
    });
    return <>{formattedCost}</>;
  };

  const renderRows = ({ resourceCost }: RenderCostRowProps) => {
    return resourceCost?.map((cost) => {
      const startDate = formatDateToMMDDYYYY(cost.startDate as string);
      const endDate = formatDateToMMDDYYYY(cost.endDate as string);
      return (
        <React.Fragment key={cost.resourceCostNumber}>
          <TableRow
            sx={{
              '.MuiTableCell-root': {
                fontWeight: 300,
                color: '#425A76',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '140px',
              },
            }}
          >
            <TableCell
              sx={{
                minWidth: '160px',
                position: 'sticky',
                left: 0,
                background: '#fff',
                zIndex: 10,
                borderRight: '1px solid #CBD6E2 !important',
              }}
            >
              <TruncateWithTooltip text={String(cost.resourceFullName)}>
                {cost.resourceFullName || 'NA'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell sx={{ minWidth: '100px' }}>
              {cost.currency || 'NA'}
            </TableCell>
            <TableCell sx={{ minWidth: '130px' }}>
              {startDate || 'NA'}
            </TableCell>
            <TableCell sx={{ minWidth: '130px' }}>{endDate || 'NA'}</TableCell>
            <TableCell sx={{ minWidth: '130px' }}>
              <TruncateWithTooltip text={String(cost.hourlyCost)}>
                {cost.hourlyCost ? CostDisplay(cost.hourlyCost) : 'NA'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell sx={{ minWidth: '130px' }}>
              <TruncateWithTooltip text={String(cost.dailyCost)}>
                {cost.dailyCost ? CostDisplay(cost.dailyCost) : 'NA'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell sx={{ minWidth: '130px' }}>
              <TruncateWithTooltip text={String(cost.biWeeklyCost)}>
                {cost.biWeeklyCost ? CostDisplay(cost.biWeeklyCost) : 'NA'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell sx={{ minWidth: '130px' }}>
              <TruncateWithTooltip text={String(cost.weeklyCost)}>
                {cost.weeklyCost ? CostDisplay(cost.weeklyCost) : 'NA'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell sx={{ minWidth: '130px' }}>
              <TruncateWithTooltip text={String(cost.monthlyCost)}>
                {cost.monthlyCost ? CostDisplay(cost.monthlyCost) : 'NA'}
              </TruncateWithTooltip>
            </TableCell>
            {/* <TableCell sx={{ minWidth: '140px' }}>
            <TruncateWithTooltip text={String(cost.semiAnnualCost)}>
            {cost.semiAnnualCost ? CostDisplay(cost.semiAnnualCost) : 'NA'}
              </TruncateWithTooltip>
            </TableCell> */}
            <TableCell sx={{ minWidth: '130px' }}>
              <TruncateWithTooltip text={String(cost.annualCost)}>
                {cost.annualCost ? CostDisplay(cost.annualCost) : 'NA'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell sx={{ padding: '0px !important' }}>
              <ActionButton
                onEdit={() => handleEdit(cost)}
                onDelete={() => {}}
                isDisabled={accountInActive}
                deleteCustomOption={{ hide: !isResourceCostDeleteEnable }}
                editCustomOption={{ hide: !isResourceCostEditEnable }}
                // onView={() => { }}
              />
            </TableCell>
          </TableRow>
        </React.Fragment>
      );
    });
  };

  const getSortIcon =
    (
      costorderBy: string,
      columnKey: keyof ResourceCostList,
      costOrder: 'asc' | 'desc'
    ) =>
    () => {
      if (costorderBy !== columnKey) {
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
      return costOrder === 'asc' ? (
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
      );
    };

  return (
    <div>
      <Paper
        sx={{
          overflowX: 'auto',
          boxShadow: 'none',
          borderBottom: '1px solid #CBD6E2',
          borderRadius: '0px',
        }}
      >
        <Table
          sx={{
            borderCollapse: 'separate !important',
            borderSpacing: 0,
            '& .MuiTableCell-root': {
              borderBottom: '1px solid #CBD6E2',
              borderRight: '1px solid #CBD6E2',
            },
          }}
        >
          <TableHead
            sx={{
              '& .MuiTableCell-root': {
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#2A2A2A',
                padding: '0px',
                pl: 1,
                height: '50px',
              },
              '& .MuiTableCell-root:last-child': {
                borderRight: 'none',
              },
              '& .MuiTableSortLabel-root': {
                '&:hover': {
                  color: 'inherit',
                  cursor: 'auto',
                },
              },
            }}
          >
            <TableRow>
              <TableCell
                sx={{
                  minWidth: '160px',
                  position: 'sticky',
                  left: 0,
                  background: '#fff',
                  zIndex: 8,
                  borderRight: '1px solid #CBD6E2 !important',
                }}
              >
                Name
                {/* <TableSortLabel
                  active={costorderBy === 'resource_fullname'}
                  direction={costorderBy === 'resource_fullname' ? costOrder : 'asc'}
                  IconComponent={getSortIcon(costorderBy, 'resource_fullname', costOrder)}
                >
                  
                </TableSortLabel> */}
              </TableCell>
              <TableCell sx={{ minWidth: '100px' }}>
                <TableSortLabel
                  active={costorderBy === 'currency'}
                  direction={costorderBy === 'currency' ? costOrder : 'asc'}
                  IconComponent={getSortIcon(
                    costorderBy,
                    'currency',
                    costOrder
                  )}
                >
                  Currency
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={costorderBy === 'effective_date'}
                  direction={
                    costorderBy === 'effective_date' ? costOrder : 'asc'
                  }
                  IconComponent={getSortIcon(
                    costorderBy,
                    'effective_date',
                    costOrder
                  )}
                >
                  Start Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={costorderBy === 'end_date'}
                  direction={costorderBy === 'end_date' ? costOrder : 'asc'}
                  IconComponent={getSortIcon(
                    costorderBy,
                    'end_date',
                    costOrder
                  )}
                >
                  End Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={costorderBy === 'hourly_cost'}
                  direction={costorderBy === 'hourly_cost' ? costOrder : 'asc'}
                  IconComponent={getSortIcon(
                    costorderBy,
                    'hourly_cost',
                    costOrder
                  )}
                >
                  Hourly
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={costorderBy === 'daily_cost'}
                  direction={costorderBy === 'daily_cost' ? costOrder : 'asc'}
                  IconComponent={getSortIcon(
                    costorderBy,
                    'daily_cost',
                    costOrder
                  )}
                >
                  Daily
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={costorderBy === 'bi_weekly_cost'}
                  direction={
                    costorderBy === 'bi_weekly_cost' ? costOrder : 'asc'
                  }
                  IconComponent={getSortIcon(
                    costorderBy,
                    'bi_weekly_cost',
                    costOrder
                  )}
                >
                  Bi-Weekly
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={costorderBy === 'weekly_cost'}
                  direction={costorderBy === 'weekly_cost' ? costOrder : 'asc'}
                  IconComponent={getSortIcon(
                    costorderBy,
                    'weekly_cost',
                    costOrder
                  )}
                >
                  Weekly
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={costorderBy === 'monthly_cost'}
                  direction={costorderBy === 'monthly_cost' ? costOrder : 'asc'}
                  IconComponent={getSortIcon(
                    costorderBy,
                    'monthly_cost',
                    costOrder
                  )}
                >
                  Monthly
                </TableSortLabel>
              </TableCell>
              {/* <TableCell sx={{ minWidth: '140px' }}>
                <TableSortLabel
                  active={costorderBy === 'semi_annual_cost'}
                  direction={
                    costorderBy === 'semi_annual_cost' ? costOrder : 'asc'
                  }
                  IconComponent={getSortIcon(
                    costorderBy,
                    'semi_annual_cost',
                    costOrder
                  )}
                >
                  Semi Annual
                </TableSortLabel>
              </TableCell> */}
              <TableCell sx={{ minWidth: '130px' }}>
                <TableSortLabel
                  active={costorderBy === 'annual_cost'}
                  direction={costorderBy === 'annual_cost' ? costOrder : 'asc'}
                  IconComponent={getSortIcon(
                    costorderBy,
                    'annual_cost',
                    costOrder
                  )}
                >
                  Annual
                </TableSortLabel>
              </TableCell>
              <TableCell
                sx={{
                  minWidth: '80px',
                }}
              >
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody
            sx={{
              '& .MuiTableCell-root': {
                fontWeight: 300,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#425A76',
                padding: '0px',
                pl: 1,
                minHeight: '42px',
                maxHeight: '42px',
                height: '42px',
              },
              '& .MuiTableCell-root:last-child': {
                borderRight: 'none',
              },
            }}
          >
            {loading ? (
              <TableRow style={{ height: '300px' }}>
                <TableCell colSpan={11} align='center'>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : resourceCostList?.length === 0 ? (
              <TableRow style={{ height: loading ? '300px' : 'auto' }}>
                <TableCell colSpan={11} align='center'>
                  <Typography variant='body1'>
                    No cost information found
                  </Typography>
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
        rowsPerPageOptions={[25, 30, 40, 50, 100]}
        // component='div'
        count={costList?.count ?? 0}
        rowsPerPage={rowsPerPage}
        page={currentPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default ResourceCostTable;
