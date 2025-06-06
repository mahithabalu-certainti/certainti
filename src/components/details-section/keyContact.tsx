import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

interface KeyContact {
  keyContactId?: string;
  keyContactName?: string;
  keyContactRole?: string;
  keyContactEmail?: string;
  isPrimaryContact?: boolean;
  includeInCommnunications?: boolean;
  keyContactStatus?: string;
}

const KeyContactSection: React.FC<{ title: string; data: KeyContact[] }> = ({
  title,
  data,
}) => (
  <div>
    <div className='flex items-center align-middle px-6 h-[30px] border border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#F5F9FF]'>
      {title}
    </div>
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            {[
              { label: 'ID', fixedWidth: 180 },
              { label: 'Name', fixedWidth: 220 },
              { label: 'Role', fixedWidth: 230 },
              { label: 'Email', fixedWidth: 230 },
              { label: 'Is Primary Contact?', fixedWidth: 160 },
              { label: 'Include in Communications?', fixedWidth: 200 },
              { label: 'Status', fixedWidth: 80 },
            ].map((col, i) => (
              <TableCell
                key={i}
                sx={{
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '0px 8px',
                  px: i === 0 ? 3.2 : 1,
                  width: col.fixedWidth ? `${col.fixedWidth}px` : 'auto',
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((field, i) => (
            <TableRow key={i} sx={{ height: '28px' }}>
              <TableCell
                sx={{
                  height: '28px',
                  py: 0,
                  px: 3.2,
                  width: '180px',
                }}
              >
                {field.keyContactId || '-'}
              </TableCell>
              <TableCell
                sx={{ height: '28px', padding: '0px 8px', width: '220px' }}
              >
                {field.keyContactName || '-'}
              </TableCell>
              <TableCell
                sx={{ height: '28px', padding: '0px 8px', width: '230px' }}
              >
                {field.keyContactRole || '-'}
              </TableCell>
              <TableCell
                sx={{
                  height: '28px',
                  padding: '0px 8px',
                  textDecoration: field.keyContactEmail ? 'underline' : 'none',
                  textDecorationColor: '#425A76',
                  width: '230px',
                }}
              >
                {field.keyContactEmail || '-'}
              </TableCell>
              <TableCell
                sx={{ height: '28px', padding: '0px 8px', width: '160px' }}
              >
                {field.isPrimaryContact ? 'Yes' : 'No'}
              </TableCell>
              <TableCell
                sx={{ height: '28px', padding: '0px 8px', width: '200px' }}
              >
                {field.includeInCommnunications ? 'Yes' : 'No'}
              </TableCell>
              <TableCell
                sx={{
                  height: '28px',
                  padding: '0px 8px',
                  width: '80px',
                  color:
                    field.keyContactStatus?.toLowerCase() === 'active'
                      ? '#3EA72F'
                      : '#f44336',
                }}
              >
                {field.keyContactStatus?.toLowerCase() === 'active'
                  ? 'Active'
                  : 'In-Active'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
);

export type { KeyContact };
export default KeyContactSection;
