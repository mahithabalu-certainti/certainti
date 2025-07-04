/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { convertResourceSkill } from './resource-skill-type';
import { ResourceSkillList } from '../../../../../types/resource-skill';
import {
  useFetchResourceSkillSubType,
  useFetchResourceSkillType,
  useGetSkillLevel,
  useResourceSkill,
} from '../../../../../services/resource-skill/resource-skill-service';
import { RESOURCESKILL } from '../../../../../../routes';
import { ListTable } from '../../../../../../components/table';
import { getResourceSkillColumns } from './columns';
import { SkillSubtype, SkillType } from '../../../../../types/resource';
import {
  CellEditData,
  FieldChangeEvent,
} from '../../../../../../components/table/types';

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
  refreshSkillTrigger,
  setCount,
}) => {
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const accountInActive =
    accountDetails?.data?.accountById?.status?.status_name?.toLowerCase() !==
    'active';
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
      // hide: !isResourceSkillDeleteEnable,
      hide: true,
    },
  ];
  const [currentSkillType, setCurrentSkillType] = useState<string>('');
  const skillLevelOptions = useGetSkillLevel();
  const { data: skillType } = useFetchResourceSkillType(true);
  const { data: skillSubType } = useFetchResourceSkillSubType(
    currentSkillType ? ([currentSkillType] as string[]) : []
  );

  const memoizedSkillLevels = useMemo(
    () =>
      skillLevelOptions?.data?.data?.skillLevel.map((item) => ({
        label: item.skill_level_name,
        value: item.rid,
      })) || [],
    [skillLevelOptions?.data?.data?.skillLevel]
  );

  const memoizedSkillType = useMemo(() => {
    const data = skillType as SkillType[];
    const convertData =
      data?.map((skill: SkillType) => ({
        label: skill.skill_type_name,
        value: skill.rid,
      })) || [];
    return convertData;
  }, [skillType]);

  const memoizedSkillSubType = useMemo(() => {
    const data = skillSubType as SkillSubtype[];
    const finalData =
      data?.map((skill: SkillSubtype) => ({
        label: skill.skill_subtype_name,
        value: skill.rid,
      })) || [];
    return finalData;
  }, [skillSubType]);

  const getRowId = (row: ResourceSkillList) => row?.rid || '';

  const resourceSkillColumns = getResourceSkillColumns(
    memoizedSkillLevels,
    memoizedSkillType,
    memoizedSkillSubType
  );

  const handleFieldChange = async (event: FieldChangeEvent) => {
    if (event.columnId === 'skill_type_name' && event.value) {
      setCurrentSkillType(event.value);
    }
  };

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    console.log(rowId, updates);
  };

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
        selectable={true}
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
        onCellEdit={handleCellEdit}
        onFieldChange={handleFieldChange}
      />
    </div>
  );
};

export default ResourceSkillTable;
