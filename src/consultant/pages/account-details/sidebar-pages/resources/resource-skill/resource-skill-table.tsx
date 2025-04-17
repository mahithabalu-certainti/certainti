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

import { useEffect, useState } from "react";
import React from 'react';
import { useNavigate } from "react-router-dom";
import { convertResourceSkill, RenderSkillRowProps, ResourceSkillType } from "./resource-skill-type";
import { ResourceSkillList } from "../../../../../types/resource-skill";
import { useResourceSkill } from "../../../../../services/resource-skill/resource-skill-service";
import { RESOURCESKILL } from "../../../../../../routes";
import ActionButton from '../../../../account-list/table/action-button';

const ResourceSkillTable: React.FC<Record<string, any>> = ({ appliedFilters, accountDetails }) => {
  const navigate = useNavigate();
  // const location = useLocation();
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<keyof ResourceSkillList>('resource_desc');
  const [resourceSkillList, setResourceSkillList] = useState<ResourceSkillType[]>([]);
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const { data: skillList, isLoading: loading } = useResourceSkill({
    page: page,
    limit: rowsPerPage,
    sortBy: orderBy,
    sortOrder: apiOrder,
    filters: appliedFilters,
    accountNumber: accountDetails?.accountById?.r_number
  });

  useEffect(() => {
    setResourceSkillList(convertResourceSkill(skillList?.resourceSkill || []));
  }, [skillList]);

  const handleEdit = (skill: ResourceSkillType) => {
    navigate(RESOURCESKILL + '/edit/' + skill.resourceRID, {
      state: { skillInfo: skill, skill: true },
    });
  };

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
      return (
        <React.Fragment key={i}>
          <TableRow
            sx={{
              '.MuiTableCell-root': {
                fontWeight: 300,
                color: '#425A76',
              },
            }}
          >
            <TableCell>{skill.resourceRole}</TableCell>
            <TableCell>{skill.startDate}</TableCell>
            <TableCell>{skill.skillName}</TableCell>
            <TableCell>{skill.skillLevel}</TableCell>
            <TableCell>{skill.yearsOfExperience}</TableCell>
            <TableCell>
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

  return (
    <Paper sx={{ overflowX: 'auto', boxShadow: 'none' }}>
      <Table className='border border-[#E0E0E0]'>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'resource_desc'}
                direction={orderBy === 'resource_desc' ? order : 'asc'}
                onClick={createSortHandler('resource_desc')}
              >
                Resource Role
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
                active={orderBy === 'skill_name'}
                direction={orderBy === 'skill_name' ? order : 'asc'}
                onClick={createSortHandler('skill_name')}
              >
                Skill Name
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'skill_level'}
                direction={orderBy === 'skill_level' ? order : 'asc'}
                onClick={createSortHandler('skill_level')}
              >
                Skill Level
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'years_of_experience'}
                direction={orderBy === 'years_of_experience' ? order : 'asc'}
                onClick={createSortHandler('years_of_experience')}
              >
                Years of Experience
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
          ) : resourceSkillList?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} align='center'>
                <Typography variant='body1'>No data available</Typography>
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
      <TablePagination
        rowsPerPageOptions={[25, 30, 40, 50]}
        component='div'
        count={skillList?.count ?? 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default ResourceSkillTable;
