// StateWiseTab.tsx
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

const StateWiseTab: React.FC = () => {
  return (
    <div className='p-4'>
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
                  <TableCell className='font-medium'>Sub Con Cost</TableCell>
                  <TableCell className='font-medium'>Non Labor Cost</TableCell>
                  <TableCell className='font-medium'>Total Credits</TableCell>
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
    </div>
  );
};

export default StateWiseTab;
