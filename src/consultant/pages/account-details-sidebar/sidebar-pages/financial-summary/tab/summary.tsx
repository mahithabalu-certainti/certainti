// SummaryTab.tsx
import {
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';
import { formatCurrency, formatNumber } from '../utils';

// interface SummaryTabProps {
//   resourceMetrics: ResourceMetrics;
//   fteHours: ProjectMetrics;
//   fteCost: ProjectMetrics;
//   subConHours: ProjectMetrics;
//   subConCost: ProjectMetrics;
//   nonLaborCost: ProjectMetrics;
//   jurisdictionCredits: JurisdictionCredits[];
// }

// Mock data integrated directly into the component
const mockFinanceData = {
  fiscalYear: 'FY-2024',
  eligibleProjects: 91,
  resourceMetrics: {
    noOfResources: 0, // Not used in this example as we're displaying in a different way
    fte: 460,
    subCon: 280,
    nonLabor: 37,
  },
  fteHours: {
    projectLevel: 822667,
    projectResourceLevel: 'Not Available',
    projectTaskLevel: 745333,
    approved: 822667,
  },
  fteCost: {
    projectLevel: 30966000,
    projectResourceLevel: 30516333,
    projectTaskLevel: 30516333,
    approved: 30966000,
  },
  subConHours: {
    projectLevel: 542960,
    projectResourceLevel: 537477,
    projectTaskLevel: 537477,
    approved: 537477,
  },
  subConCost: {
    projectLevel: 22804320,
    projectResourceLevel: 22681873,
    projectTaskLevel: 22681873,
    approved: 22681873,
  },
  nonLaborCost: {
    projectLevel: 12843000,
    projectResourceLevel: 9765000,
    projectTaskLevel: 'Not Applicable',
    approved: 9765000,
  },
  jurisdictionCredits: [
    {
      jurisdictionName: 'Federal',
      fteCreditAmount: 22887250,
      subConCreditAmount: 13609124,
      nonLaborCreditAmount: 3906000,
      totalCreditAmount: 40402374,
    },
    {
      jurisdictionName: 'Statewise',
      fteCreditAmount: 20598525,
      subConCreditAmount: 12248212,
      nonLaborCreditAmount: 390600,
      totalCreditAmount: 33237337,
    },
    {
      jurisdictionName: 'Grand Total',
      fteCreditAmount: 43485775,
      subConCreditAmount: 25857336,
      nonLaborCreditAmount: 4296600,
      totalCreditAmount: 75639711,
    },
  ],
};

const SummaryTab: React.FC = () => {
  // Using the mock data directly instead of props
  const {
    resourceMetrics,
    fteHours,
    fteCost,
    subConHours,
    subConCost,
    nonLaborCost,
    jurisdictionCredits,
  } = mockFinanceData;

  return (
    <div className='p-4'>
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
                  <TableCell>{formatNumber(resourceMetrics.subCon)}</TableCell>
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
                  <TableCell className='font-medium'>Project Level</TableCell>
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
                  <TableCell>{formatNumber(fteHours.projectLevel)}</TableCell>
                  <TableCell>
                    {typeof fteHours.projectResourceLevel === 'number'
                      ? formatNumber(fteHours.projectResourceLevel)
                      : fteHours.projectResourceLevel}
                  </TableCell>
                  <TableCell>
                    {formatNumber(fteHours.projectTaskLevel)}
                  </TableCell>
                  <TableCell>{formatNumber(fteHours.approved)}</TableCell>
                </TableRow>
                <TableRow className='bg-gray-50'>
                  <TableCell>FTE Cost</TableCell>
                  <TableCell>{formatCurrency(fteCost.projectLevel)}</TableCell>
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
                  <TableCell>{formatNumber(subConHours.approved)}</TableCell>
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
                  <TableCell>{formatCurrency(subConCost.approved)}</TableCell>
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
                    {typeof nonLaborCost.projectTaskLevel === 'number'
                      ? formatNumber(nonLaborCost.projectTaskLevel)
                      : nonLaborCost.projectTaskLevel}
                  </TableCell>
                  <TableCell>{formatCurrency(nonLaborCost.approved)}</TableCell>
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
                  <TableCell className='font-medium'>RD Credits FTE</TableCell>
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
    </div>
  );
};

export default SummaryTab;
