// import { Box, Tab, Tabs, Typography } from '@mui/material';
// import { useState } from 'react';
// import { TabPanel } from './tab-panel';
// import ProjectCostTab from './tab/project-cost';
// import ResourceCostTab from './tab/resource';
// import StateWiseTab from './tab/statewise';
// import SummaryTab from './tab/summary';
// import { a11yProps } from './utils';

// const FinancialSummary = () => {
//   // State for current tab
//   const [currentTab, setCurrentTab] = useState(0);

//   const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
//     setCurrentTab(newValue);
//   };
//   return (
//     <div className='container mx-auto py-8'>
//       <div className='flex flex-col bg-white border rounded-md shadow-sm'>
//         {/* Header */}
//         <div className='flex justify-between items-center p-4 border-b'>
//           <Typography variant='h6' component='h2' className='font-bold'>
//             RD Eligible No of Projects: 11
//           </Typography>
//           <Typography variant='subtitle1' className='text-blue-600 font-medium'>
//             2024
//           </Typography>
//         </div>

//         {/* Navigation Tabs */}
//         <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
//           <Tabs
//             value={currentTab}
//             onChange={handleTabChange}
//             aria-label='RD Dashboard tabs'
//             className='px-4'
//             TabIndicatorProps={{
//               style: {
//                 backgroundColor: '#1976d2',
//                 height: '3px',
//               },
//             }}
//           >
//             <Tab label='Summary' {...a11yProps(0)} className='font-medium' />
//             <Tab
//               label='State wise Summary'
//               {...a11yProps(1)}
//               className='font-medium'
//             />
//             <Tab
//               label='Project Cost'
//               {...a11yProps(2)}
//               className='font-medium'
//             />
//             <Tab
//               label='Resource Cost'
//               {...a11yProps(3)}
//               className='font-medium'
//             />
//           </Tabs>
//         </Box>

//         {/* Tab Contents */}
//         <TabPanel value={currentTab} index={0}>
//           <SummaryTab />
//         </TabPanel>

//         <TabPanel value={currentTab} index={1}>
//           <StateWiseTab />
//         </TabPanel>

//         <TabPanel value={currentTab} index={2}>
//           <ProjectCostTab />
//         </TabPanel>

//         <TabPanel value={currentTab} index={3}>
//           <ResourceCostTab />
//         </TabPanel>
//       </div>
//     </div>
//   );
// };

// export default FinancialSummary;

const FinancialSummary = () => {
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-4'>FinancialSummary</h1>
    </div>
  );
};

export default FinancialSummary;
