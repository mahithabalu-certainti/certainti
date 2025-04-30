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

import { useEffect, useState } from "react";
import React from 'react';
import { useNavigate } from "react-router-dom";
import { convertResourceSkill, RenderSkillRowProps, ResourceSkillType } from "./resource-skill-type";
import { ResourceSkillList } from "../../../../../types/resource-skill";
import { useResourceSkill } from "../../../../../services/resource-skill/resource-skill-service";
import { RESOURCESKILL } from "../../../../../../routes";
import ActionButton from '../../../../account-list/table/action-button';
import { TablePagination } from '../../../../../../components/table';
import { arrowDownIcon, arrowUpIcon } from '../../../../../../assets';
import { formatDateToMMDDYYYY } from '../utils';

const ResourceSkillTable: React.FC<Record<string, any>> = ({ fiscalYear, appliedFilters, accountDetails, resourceRid }) => {
  const navigate = useNavigate();
  // const location = useLocation();
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<keyof ResourceSkillList>('created_datetime');
  const [resourceSkillList, setResourceSkillList] = useState<ResourceSkillType[]>([]);
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const { data: skillList, isLoading: loading } = useResourceSkill({
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
    setResourceSkillList(convertResourceSkill(skillList?.resourceSkill || []));
  }, [skillList]);

  const handleEdit = (skill: ResourceSkillType) => {
    navigate(RESOURCESKILL + '/edit/' + skill.resourceRID, {
      state: { ...accountDetails, skillInfo: skill, skill: true },
    });
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage + 1);
  };

  // handles page limit change
  const handleChangeRowsPerPage = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setPage(1);
  };

  const handleRequestSort = (
    _event: React.MouseEvent<unknown>,
    property: keyof ResourceSkillList
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler =
    (property: keyof ResourceSkillList) => (event: React.MouseEvent<unknown>) => {
      handleRequestSort(event, property);
    };

  const renderRows = ({ resourceSkill }: RenderSkillRowProps) => {
    return resourceSkill?.map((skill, i) => {
      const startDate = formatDateToMMDDYYYY(skill.startDate as string);
      return (
        <React.Fragment key={i}>
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
              '& .MuiTableCell-root:last-child': {
                borderRight: 'none',
              },
            }}
          >
            {/* <TableCell sx={{ minWidth: '200px' }}>{skill.resourceRole}</TableCell> */}
            <TableCell sx={{ minWidth: '120px' }}>{startDate}</TableCell>
            <TableCell sx={{ minWidth: '140px' }}>{skill.skillName}</TableCell>
            <TableCell sx={{ minWidth: '120px' }}>{skill.skillLevel}</TableCell>
            <TableCell sx={{ minWidth: '160px' }}>{skill.yearsOfExperience}</TableCell>
            <TableCell sx={{ minWidth: '80px' }}>
              <ActionButton
                onEdit={() => handleEdit(skill)}
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
    (orderBy: string, columnKey: keyof ResourceSkillList, order: 'asc' | 'desc') => () => {

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
    <div>
      <Paper sx={{ overflowX: 'auto', boxShadow: 'none', borderRadius: '0px' }}>
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
            },
            '& .MuiTableCell-root:last-child': {
                borderRight: 'none',
              },
            '& .MuiTableSortLabel-root': {
              '&:hover': {
                color: 'inherit',
                cursor: 'auto',
              },
            }
          }}>
            <TableRow>
              {/* <TableCell sx={{ minWidth: '200px' }}>
                <TableSortLabel
                  active={orderBy === 'resource_role'}
                  direction={orderBy === 'resource_role' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'resource_role', order)}
                >
                  Resource Role
                </TableSortLabel>
              </TableCell> */}
              <TableCell sx={{ minWidth: '120px' }}>
                <TableSortLabel
                  active={orderBy === 'start_date'}
                  direction={orderBy === 'start_date' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'start_date', order)}
                >
                  Start Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '140px' }}>
                <TableSortLabel
                  active={orderBy === 'skill_name'}
                  direction={orderBy === 'skill_name' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'skill_name', order)}
                >
                  Skill Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '120px' }}>
                <TableSortLabel
                  active={orderBy === 'skill_level'}
                  direction={orderBy === 'skill_level' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'skill_level', order)}
                >
                  Skill Level
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '160px' }}>
                <TableSortLabel
                  active={orderBy === 'years_of_experience'}
                  direction={orderBy === 'years_of_experience' ? order : 'asc'}
                  IconComponent={getSortIcon(orderBy, 'years_of_experience', order)}
                >
                  Years of Experience
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: '80px' }}>Action</TableCell>
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
              height: '42px',
            },
          }}>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align='center'>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : resourceSkillList?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align='center'>
                  <Typography variant='body1'>No skill information found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              renderRows({
                resourceSkill: resourceSkillList || [],
                // handleEdit,
                // handleDelete,
              })
            )}
          </TableBody>
        </Table>
      </Paper>
      <TablePagination
        rowsPerPageOptions={[25, 30, 40, 50]}
        count={skillList?.count ?? 0}
        rowsPerPage={rowsPerPage}
        page={(page ?? 1) - 1}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default ResourceSkillTable;
