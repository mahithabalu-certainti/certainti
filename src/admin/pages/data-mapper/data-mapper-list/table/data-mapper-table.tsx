import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { FilterCondition } from '../../../../types/manage-user';
import {
  ActionItem,
  CellEditData,
  FieldChangeEvent,
  FieldChangeValue,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { getDataMapperColumns } from './columns';
import { DataMapperListItem, DataMapperListParams } from '../../../../types';
import { generatePath, useNavigate } from 'react-router-dom';
import { DATA_MAPPER_CONFIG, DATA_MAPPER_EDIT } from '../../../../../routes';
import { useDataMapperList } from '../../../../service/data-mapper/data-mapper-service';
import { caseClient } from '../../../../../api/graphql/clients/client';
import { UPDATE_DATA_MAPPER } from '../../../../../api/graphql/queries/data-mapper-query';
import { useToast } from '../../../../../hooks';
import dayjs from 'dayjs';

interface IDataMapperTableProps {
  appliedFilters: Record<string, FilterCondition>;
  tableParams: DataMapperListParams;
  setTableParams: React.Dispatch<React.SetStateAction<DataMapperListParams>>;
  refreshTrigger?: number;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
  countryOptions: { label: string; value: string }[];
  regionOptions: { label: string; value: string }[];
  regionLoading?: boolean;
  setCurrentCountry: React.Dispatch<React.SetStateAction<string>>;
}

export const DataMapperTable: React.FC<IDataMapperTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  refreshTrigger,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
  countryOptions,
  regionOptions,
  regionLoading,
  setCurrentCountry,
}) => {
  const { errorToast } = useToast();
  const navigate = useNavigate();
  const [dataMapperList, setDataMapperList] = useState<DataMapperListItem[]>(
    []
  );
  const [dateRange, setDateRange] = useState<{
    endMin?: string;
    endMax?: string;
  }>({});
  const [updateDataMapper] = useMutation(UPDATE_DATA_MAPPER, {
    client: caseClient,
  });

  const { data, isLoading, isError } = useDataMapperList(
    { ...tableParams, filters: appliedFilters, search: searchValue },
    refreshTrigger
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data?.items) {
      setDataMapperList(data?.items || []);
    }
  }, [data?.items]);

  const getRowId = (row: DataMapperListItem) => row.rid;

  const handleEdit = (row: DataMapperListItem) => {
    const path = generatePath(DATA_MAPPER_EDIT, {
      mapperId: row.rid,
    });
    navigate(path);
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

  const handleDownload = (documentUrl: string) => {
    if (!documentUrl) return;

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = '';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDateRange = (date: string) => {
    // Set minimum end date to the day after the start date
    const nextDay = date ? dayjs(date).add(1, 'day').format('YYYY-MM-DD') : '';
    setDateRange({ endMin: nextDay, endMax: '' });
  };

  const handleFieldChange = async (event: FieldChangeEvent) => {
    if (event.columnId === 'country_name' && event.value) {
      setCurrentCountry(String(event.value));
    }
    if (event.columnId === 'effective_from_date' && event.value) {
      handleDateRange(String(event.value) || '');
    }
  };

  const handleCountry = (country: string) => {
    setCurrentCountry(country);
  };

  const handleConfig = (row: DataMapperListItem) => {
    const path = generatePath(DATA_MAPPER_CONFIG, {
      mapperId: row.rid,
    });
    navigate(path);
  };

  const dataMapperColumns = getDataMapperColumns(
    handleConfig,
    handleDownload,
    countryOptions,
    regionOptions,
    handleCountry,
    dateRange,
    handleDateRange,
    regionLoading
  );

  const actionButtons: ActionItem<DataMapperListItem>[] = [
    {
      label: 'Edit',
      disabled: (row) => row?.status_name?.toLowerCase() === 'initiated',
      onClick: (row) => handleEdit(row),
    },
  ];

  const isModalOpen = Boolean(columnAnchorEl);

  const handlePopoverClose = () => setColumnAnchorEl(null);
  const modalId = isModalOpen
    ? 'data-mapper-list-column-visibility-popover'
    : undefined;

  const RestrictedColumns = [
    { id: 'r_number', canHide: false, canDrag: false },
  ];

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(dataMapperColumns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(
    dataMapperColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = useMemo(
    () =>
      columnOrder
        .map((id) => dataMapperColumns.find((col) => col.id === id)!)
        .filter((col) => columnVisibility[col.id]),
    [columnOrder, columnVisibility, dataMapperColumns]
  );

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousDataList = [...dataMapperList];

    const matchedData = dataMapperList.find((data) => data.rid === rowId);
    if (!matchedData) {
      return;
    }

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (usr, item) => {
        const key = item.editId || item.columnId;
        usr[key] = item.value;
        return usr;
      },
      {
        rid: rowId,
      }
    );

    try {
      const res = await updateDataMapper({
        variables: { data: updateData },
      });
      const result = res.data?.updateDataMapperInline;
      if (result?.statusCode === 200 && result.data) {
        const updatedItem = result.data;
        setDataMapperList((prev) =>
          prev.map((item) =>
            item.rid === updatedItem.rid ? { ...item, ...updatedItem } : item
          )
        );
      } else {
        errorToast(result?.statusMessage || 'Failed to update field');
        setDataMapperList(previousDataList);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update field');
      setDataMapperList(previousDataList);
    }
  };

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={dataMapperColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={dataMapperList}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 190px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={2}
        // Selection
        selectable={false}
        // Actions
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={actionButtons}
        // State
        loading={isLoading}
        error={isError ? 'Failed to load data mappers' : undefined}
        // Pagination
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        // Sorting
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
        onCellEdit={handleCellEdit}
        onFieldChange={handleFieldChange}
      />
    </>
  );
};
