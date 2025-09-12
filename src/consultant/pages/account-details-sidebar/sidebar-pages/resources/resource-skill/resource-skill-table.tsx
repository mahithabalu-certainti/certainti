/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../components/table';
import { getResourceSkillColumns } from './columns';
import { SkillSubtype, SkillType } from '../../../../../types/resource';
import {
  CellEditData,
  FieldChangeEvent,
  FieldChangeValue,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../../components/table/types';
import { useToast } from '../../../../../../hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { AllPermissions } from '../../../../../../common-service';
import Uploads from '../../../../../../components/Attachments/upload';
import { checkPermission } from '../../../../../../common-utils';

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
  resourceInActive: boolean;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
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
  resourceInActive,
  columnAnchorEl,
  setColumnAnchorEl,
}) => {
  const navigate = useNavigate();
  const { accountid } = useParams();
  const { errorToast } = useToast();
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const [searchParams] = useSearchParams();
  const [resourceSkillList, setResourceSkillList] = useState<
    ResourceSkillList[]
  >([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [updateResourceSkill] = useMutation(UPDATE_RESOURCE_SKILL, {
    client: resourceClient,
  });
  const accountInActive =
    accountDetails?.data?.accountById?.status?.status_name?.toLowerCase() !==
    'active';
  const apiOrder = skillOrder.toUpperCase() as 'ASC' | 'DESC';
  const { permission } = useSelector((state: RootState) => state.permission);

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
      setResourceSkillList(skillList.resourceSkill);
    }
  }, [skillList]);

  const attachmentCreateEnable = checkPermission(
    permission || [],
    AllPermissions.ATTACHMENT_CREATE
  );

  //permissions
  const skillViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ACCOUNT_RESOURCE_SKILL_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    skillViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [skillViewEditFields]);

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
  const { data: skillType, isLoading: skillTypeLoading } =
    useFetchResourceSkillType(true);
  const { data: skillSubType, isLoading: subTypeLoading } =
    useFetchResourceSkillSubType(
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

  const handleSkillType = (rid: string) => {
    setCurrentSkillType(rid);
  };

  const handleAttachmentClick = (rowId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('attachment_entity', 'resource_skill');
    navigate({
      pathname: location.pathname,
      search: newParams.toString(),
    });
    setSelectedRowId(rowId);
  };

  const resourceSkillColumns = getResourceSkillColumns(
    memoizedSkillLevels,
    memoizedSkillType,
    memoizedSkillSubType,
    handleSkillType,
    skillTypeLoading,
    subTypeLoading,
    permissionMap,
    accountInActive,
    handleAttachmentClick,
    resourceInActive,
    attachmentCreateEnable
  );

  const handleFieldChange = async (event: FieldChangeEvent) => {
    if (event.columnId === 'skill_type_name' && event.value) {
      setCurrentSkillType(String(event.value));
    }
  };

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousSkillList = [...resourceSkillList];

    // Flags
    let hasSkillType = false;
    let hasSkillTypeOther = false;
    let hasSkillSubType = false;
    let hasSkillSubTypeOther = false;

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (skill, item) => {
        const key = item.editId || item.columnId;
        skill[key] = item.value;

        if (item.columnId === 'skill_type_name') hasSkillType = true;
        if (item.columnId === 'skill_type_others') hasSkillTypeOther = true;
        if (item.columnId === 'skill_subtype_name') hasSkillSubType = true;
        if (item.columnId === 'skill_subtype_others')
          hasSkillSubTypeOther = true;

        return skill;
      },
      {
        resource_skill_rid: rowId,
        account_rid: accountDetails?.data?.accountById?.rid,
        resource_rid: resourceRid,
      }
    );

    if (
      hasSkillType &&
      hasSkillSubType &&
      !hasSkillTypeOther &&
      !hasSkillSubTypeOther
    ) {
      updateData['skill_type_others'] = '';
      updateData['skill_subtype_others'] = '';
    }

    try {
      const res = await updateResourceSkill({
        variables: { data: updateData },
      });
      const result = res.data?.updateResourceSkillInline;
      if (result?.statusCode === 200 && result.data) {
        const updatedResourceSkill = result.data;
        setResourceSkillList((prevSkill) =>
          prevSkill.map((skill) =>
            skill.rid === updatedResourceSkill.rid
              ? updatedResourceSkill
              : skill
          )
        );
      } else {
        errorToast(result?.statusMessage || 'Failed to update filed');
        setResourceSkillList(previousSkillList);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update filed');
      setResourceSkillList(previousSkillList);
    }
  };

  const showUploads =
    searchParams.get('attachment_entity') === 'resource_skill';

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<ResourceSkillList>[]
  >(resourceSkillColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<ResourceSkillList>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'interaction-column-visibility-popover'
    : undefined;

  return (
    <div>
      {showUploads ? (
        <Uploads accountId={accountid} attachID={selectedRowId} />
      ) : (
        <>
          <ManageColumnsPopover
            anchorEl={columnAnchorEl}
            open={isModalOpen}
            popoverId={modalId}
            onClose={handlePopoverClose}
            columns={resourceSkillColumns}
            onColumnsChange={handleColumnsChange}
            // columnRestrictions={RestrictedColumns}
          />
          <ListTable
            data={resourceSkillList}
            columns={visibleColumns}
            getRowId={getRowId}
            hoverHighlight={false}
            stickyHeader={false}
            stickyColumnsCount={1}
            tableStyle={{
              borderBottom: '1px solid #CBD6E2',
              height: '100%',
              maxHeight: 'calc(100vh - 450px)',
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
        </>
      )}
    </div>
  );
};

export default ResourceSkillTable;
