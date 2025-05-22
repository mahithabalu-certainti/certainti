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
import { TruncateWithTooltip } from '../../../../../../components';
import { formatDateToMMDDYYYY } from '../utils';

interface ResourceSkillTableProps {
  fiscalYear?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appliedFilters?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accountDetails?: Record<string, any>;
  resourceRid: string;
  skillOrder: 'asc' | 'desc';
  setSkillOrder: (skillOrder: 'asc' | 'desc') => void;
  skillOrderBy: string;
  setSkillOrderBy: (field: keyof ResourceSkillList) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}
const ResourceSkillTable: React.FC<ResourceSkillTableProps> = ({
  appliedFilters,
  accountDetails,
  resourceRid, currentPage, setCurrentPage,
  skillOrder,
  setSkillOrder,
  skillOrderBy,
  setSkillOrderBy,
}) => {
  const navigate = useNavigate();
  // const location = useLocation();
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [resourceSkillList, setResourceSkillList] = useState<
  ResourceSkillType[]
  >([]);
  const accountInActive = accountDetails?.data?.accountById?.status === "inactive";
  const apiOrder = skillOrder.toUpperCase() as 'ASC' | 'DESC';
  const { data: skillList, isLoading: loading } = useResourceSkill({
    page: currentPage+1,
    limit: rowsPerPage,
    sortBy: skillOrderBy,
    sortOrder: apiOrder,
    filters: appliedFilters,
    accountNumber: accountDetails?.data?.accountById?.r_number,
    resourceRid,
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
    setCurrentPage(newPage);
  };

  // handles page limit change
  const handleChangeRowsPerPage = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(0);
  };

  const handleRequestSort = (
    _event: React.MouseEvent<unknown>,
    property: keyof ResourceSkillList
  ) => {
    const isAsc = skillOrderBy === property && skillOrder === 'asc';
    setSkillOrder(isAsc ? 'desc' : 'asc');
    setSkillOrderBy(property);
  };

  const createSortHandler =
    (property: keyof ResourceSkillList) =>
    (event: React.MouseEvent<unknown>) => {
      handleRequestSort(event, property);
    };
  const renderRows = ({ resourceSkill }: RenderSkillRowProps) => {
    return resourceSkill?.map((skill, i) => {
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
            <TableCell sx={{ width: '15%', maxWidth: '15%', minWidth: '15%' }}>
           { formatDateToMMDDYYYY(skill.startDate as string) || 'NA'}
             </TableCell>
            <TableCell sx={{ width: '20%', maxWidth: '20%', minWidth: '20%' }}>
              <TruncateWithTooltip text={String(skill.skillType)}>
                {skill.skillType || 'NA'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell sx={{ width: '20%', maxWidth: '20%', minWidth: '20%' }}>
              <TruncateWithTooltip text={String(skill.skillSubType)}>
                {skill.skillSubType || 'NA'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell sx={{ width: '20%', maxWidth: '20%', minWidth: '20%' }}>
              <TruncateWithTooltip text={String(skill.skillDetails)}>
                {skill.skillDetails || 'NA'}
              </TruncateWithTooltip>
            </TableCell>
            <TableCell sx={{ width: '15%', maxWidth: '15%', minWidth: '15%' }}>{skill.skillLevel || 'NA'}</TableCell>
            <TableCell sx={{ width: '10%', maxWidth: '10%', minWidth: '10%', padding: '0px !important' }}>
              <ActionButton
                onEdit={() => handleEdit(skill)}
                onDelete={() => {}}
                isDisabled={accountInActive}
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
      skillOrderBy: string,
      columnKey: keyof ResourceSkillList,
      skillOrder: 'asc' | 'desc'
    ) =>
    () => {
      if (skillOrderBy !== columnKey) {
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
      return skillOrder === 'asc' ? (
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
      <Paper sx={{ overflowX: 'auto', boxShadow: 'none', borderRadius: '0px' }}>
        <Table
          sx={{
            tableLayout: 'fixed',
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
              {/* <TableCell sx={{ minWidth: '200px' }}>
                <TableSortLabel
                  active={skillOrderBy === 'resource_role'}
                  direction={skillOrderBy === 'resource_role' ? skillOrder : 'asc'}
                  IconComponent={getSortIcon(skillOrderBy, 'resource_role', skillOrder)}
                >
                  Resource Role
                </TableSortLabel>
              </TableCell> */}
              <TableCell sx={{ width: '15%', maxWidth: '15%', minWidth: '15%' }}>
                <TableSortLabel
                  active={skillOrderBy === 'start_date'}
                  direction={skillOrderBy === 'start_date' ? skillOrder : 'asc'}
                  IconComponent={getSortIcon(
                    skillOrderBy,
                    'start_date',
                    skillOrder
                  )}
                >
                  Start Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: '20%', maxWidth: '20%', minWidth: '20%' }}>
                <TableSortLabel
                  active={skillOrderBy === 'skill_type'}
                  direction={skillOrderBy === 'skill_type' ? skillOrder : 'asc'}
                  IconComponent={getSortIcon(
                    skillOrderBy,
                    'skill_type_name',
                    skillOrder
                  )}
                >
                  Skill Type
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: '20%', maxWidth: '20%', minWidth: '20%' }}>
                <TableSortLabel
                  active={skillOrderBy === 'skill_sub_type'}
                  direction={skillOrderBy === 'skill_sub_type' ? skillOrder : 'asc'}
                  IconComponent={getSortIcon(
                    skillOrderBy,
                    'skill_subtype_name',
                    skillOrder
                  )}
                >
                  Skill SubType
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: '20%', maxWidth: '20%', minWidth: '20%' }}>
                <TableSortLabel
                  active={skillOrderBy === 'skill_details'}
                  direction={skillOrderBy === 'skill_details' ? skillOrder : 'asc'}
                  IconComponent={getSortIcon(
                    skillOrderBy,
                    'skill_details',
                    skillOrder
                  )}
                >
                  Skill Details
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: '15%', maxWidth: '15%', minWidth: '15%' }}>
                <TableSortLabel
                  active={skillOrderBy === 'skill_level'}
                  direction={
                    skillOrderBy === 'skill_level' ? skillOrder : 'asc'
                  }
                  IconComponent={getSortIcon(
                    skillOrderBy,
                    'skill_level',
                    skillOrder
                  )}
                >
                  Skill Level
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: '10%', maxWidth: '10%', minWidth: '10%' }}
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
            }}
          >
            {loading ? (
              <TableRow style={{ height:'300px' }}>
                <TableCell colSpan={11} align='center'>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : resourceSkillList?.length === 0 ? (
              <TableRow style={{ height: loading ? '300px' : "auto" }}>
                <TableCell colSpan={11} align='center'>
                  <Typography variant='body1'>
                    No skill information found
                  </Typography>
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
        rowsPerPageOptions={[25, 30, 40, 50, 100]}
        count={skillList?.count ?? 0}
        rowsPerPage={rowsPerPage}
        page={currentPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default ResourceSkillTable;
