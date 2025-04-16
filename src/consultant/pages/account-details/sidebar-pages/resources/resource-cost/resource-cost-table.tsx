import {
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  convertResourceCost,
  RenderCostRowProps,
  ResourceCostType,
} from './resourceCostType';
// import { ResourceCostList } from "../../../types/resourceCost";
// import { useResourceCost } from "../../../services/resource-cost/resource-cost-service";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RESOURCECOST } from '../../../../../../routes';
import { useResourceCost } from '../../../../../services/resource-cost/resource-cost-service';
import { ResourceCostList } from '../../../../../types/resourceCost';
import ActionButton from '../../../../account-list/table/action-button';
// import { RESOURCECOST } from "../../../../routes";
// import ActionButton from "../../accounts/table/action-button";

const ResourceCostTable: React.FC<Record<string, any>> = ({
  appliedFilters,
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<keyof ResourceCostList>(
    'resource_cost_number'
  );
  const [resourceCostList, setResourceCostList] = useState<ResourceCostType[]>(
    []
  );
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const { data: costList, isLoading: loading } = useResourceCost({
    page: page,
    limit: rowsPerPage,
    sortBy: orderBy,
    sortOrder: apiOrder,
    filters: appliedFilters,
  });

  useEffect(() => {
    setResourceCostList(convertResourceCost(costList?.resourceCost || []));
  }, [costList]);

  const handleEdit = (cost: ResourceCostType) => {
    console.log('cost', cost);

    navigate(RESOURCECOST + '/edit/' + cost.resourceCostNumber, {
      state: { cost },
    });
  };

  // const handleDelete = (cost: ResourceCostType) => {
  //   console.log('Delete account', cost.resourceCostNumber);
  // };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // handles page limit change
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  const renderRows = ({ resourceCost }: RenderCostRowProps) => {
    return resourceCost?.map((cost) => {
      return (
        <React.Fragment key={cost.resourceCostNumber}>
          <TableRow
            sx={{
              '.MuiTableCell-root': {
                fontWeight: 300,
                color: '#425A76',
              },
            }}
          >
            <TableCell>{cost.resourceCostNumber}</TableCell>
            <TableCell>{cost.currency}</TableCell>
            <TableCell>{cost.startDate}</TableCell>
            <TableCell>{cost.endDate}</TableCell>
            <TableCell>
              {cost.hourlyCompensation ? cost.hourlyCompensation : '-'}
            </TableCell>
            <TableCell>
              {cost.dailyCompensation ? cost.dailyCompensation : '-'}
            </TableCell>
            <TableCell>
              {cost.biWeeklyCompensation ? cost.biWeeklyCompensation : '-'}
            </TableCell>
            <TableCell>
              {cost.weeklyCompensation ? cost.weeklyCompensation : '-'}
            </TableCell>
            <TableCell>
              {cost.monthlyCompensation ? cost.monthlyCompensation : '-'}
            </TableCell>
            <TableCell>
              {cost.semiAnnualCompensation ? cost.semiAnnualCompensation : '-'}
            </TableCell>
            <TableCell>
              {cost.annualCompensation ? cost.annualCompensation : '-'}
            </TableCell>
            <TableCell>
              <ActionButton
                onEdit={() => handleEdit(cost)}
                onDelete={() => {}}
                // onView={() => { }}
              />
            </TableCell>
          </TableRow>
        </React.Fragment>
      );
    });
  };

  return (
    <Paper sx={{ overflowX: 'auto', boxShadow: 'none' }}>
      <Table className='border border-[#E0E0E0]'>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'resource_cost_number'}
                direction={orderBy === 'resource_cost_number' ? order : 'asc'}
                onClick={createSortHandler('resource_cost_number')}
              >
                Resource Cost Number
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'currency'}
                direction={orderBy === 'currency' ? order : 'asc'}
                onClick={createSortHandler('currency')}
              >
                Currency
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'start_date'}
                direction={orderBy === 'start_date' ? order : 'asc'}
                onClick={createSortHandler('start_date')}
              >
                Start Date
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'end_date'}
                direction={orderBy === 'end_date' ? order : 'asc'}
                onClick={createSortHandler('end_date')}
              >
                End Date
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'hourly_compensation'}
                direction={orderBy === 'hourly_compensation' ? order : 'asc'}
                onClick={createSortHandler('hourly_compensation')}
              >
                Hourly
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'daily_compensation'}
                direction={orderBy === 'daily_compensation' ? order : 'asc'}
                onClick={createSortHandler('daily_compensation')}
              >
                Daily
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'bi_weekly_compensation'}
                direction={orderBy === 'bi_weekly_compensation' ? order : 'asc'}
                onClick={createSortHandler('bi_weekly_compensation')}
              >
                Bi-Weekly
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'weekly_compensation'}
                direction={orderBy === 'weekly_compensation' ? order : 'asc'}
                onClick={createSortHandler('weekly_compensation')}
              >
                Weekly
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'monthly_compensation'}
                direction={orderBy === 'monthly_compensation' ? order : 'asc'}
                onClick={createSortHandler('monthly_compensation')}
              >
                Monthly
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'semi_annual_compensation'}
                direction={
                  orderBy === 'semi_annual_compensation' ? order : 'asc'
                }
                onClick={createSortHandler('semi_annual_compensation')}
              >
                Semin Annual
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'annual_compensation'}
                direction={orderBy === 'annual_compensation' ? order : 'asc'}
                onClick={createSortHandler('annual_compensation')}
              >
                Annual
              </TableSortLabel>
            </TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={11} align='center'>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : resourceCostList?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} align='center'>
                <Typography variant='body1'>No data available</Typography>
              </TableCell>
            </TableRow>
          ) : (
            renderRows({
              resourceCost: resourceCostList || [],
            })
          )}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[25, 30, 40, 50]}
        component='div'
        count={costList?.count ?? 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default ResourceCostTable;
