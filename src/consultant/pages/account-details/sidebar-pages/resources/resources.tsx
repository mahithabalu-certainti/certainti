/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { resourceHeaderIcon } from '../../../../../assets';
import { mockResourcesList } from '../../../../mockdata/resource-list';
import TabPanel from '../../components/tab';
import ListTable from '../../components/table';
import { getResourceColumns } from './columns';

const Resource = () => {
  const [viewMode, setViewMode] = useState<boolean>(false);
  const [columns, setColumns] = useState<any>([]);

  const handleResourceClick = (row: any) => {
    console.log('Resource clicked:', row.id);
    // Add your custom logic here
  };

  useEffect(() => {
    setColumns(
      getResourceColumns({
        onResourceIdClick: handleResourceClick,
        view: viewMode,
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
      onClick: () => console.log('New'),
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
      />
      <ListTable
        data={mockResourcesList.data.resources}
        columns={columns}
        actionMenuItems={actionMenuItems}
        title='Resource'
        titleIcon={<img src={resourceHeaderIcon} alt='resource header icon' />}
        headerButtons={viewMode ? [] : headerButtons}
        pagination={!viewMode}
        rowsPerPage={5}
        sortable={true}
        setViewMode={setViewMode}
        viewMode={viewMode}
      />
    </div>
  );
};

export default Resource;
