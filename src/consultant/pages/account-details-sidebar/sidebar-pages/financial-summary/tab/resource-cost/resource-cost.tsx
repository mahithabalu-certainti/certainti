import React from 'react';
import { ListTable } from '../../../../../../../components/table';
import { FinancialResourceCostList } from '../../../../../../types';
import { getFinancialResourceCostColumns } from './columns';
const FinancialResourceCost: React.FC = () => {
  const getRowId = (row: FinancialResourceCostList) => row?.rid || '';
  return (
    <ListTable
      data={[]}
      columns={getFinancialResourceCostColumns()}
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

export default FinancialResourceCost;
