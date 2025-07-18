import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AllPermissions } from '../../../../../common-service';
import { ResourceTabs } from '../resources/resources';
import { useEffect, useState } from 'react';
import { ImportsList } from '../../../../types/imports';
import { getImportsListColumns } from './columns';
import { getImportsFilterFields } from './helpers';
import { CellEditData } from '../../../../../components/table/types';
import { SectionTabPanel } from '../../../../../components';
import { ImportIcon } from '../../../../../assets';
import { ListTable } from '../../../../../components/table';
import { AccountDetailsResponse } from '../../../../types';
import ImportFile from './import-file/import-file';
import { useImportListList } from '../../../../services/import';
import ImportDetails from './import-details/import-details';
import SectionHeader from '../../../../../components/details-section/section-header';
import { getFiscalYears } from '../../../../../common-utils';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';

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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] = useState<string>('r_number');
  const [importsList, setImportsList] = useState<ImportsList[]>([]);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [showUploads, setShowUploads] = useState<boolean>(false);

  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const fileId = searchParams.get('file_id');
  const viewDetails = !!fileId;
  //   const [updateImport] = useMutation(IMPORTS_UPDATE, {
  //     client: resourceClient,
  //   });

  const { data, isLoading, isError } = useImportListList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortOrder,
      filters: appliedFilters,
      account_rid: accountid || '',
      fiscalYear: convertedFiscalYear,
    },
    !viewDetails,
    refreshImports
  );
  const totalItems = data?.count || 0;
  const fiscalYears = getFiscalYears(26);

  useEffect(() => {
    if (data) {
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
    setSortOrder(sortOrder);
    setSortField(property);
  };

  const handleDownload = (rowId: string) => {
    console.log('Download clicked', rowId);
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

  const importsColumns = getImportsListColumns(handleDocument, handleDownload);
  const importsFilterFields = getImportsFilterFields(fiscalYears);

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
          <SectionHeader
            title='Imports'
            count={totalItems}
            showItemCount={true}
            titleIcon={<ImportIcon alt='Imports-header-icon' />}
            buttons={headerButtons}
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
              totalItems={0}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sortBy={sortField}
              sortOrder={sortOrder.toUpperCase() as 'ASC' | 'DESC'}
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
