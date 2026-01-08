import React, { useMemo } from 'react';
import ListTable from '../../../../../../../components/table/list-table';
import { ListTableColumn } from '../../../../../../../components/table/types';
import { Tooltip } from '@mui/material';
import { FinancialHighlightsResponse } from '../../../../../../types/dossier';

interface FinancialWorkingProps {
    data: FinancialHighlightsResponse | null;
}

interface FinancialWorkingRow {
    id: string;
    row_label: string;
    Total: number | string | undefined;
    [key: string]: string | number | undefined; 
}

const FinancialWorking: React.FC<FinancialWorkingProps> = ({ data }) => {
    const computedFields = data?.data?.computed_fields;

    // Format value helper function
    const formatValue = (value: string | number | null | undefined) => {
        if (value === 0 || value === '0') {
            return '-';
        }
        if (value === null || value === undefined || value === '') {
            return '';
        }
        // Optional: formatting for numbers if desired, 
        // but strictly following user rule: 0 -> - and null -> empty.
        // Assuming we pass through other values as-is or locale string usually looks better for financial data
        if (typeof value === 'number') {
             return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return value;
    };

    const columns: ListTableColumn<FinancialWorkingRow>[] = useMemo(() => {
        if (!computedFields) return [];

        const columnsList = computedFields.Columns || [];
        const projects = computedFields.Projects || [];

        // 1. First Column: Label from Columns[0]
        // User: "LABOUR has frist column heading"
        const firstColumnHeader = columnsList.length > 0 ? columnsList[0] : '';
        
        const generatedColumns: ListTableColumn<FinancialWorkingRow>[] = [
           {
               id: 'row_label',
               label: (
                   <Tooltip title={firstColumnHeader} placement="top">
                       <span>{firstColumnHeader}</span>
                   </Tooltip>
               ) as React.ReactNode as string,
               width: 200,
               sortId: 'row_label',
               render: (row: FinancialWorkingRow) => <span className="font-semibold text-[#2D3E4F]">{row.row_label}</span>
           } 
        ];

        // 2. Project Columns: From projects array
        // User: "project name ... use that values are are column heading"
        projects.forEach((project, index: number) => {
            const label = project['Project Name'] || `Project ${index + 1}`;
            generatedColumns.push({
                id: project['Project ID'] || `project_${index}`,
                label: (
                    <Tooltip title={label} placement="top">
                        <span className='truncate block max-w-[200px]'>{label}</span>
                    </Tooltip>
                ) as React.ReactNode as string,
                width: 180,
                 sx: {
               textAlign: 'right',
            },
                sortId: project['Project ID'] || `project_${index}`,
                render: (row: FinancialWorkingRow) => {
                    const projectId = project['Project ID'] || `project_${index}`;
                    return <span className="text-[#425A76]">{formatValue(row[projectId])}</span>;
                }
            });
        });

        // 3. Total Column
        // User: "add total for the last column heading"
        generatedColumns.push({
            id: 'Total',
            label: 'Total',
            width: 150,
            sortId: 'Total',
            sx: {
               textAlign: 'right',
            },
            render: (row: FinancialWorkingRow) => <span className="font-bold text-[#2D3E4F]">{formatValue(row.Total)}</span>
        });

        return generatedColumns;

    }, [computedFields]);

    const tableData = useMemo(() => {
        if (!computedFields) return [];

        const columnsList = computedFields.Columns || [];
        const projects = computedFields.Projects || [];
        const total = computedFields.Total || {};

        // User: "remaining column are row in table"
        // We take columns list starting from index 1
        const rowKeys = columnsList.slice(1);

        const data: FinancialWorkingRow[] = rowKeys.map((key: string) => {
            const rowData: FinancialWorkingRow = {
                id: key, // Use the key name as row ID (assuming unique)
                row_label: key,
                Total: total[key]
            };

            // Map each project's value for this key
            projects.forEach((project, pIndex: number) => {
                const projectId = project['Project ID'] || `project_${pIndex}`;
                // "some values are missing in column row add that values are null"
                // Accessing property by key. If missing, it's undefined.
                rowData[projectId] = project[key as keyof typeof project];
            });

            return rowData;
        });

        return data;

    }, [computedFields]);

    const getRowId = (row: FinancialWorkingRow) => {
        return row.id;
    };

    if (!computedFields) {
        return <div className="p-4 text-center text-gray-500">No data available</div>;
    }

    return (
        <div className="w-full h-full overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
            <ListTable
                data={tableData}
                columns={columns}
                getRowId={getRowId}
                showEmptyRow={true}
                actionMenuItems={[]}
                actionWidth={80}
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
