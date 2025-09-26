import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { FilterCondition } from '../../../types/manage-user';
import {
  formatFilterForApi,
  getStoredFilters,
} from '../../../../components/filter-component/utils';
import { FilterState } from '../../../../consultant/types/account-filter';
import {
  InteractionDetailIcon,
  NewFilterIcon,
  RefreshIcon,
} from '../../../../assets';
import { FilterModal } from '../../../../components';
import TextButton from '../../../../components/button/text-button';
import { getTemplateFilterFields } from './helpers';
import { TemplateTable } from './table/templates-table';
import { useNavigate } from 'react-router-dom';
import { INTERACTION_TEMPLATES_CREATE } from '../../../../routes';
import { TemplateListParams } from '../../../types';
import {
  AllModules,
  AllPermissions,
  useGetInteractionLevel,
  useGetInteractionTypes,
  useGetStatus,
} from '../../../../common-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission } from '../../../../common-utils';
import { AccessRestricted } from '../../../../components/account-restricted';

const InteractionTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterCondition>
  >({});
  const [page, setPage] = useState<number>(1);
  const [tableParams, setTableParams] = useState<TemplateListParams>({
    page: page,
    limit: 100,
    sortBy: 'r_number',
    sortOrder: 'ASC',
  });
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>();
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Permission
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const isInteractionTemplatesEnable = checkPermission(
    modules,
    AllModules.INTERACTION_TEMPLATES
  );
  const isTemplateCreateEnable = checkPermission(
    permission,
    AllPermissions.INTERACTION_TEMPLATES_CREATE
  );
  const isTemplateViewAllEnable = checkPermission(
    permission,
    AllPermissions.INTERACTION_TEMPLATES_VIEW_EDIT
  );

  const templateViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.INTERACTION_TEMPLATES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    templateViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [templateViewEditFields]);

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'account-column-visibility-popover' : undefined;

  const onRefreshClick = () => {
    setRefreshTrigger(Date.now());
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen
    ? 'interaction-template-filter-popover'
    : undefined;

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setTableParams((prev) => ({
        ...prev,
        sortBy: defaultSortField,
        sortOrder: defaultSortOrder,
      }));
    } else {
      setSortFilterCount(1);
      setTableParams((prev) => ({
        ...prev,
        sortBy,
        sortOrder: apiOrder,
      }));
    }
  };

  const interactionTypes = useGetInteractionTypes();
  const interactionLevel = useGetInteractionLevel();
  const templateStatus = useGetStatus();

  const statusOptions = useMemo(
    () =>
      templateStatus.data?.data?.status.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [templateStatus.data?.data?.status]
  );

  const memoizedInteractionTypes = useMemo(
    () =>
      interactionTypes.data?.data.interactionTypes.map((type) => ({
        label: type.interaction_type_name,
        value: type.rid,
      })) || [],
    [interactionTypes.data?.data.interactionTypes]
  );

  const memoizedInteractionLevel = useMemo(
    () =>
      interactionLevel.data?.data.interactionLevel.map((status) => ({
        label: status.interaction_level_name,
        value: status.rid,
      })) || [],
    [interactionLevel.data?.data.interactionLevel]
  );

  const templateFilterfields = getTemplateFilterFields(
    memoizedInteractionTypes,
    memoizedInteractionLevel,
    statusOptions,
    permissionMap
  );

  useEffect(() => {
    const saved = getStoredFilters();
    if (saved) {
      setAppliedFilters(
        formatFilterForApi(saved as Record<string, FilterState>)
      );
    }
  }, []);

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  if (!isInteractionTemplatesEnable || !isTemplateViewAllEnable)
    return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <InteractionDetailIcon
              alt='interaction-template-icon'
              className='h-7 w-7 p-[3px] rounded [&>path]:fill-[#fff] [&>path]:stroke-[#F16137] bg-[#F16137]'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Admin Template
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Interaction Templates
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <button
            className='flex border border-[#CBD6E2] rounded-[2px] w-[24px] h-[23px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </button>
          <TextButton
            label='Create Template'
            hide={!isTemplateCreateEnable}
            onClick={() => navigate(INTERACTION_TEMPLATES_CREATE)}
            sx={{
              width: '120px',
              minWidth: '120px',
              maxWidth: '120px',
            }}
          />
        </div>
      </div>

      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
          All Templates
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex gap-1 relative'>
            <button
              aria-describedby={modalId}
              className={`w-[120px] h-[24px] mt-1 text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 rounded-[2px] relative border border-[#CBD6E2] px-0 py-0 normal-case ${isModalOpen ? 'bg-[#F3F3F3]' : 'bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'} hover:text-[#425A76] transition-colors duration-150`}
              style={{
                boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
              }}
              onClick={handleColumnVisibility}
            >
              Show/Hide Fields
            </button>
            <button
              aria-describedby={filterId}
              className={`w-[64px] h-[24px] text-[13px] mt-[4px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
              ${isFilterOpen || (appliedFilters && Object.keys(appliedFilters).length > 0) || sortFilterCount > 0 ? 'bg-[#F3F3F3]' : ''}`}
              onClick={handleFilterModal}
            >
              <NewFilterIcon alt='filter-icon' />
              Filter
              {(appliedFilters && Object.keys(appliedFilters).length > 0) ||
              sortFilterCount > 0 ? (
                <div className='absolute -top-[5px] -right-2 w-4 h-4 flex items-center justify-center text-xs'>
                  <span className='absolute w-full h-full bg-[#FF6666] rounded-full animate-ping opacity-75 z-0'></span>
                  <span className='w-4 h-4 bg-[#FF6666] text-white rounded-full flex items-center justify-center z-10 font-semibold'>
                    {(appliedFilters ? Object.keys(appliedFilters).length : 0) +
                      sortFilterCount}
                  </span>
                </div>
              ) : null}
            </button>
            <Suspense fallback={null}>
              <FilterModal
                isOpen={isFilterOpen}
                filterAnchorEl={anchorEl}
                filterId={filterId}
                filterFields={templateFilterfields}
                setAppliedFilters={(filters) =>
                  setAppliedFilters(filters as Record<string, FilterCondition>)
                }
                setPage={setPage}
                handleCloseFilter={handleCloseFilter}
                handleSorting={handleSorting}
              />
            </Suspense>
          </div>
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <TemplateTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={(data) => {
            setTableParams(data);
            onRefreshClick();
          }}
          refreshTrigger={refreshTrigger}
          setColumnAnchorEl={setColumnAnchorEl}
          columnAnchorEl={columnAnchorEl}
        />
      </div>
    </div>
  );
};

export default InteractionTemplates;
