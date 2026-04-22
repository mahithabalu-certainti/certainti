// ProjectCostTab.tsx
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

const ProjectCostTab: React.FC = () => {
  return (
    <div className='p-4'>
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
                  <TableCell className='font-medium'>Project Name</TableCell>
                  <TableCell className='font-medium'>FTE Cost</TableCell>
                  <TableCell className='font-medium'>Sub Con Cost</TableCell>
                  <TableCell className='font-medium'>Non Labor Cost</TableCell>
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
            * Showing 5 of 91 projects. For complete list, use export feature.
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectCostTab;
