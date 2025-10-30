import { ListTableColumn } from '../../../../components/table/types';
import { Case } from '../MockData';

export const getAllCaseListColumns = (
  onClick: (caseItem: Case) => void
): ListTableColumn<Case>[] => {
  return [
    {
      id: 'case_id',
      label: 'Case Id',
      width: 120,
      sortable: true,
      sticky: true,
      sortId: 'case_id',
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2 !important',
        borderBottom: '1px solid #CBD6E2 !important',
      },
      render: (row: Case) => (
        <span
          className='cursor-pointer no-underline hover:underline hover:text-[#1755E7] font-medium'
          onClick={() => onClick(row)}
        >
          {row.case_id}
        </span>
      ),
    },
    {
      id: 'case_number',
      label: 'Case Number',
      width: 140,
      sortable: true,
      sortId: 'case_number',
      render: (row: Case) => row.case_number || '-',
    },
    {
      id: 'fiscal_year',
      label: 'Fiscal Year',
      width: 120,
      sortable: true,
      sortId: 'fiscal_year',
      render: (row: Case) => row.fiscal_year?.toString() || '-',
    },
    {
      id: 'case_code',
      label: 'Case Code',
      width: 200,
      sortable: true,
      sortId: 'case_code',
      render: (row: Case) => row.case_code || '-',
    },
    {
      id: 'case_type',
      label: 'Case Type',
      width: 150,
      sortable: true,
      sortId: 'case_type',
      render: (row: Case) => row.case_type || '-',
    },
    {
      id: 'country',
      label: 'Country',
      width: 120,
      sortable: true,
      sortId: 'country',
      render: (row: Case) => row.country || '-',
    },
    {
      id: 'region',
      label: 'Region',
      width: 120,
      sortable: true,
      sortId: 'region',
      render: (row: Case) => row.region || '-',
    },
    {
      id: 'case_owner',
      label: 'Case Owner',
      width: 160,
      sortable: true,
      sortId: 'case_owner',
      render: (row: Case) => row.case_owner || '-',
    },
    {
      id: 'rd_claim',
      label: 'RD Claim',
      width: 120,
      sortable: true,
      sortId: 'rd_claim',
      render: (row: Case) => row.rd_claim || '-',
    },
  ];
};
