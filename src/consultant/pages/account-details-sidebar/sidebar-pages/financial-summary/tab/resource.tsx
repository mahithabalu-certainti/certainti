// ResourceCostTab.tsx
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
import { formatCurrency } from '../utils';

const ResourceCostTab: React.FC = () => {
  return (
    <div className='p-4'>
      <Card elevation={1}>
        <CardContent>
          <Typography variant='h6' component='h3' className='mb-3'>
            Resource Cost Analysis
          </Typography>
          <TableContainer component={Paper} className='bg-gray-50'>
            <Table size='small'>
              <TableHead className='bg-gray-100'>
                <TableRow>
                  <TableCell className='font-medium'>Resource Type</TableCell>
                  <TableCell className='font-medium'>Count</TableCell>
                  <TableCell className='font-medium'>Hours</TableCell>
                  <TableCell className='font-medium'>Average Rate</TableCell>
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
    </div>
  );
};

export default ResourceCostTab;
