/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import {
  accountSettingsIcon,
  actionIcon,
  newFilterIcon,
  projectDetailsIcon,
  refreshIcon,
} from '../../../../assets';
import { ActionsDropdown } from '../../../../components';
import { getAllProjectFilterFields } from './helpers';
import { ProjectTable } from './table/project-table';
import { ProjectListParams } from '../../../types/project';
import Filter from '../../account-details-sidebar/components/filter/filter';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission } from '../../../../common-utils';
import { AllModules, AllPermissions } from '../../../../common-service';
import { AccessRestricted } from '../../../../components/account-restricted';
import { exportProjectData } from '../../../services/project';
import { useFetchClassification } from '../../../services/account';

export const Projects: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [tableParams, setTableParams] = useState<ProjectListParams>({
    page: page,
    limit: 100,
    sortBy: 'project_code',
    sortOrder: 'ASC',
    fiscalYear: 0,
    globalFilters: {},
  });
  const [refreshProjectsTrigger, setRefreshProjectsTrigger] = useState<number>(
    Date.now()
  );
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);

  const onRefreshClick = () => {
    setRefreshProjectsTrigger(Date.now()); // unique on every click
  };
  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const projectIsEnable = checkPermission(modules, AllModules.PROJECTS);
  const isProjectExportEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_PROJECTS_EXPORT
  );
  const isProjectEditEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_PROJECTS_EDIT
  );
  const isProjectDeleteEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_PROJECTS_DELETE
  );

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'all-project-filter-popover' : undefined;

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'project_code';
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

  const handleExport = () => {
    const projectParams = {
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      fiscalYear: tableParams.fiscalYear,
      globalFilters: tableParams.globalFilters,
    };
    exportProjectData('projectall', projectParams);
  };
  const menuItems = [
    {
      label: 'Manage user',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Export',
      hide: !isProjectExportEnable,
      onClick: () => handleExport(),
    },
  ];

  const Classification = useFetchClassification();
  const memoizedClassification = useMemo(
    () =>
      Classification.data?.data.projectClassifications.map((data) => ({
        option: data.classification_name,
        value: data.classification_name,
      })) || [],
    [Classification.data?.data.projectClassifications]
  );

  const projectFilterFields = getAllProjectFilterFields(
    memoizedClassification.map((item) => ({
      label: item.option,
      value: item.value,
    }))
  );

  if (!projectIsEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <img
              src={projectDetailsIcon}
              alt='menu-icon'
              className='h-7 w-7 bg-[#d16dd3] p-[7px] rounded'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-bold text-[16px] text-[#2D3E4F]'>
                Projects
              </div>
              <div className='font-semibold text-[#7D98B6] text-[12px] -mt-1'>
                {`All Projects • ${totalCount} items`}
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <ActionsDropdown actions={menuItems} />
          <div
            className='flex items-center justify-center border border-[#CBD6E2] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] w-[24px] h-[23px] cursor-pointer'
            onClick={onRefreshClick}
          >
            <img src={refreshIcon} alt='refresh-icon' className='h-4' />
          </div>
          <div className='hidden border border-[#CBD6E2] w-[24px] h-[24px] justify-center items-center bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'>
            <img src={actionIcon} alt='menu-icon' className='h-4' />
          </div>
          <div className='hidden border border-[#CBD6E2] w-[24px] h-[24px]  justify-center items-center bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'>
            <img src={accountSettingsIcon} alt='menu-icon' className='h-4' />
          </div>
        </div>
      </div>
      <div className='flex items-center justify-end h-[34px] min-h-[34px] px-4'>
        <div className='relative'>
          <button
            aria-describedby={filterId}
            className={`w-[64px] h-[26px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
              ${isFilterOpen || (appliedFilters && Object.keys(appliedFilters).length > 0) || sortFilterCount > 0 ? 'bg-[#F3F3F3]' : ''}`}
            onClick={handleFilterModal}
          >
            <img src={newFilterIcon} alt='filter-icon' />
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
          <Filter
            value={'allProjects'}
            isOpen={isFilterOpen}
            filterAnchorEl={anchorEl}
            filterId={filterId}
            filterMenu={projectFilterFields}
            setAppliedFilters={setAppliedFilters}
            handleCloseFilter={handleCloseFilter}
            setCurrentPage={setPage}
            mode={'date'}
            handleSorting={handleSorting}
          />
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <ProjectTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={setTableParams}
          setTotalCount={setTotalCount}
          isProjectEditEnable={isProjectEditEnable}
          isProjectDeleteEnable={isProjectDeleteEnable}
          refreshProjectsTrigger={refreshProjectsTrigger}
        />
      </div>
    </div>
  );
};
