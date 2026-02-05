/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import ListTable from '../../../../../../../components/table/list-table';
import { ListTableColumn } from '../../../../../../../components/table/types';
import TruncateWithTooltip from '../../../../../../../components/truncate-with-tooltip/truncate-with-tooltip';
import {
  FinancialHighlightsResponse,
  FinancialHighlightsComputedFields,
} from '../../../../../../types/dossier';
import { costDisplay } from '../../../../../../../common-utils';

interface FinancialWorkingProps {
  data: FinancialHighlightsResponse | null;
  currencySymbol?: string;
}

interface FinancialWorkingRow {
  id: string;
  row_label: string;
  Total: number | string | undefined;
  [key: string]: string | number | boolean | undefined;
}

const FinancialWorking: React.FC<FinancialWorkingProps> = ({
  data,
  currencySymbol,
}) => {
  const computedFields = data?.data
    ?.computed_fields as FinancialHighlightsComputedFields;
  const symbol = currencySymbol || '$';

  const projects = useMemo(
    () =>
      computedFields && 'Projects' in computedFields
        ? computedFields.Projects
        : [],
    [computedFields]
  );
  const hasProjectCode = useMemo(
    () => projects.some((p) => p['Project Code']),
    [projects]
  );

  const boldRows = useMemo(
    () => (computedFields as any)?.BOLD || [],
    [computedFields]
  );

  // Format value helper function
  const formatValue = (
    value: string | number | boolean | null | undefined,
    currency?: string
  ) => {
    if (value === 0 || value === '0') {
      return '-';
    }
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (typeof value === 'number') {
      return costDisplay(value, currency || '$');
    }
    return value;
  };

  const columns: ListTableColumn<FinancialWorkingRow>[] = useMemo(() => {
    if (!computedFields || !('Columns' in computedFields)) return [];

    const columnsList = computedFields.Columns || [];

    // 1. First Column: Label from Columns[0]
    // User: "LABOUR has frist column heading"
    const firstColumnHeader = hasProjectCode
      ? 'Project Code'
      : columnsList.length > 0
        ? columnsList[0]
        : '';

    const generatedColumns: ListTableColumn<FinancialWorkingRow>[] = [
      {
        id: 'row_label',
        label: (
          <div className='flex items-center w-full min-w-0 overflow-hidden'>
            <TruncateWithTooltip
              text={firstColumnHeader}
              enableCopy={false}
              className='font-bold'
            />
          </div>
        ) as React.ReactNode as string,
        width: 200,
        sortId: 'row_label',
        sticky: true,
        sx: {
          position: 'sticky',
          left: 0,
          background: '#fff',
          padding: '0px 8px 0px 14px !important',
          zIndex: 10,
          borderRight: '1px solid #CBD6E2 !important',
          borderBottom: '1px solid #CBD6E2 !important',
        },
        render: (row: FinancialWorkingRow) => {
          const isBold = boldRows.includes(row.row_label);
          return (
            <TruncateWithTooltip
              text={row.row_label}
              enableCopy={false}
              className={`w-full ${isBold ? 'font-bold text-[#1A2733]' : 'font-semibold text-[#2D3E4F]'}`}
            />
          );
        },
      },
    ];

    // 2. Project Columns: From projects array
    // User: "project name ... use that values are are column heading"
    projects.forEach((project, index: number) => {
      const code = project['Project Code'];
      const name = project['Project Name'];
      const topLabel =
        (hasProjectCode ? code || name : name) || `Project ${index + 1}`;
      const projectId = project['Project ID'] || `project_${index}`;

      generatedColumns.push({
        id: projectId,
        label: (
          <div className='flex items-center justify-center w-full min-w-0 overflow-hidden py-1'>
            <TruncateWithTooltip
              text={topLabel}
              enableCopy={false}
              className='font-bold px-2 text-center'
            />
          </div>
        ) as React.ReactNode as string,
        width: 180,
        // sx: (row?: FinancialWorkingRow) => ({
        //   textAlign: typeof row?.[projectId] === 'number' ? 'right' : 'left',
        // }),
        sortId: projectId,
        render: (row: FinancialWorkingRow) => {
          const value = row[projectId];
          const isBold = boldRows.includes(row.row_label);
          const formattedValue = formatValue(value, symbol);
          return (
            <TruncateWithTooltip
              text={String(formattedValue)}
              enableCopy={false}
              className={`w-full ${isBold ? 'font-bold text-[#1A2733]' : 'text-[#425A76]'}`}
            />
          );
        },
      });
    });

    // 3. Total Column
    // User: "add total for the last column heading"
    generatedColumns.push({
      id: 'Total',
      label: (
        <TruncateWithTooltip
          text='Total'
          enableCopy={false}
          className='font-bold'
        />
      ) as React.ReactNode as string,
      width: 150,
      sortId: 'Total',
      // sx: (row?: FinancialWorkingRow) => ({
      //   textAlign: typeof row?.Total === 'number' ? 'right' : 'left',
      // }),
      render: (row: FinancialWorkingRow) => {
        const isBold = boldRows.includes(row.row_label);
        const formattedValue = formatValue(row.Total, symbol);
        return (
          <TruncateWithTooltip
            text={String(formattedValue)}
            enableCopy={false}
            className={`w-full ${isBold ? 'font-bold text-[#1A2733]' : 'font-bold text-[#2D3E4F]'}`}
          />
        );
      },
    });

    return generatedColumns;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedFields, symbol, projects, hasProjectCode]);

  const tableData = useMemo(() => {
    if (!computedFields || !('Columns' in computedFields)) return [];

    const columnsList = computedFields.Columns || [];
    const total = computedFields.Total || {};

    // User: "remaining column are row in table"
    // We take columns list starting from index 1
    const rowKeys = [...columnsList.slice(1)];

    // Filter out Project Code if it exists in rows and we are showing it in header
    const filteredRowKeys = hasProjectCode
      ? ['Project Name', ...rowKeys.filter((k) => k !== 'Project Code')]
      : rowKeys;

    const data: FinancialWorkingRow[] = filteredRowKeys.map((key: string) => {
      const rowData: FinancialWorkingRow = {
        id: key, // Use the key name as row ID (assuming unique)
        row_label: key,
        Total: total[key],
      };

      // Map each project's value for this key
      projects.forEach((project, pIndex: number) => {
        const projectId = project['Project ID'] || `project_${pIndex}`;
        // Special handling for Project Name row
        if (key === 'Project Name') {
          rowData[projectId] = project['Project Name'];
        } else {
          // Accessing property by key. If missing, it's undefined.
          rowData[projectId] = project[key as keyof typeof project];
        }
      });

      return rowData;
    });

    return data;
  }, [computedFields, projects, hasProjectCode]);

  const getRowId = (row: FinancialWorkingRow) => {
    return row.id;
  };

  if (!data?.data || !computedFields || !('Columns' in computedFields)) {
    return (
      <div className='p-8 text-center text-[#425A76] italic font-medium'>
        No data available
      </div>
    );
  }

  return (
    <div className='w-full h-full overflow-hidden flex flex-col'>
      <div className='flex-1 overflow-auto border-t border-[#CBD6E2]'>
        <ListTable
          data={tableData}
          columns={columns}
          getRowId={getRowId}
          showEmptyRow={true}
          actionMenuItems={[]}
          actionWidth={80}
          stickyColumnsCount={1}
          tableStyle={{
            height: '100%',
            maxHeight: '300px',
            overflow: 'auto',
          }}
        />
      </div>
    </div>
  );
};

export default FinancialWorking;
