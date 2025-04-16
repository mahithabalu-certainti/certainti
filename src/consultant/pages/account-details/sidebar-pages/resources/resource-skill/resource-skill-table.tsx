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

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RESOURCESKILL } from '../../../../../../routes';
import { useResourceSkill } from '../../../../../services/resource-skill/resource-skill-service';
import { ResourceSkillList } from '../../../../../types/resourceSkill';
import ActionButton from '../../../../account-list/table/action-button';
import {
  convertResourceSkill,
  RenderSkillRowProps,
  ResourceSkillType,
} from './resourceSkillType';

const ResourceSkillTable: React.FC<Record<string, any>> = ({
  appliedFilters,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] =
    useState<keyof ResourceSkillList>('resourceRole');
  const [resourceSkillList, setResourceSkillList] = useState<
    ResourceSkillType[]
  >([]);
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const { data: skillList, isLoading: loading } = useResourceSkill({
    page: page,
    limit: rowsPerPage,
    sortBy: orderBy,
    sortOrder: apiOrder,
    filters: appliedFilters,
  });

  console.log('location', location.state);

  useEffect(() => {
    setResourceSkillList(convertResourceSkill(skillList?.resourceSkill || []));
  }, [skillList]);

  const handleEdit = (skill: ResourceSkillType) => {
    navigate(RESOURCESKILL + '/edit/' + 1, {
      state: { skill },
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
    property: keyof ResourceSkillType
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler =
    (property: keyof ResourceSkillType) =>
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
                active={orderBy === 'resourceRole'}
                direction={orderBy === 'resourceRole' ? order : 'asc'}
                onClick={createSortHandler('resourceRole')}
              >
                Resource Role
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'startDate'}
                direction={orderBy === 'startDate' ? order : 'asc'}
                onClick={createSortHandler('startDate')}
              >
                Start Date
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'skillName'}
                direction={orderBy === 'skillName' ? order : 'asc'}
                onClick={createSortHandler('skillName')}
              >
                Skill Name
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'skillLevel'}
                direction={orderBy === 'skillLevel' ? order : 'asc'}
                onClick={createSortHandler('skillLevel')}
              >
                Skill Level
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'yearsOfExperience'}
                direction={orderBy === 'yearsOfExperience' ? order : 'asc'}
                onClick={createSortHandler('yearsOfExperience')}
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
