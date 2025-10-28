/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import {
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../../components/table/types';
import { AssignProject } from '../../../../../types/assign-projects';
import { ListTable } from '../../../../../../components/table';
import { getSelectProjectColumns } from './column';
import { AllPermissions } from '../../../../../../common-service';
import { RootState } from '../../../../../../store/store';
import { useSelector } from 'react-redux';
import { mockAssignProjects } from './mockdata';
import { useAssingeProjectsList } from '../../../../../services/cases-assign-projects/assign-project-service';

const SelectProjects: React.FC = () => {
  const projectList: any[] = [];

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('interaction_source_name');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  const { permission } = useSelector((state: RootState) => state.permission);
  const projectViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);
  const { data, isLoading, isError } = useAssingeProjectsList({
    page: currentPage + 1,
    limit: rowsPerPage,
    sort: sortField,
    sort_by: sortBy,
  });

  const projectColumns = getSelectProjectColumns(permissionMap);
  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<AssignProject>[]
  >(projectColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<AssignProject>[]
    );
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    setSortBy(apiOrder);
    setSortField(property);
  };
  const getRowId = (row: AssignProject) => row.rid;
  return (
    <div>
      <ListTable
        data={mockAssignProjects || []}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          borderBottom: '1px solid #CBD6E2',
          height: '100%',
          maxHeight: 'calc(100vh - 380px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={1}
        selectable={true}
        onSelectionChange={() => {}}
        onColumnsChange={handleColumnsChange}
        actionWidth={80}
        actionDisplayMode='dropdown'
        actionMenuItems={[]}
        loading={false}
        error={undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        totalItems={mockAssignProjects.length}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={sortField}
        sortOrder={sortBy}
        onSort={handleSortRequest}
      />
    </div>
  );
};

export default SelectProjects;
