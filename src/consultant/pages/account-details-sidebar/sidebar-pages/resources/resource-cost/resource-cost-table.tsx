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
} from './resource-cost-type';
import React from 'react';
import { useNavigate } from "react-router-dom";
import { ResourceCostList } from "../../../../../types/resource-cost";
import { useResourceCost } from "../../../../../services/resource-cost/resource-cost-service";
import { RESOURCECOST } from "../../../../../../routes";
import ActionButton from '../../../../account-list/table/action-button';

interface ResourceCostTableProps {
  fiscalYear?: number;
  appliedFilters?: Record<string, any>;
  accountDetails?: Record<string, any>;
}

const ResourceCostTable: React.FC<ResourceCostTableProps> = ({ fiscalYear, appliedFilters, accountDetails }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<keyof ResourceCostList>('resource_cost_number');
  const [resourceCostList, setResourceCostList] = useState<ResourceCostType[]>([]);
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const { data: costList, isLoading: loading } = useResourceCost({
    page: page,
    limit: rowsPerPage,
    sortBy: orderBy,
    sortOrder: apiOrder,
    filters: appliedFilters,
    accountNumber: accountDetails?.data?.accountById?.r_number,
    fiscalYear: fiscalYear
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
          <TableRow sx={{
            '.MuiTableCell-root': {
              fontWeight: 300,
              color: '#425A76',
            }
          }}>
            <TableCell>
              {cost.resourceCostNumber}
            </TableCell>
            <TableCell>
              {cost.currency}
            </TableCell>
            <TableCell>{cost.startDate}</TableCell>
            <TableCell>{cost.endDate}</TableCell>
            <TableCell>{cost.hourlyCost ? cost.hourlyCost : '-'}</TableCell>
            <TableCell>{cost.dailyCost ? cost.dailyCost : "-"}</TableCell>
            <TableCell>{cost.biWeeklyCost ? cost.biWeeklyCost : "-"}</TableCell>
            <TableCell>{cost.weeklyCost ? cost.weeklyCost : "-"}</TableCell>
            <TableCell>{cost.monthlyCost ? cost.monthlyCost : "-"}</TableCell>
            <TableCell>{cost.semiAnnualCost ? cost.semiAnnualCost : "-"}</TableCell>
            <TableCell>{cost.annualCost ? cost.annualCost : "-"}</TableCell>
            <TableCell>
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

  return (
    <Paper sx={{ overflowX: 'scroll', boxShadow: 'none' }}>
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
              {/* <TableSortLabel
                active={orderBy === 'currency_code'}
                direction={orderBy === 'currency_code' ? order : 'asc'}
                onClick={createSortHandler('currency_code')}
              > */}
              Currency
              {/* </TableSortLabel> */}
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'effective_date'}
                direction={orderBy === 'effective_date' ? order : 'asc'}
                onClick={createSortHandler('effective_date')}
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
                active={orderBy === 'hourly_cost'}
                direction={orderBy === 'hourly_cost' ? order : 'asc'}
                onClick={createSortHandler('hourly_cost')}
              >
                Hourly
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'daily_cost'}
                direction={orderBy === 'daily_cost' ? order : 'asc'}
                onClick={createSortHandler('daily_cost')}
              >
                Daily
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'bi_weekly_cost'}
                direction={orderBy === 'bi_weekly_cost' ? order : 'asc'}
                onClick={createSortHandler('bi_weekly_cost')}
              >
                Bi-Weekly
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'weekly_cost'}
                direction={orderBy === 'weekly_cost' ? order : 'asc'}
                onClick={createSortHandler('weekly_cost')}
              >
                Weekly
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'monthly_cost'}
                direction={orderBy === 'monthly_cost' ? order : 'asc'}
                onClick={createSortHandler('monthly_cost')}
              >
                Monthly
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'semi_annual_cost'}
                direction={orderBy === 'semi_annual_cost' ? order : 'asc'}
                onClick={createSortHandler('semi_annual_cost')}
              >
                Semin Annual
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'annual_cost'}
                direction={orderBy === 'annual_cost' ? order : 'asc'}
                onClick={createSortHandler('annual_cost')}
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
