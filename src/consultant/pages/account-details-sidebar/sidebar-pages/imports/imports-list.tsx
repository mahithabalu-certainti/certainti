import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AllPermissions } from '../../../../../common-service';
import { ResourceTabs } from '../resources/resources';
import { useEffect, useState } from 'react';
import { ImportsList } from '../../../../types/imports';
import { getImportsListColumns } from './columns';
import { getImportsFilterFields } from './helpers';
import { CellEditData } from '../../../../../components/table/types';
import { SectionTabPanel } from '../../../../../components';
import ResourceTableHeader from '../resources/resource-table-header';
import { ImportIcon } from '../../../../../assets';
import { ListTable } from '../../../../../components/table';
import { AccountDetailsResponse } from '../../../../types';
import ImportFile from './import-file/import-file';
import { useImportListList } from '../../../../services/import';
import ImportDetails from './import-details/import-details';

const ImportsTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_IMPORTS_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.ACCOUNT_IMPORTS_TIMELINE,
    name: 'Timeline',
    hide: false,
    disable: true,
  },
];
interface AccountDetailsProps extends AccountDetailsResponse {
  activeKey: string;
}

interface ImportsProps {
  accountDetails?: AccountDetailsProps;
  //   setExportType?: (
  //     type: 'resource' | 'cost' | 'skill' | 'project' | 'attachments'
  //   ) => void;
  //   setAttachmentParams: React.Dispatch<
  //     React.SetStateAction<AttachmentsListExportParams>
  //   >;
  accountInActive: boolean;
}

const Imports: React.FC<ImportsProps> = ({
  //   setExportType,
  //   setAttachmentParams,
  accountInActive,
  accountDetails,
}) => {
  // const { errorToast } = useToast();
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshImports, setRefreshImports] = useState<number>(Date.now());
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('document_name');
  const [totalItems, setTotalItems] = useState<number>(0);
  const [importsList, setImportsList] = useState<ImportsList[]>([]);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [showUploads, setShowUploads] = useState<boolean>(false);
  const [viewDetails, setViewDetails] = useState<boolean>(false);
  //   const [updateImport] = useMutation(IMPORTS_UPDATE, {
  //     client: resourceClient,
  //   });

  const { data, isLoading, isError } = useImportListList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      accountId: accountid || '',
    },
    refreshImports
  );

  useEffect(() => {
    if (data) {
      setTotalItems(data?.count || 0);
      setImportsList(data.imports || []);
    }
  }, [data]);

  //   useEffect(() => {
  //     if (setExportType) {
  //       setExportType('attachments');
  //     }
  //     setAttachmentParams({
  //       sortBy: sortField,
  //       sortOrder: sortOrder,
  //       filters: appliedFilters,
  //     });
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, [sortField, sortOrder, appliedFilters]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const onRefreshClick = () => {
    setRefreshImports(Date.now());
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'document_name';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setSortOrder(defaultSortOrder);
      setSortField(defaultSortField);
    } else {
      setSortFilterCount(1);
      setSortOrder(apiOrder);
      setSortField(sortBy);
    }
  };

  const handleImport = () => {
    setShowUploads(!showUploads);
  };

  const headerButtons = [
    {
      label: 'Import file',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleImport(),
      sx: { width: '90px', minWidth: '90px' },
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
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setSortOrder(apiOrder);
    setSortField(property);
  };

  const handleDownload = (rowId: string) => {
    console.log('Download clicked', rowId);
  };

  const handleDocument = (rowId: string) => {
    console.log('clicked', rowId);
    if (rowId) {
      setViewDetails(true);
      searchParams.set('file_id', rowId);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const handleBackClick = () => {
    setViewDetails(false);
    searchParams.delete('file_id');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const importsColumns = getImportsListColumns(handleDocument, handleDownload);
  const importsFilterFields = getImportsFilterFields();

  const getRowId = (row: ImportsList) => row.rid;

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    console.log('Edit data', rowId, updates);
  };

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
      />
      {showUploads ? (
        <ImportFile
          accountNo={accountDetails?.accountById?.r_number}
          accountId={accountid}
          accountInActive={accountInActive}
          onUploadSuccess={onRefreshClick}
          handleShowUpload={handleImport}
        />
      ) : viewDetails ? (
        <ImportDetails handleBackClick={handleBackClick} />
      ) : (
        <>
          <ResourceTableHeader
            value={'imports'}
            title='Imports'
            count={totalItems}
            titleIcon={<ImportIcon alt='Imports-header-icon' />}
            headerButtons={headerButtons}
          />
          <div className='border border-[#CBD6E2]'>
            <ListTable
              data={importsList}
              columns={importsColumns}
              getRowId={getRowId}
              hoverHighlight={false}
              tableStyle={{
                borderBottom: '1px solid #CBD6E2',
                height: '100%',
                maxHeight: 'calc(100vh - 290px)',
                overflow: 'auto',
              }}
              stickyHeader={false}
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
              totalItems={0}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sortBy={sortField}
              sortOrder={sortOrder}
              onSort={handleSortRequest}
              onCellEdit={handleCellEdit}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Imports;
