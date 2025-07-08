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
import { useMutation } from '@apollo/client';
import { UPDATE_RESOURCE_SKILL } from '../../../../../../api/graphql/queries/resource-query';
import { resourceClient } from '../../../../../../api/graphql/clients/client';
import { RESOURCESKILL } from '../../../../../../routes';
import { ListTable } from '../../../../../../components/table';
import { getResourceSkillColumns } from './columns';
import { SkillSubtype, SkillType } from '../../../../../types/resource';
import {
  CellEditData,
  FieldChangeEvent,
  FieldChangeValue,
  ListTableColumn,
} from '../../../../../../components/table/types';
import { OthersEnum } from '../../../../../types';

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
  const [localSkillList, setLocalSkillList] = useState<ResourceSkillList[]>([]);
  const [updateResourceSkill] = useMutation(UPDATE_RESOURCE_SKILL, {
    client: resourceClient,
  });
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

  useEffect(() => {
    if (skillList?.resourceSkill) {
      setLocalSkillList(skillList.resourceSkill);
    }
  }, [skillList]);

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

  const othersSkillTypeId = useMemo(() => {
    const data = skillType as SkillType[];
    const others = data?.find(
      (item) => item.skill_type_name.toLowerCase() === OthersEnum.Others
    );
    return others?.rid || null;
  }, [skillType]);

  const othersSkillSubTypeId = useMemo(() => {
    const data = skillSubType as SkillSubtype[];
    const others = data?.find(
      (item) => item.skill_subtype_name?.toLowerCase() === OthersEnum.Others
    );
    return others?.rid || null;
  }, [skillSubType]);

  const getRowId = (row: ResourceSkillList) => row?.rid || '';

  const handleSkillType = (rid: string) => {
    setCurrentSkillType(rid);
  };

  const resourceSkillColumns = getResourceSkillColumns(
    memoizedSkillLevels,
    memoizedSkillType,
    memoizedSkillSubType,
    handleSkillType
  );

  const handleFieldChange = async (event: FieldChangeEvent) => {
    if (event.columnId === 'skill_type_name' && event.value) {
      setCurrentSkillType(String(event.value));
    }
  };

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousCostList = [...localSkillList];

    const columnEditIdMap: Record<string, string> = {};
    const columnMap: Record<string, ListTableColumn<ResourceSkillList>> = {};
    resourceSkillColumns.forEach((col) => {
      if (col.id) {
        columnMap[col.id] = col;
        if (col.editId) {
          columnEditIdMap[col.id] = col.editId;
        }
      }
    });

    const updateFieldsForApi: Record<string, FieldChangeValue> = {};
    const updateFieldsForUi: Record<string, FieldChangeValue> = {};

    let skillTypeEdited = false;
    let skillSubTypeEdited = false;

    updates.forEach((item) => {
      const column = columnMap[item.columnId];
      const editKey =
        item.editId || columnEditIdMap[item.columnId] || item.columnId;
      let value = item.value;

      if (editKey === 'skill_type_rid') {
        skillTypeEdited = true;
      } else if (editKey === 'skill_subtype_rid') {
        skillSubTypeEdited = true;
      }

      if (typeof value === 'string' && !isNaN(Number(value))) {
        value = Number(value);
      }
      updateFieldsForApi[editKey] = value;
      if (column?.field?.type === 'select') {
        const selectedOption = column.field.options?.find(
          (opt: any) => opt.value === value
        );

        if (selectedOption) {
          updateFieldsForUi[item.columnId] = selectedOption.label;
          if (editKey !== item.columnId) {
            updateFieldsForUi[editKey] = value;
          }
        } else {
          updateFieldsForUi[item.columnId] = value;
          if (editKey !== item.columnId) {
            updateFieldsForUi[editKey] = value;
          }
        }
      } else {
        updateFieldsForUi[item.columnId] = value;
        if (editKey !== item.columnId) {
          updateFieldsForUi[editKey] = value;
        }
      }
    });

    if (skillTypeEdited || skillSubTypeEdited) {
      const skillTypeOthersUpdate = updates.find(
        (item) =>
          (item.editId || columnEditIdMap[item.columnId] || item.columnId) ===
          'skill_type_others'
      );
      const skillSubTypeOthersUpdate = updates.find(
        (item) =>
          (item.editId || columnEditIdMap[item.columnId] || item.columnId) ===
          'skill_subtype_others'
      );
      updateFieldsForApi['skill_type_others'] = skillTypeOthersUpdate
        ? String(skillTypeOthersUpdate.value)
        : '';
      updateFieldsForApi['skill_subtype_others'] = skillSubTypeOthersUpdate
        ? String(skillSubTypeOthersUpdate.value)
        : '';

      updateFieldsForUi['skill_type_others'] =
        updateFieldsForApi['skill_type_others'];
      updateFieldsForUi['skill_subtype_others'] =
        updateFieldsForApi['skill_subtype_others'];
    }

    const updateData = {
      resource_skill_rid: rowId,
      account_rid: accountDetails?.data?.accountById?.rid,
      resource_rid: resourceRid,
      ...updateFieldsForApi,
    };

    const updatedLocalList = localSkillList.map((row) =>
      row.rid === rowId ? { ...row, ...updateFieldsForUi } : row
    );
    setLocalSkillList(updatedLocalList);

    try {
      const res = await updateResourceSkill({
        variables: { data: updateData },
      });
      if (res?.data?.updateResourceSkillInline?.statusCode !== 200) {
        console.log('Please check the status code...', res?.data);
        setLocalSkillList(previousCostList);
      } else {
        console.log('Update success:', res?.data);
      }
    } catch (error) {
      console.error('Update failed:', error);
      setLocalSkillList(previousCostList); // rollback on error
    }
  };
  return (
    <div>
      <ListTable
        data={localSkillList}
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
        skillTypeIds={{
          othersSkillTypeId,
          othersSkillSubTypeId,
        }}
      />
    </div>
  );
};

export default ResourceSkillTable;
