import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { TruncateWithTooltip } from '../truncate-with-tooltip';

type RowData = {
  [key: string]: unknown;
};

type Column<T> = {
  id: string;
  label: string;
  width?: number;
  hide?: boolean;
  render?: (row: T) => React.ReactNode;
};

interface DetailsTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

const DetailsTable = <T extends RowData>({
  title,
  columns,
  data,
  emptyMessage = 'No data available',
}: DetailsTableProps<T>) => (
  <div>
    <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
      {title}
    </div>
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table>
        {/* Table Head */}
        <TableHead
          sx={{
            '& .MuiTableCell-root': {
              color: '#2a2a2a',
              fontSize: '13px',
              fontWeight: 700,
            },
            '& .MuiTableRow-root > .MuiTableCell-root:last-of-type': {
              borderRight: 'none',
            },
          }}
        >
          <TableRow>
            {columns.map((col, i) => (
              <TableCell
                key={col.id}
                sx={{
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '0px 8px',
                  px: i === 0 ? 3.2 : 1,
                  width: col.width,
                  minWidth: col.width,
                  maxWidth: col.width,
                  display: col.hide ? 'none' : 'table-cell',
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {/* Table Body */}
        <TableBody
          sx={{
            '& .MuiTableCell-root': {
              color: '#425A76',
              fontSize: '13px',
              fontWeight: 500,
            },
            '& .MuiTableRow-root > .MuiTableCell-root:last-of-type': {
              borderRight: 'none',
            },
          }}
        >
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.filter((c) => !c.hide).length}
                sx={{ textAlign: 'center', py: 1 }}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow key={i} sx={{ height: '28px' }}>
                {columns.map((col, j) => (
                  <TableCell
                    key={col.id}
                    sx={{
                      height: '28px',
                      padding: '0px 8px',
                      px: j === 0 ? 3.2 : 1,
                      width: col.width,
                      minWidth: col.width,
                      maxWidth: col.width,
                      display: col.hide ? 'none' : 'table-cell',
                    }}
                  >
                    {col.render ? (
                      col.render(row) || '-'
                    ) : (
                      <TruncateWithTooltip
                        text={String(row[col.id] ?? '-')}
                        maxWidth={(col.width || 160) - 10}
                      >
                        {String(row[col.id] ?? '-')}
                      </TruncateWithTooltip>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
);

export default DetailsTable;
