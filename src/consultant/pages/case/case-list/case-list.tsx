/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useToast } from '../../../../hooks';
import { CaseListParams } from '../../../types';
import { EditIcon } from '../../../../assets';
import { ListTable } from '../../../../components/table';
import { ActionItem, CellEditData } from '../../../../components/table/types';
import { getAllCaseListColumns } from './columns';
import { Case, useAllCases } from '../MockData';
import { generatePath, useNavigate } from 'react-router-dom';
import { CASE_DETAILS } from '../../../../routes';

interface ICaseTableProps {
  appliedFilters: Record<string, string | number | boolean>;
  tableParams: CaseListParams;
  isCaseEditEnable?: boolean;
  isCaseDeleteEnable?: boolean;
  setTableParams: React.Dispatch<React.SetStateAction<CaseListParams>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshCasesTrigger?: number;
}

export const CaseListTable: React.FC<ICaseTableProps> = ({
  tableParams,
  setTableParams,
  setTotalCount,
  refreshCasesTrigger,
}) => {
  const { errorToast } = useToast();
  const navigate = useNavigate();
  const [allCaseList, setAllCaseList] = useState<Case[]>([]);

  const { data, isLoading, isError } = useAllCases(
    tableParams,
    refreshCasesTrigger
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setTotalCount(data?.count || 0);
      setAllCaseList(data.cases || []);
    }
  }, [data, setTotalCount]);

  const getRowId = (row: Case) => {
    return row.case_id;
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: apiOrder,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({
      ...prev,
      page: newPage + 1,
    }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setTableParams((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  // const handleCaseIDClick = (caseItem: Case) => {
  //   console.log('Case clicked:', caseItem);
  //   const path = generatePath(CASE_DETAILS, {
  //     caseid: caseItem.case_id,
  //   });
  //   navigate(path);
  // };
  const handleCaseIDClick = (project: any) => {
    const path = generatePath(CASE_DETAILS, {
      caseId: 'DO98335VDBRFU53001',
    });
    // Create query parameter
    const queryParams = new URLSearchParams({
      accountID: project?.account_rid ?? '',
    });

    navigate(`${path}?${queryParams.toString()}`);
  };

  const caseColumns = getAllCaseListColumns(handleCaseIDClick);

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    console.log('Cell edit:', rowId, updates);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('Case updated successfully');
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update case');
    }
  };

  const handleEdit = () => {
    navigate(`/case/edit`);
  };

  const actionButtons: ActionItem<Case>[] = [
    {
      label: 'Edit',
      onClick: () => handleEdit,
      icon: EditIcon,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
      hide: false,
    },
  ];

  return (
    <ListTable
      data={allCaseList}
      columns={caseColumns}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{
        height: '100%',
        maxHeight: 'calc(100vh - 180px)',
        overflow: 'auto',
      }}
      stickyHeader={true}
      stickyColumnsCount={2}
      selectable={true}
      expandable={false}
      onSelectionChange={(selectedIds) => console.log('Selected:', selectedIds)}
      actionWidth={60}
      actionDisplayMode='dropdown'
      actionMenuItems={actionButtons}
      loading={isLoading}
      error={isError ? 'Failed to load cases' : undefined}
      rowsPerPageOptions={[25, 50, 100]}
      rowsPerPage={tableParams.limit}
      currentPage={(tableParams.page ?? 1) - 1}
      totalItems={totalItems}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      sortBy={tableParams.sortBy}
      sortOrder={tableParams.sortOrder}
      onSort={handleSort}
      component='cases'
      onCellEdit={handleCellEdit}
    />
  );
};
