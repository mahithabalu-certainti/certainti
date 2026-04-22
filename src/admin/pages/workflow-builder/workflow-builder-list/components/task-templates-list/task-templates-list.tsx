import React, { Suspense, useMemo, useState } from 'react';
import { FilterCondition } from '../../../../../types/manage-user';
import { TaskTemplateListParams } from '../../../../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { AllPermissions, useGetStatus } from '../../../../../../common-service';
import {
  useGetTaskPriorityTypes,
  useGetTaskTemplateTypes,
} from '../../../../../service/task-template/task-template-service';
import { getTaskTemplateFilterFields } from './helpers';
import {
  NewFilterIcon,
  RefreshIcon,
  TaskTemplateIcon,
} from '../../../../../../assets';
import { FilterModal } from '../../../../../../components';
import { TaskTemplateTable } from './table/task-templates-table';

interface TaskTemplatesProps {
  onSelectionChange?: (selectedIds: string[]) => void;
  initialSelectedIds?: string[];
  resetFilterTrigger?: number;
}

const TaskTemplates: React.FC<TaskTemplatesProps> = ({
  onSelectionChange,
  initialSelectedIds,
  resetFilterTrigger,
}) => {
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterCondition>
  >({});
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [tableParams, setTableParams] = useState<TaskTemplateListParams>({
    page: page,
    limit: 100,
    sort_by: 'ASC',
    sort: 'r_number',
    search: '',
  });

  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const { permission } = useSelector((state: RootState) => state.permission);
  const taskViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.TASK_TEMPLATE_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    taskViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [taskViewEditFields]);

  const onRefreshClick = () => {
    setRefreshTrigger(Date.now());
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'task-template-filter-popover' : undefined;

  const handleSorting = (sort: string, sort_by: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
    const defaultSortOrder = 'ASC';
    const apiOrder = sort_by === 'asc' ? 'ASC' : 'DESC';

    if (!sort) {
      setSortFilterCount(0);
      setTableParams((prev) => ({
        ...prev,
        sort: defaultSortField,
        sort_by: defaultSortOrder,
      }));
    } else {
      setSortFilterCount(1);
      setTableParams((prev) => ({
        ...prev,
        sort,
        sort_by: apiOrder,
      }));
    }
  };

  const statusOptions = useGetStatus();
  const taskTemplateTypes = useGetTaskTemplateTypes();
  const taskPrioritytTypes = useGetTaskPriorityTypes();

  const taskTemplateTypesOptions = useMemo(() => {
    return (
      taskTemplateTypes?.data?.data?.map((item) => ({
        value: item.rid,
        label: item.task_type_name,
      })) || []
    );
  }, [taskTemplateTypes]);

  const taskPrioritytTypesTypesOptions = useMemo(() => {
    return (
      taskPrioritytTypes?.data?.data?.map((item) => ({
        value: item.rid,
        label: item.priority_name,
      })) || []
    );
  }, [taskPrioritytTypes]);

  const memoizedStatus = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        label: status?.status_name,
        value: status?.rid,
        desc: status?.status_description,
      })) || [],
    [statusOptions?.data?.data?.status]
  );

  const taskTemplateFilterFields = getTaskTemplateFilterFields(
    taskTemplateTypesOptions,
    taskPrioritytTypesTypesOptions,
    memoizedStatus,
    permissionMap
  );

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <TaskTemplateIcon
              alt='task-template-icon'
              className={`w-7 h-7 p-[5px] [&>path]:stroke-[#fff] bg-[#9747FF] rounded`}
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-bold text-[16px] text-[#2D3E4F]'>
                Case Task
              </div>
              <div className='font-semibold text-[#7D98B6] text-[12px] -mt-1'>
                {`${totalCount} items`}
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
        </div>
      </div>

      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'></div>
        <div className='flex items-center gap-3'>
          <div className='flex gap-1 relative'>
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
                filterFields={taskTemplateFilterFields}
                setAppliedFilters={(filters) =>
                  setAppliedFilters(filters as Record<string, FilterCondition>)
                }
                setPage={setPage}
                handleCloseFilter={handleCloseFilter}
                handleSorting={handleSorting}
                resetFilterTrigger={resetFilterTrigger}
              />
            </Suspense>
          </div>
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <TaskTemplateTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={setTableParams}
          refreshTrigger={refreshTrigger}
          onSelectionChange={onSelectionChange}
          setTotalCount={setTotalCount}
          initialSelectedIds={initialSelectedIds}
        />
      </div>
    </div>
  );
};

export default TaskTemplates;
