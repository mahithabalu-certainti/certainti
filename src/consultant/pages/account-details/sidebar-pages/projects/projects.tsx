// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState } from 'react';
// import { projectHeaderIcon } from '../../../../../assets';
// import { mockProjectsList } from '../../../../mockdata/project-list';
// import TabPanel from '../../components/tab';
// import ListTable from '../../components/table';

// const Projects = () => {
//   const [viewMode, setViewMode] = useState<boolean>(false);

//   const columns = [
//     { id: 'id', label: 'Project Id', sortable: true },
//     { id: 'number', label: 'Project Number', sortable: true },
//     { id: 'refId', label: 'Project Ref Id', sortable: true },
//     { id: 'industry', label: 'Industry', sortable: true },
//     { id: 'startDate', label: 'Project Start Date', sortable: true },
//     { id: 'endDate', label: 'Project End Date', sortable: true },
//     {
//       id: 'status',
//       label: 'Status',
//       sortable: true,
//       render: (value: string) => (
//         <span className='text-green-600 font-medium'>{value}</span>
//       ),
//     },
//   ];

//   const actionMenuItems = [
//     {
//       label: 'Edit',
//       onClick: (row: any) => console.log('Edit', row),
//     },
//     {
//       label: 'Delete',
//       onClick: (row: any) => console.log('Delete', row),
//     },
//     {
//       label: 'View Summary',
//       onClick: (row: any) => console.log('Summary', row),
//     },
//     {
//       label: 'View Activities',
//       onClick: (row: any) => console.log('Activities', row),
//     },
//     {
//       label: 'View Notes',
//       onClick: (row: any) => console.log('Notes', row),
//     },
//   ];

//   const headerButtons: {
//     label: string;
//     variant: 'text' | 'outlined' | 'contained';
//     onClick: () => void;
//   }[] = [
//     {
//       label: 'Download',
//       variant: 'outlined',
//       onClick: () => console.log('Download'),
//     },
//     {
//       label: 'New',
//       variant: 'outlined',
//       onClick: () => console.log('New'),
//     },
//     {
//       label: 'View',
//       variant: 'outlined',
//       onClick: () => setViewMode(true),
//     },
//   ];

//   const toggleViewMode = () => {
//     setViewMode(!viewMode);
//   };

//   return (
//     <div className='w-full'>
//       <TabPanel
//         viewMode={viewMode}
//         onExitView={toggleViewMode}
//         title='Project'
//       />
//       <ListTable
//         data={mockProjectsList}
//         columns={columns}
//         actionMenuItems={actionMenuItems}
//         title='Projects'
//         titleIcon={<img src={projectHeaderIcon} alt='project header icon' />}
//         headerButtons={viewMode ? [] : headerButtons}
//         pagination={!viewMode}
//         rowsPerPage={5}
//         sortable={true}
//         setViewMode={setViewMode}
//         viewMode={viewMode}
//       />
//     </div>
//   );
// };

// export default Projects;

const Projects = () => {
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-4'>Projects</h1>
    </div>
  );
};

export default Projects;
