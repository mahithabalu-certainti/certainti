import {
  Box,
  Card,
  CardContent,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

type ResourceMetrics = {
  noOfResources: number;
  fte: number;
  subCon: number;
  nonLabor: number;
};

type ProjectMetrics = {
  projectLevel: number | string;
  projectResourceLevel: number | string;
  projectTaskLevel: number | string;
  approved: number | string;
};

type JurisdictionCredits = {
  jurisdictionName: string;
  fteCreditAmount: number;
  subConCreditAmount: number;
  nonLaborCreditAmount: number;
  totalCreditAmount: number;
};

interface RDDashboardProps {
  fiscalYear: string;
  eligibleProjects: number;
  resourceMetrics: ResourceMetrics;
  fteHours: ProjectMetrics;
  fteCost: ProjectMetrics;
  subConHours: ProjectMetrics;
  subConCost: ProjectMetrics;
  nonLaborCost: ProjectMetrics;
  jurisdictionCredits: JurisdictionCredits[];
}

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`rd-tabpanel-${index}`}
      aria-labelledby={`rd-tab-${index}`}
      className='py-4'
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

// Helper function for tab accessibility
const a11yProps = (index: number) => {
  return {
    id: `rd-tab-${index}`,
    'aria-controls': `rd-tabpanel-${index}`,
  };
};

// Format functions
const formatNumber = (num: number | string): string => {
  if (typeof num === 'string') {
    return num;
  }
  return num.toLocaleString();
};

const formatCurrency = (amount: number | string): string => {
  if (typeof amount === 'string') {
    return amount;
  }
  return `$${amount.toLocaleString()}`;
};

const RDDashboard: React.FC<RDDashboardProps> = ({
  fiscalYear,
  eligibleProjects,
  resourceMetrics,
  fteHours,
  fteCost,
  subConHours,
  subConCost,
  nonLaborCost,
  jurisdictionCredits,
}) => {
  // State for current tab
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <div className='flex flex-col bg-white border rounded-md shadow-sm'>
      {/* Header */}
      <div className='flex justify-between items-center p-4 border-b'>
        <Typography variant='h6' component='h2' className='font-bold'>
          RD Eligible No of Projects: {eligibleProjects}
        </Typography>
        <Typography variant='subtitle1' className='text-blue-600 font-medium'>
          {fiscalYear}
        </Typography>
      </div>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label='RD Dashboard tabs'
          className='px-4'
          TabIndicatorProps={{
            style: {
              backgroundColor: '#1976d2',
              height: '3px',
            },
          }}
        >
          <Tab label='Summary' {...a11yProps(0)} className='font-medium' />
          <Tab
            label='State wise Summary'
            {...a11yProps(1)}
            className='font-medium'
          />
          <Tab label='Project Cost' {...a11yProps(2)} className='font-medium' />
          <Tab
            label='Resource Cost'
            {...a11yProps(3)}
            className='font-medium'
          />
        </Tabs>
      </Box>

      {/* Summary Tab */}
      <TabPanel value={currentTab} index={0}>
        <Box className='p-4'>
          <Card elevation={1} className='mb-4'>
            <CardContent>
              <Typography variant='h6' component='h3' className='mb-3'>
                Resource Summary
              </Typography>
              <TableContainer component={Paper} className='mb-4 bg-gray-50'>
                <Table size='small'>
                  <TableHead className='bg-gray-100'>
                    <TableRow>
                      <TableCell className='font-medium'>Metrics</TableCell>
                      <TableCell className='font-medium'>FTE</TableCell>
                      <TableCell className='font-medium'>Sub Con</TableCell>
                      <TableCell className='font-medium'>Non Labor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>No Of Resources</TableCell>
                      <TableCell>{formatNumber(resourceMetrics.fte)}</TableCell>
                      <TableCell>
                        {formatNumber(resourceMetrics.subCon)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(resourceMetrics.nonLabor)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card elevation={1}>
            <CardContent>
              <Typography variant='h6' component='h3' className='mb-3'>
                Project Metrics
              </Typography>
              <TableContainer component={Paper} className='mb-4 bg-gray-50'>
                <Table size='small'>
                  <TableHead className='bg-gray-100'>
                    <TableRow>
                      <TableCell className='font-medium'>Metrics</TableCell>
                      <TableCell className='font-medium'>
                        Project Level
                      </TableCell>
                      <TableCell className='font-medium'>
                        Project Resource Level
                      </TableCell>
                      <TableCell className='font-medium'>
                        Project Task Level
                      </TableCell>
                      <TableCell className='font-medium'>Approved</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>FTE Hours</TableCell>
                      <TableCell>
                        {formatNumber(fteHours.projectLevel)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(fteHours.projectResourceLevel)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(fteHours.projectTaskLevel)}
                      </TableCell>
                      <TableCell>{formatNumber(fteHours.approved)}</TableCell>
                    </TableRow>
                    <TableRow className='bg-gray-50'>
                      <TableCell>FTE Cost</TableCell>
                      <TableCell>
                        {formatCurrency(fteCost.projectLevel)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(fteCost.projectResourceLevel)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(fteCost.projectTaskLevel)}
                      </TableCell>
                      <TableCell>{formatCurrency(fteCost.approved)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sub Con Hours</TableCell>
                      <TableCell>
                        {formatNumber(subConHours.projectLevel)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(subConHours.projectResourceLevel)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(subConHours.projectTaskLevel)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(subConHours.approved)}
                      </TableCell>
                    </TableRow>
                    <TableRow className='bg-gray-50'>
                      <TableCell>Sub Con Cost</TableCell>
                      <TableCell>
                        {formatCurrency(subConCost.projectLevel)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(subConCost.projectResourceLevel)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(subConCost.projectTaskLevel)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(subConCost.approved)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Non Labor Cost</TableCell>
                      <TableCell>
                        {formatCurrency(nonLaborCost.projectLevel)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(nonLaborCost.projectResourceLevel)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(nonLaborCost.projectTaskLevel)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(nonLaborCost.approved)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card elevation={1} className='mt-4'>
            <CardContent>
              <Typography variant='h6' component='h3' className='mb-3'>
                Jurisdiction Credits
              </Typography>
              <TableContainer component={Paper} className='bg-gray-50'>
                <Table size='small'>
                  <TableHead className='bg-gray-100'>
                    <TableRow>
                      <TableCell className='font-medium'>
                        Claim Jurisdiction
                      </TableCell>
                      <TableCell className='font-medium'>
                        RD Credits FTE
                      </TableCell>
                      <TableCell className='font-medium'>
                        RD Credits Sub Con
                      </TableCell>
                      <TableCell className='font-medium'>
                        RD Credits Non Labor
                      </TableCell>
                      <TableCell className='font-medium'>
                        RD Credits Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jurisdictionCredits.map((jurisdiction, index) => (
                      <TableRow
                        key={index}
                        className={index % 2 === 0 ? '' : 'bg-gray-50'}
                      >
                        <TableCell>{jurisdiction.jurisdictionName}</TableCell>
                        <TableCell>
                          {formatCurrency(jurisdiction.fteCreditAmount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(jurisdiction.subConCreditAmount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(jurisdiction.nonLaborCreditAmount)}
                        </TableCell>
                        <TableCell className='font-medium'>
                          {formatCurrency(jurisdiction.totalCreditAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* State wise Summary Tab */}
      <TabPanel value={currentTab} index={1}>
        <Box className='p-4'>
          <Card elevation={1}>
            <CardContent>
              <Typography variant='h6' component='h3' className='mb-3'>
                State wise Summary
              </Typography>
              <TableContainer component={Paper} className='bg-gray-50'>
                <Table size='small'>
                  <TableHead className='bg-gray-100'>
                    <TableRow>
                      <TableCell className='font-medium'>State</TableCell>
                      <TableCell className='font-medium'>Projects</TableCell>
                      <TableCell className='font-medium'>FTE Cost</TableCell>
                      <TableCell className='font-medium'>
                        Sub Con Cost
                      </TableCell>
                      <TableCell className='font-medium'>
                        Non Labor Cost
                      </TableCell>
                      <TableCell className='font-medium'>
                        Total Credits
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>New York</TableCell>
                      <TableCell>15</TableCell>
                      <TableCell>{formatCurrency(5862750)}</TableCell>
                      <TableCell>{formatCurrency(3486112)}</TableCell>
                      <TableCell>{formatCurrency(96200)}</TableCell>
                      <TableCell>{formatCurrency(9445062)}</TableCell>
                    </TableRow>
                    <TableRow className='bg-gray-50'>
                      <TableCell>California</TableCell>
                      <TableCell>22</TableCell>
                      <TableCell>{formatCurrency(6972175)}</TableCell>
                      <TableCell>{formatCurrency(3962100)}</TableCell>
                      <TableCell>{formatCurrency(112400)}</TableCell>
                      <TableCell>{formatCurrency(11046675)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Texas</TableCell>
                      <TableCell>18</TableCell>
                      <TableCell>{formatCurrency(5148600)}</TableCell>
                      <TableCell>{formatCurrency(2860000)}</TableCell>
                      <TableCell>{formatCurrency(85000)}</TableCell>
                      <TableCell>{formatCurrency(8093600)}</TableCell>
                    </TableRow>
                    <TableRow className='bg-gray-50'>
                      <TableCell>Massachusetts</TableCell>
                      <TableCell>12</TableCell>
                      <TableCell>{formatCurrency(2615000)}</TableCell>
                      <TableCell>{formatCurrency(1940000)}</TableCell>
                      <TableCell>{formatCurrency(97000)}</TableCell>
                      <TableCell>{formatCurrency(4652000)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Other States</TableCell>
                      <TableCell>24</TableCell>
                      <TableCell>{formatCurrency(22887250)}</TableCell>
                      <TableCell>{formatCurrency(13609124)}</TableCell>
                      <TableCell>{formatCurrency(3906000)}</TableCell>
                      <TableCell>{formatCurrency(40402374)}</TableCell>
                    </TableRow>
                    <TableRow className='bg-gray-100 font-medium'>
                      <TableCell>Total</TableCell>
                      <TableCell>91</TableCell>
                      <TableCell>{formatCurrency(43485775)}</TableCell>
                      <TableCell>{formatCurrency(25857336)}</TableCell>
                      <TableCell>{formatCurrency(4296600)}</TableCell>
                      <TableCell>{formatCurrency(75639711)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Project Cost Tab */}
      <TabPanel value={currentTab} index={2}>
        <Box className='p-4'>
          <Card elevation={1}>
            <CardContent>
              <Typography variant='h6' component='h3' className='mb-3'>
                Project Cost Breakdown
              </Typography>
              <TableContainer component={Paper} className='bg-gray-50'>
                <Table size='small'>
                  <TableHead className='bg-gray-100'>
                    <TableRow>
                      <TableCell className='font-medium'>Project ID</TableCell>
                      <TableCell className='font-medium'>
                        Project Name
                      </TableCell>
                      <TableCell className='font-medium'>FTE Cost</TableCell>
                      <TableCell className='font-medium'>
                        Sub Con Cost
                      </TableCell>
                      <TableCell className='font-medium'>
                        Non Labor Cost
                      </TableCell>
                      <TableCell className='font-medium'>Total Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>P001</TableCell>
                      <TableCell>AI Model Development</TableCell>
                      <TableCell>{formatCurrency(1250000)}</TableCell>
                      <TableCell>{formatCurrency(850000)}</TableCell>
                      <TableCell>{formatCurrency(320000)}</TableCell>
                      <TableCell>{formatCurrency(2420000)}</TableCell>
                    </TableRow>
                    <TableRow className='bg-gray-50'>
                      <TableCell>P002</TableCell>
                      <TableCell>ML Framework Optimization</TableCell>
                      <TableCell>{formatCurrency(980000)}</TableCell>
                      <TableCell>{formatCurrency(420000)}</TableCell>
                      <TableCell>{formatCurrency(150000)}</TableCell>
                      <TableCell>{formatCurrency(1550000)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>P003</TableCell>
                      <TableCell>Database Architecture</TableCell>
                      <TableCell>{formatCurrency(870000)}</TableCell>
                      <TableCell>{formatCurrency(320000)}</TableCell>
                      <TableCell>{formatCurrency(95000)}</TableCell>
                      <TableCell>{formatCurrency(1285000)}</TableCell>
                    </TableRow>
                    <TableRow className='bg-gray-50'>
                      <TableCell>P004</TableCell>
                      <TableCell>Cloud Infrastructure</TableCell>
                      <TableCell>{formatCurrency(1100000)}</TableCell>
                      <TableCell>{formatCurrency(750000)}</TableCell>
                      <TableCell>{formatCurrency(410000)}</TableCell>
                      <TableCell>{formatCurrency(2260000)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>P005</TableCell>
                      <TableCell>Quantum Computing Research</TableCell>
                      <TableCell>{formatCurrency(1450000)}</TableCell>
                      <TableCell>{formatCurrency(920000)}</TableCell>
                      <TableCell>{formatCurrency(520000)}</TableCell>
                      <TableCell>{formatCurrency(2890000)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant='body2' className='mt-3 text-gray-600'>
                * Showing 5 of 91 projects. For complete list, use export
                feature.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Resource Cost Tab */}
      <TabPanel value={currentTab} index={3}>
        <Box className='p-4'>
          <Card elevation={1}>
            <CardContent>
              <Typography variant='h6' component='h3' className='mb-3'>
                Resource Cost Analysis
              </Typography>
              <TableContainer component={Paper} className='bg-gray-50'>
                <Table size='small'>
                  <TableHead className='bg-gray-100'>
                    <TableRow>
                      <TableCell className='font-medium'>
                        Resource Type
                      </TableCell>
                      <TableCell className='font-medium'>Count</TableCell>
                      <TableCell className='font-medium'>Hours</TableCell>
                      <TableCell className='font-medium'>
                        Average Rate
                      </TableCell>
                      <TableCell className='font-medium'>Total Cost</TableCell>
                      <TableCell className='font-medium'>% of Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Software Engineer</TableCell>
                      <TableCell>180</TableCell>
                      <TableCell>354000</TableCell>
                      <TableCell>{formatCurrency(85)}/hr</TableCell>
                      <TableCell>{formatCurrency(30090000)}</TableCell>
                      <TableCell>48.5%</TableCell>
                    </TableRow>
                    <TableRow className='bg-gray-50'>
                      <TableCell>Data Scientist</TableCell>
                      <TableCell>95</TableCell>
                      <TableCell>186200</TableCell>
                      <TableCell>{formatCurrency(95)}/hr</TableCell>
                      <TableCell>{formatCurrency(17689000)}</TableCell>
                      <TableCell>28.5%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Project Manager</TableCell>
                      <TableCell>45</TableCell>
                      <TableCell>88200</TableCell>
                      <TableCell>{formatCurrency(110)}/hr</TableCell>
                      <TableCell>{formatCurrency(9702000)}</TableCell>
                      <TableCell>15.6%</TableCell>
                    </TableRow>
                    <TableRow className='bg-gray-50'>
                      <TableCell>Cloud Architect</TableCell>
                      <TableCell>35</TableCell>
                      <TableCell>68600</TableCell>
                      <TableCell>{formatCurrency(125)}/hr</TableCell>
                      <TableCell>{formatCurrency(8575000)}</TableCell>
                      <TableCell>13.8%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>UX Designer</TableCell>
                      <TableCell>25</TableCell>
                      <TableCell>49000</TableCell>
                      <TableCell>{formatCurrency(90)}/hr</TableCell>
                      <TableCell>{formatCurrency(4410000)}</TableCell>
                      <TableCell>7.1%</TableCell>
                    </TableRow>
                    <TableRow className='bg-gray-50'>
                      <TableCell>QA Engineer</TableCell>
                      <TableCell>80</TableCell>
                      <TableCell>156800</TableCell>
                      <TableCell>{formatCurrency(75)}/hr</TableCell>
                      <TableCell>{formatCurrency(11760000)}</TableCell>
                      <TableCell>19.0%</TableCell>
                    </TableRow>
                    <TableRow className='bg-gray-100 font-medium'>
                      <TableCell>Total</TableCell>
                      <TableCell>460</TableCell>
                      <TableCell>902800</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatCurrency(62226000)}</TableCell>
                      <TableCell>100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>
    </div>
  );
};

export default RDDashboard;
