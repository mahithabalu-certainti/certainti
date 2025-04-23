/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resourceHeaderIcon } from '../../../../../assets';
import { RESOURCE, RESOURCE_CREATE } from '../../../../../routes';
import { useResourceList } from '../../../../services/resource-list';
import { AccountData } from '../../../account-details/utils';
import TabPanel from '../../components/tab';
import ListTable from '../../components/table';
import { getResourceColumns } from './columns';
import ResourceSubComponents from './resource-sub-components';
import ResourceTableHeader from './resource-table-header';

interface ResourceProps {
  accountDetails?: Record<string, any>;
  activeKey?: string;
}

const Resource: React.FC<ResourceProps> = ({ accountDetails }) => {
  const [viewMode, setViewMode] = useState<boolean>(false);
  const [viewResourceList, setViewResourceList] = useState<boolean>(true);
  const [columns, setColumns] = useState<any>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [value, setValue] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>();
  const [showBackArrow, setShowBackArrow] = useState<boolean>(false);
  const [resourceData, setResourceData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('rid');
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const navigate = useNavigate();
  const location = useLocation();
  const {
    data: ResourceList,
    isLoading,
    error,
  } = useResourceList({
    page: currentPage,
    limit: rowsPerPage,
    accountNumber: accountDetails?.data?.accountById.r_number,
    sortBy: sortField,
    sortOrder: sortOrder,
    filters: appliedFilters,
  });
  const handleFilter = () => {
    setShowFilter(!showFilter);
    if (showFilter === false) {
      setAppliedFilters({});
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    setAppliedFilters({});
  };

  // fiscalYear change

  const [fiscalYearValue, setFiscalYearValue] = useState<number>(
    new Date().getFullYear()
  );

  const handleResourceClick = (row: any) => {
    setResourceData(row);
    setViewResourceList(!viewResourceList);
    setShowBackArrow(!showBackArrow);
    setValue('details');
  };

  useEffect(() => {
    setColumns(
      getResourceColumns({
        onResourceIdClick: handleResourceClick,
        view: viewMode,
        onClickId: 'rid',
      })
    );
  }, [viewMode]);

  const handleEdit = (resource: any) => {
    navigate(RESOURCE + '/edit/' + resource.rid, {
      state: { resource, accountDetails },
    });
  };

  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: handleEdit,
    },
    {
      label: 'Delete',
      onClick: (row: any) => console.log('Delete', row),
    },
    {
      label: 'View Summary',
      onClick: (row: any) => console.log('Summary', row),
    },
    {
      label: 'View Activities',
      onClick: (row: any) => console.log('Activities', row),
    },
    {
      label: 'View Notes',
      onClick: (row: any) => console.log('Notes', row),
    },
  ];

  const headerButtons: {
    label: string;
    variant: 'text' | 'outlined' | 'contained';
    onClick: () => void;
  }[] = [
      {
        label: 'Download',
        variant: 'outlined',
        onClick: () => console.log('Download'),
      },
      {
        label: 'New',
        variant: 'outlined',
        onClick: () => handleCreateResource(),
      },
    ];

  const toggleViewMode = () => {
    setViewMode(!viewMode);
  };

  const handleBackClick = () => {
    setViewResourceList(!viewResourceList);
    setShowBackArrow(!showBackArrow);
    setValue('');
    navigate(location.pathname, {
      state: { ...location.state, activeKey: 'resources' },
      replace: true,
    });
  };

  const handleCreateResource = () => {
    if (!value) {
      navigate(RESOURCE_CREATE, { state: accountDetails });
    }
    if (value === 'cost') {
      navigate(`${RESOURCE}/cost/create`, {
        state: { ...accountDetails, resourceData, cost: true, sectionName: 'Financial Information' },
      });
    } else if (value === 'skill') {
      navigate(`${RESOURCE}/skill/create`, {
        state: { ...accountDetails, resourceData, skill: true, sectionName: 'Skill Information' },
      });
    }
  };

  return (
    <div className='w-full'>
      <TabPanel
        viewMode={viewMode}
        onExitView={toggleViewMode}
        title='Resource'
        setFiscalYearValue={setFiscalYearValue}
      />
      <ResourceTableHeader
        handleFilter={handleFilter}
        value={value}
        setAppliedFilters={setAppliedFilters}
        showFilter={showFilter}
        title='Resource'
        titleIcon={<img src={resourceHeaderIcon} alt='resource header icon' />}
        headerButtons={viewMode ? [] : headerButtons}
        toggleViewMode={toggleViewMode}
        showBackArrow={showBackArrow}
        onBackClick={handleBackClick}
      />
      {!viewResourceList ? (
        <ResourceSubComponents
          handleTabChange={handleTabChange}
          value={value}
          resourceData={resourceData}
          accountId={accountDetails?.data?.accountById?.r_number}
          appliedFilters={appliedFilters || {}}
          fiscalYearValue={fiscalYearValue}
          accountDetails={accountDetails as AccountData}
        />
      ) : (
        <ListTable
          data={ResourceList?.resource as any}
          columns={columns}
          actionMenuItems={actionMenuItems}
          // title='Resource'
          // titleIcon={<img src={resourceHeaderIcon} alt='resource header icon' />}
          // headerButtons={viewMode ? [] : headerButtons}
          pagination={!viewMode}
          rowsPerPage={5}
          sortable={true}
          onViewModeToggle={setViewMode}
          viewMode={viewMode}
          isLoading={isLoading}
          error={error}
          rowIdentifier='rid'
          setCurrentPage={setCurrentPage}
          setSortOrder={setSortOrder}
          setSortField={setSortField}
          setRowsPerPage={setRowsPerPage}
          sortField={sortField}
          sortOrder={sortOrder}
          currentPage={currentPage}
        />
      )}
    </div>
  );
};

export default Resource;
