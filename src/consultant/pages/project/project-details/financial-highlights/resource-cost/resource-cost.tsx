import React, { useState, useEffect } from 'react';
import { ListTable } from '../../../../../../components/table';
import { getFinancialResourceCostColumns } from './columns';
import {
  FinancialResourceCost,
  ResourceCostFinancialHighlightListParams,
} from '../../../../../types';
import { NewProjectData } from '../../../../../types/project';

interface FinancialResourceCostProps {
  projectDetails: NewProjectData | null;
}
const ResourceCost: React.FC<FinancialResourceCostProps> = ({
  projectDetails,
}) => {
  console.log('projectDetails', projectDetails);
  const [tableParams, setTableParams] =
    useState<ResourceCostFinancialHighlightListParams>({
      sortBy: 'project_name',
      sortOrder: 'ASC',
      page: 1,
      limit: 100,
    });
  const getRowId = (row: FinancialResourceCost) => row.rid;

  return (
    <ListTable
      data={[]}
      columns={getFinancialResourceCostColumns()}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{
        height: '100%',
        maxHeight: 'calc(100vh - 290px)',
        overflow: 'auto',
      }}
      stickyHeader={true}
      stickyColumnsCount={1}
      selectable={false}
      actionWidth={80}
      showEmptyRow={false}
      rowsPerPageOptions={[25, 50, 100]}
      totalItems={0}
    />
  );
};

export default ResourceCost;
