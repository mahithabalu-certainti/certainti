/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceHeaderIcon } from '../../../../../assets';
import { RESOURCE, RESOURCE_CREATE } from '../../../../../routes';
import { useResourceList } from '../../../../services/resource-list';
import TabPanel from '../../components/tab';
import ListTable from '../../components/table';
import { getResourceColumns } from './columns';
import ResourceSubComponents from './resource-sub-components';
import ResourceTableHeader from './resource-table-header';
import { AccountData } from '../../utils';

interface ResourceProps {
  accountDetails?: Record<string, any>;
}

const Resource:React.FC<ResourceProps> = ({ accountDetails }) => {
  const [viewMode, setViewMode] = useState<boolean>(false);
  const [viewResourceList, setViewResourceList] = useState<boolean>(true);
  const [columns, setColumns] = useState<any>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [value, setValue] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>();
  const [showBackArrow, setShowBackArrow] = useState<boolean>(false);
  const [resourceData, setResourceData] = useState<any>({});
  const navigate = useNavigate();
  const {
    data: ResourceList,
    isLoading,
    error,
  } = useResourceList(accountDetails?.data?.accountById.r_number);
  const handleFilter = () => {
    setShowFilter(!showFilter);
    if(showFilter === false){
      setAppliedFilters({})
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    setAppliedFilters({})
  };

  // fiscalYear change

  const [fiscalYearValue, setFiscalYearValue] = useState<number>(new Date().getFullYear())

  const handleResourceClick = (row: any) => {
    setResourceData(row);
    setViewResourceList(!viewResourceList);
    setShowBackArrow(!showBackArrow);
    setValue('details')
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
  };

  const handleCreateResource = () => {
    if (!value) {
      navigate(RESOURCE_CREATE, { state: accountDetails });
    }
    if (value === 'cost') {
      navigate(`${RESOURCE}/cost/create`, { state: { ...accountDetails, resourceData, cost: true } })
    } else if (value === 'skill') {
      navigate(`${RESOURCE}/skill/create`, { state: { ...accountDetails, resourceData, skill: true } })
    }
  };
  return (
    <div className='w-full'>
      <TabPanel
        viewMode={viewMode}
        onExitView={toggleViewMode}
        title='Resource'
        handleFilter={handleFilter}
        value={value}
        showFilter={showFilter}
        setAppliedFilters={setAppliedFilters}
        setFiscalYearValue={setFiscalYearValue}
      />
      <ResourceTableHeader
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
        />
      )}
    </div>
  );
};

export default Resource;
