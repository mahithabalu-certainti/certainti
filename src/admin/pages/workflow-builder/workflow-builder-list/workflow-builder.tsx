import React, { Suspense, useState } from 'react';
import { NewFilterIcon, RefreshIcon, WorkflowIcon } from '../../../../assets';
import TextButton from '../../../../components/button/text-button';
import { WORKFLOW_BUILDER_CREATE } from '../../../../routes';
import { useNavigate } from 'react-router-dom';
import { WorkflowTable } from './table/workflow-table';
import { WorkflowRuleListURLParams } from '../../../types';
import { ActionsDropdown } from '../../../../components';
import {
  AllModules,
  AllPermissions,
  FilterTypes,
} from '../../../../common-service';
import Filter from '../../../../consultant/pages/account-details-sidebar/components/filter/filter';
import SearchBar from '../../../../components/search/search-bar';
import { getWorkflowListFilterFields } from './helper';
import { ExportWorkflowRuleList } from '../../../service/workflow-builder/workflow-builder-service';
import { useSelector } from 'react-redux';
import { checkPermission } from '../../../../common-utils';
import { RootState } from '../../../../store/store';
import { AccessRestricted } from '../../../../components/account-restricted';
import { ColorCode } from '../../../../consultant/types';

const BUTTON_STYLES = {
  height: '24px',
  fontSize: '13px',
};

const WorkflowBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<FilterTypes>({});
  const [page, setPage] = useState<number>(1);
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());
  const [searchText, setSearchText] = useState<string>('');
  const [tableParams, setTableParams] = useState<WorkflowRuleListURLParams>({
    page: page,
    limit: 100,
    sortBy: 'rule_name',
    sortOrder: 'ASC',
  });
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  // Permission Management
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const workflowEnable = checkPermission(modules, AllModules.WORKFLOW_BUILDER);

  const isWorkflowViewEnable = checkPermission(
    permission,
    AllPermissions.WORKFLOW_BUILDER_VIEW_EDIT
  );

  const isWorkflowExportEnable = checkPermission(
    permission,
    AllPermissions.WORKFLOW_BUILDER_EXPORT
  );

  const isWorkflowCreateEnable = checkPermission(
    permission,
    AllPermissions.WORKFLOW_BUILDER_CREATE
  );

  const onRefreshClick = () => {
    setRefreshTrigger(Date.now());
  };

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'workflow-filter-popover' : undefined;

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'workflow-column-visibility-popover'
    : undefined;

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'rule_name';
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
    const payload = {
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      isGlobal: true,
      search: searchText,
    };
    ExportWorkflowRuleList(payload);
  };

  const menuItems = [
    {
      label: 'Export',
      onClick: () => handleExport(),
      hide: !isWorkflowExportEnable,
    },
  ];

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const workflowFilterFields = getWorkflowListFilterFields();

  if (!workflowEnable || !isWorkflowViewEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <WorkflowIcon
              alt='workflow-icon'
              className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${ColorCode.manageAccountTextColor}] bg-[${ColorCode.manageTemplateBgcolor}]`}
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Workflow Builder
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Workflow Management
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
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </div>
          <TextButton
            label='Create Rule'
            hide={!isWorkflowCreateEnable}
            onClick={() => navigate(WORKFLOW_BUILDER_CREATE)}
            sx={{
              ...BUTTON_STYLES,
              width: '91px',
              minWidth: '91px',
              maxWidth: '91px',
            }}
          />
        </div>
      </div>

      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
          All Workflow Rules
        </div>
        <div className='flex gap-1 relative'>
          <SearchBar
            initialSearchText={searchText}
            onSearch={(value) => {
              setSearchText(value);
              setTableParams((prevParams) => {
                const newParams = { ...prevParams };
                if (value) {
                  newParams.search = value;
                } else {
                  delete newParams.search;
                }
                return newParams;
              });
            }}
            placeholder='Search'
            disabled={false}
            hide={true}
            setCurrentPage={(pageNo) => {
              setPage(pageNo + 1);
              setTableParams((prev) => ({
                ...prev,
                page: pageNo + 1,
              }));
            }}
          />
          <button
            aria-describedby={modalId}
            className={`w-[120px] h-[24px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative border border-[#CBD6E2] px-0 py-0 normal-case ${isModalOpen ? 'bg-[#F3F3F3]' : 'bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'} hover:text-[#425A76] transition-colors duration-150`}
            style={{
              boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
            }}
            onClick={handleColumnVisibility}
          >
            Show/Hide Fields
          </button>
          <button
            aria-describedby={filterId}
            className={`w-[64px] h-[26px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
              ${isFilterOpen || (appliedFilters && Object.keys(appliedFilters).length > 0) || sortFilterCount > 0 ? 'bg-[#F3F3F3]' : ''}`}
            onClick={handleFilterModal}
          >
            <React.Suspense fallback={null}>
              <NewFilterIcon alt='filter-icon' />
            </React.Suspense>
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
              value='workflow-list'
              isOpen={isFilterOpen}
              filterAnchorEl={anchorEl}
              filterId={filterId}
              filterMenu={workflowFilterFields}
              setAppliedFilters={setAppliedFilters}
              handleCloseFilter={handleCloseFilter}
              setCurrentPage={(pageNo) => {
                setPage(pageNo + 1);
                setTableParams((prev) => ({
                  ...prev,
                  page: pageNo + 1,
                }));
              }}
              handleSorting={handleSorting}
            />
          </Suspense>
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <WorkflowTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={setTableParams}
          refreshTrigger={refreshTrigger}
          setColumnAnchorEl={setColumnAnchorEl}
          columnAnchorEl={columnAnchorEl}
          searchValue={searchText}
        />
      </div>
    </div>
  );
};

export default WorkflowBuilder;
