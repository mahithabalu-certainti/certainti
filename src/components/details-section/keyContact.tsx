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
              'ID',
              'Name',
              'Role',
              'Email',
              'Is Primary Contact?',
              'Include in Communications?',
              'Status',
            ].map((col, i) => (
              <TableCell
                key={i}
                sx={{ fontWeight: 700, fontSize: '13px', padding: '0px 8px' }}
              >
                {col}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((field, i) => (
            <TableRow key={i}>
              <TableCell>{field.keyContactId || '-'}</TableCell>
              <TableCell>{field.keyContactName || '-'}</TableCell>
              <TableCell>{field.keyContactRole || '-'}</TableCell>
              <TableCell
                sx={{
                  textDecoration: field.keyContactEmail ? 'underline' : 'none',
                  textDecorationColor: '#425A76',
                }}
              >
                {field.keyContactEmail || '-'}
              </TableCell>
              <TableCell>{field.isPrimaryContact ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                {field.includeInCommnunications ? 'Yes' : 'No'}
              </TableCell>
              <TableCell
                sx={{
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
