/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense, useMemo, useState } from 'react';
import { ProjectListParams } from '../../../../../../consultant/types/project';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { checkPermission } from '../../../../../../common-utils';
import { AllModules, AllPermissions } from '../../../../../../common-service';
import { getAllProjectFilterFields } from './helpers';
import { AccessRestricted } from '../../../../../../components/account-restricted';
import SearchBar from '../../../../../../components/search/search-bar';
import {
  NewFilterIcon,
  ProjectDetailsIcon,
  RefreshIcon,
} from '../../../../../../assets';
import Filter from '../../../../../../consultant/pages/account-details-sidebar/components/filter/filter';
import { ProjectTable } from './table/project-table';

interface ProjectsProps {
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ onSelectionChange }) => {
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [tableParams, setTableParams] = useState<ProjectListParams>({
    page: page,
    limit: 100,
    sortBy: 'project_code',
    sortOrder: 'ASC',
    fiscalYear: 0,
  });
  const [refreshProjectsTrigger, setRefreshProjectsTrigger] =
    useState<number>();
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');

  const onRefreshClick = () => {
    setRefreshProjectsTrigger(Date.now()); // unique on every click
  };
  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const projectIsEnable = checkPermission(modules, AllModules.PROJECTS);
  const isProjectFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );
  const isProjectViewEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_VIEW_EDIT
  );

  const isProjectDeleteEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_DELETE
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

  const projectViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const projectPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);

  const accountViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const accountPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    accountViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [accountViewEditFields]);

  const projectFilterFields = getAllProjectFilterFields(
    projectPermissionMap,
    accountPermissionMap
  );

  if (!projectIsEnable || !isProjectViewEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full  h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[55px] max-h-[55px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <ProjectDetailsIcon
              alt='menu-icon'
              className='h-7 w-7 bg-[#d16dd3] p-[7px] rounded'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-bold text-[16px] text-[#2D3E4F]'>
                Projects
              </div>
              <div className='font-semibold text-[#7D98B6] text-[12px] -mt-1'>
                {`${totalCount} items`}
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <div
            className='flex items-center justify-center border border-[#CBD6E2] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] w-[24px] h-[23px] cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </div>
        </div>
      </div>
      <div className='flex items-center justify-end h-[34px] min-h-[34px] px-4'>
        {/* <div className='flex items-center gap-2'>  // Commented for it may use in future
          <span className='font-semibold text-[13px] text-[#425A76]'>
            Include Parent
          </span>
          <Switch
            checked={toggleEnabled}
            onChange={handleToggleChange}
            size='small'
            color='success'
          />
        </div> */}
        <div className='flex gap-1 relative'>
          <SearchBar
            initialSearchText={searchText}
            onSearch={(value) => {
              setSearchText(value);
            }}
            placeholder='Search'
            disabled={false}
            hide={false}
            setCurrentPage={(pageNo) => {
              setPage(pageNo + 1);
              setTableParams((prev) => ({
                ...prev,
                page: pageNo + 1,
              }));
            }}
          />
          <button
            aria-describedby={filterId}
            className={`w-[64px] h-[26px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
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
          </Suspense>
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <ProjectTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={(data) => {
            setTableParams(data);
            onRefreshClick();
          }}
          setTotalCount={setTotalCount}
          isProjectEditEnable={isProjectFieldsEditable}
          isProjectDeleteEnable={isProjectDeleteEnable}
          refreshProjectsTrigger={refreshProjectsTrigger}
          searchValue={searchText}
          onSelectionChange={onSelectionChange}
        />
      </div>
    </div>
  );
};

export default Projects;
