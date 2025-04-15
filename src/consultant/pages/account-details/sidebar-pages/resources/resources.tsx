/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { resourceHeaderIcon } from '../../../../../assets';
import { mockResourcesList } from '../../../../mockdata/resource-list';
import TabPanel from '../../components/tab';
import ListTable from '../../components/table';
import { getResourceColumns } from './columns';
import ResourceSubComponents from './resource-sub-components';
import ResourceTableHeader from './resource-table-header';
import { useNavigate } from 'react-router-dom';
import { RESOURCE } from '../../../../../routes';
import { AccountData } from '../../utils';

interface ResourceProps{
  accountDetails?: AccountData
}

const Resource:React.FC<ResourceProps> = ({accountDetails}) => {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<boolean>(false);
  const [viewResourceList, setViewResourceList] = useState<boolean>(true);
  const [columns, setColumns] = useState<any>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [value, setValue] = useState('');
  const [resourceInfo, setResourceInfo] = useState<any>({})
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>();

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const handleResourceClick = (row: any) => {
    setResourceInfo(row);
    setViewResourceList(!viewResourceList);
    setValue('details')
  };

  const handleNewCLick = () => {
    if (value === 'cost') {
      navigate(`${RESOURCE}/cost/create`, { state: { resourceInfo, cost: true } })
    } else if (value === 'skill') {
      navigate(`${RESOURCE}/skill/create`, { state: { resourceInfo, skill: true } })
    }
  }

  useEffect(() => {
    setColumns(
      getResourceColumns({
        onResourceIdClick: handleResourceClick,
        view: viewMode,
        onClickId: 'rid',
      })
    );
  }, [viewMode]);

  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: (row: any) => console.log('Edit', row),
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
        onClick: handleNewCLick,
      },
      {
        label: 'View',
        variant: 'outlined',
        onClick: () => setViewMode(true),
      },
    ];

  const toggleViewMode = () => {
    setViewMode(!viewMode);
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
      />
      <ResourceTableHeader
        title='Resource'
        titleIcon={<img src={resourceHeaderIcon} alt='resource header icon' />}
        headerButtons={viewMode ? [] : headerButtons}
        toggleViewMode={toggleViewMode}
      />
      {!viewResourceList ? (
        <ResourceSubComponents
          handleTabChange={handleTabChange}
          value={value}
          appliedFilters={appliedFilters || {}}
          accountDetails={accountDetails as AccountData}
        />
      ) : (
        <ListTable
          data={mockResourcesList.data.resources}
          columns={columns}
          actionMenuItems={actionMenuItems}
          // title='Resource'
          // titleIcon={<img src={resourceHeaderIcon} alt='resource header icon' />}
          // headerButtons={viewMode ? [] : headerButtons}
          pagination={!viewMode}
          rowsPerPage={5}
          sortable={true}
          setViewMode={setViewMode}
          viewMode={viewMode}
        />
      )}
    </div>
  );
};

export default Resource;
