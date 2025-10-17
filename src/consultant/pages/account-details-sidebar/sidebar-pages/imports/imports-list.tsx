import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AllModules, AllPermissions } from '../../../../../common-service';
import { ResourceTabs } from '../resources/resources';
import React, { useEffect, useMemo, useState } from 'react';
import { ImportsList, ImportsListURLParams } from '../../../../types/imports';
import { getImportsListColumns } from './columns';
import { getImportsFilterFields } from './helpers';
import { SectionTabPanel } from '../../../../../components';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { AccountDetailsResponse, ExportType } from '../../../../types';
import ImportFile from './import-file/import-file';
import {
  useImportListList,
  useTempleteList,
} from '../../../../services/import';
import ImportDetails from './import-details/import-details';
import SectionHeader from '../../../../../components/details-section/section-header';
import {
  ActionsDropdownItem,
  checkPermission,
  getFiscalYears,
} from '../../../../../common-utils';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { ImportsIcon } from '../../../../../assets';
import { ShowHideTableColumn } from '../../../../../components/table/types';

const ImportsTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_IMPORTS_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.ACCOUNT_IMPORTS_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];
interface AccountDetailsProps extends AccountDetailsResponse {
  activeKey: string;
}

interface ImportsProps {
  accountDetails?: AccountDetailsProps;
  setExportType?: (type: ExportType) => void;
  setImportsParams: React.Dispatch<React.SetStateAction<ImportsListURLParams>>;
  accountInActive: boolean;
}

const Imports: React.FC<ImportsProps> = ({
  setExportType,
  setImportsParams,
  accountInActive,
  accountDetails,
}) => {
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshImports, setRefreshImports] = useState<number>(Date.now());
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] = useState<string>('r_number');
  const [importsList, setImportsList] = useState<ImportsList[]>([]);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [searchText, setSearchText] = useState('');

  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );

  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const fileId = searchParams.get('file_id');
  const viewDetails = !!fileId;

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  // Permissions
  const importsEnable = checkPermission(modules, AllModules.IMPORTS);
  const isImportExportEnable = checkPermission(
    permission,
    AllPermissions.IMPORTS_EXPORT
  );
  const importsViewEnable = checkPermission(
    permission,
    AllPermissions.IMPORTS_VIEW_EDIT
  );

  const importViewEditFields = useMemo(
    () =>
      permission?.find((item) => item.name === AllPermissions.IMPORTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    importViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [importViewEditFields]);

  const { data, isLoading, isError } = useImportListList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortOrder,
      filters: appliedFilters,
      account_rid: accountid || '',
      fiscal_year: convertedFiscalYear,
      search: searchText,
    },
    !viewDetails,
    refreshImports
  );
  const { data: TempleteList } = useTempleteList();
  const totalItems = data?.count || 0;
  const minYear = 1950;
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - minYear + 1);

  useEffect(() => {
    if (data) {
      setImportsList(data.imports || []);
    }
  }, [data]);

  useEffect(() => {
    if (setExportType) {
      setExportType('imports');
    }
    setImportsParams({
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortOrder,
      filters: appliedFilters,
      account_rid: accountid || '',
      fiscal_year: convertedFiscalYear,
      search: searchText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortField,
    sortOrder,
    appliedFilters,
    currentPage,
    rowsPerPage,
    convertedFiscalYear,
    searchText,
  ]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const onRefreshClick = () => {
    setRefreshImports(Date.now());
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
    const defaultSortOrder = 'asc';

    if (!sortBy) {
      setSortFilterCount(0);
      setSortOrder(defaultSortOrder);
      setSortField(defaultSortField);
    } else {
      setSortFilterCount(1);
      setSortOrder(sortOrder);
      setSortField(sortBy);
    }
  };

  const showUploads = searchParams.get('upload') === 'true';

  const handleImport = (value: boolean) => {
    if (value) {
      searchParams.set('upload', 'true');
    } else {
      searchParams.delete('upload');
    }
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const menuItems: ActionsDropdownItem[] =
    TempleteList?.map((item) => ({
      label: item.template_name,
      disabled: !item.blob_url,
      onClick: () => {
        if (item.blob_url) {
          handleDownload(item.blob_url);
        }
      },
    })) ?? [];

  const headerButtons = [
    {
      label: 'Import file',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleImport(true),
      sx: { width: '90px', minWidth: '90px' },
      hide: false,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: false,
    },
  ];

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    setSortOrder(sortOrder);
    setSortField(property);
  };

  const handleDownload = (documentUrl: string) => {
    if (!documentUrl) return;

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDocument = (rowId: string) => {
    if (rowId) {
      searchParams.set('file_id', rowId);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const handleBackClick = () => {
    searchParams.delete('file_id');
    searchParams.delete('view_type');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const importsColumns = getImportsListColumns(
    handleDocument,
    handleDownload,
    permissionMap,
    isImportExportEnable
  );

  const importsFilterFields = getImportsFilterFields(
    fiscalYears,
    permissionMap
  );

  const getRowId = (row: ImportsList) => row.rid;

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'account-timesheet-list-column-visibility-popover'
    : undefined;

  const RestrictedColumns = [
    {
      id: 'r_number',
      canHide: false,
      canDrag: false,
    },
  ];

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(importsColumns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(
    importsColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => importsColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  if (!importsEnable || !importsViewEnable) return <AccessRestricted />;

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={ImportsTabs}
        filterMenu={importsFilterFields}
        filterVisibility={showUploads || viewDetails ? false : true}
        showFilter={showFilter}
        contextKey='imports'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={showUploads || viewDetails ? false : true}
        onRefreshClick={onRefreshClick}
        showSearch={viewDetails ? false : true}
        searchDisabled={false}
        searchPlaceholder='Search'
        onSearch={(text) => setSearchText(text)}
      />
      {showUploads ? (
        <ImportFile
          accountNo={accountDetails?.accountById?.r_number}
          accountId={accountid}
          accountInActive={accountInActive}
          onUploadSuccess={onRefreshClick}
          handleShowUpload={() => handleImport(false)}
        />
      ) : viewDetails ? (
        <ImportDetails handleBackClick={handleBackClick} />
      ) : (
        <>
          <SectionHeader
            title='Imports'
            count={totalItems}
            showItemCount={true}
            titleIcon={
              <ImportsIcon
                className='[&>path]:stroke-white'
                alt='Imports-header-icon'
              />
            }
            ActionName='Download Templete'
            actionItems={menuItems}
            buttons={headerButtons}
            iconBg='#af78ff'
            bgType='circle'
          />
          <div className='border border-[#CBD6E2]'>
            <ManageColumnsPopover
              anchorEl={columnAnchorEl}
              open={isModalOpen}
              popoverId={modalId}
              onClose={handlePopoverClose}
              columns={importsColumns}
              onColumnsChange={handleColumnsChange}
              columnRestrictions={RestrictedColumns}
            />
            <ListTable
              data={importsList}
              columns={visibleColumns}
              getRowId={getRowId}
              hoverHighlight={false}
              tableStyle={{
                borderBottom: '1px solid #CBD6E2',
                height: '100%',
                maxHeight: 'calc(100vh - 320px)',
                overflow: 'auto',
              }}
              stickyHeader={true}
              stickyColumnsCount={1}
              selectable={false}
              actionWidth={80}
              actionDisplayMode='dropdown'
              actionMenuItems={[]}
              loading={isLoading}
              error={isError ? 'Failed to load imports records' : undefined}
              rowsPerPageOptions={[25, 50, 100]}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sortBy={sortField}
              sortOrder={sortOrder.toUpperCase() as 'ASC' | 'DESC'}
              onSort={handleSortRequest}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Imports;
