import React, { useMemo } from 'react';
import ListTable from '../../../../../../../components/table/list-table';
import { ListTableColumn } from '../../../../../../../components/table/types';

interface FinancialWorkingProps {
    data: any;
}

const FinancialWorking: React.FC<FinancialWorkingProps> = ({ data }) => {
    const computedFields = data?.data?.computed_fields;

    // Format value helper function
    const formatValue = (value: any) => {
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

    const columns: ListTableColumn<any>[] = useMemo(() => {
        if (!computedFields) return [];

        const columnsList = computedFields.Columns || [];
        const projects = computedFields.Projects || [];

        // 1. First Column: Label from Columns[0]
        // User: "LABOUR has frist column heading"
        const firstColumnHeader = columnsList.length > 0 ? columnsList[0] : '';
        
        const generatedColumns: ListTableColumn<any>[] = [
           {
               id: 'row_label',
               label: firstColumnHeader,
               minWidth: 200,
               fixed: true, // often good for the label column
               render: (row: any) => <span className="font-semibold text-[#2D3E4F]">{row.row_label}</span>
           } 
        ];

        // 2. Project Columns: From projects array
        // User: "project name ... use that values are are column heading"
        projects.forEach((project: any, index: number) => {
            generatedColumns.push({
                id: project['Project ID'] || `project_${index}`,
                label: project['Project Name'] || `Project ${index + 1}`,
                minWidth: 150,
                render: (row: any) => {
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
            minWidth: 150,
            render: (row: any) => <span className="font-bold text-[#2D3E4F]">{formatValue(row.Total)}</span>
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

        const data = rowKeys.map((key: string, index: number) => {
            const rowData: any = {
                id: key, // Use the key name as row ID (assuming unique)
                row_label: key,
                Total: total[key]
            };

            // Map each project's value for this key
            projects.forEach((project: any, pIndex: number) => {
                const projectId = project['Project ID'] || `project_${pIndex}`;
                // "some values are missing in column row add that values are null"
                // Accessing property by key. If missing, it's undefined.
                rowData[projectId] = project[key];
            });

            return rowData;
        });

        return data;

    }, [computedFields]);

    const getRowId = (row: any) => {
        return row.id;
    };

    if (!computedFields) {
        return <div className="p-4 text-center text-gray-500">No data available</div>;
    }

    return (
        <div className="w-full">
            <ListTable
                data={tableData}
                columns={columns}
                getRowId={getRowId}
                showEmptyRow={true}
                tableStyle={{
                    '& .MuiTableCell-head': {
                        backgroundColor: '#F5F7FA',
                        color: '#425A76',
                        fontWeight: 600,
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        height: '40px',
                        padding: '8px 16px'
                    },
                    '& .MuiTableCell-body': {
                        fontSize: '13px',
                        color: '#2D3E4F',
                        borderBottom: '1px solid #E5E7EB',
                        height: '40px',
                        padding: '8px 16px'
                    }
                }}
            />
        </div>
    );
};

export default FinancialWorking;
