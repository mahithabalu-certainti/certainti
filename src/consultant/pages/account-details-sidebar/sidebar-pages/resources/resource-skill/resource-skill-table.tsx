/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { convertResourceSkill } from './resource-skill-type';
import { ResourceSkillList } from '../../../../../types/resource-skill';
import { useResourceSkill } from '../../../../../services/resource-skill/resource-skill-service';
import { RESOURCESKILL } from '../../../../../../routes';
import { ListTable } from '../../../../../../components/table';
import { resourceSkillColumns } from './columns';

interface ResourceSkillTableProps {
  fiscalYear?: number;
  appliedFilters?: Record<string, any>;
  accountDetails?: Record<string, any>;
  resourceRid: string;
  skillOrder: 'asc' | 'desc';
  setSkillOrder: (skillOrder: 'asc' | 'desc') => void;
  skillOrderBy: string;
  setSkillOrderBy: (field: keyof ResourceSkillList) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  isResourceSkillEditEnable?: boolean;
  isResourceSkillDeleteEnable?: boolean;
  refreshSkillTrigger?: number;
  setCount?: (count: number) => void;
}
const ResourceSkillTable: React.FC<ResourceSkillTableProps> = ({
  appliedFilters,
  accountDetails,
  resourceRid,
  currentPage,
  setCurrentPage,
  skillOrder,
  setSkillOrder,
  skillOrderBy,
  setSkillOrderBy,
  isResourceSkillEditEnable,
  isResourceSkillDeleteEnable,
  refreshSkillTrigger,
  setCount,
}) => {
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const accountInActive =
    accountDetails?.data?.accountById?.status?.status_name !== 'active';
  const apiOrder = skillOrder.toUpperCase() as 'ASC' | 'DESC';
  const {
    data: skillList,
    isLoading,
    error,
  } = useResourceSkill(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: skillOrderBy,
      sortOrder: apiOrder,
      filters: appliedFilters,
      accountNumber: accountDetails?.data?.accountById?.r_number,
      resourceRid,
    },
    undefined,
    refreshSkillTrigger
  );
  useEffect(() => {
    if (setCount) {
      setCount(skillList?.count || 0);
    }
  }, [skillList, setCount]);

  const handleEdit = (skill: ResourceSkillList) => {
    const data = convertResourceSkill(skill);
    navigate(RESOURCESKILL + '/edit/' + skill.resource_rid, {
      state: { ...accountDetails, skillInfo: data, skill: true },
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // handles page limit change
  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(0);
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    setSkillOrder(sortOrder);
    setSkillOrderBy(property as keyof ResourceSkillList);
  };

  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: handleEdit,
      disabled: accountInActive,
      hide: !isResourceSkillEditEnable,
    },
    {
      label: 'Delete',
      onClick: () => console.log('Delete'),
      disabled: accountInActive,
      hide: !isResourceSkillDeleteEnable,
    },
  ];

  const getRowId = (row: ResourceSkillList) => row?.rid || '';

  return (
    <div>
      <ListTable
        data={skillList?.resourceSkill as any}
        columns={resourceSkillColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        stickyHeader={false}
        stickyColumnsCount={1}
        tableStyle={{
          borderBottom: '1px solid #CBD6E2',
          height: '100%',
          maxHeight: 'calc(100vh - 410px)',
          overflow: 'auto',
        }}
        selectable={false}
        actionWidth={80}
        actionDisplayMode='dropdown'
        actionMenuItems={actionMenuItems}
        loading={isLoading}
        error={error ? 'Failed to load resource' : undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        totalItems={skillList?.count ?? 0}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={skillOrderBy}
        sortOrder={skillOrder.toUpperCase() as 'ASC' | 'DESC'}
        onSort={handleSortRequest}
      />
    </div>
  );
};

export default ResourceSkillTable;
