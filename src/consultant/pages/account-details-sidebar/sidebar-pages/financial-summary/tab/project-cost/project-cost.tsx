import React from 'react';
import { ListTable } from '../../../../../../../components/table';
import { FinancialProjectCostList } from '../../../../../../types';
import { getFinancialProjectCostColumns } from './columns';

const FinancialProjectCost: React.FC = () => {
  const getRowId = (row: FinancialProjectCostList) => row?.rid || '';

  return (
    <ListTable
      data={[]}
      columns={getFinancialProjectCostColumns()}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{
        borderBottom: '1px solid #CBD6E2',
        height: '100%',
        maxHeight: 'calc(100vh - 410px)',
        overflow: 'auto',
      }}
      stickyHeader={true}
      stickyColumnsCount={1}
      selectable={false}
      actionWidth={80}
      actionDisplayMode='dropdown'
      rowsPerPageOptions={[25, 50, 100]}
    />
  );
};

export default FinancialProjectCost;
