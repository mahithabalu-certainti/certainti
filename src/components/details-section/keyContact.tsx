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
    <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
      {title}
    </div>
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table>
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
            {[
              { label: 'Key Contact Name', fixedWidth: 200 },
              { label: 'Key Contact Role', fixedWidth: 200 },
              { label: 'Key Contact Email', fixedWidth: 200 },
              { label: 'Is Primary Contact?', fixedWidth: 160 },
              { label: 'Include In Communications?', fixedWidth: 200 },
              { label: 'Key Contact Status', fixedWidth: 160 },
            ].map((col, i) => (
              <TableCell
                key={i}
                sx={{
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '0px 8px',
                  px: i === 0 ? 3.2 : 1,
                  width: col.fixedWidth || 160,
                  minWidth: col.fixedWidth || 160,
                  maxWidth: col.fixedWidth || 160,
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
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
              <TableCell colSpan={8} sx={{ textAlign: 'center', py: 1 }}>
                Key contact information is not available
              </TableCell>
            </TableRow>
          ) : (
            data.map((field, i) => (
              <TableRow key={i} sx={{ height: '28px' }}>
                <TableCell
                  sx={{
                    py: 0,
                    px: 3.2,
                    height: '28px',
                    width: '200px',
                    minWidth: '200px',
                    maxWidth: '200px',
                  }}
                >
                  {field.keyContactName || '-'}
                </TableCell>
                <TableCell
                  sx={{
                    height: '28px',
                    padding: '0px 8px',
                    width: '200px',
                    minWidth: '200px',
                    maxWidth: '200px',
                  }}
                >
                  {field.keyContactRole || '-'}
                </TableCell>
                <TableCell
                  sx={{
                    height: '28px',
                    padding: '0px 8px',
                    textDecoration: field.keyContactEmail
                      ? 'underline'
                      : 'none',
                    textDecorationColor: '#425A76',
                    width: '200px',
                    minWidth: '200px',
                    maxWidth: '200px',
                  }}
                >
                  {field.keyContactEmail || '-'}
                </TableCell>
                <TableCell
                  sx={{
                    height: '28px',
                    padding: '0px 8px',
                    width: '160px',
                    minWidth: '160px',
                    maxWidth: '160px',
                  }}
                >
                  {field.isPrimaryContact ? 'Yes' : 'No'}
                </TableCell>
                <TableCell
                  sx={{
                    height: '28px',
                    padding: '0px 8px',
                    width: '200px',
                    minWidth: '200px',
                    maxWidth: '200px',
                  }}
                >
                  {field.includeInCommnunications === true
                    ? 'Yes'
                    : field.includeInCommnunications === false
                      ? 'No'
                      : '-'}
                </TableCell>
                <TableCell
                  sx={{
                    height: '28px',
                    padding: '0px 8px',
                    width: '160px',
                    minWidth: '160px',
                    maxWidth: '160px',
                    color:
                      field.keyContactStatus?.toLowerCase() === 'active'
                        ? '#3EA72F !important'
                        : '#f44336 !important',
                  }}
                >
                  {field.keyContactStatus?.toLowerCase() === 'active'
                    ? 'Active'
                    : 'In-Active'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
);

export type { KeyContact };
export default KeyContactSection;
