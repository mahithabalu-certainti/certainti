/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { ResourceTabs } from '../resources/resources';
import { useNavigate, useParams } from 'react-router-dom';
import { BUTTON_STYLES } from '../../../../../admin/pages/manage-user-detail/styles';
import ResourceTableHeader from '../resources/resource-table-header';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import {
  AllModules,
  AllPermissions,
  useGetAllDocumentInfo,
  useGetDocumentCategoryType,
} from '../../../../../common-service';
import Uploads from '../../../../../components/Attachments/upload';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  ActivityDropdownItem,
  colorCode,
  ExportType,
  SelectOption,
} from '../../../../types';
import { useAttachmentList } from '../../../../services/attachments/attachments-service';
import {
  AttachmentList,
  AttachmentsListExportParams,
} from '../../../../types/attachment';
import { SectionTabPanel } from '../../../../../components';
import { checkPermission, getFiscalYears } from '../../../../../common-utils';
import {
  getAttachmentsFilterFields,
  getAttachmentTableColumns,
} from '../../../../../components/Attachments/helpers';
import {
  CellEditData,
  FieldChangeEvent,
  FieldChangeValue,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { ATTACHMENT_UPDATE } from '../../../../../api/graphql/queries/attachment-query';
import { resourceClient } from '../../../../../api/graphql/clients/client';
import { useMutation } from '@apollo/client';
import { useToast } from '../../../../../hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { FilterValue } from '../../components/filter/filterType';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { AttachmentsSideIcon } from '../../../../../assets';

const AttachmentTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.ACCOUNT_ATTACHMENT_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

interface AttachmentsProps {
  setExportType?: (type: ExportType) => void;
  setAttachmentParams: React.Dispatch<
    React.SetStateAction<AttachmentsListExportParams>
  >;
  accountInActive: boolean;
  refetchAccountDetails: () => void;
  activityMenuItems: ActivityDropdownItem[];
}

const Attachments: React.FC<AttachmentsProps> = ({
  setExportType,
  setAttachmentParams,
  accountInActive,
  refetchAccountDetails,
  activityMenuItems,
}) => {
  const { errorToast } = useToast();
  const { accountid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshAttachments, setRefreshAttachments] = useState<number>(
    Date.now()
  );
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('document_name');
  const [totalItems, setTotalItems] = useState<number>(0);
  const [attachmentList, setAttachmentList] = useState<AttachmentList[]>([]);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState('');

  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };
  const [updateAttachment] = useMutation(ATTACHMENT_UPDATE, {
    client: resourceClient,
  });
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const { data, isLoading, isError } = useAttachmentList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      attachmentLevel: 'account',
      accountRid: accountid || '',
      entityId: accountid || '',
      search: searchText,
      fiscalYear: convertedFiscalYear,
    },
    refreshAttachments
  );

  useEffect(() => {
    if (data) {
      setTotalItems(data?.count || 0);
      setAttachmentList(data.attachments || []);
    }
  }, [data]);

  useEffect(() => {
    if (setExportType) {
      setExportType('attachments');
    }
    setAttachmentParams({
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      search: searchText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortOrder, appliedFilters, convertedFiscalYear, searchText]);
  const minYear = 1950;
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - minYear + 1);
  const allDocumentInfo = useGetAllDocumentInfo();
  const categoryTypes = useGetDocumentCategoryType(currentCategory);

  const memoizedDocumentTypes: SelectOption[] = useMemo(
    () =>
      categoryTypes.data?.data.documentTypes.map((type) => ({
        label: type.type_name,
        value: type.rid,
      })) || [],
    [categoryTypes.data?.data.documentTypes]
  );

  const memoizedDocumentCategories: SelectOption[] = useMemo(
    () =>
      allDocumentInfo.data?.data.documentCategories.map((category) => ({
        label: category.category_name,
        value: category.rid,
      })) || [],
    [allDocumentInfo.data?.data.documentCategories]
  );

  const showUploads = searchParams.get('attachment_entity') === 'account';

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const onRefreshClick = () => {
    setRefreshAttachments(Date.now());
    refetchAccountDetails();
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
  const handleOpen = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('attachment_entity', 'account');
    navigate({
      pathname: location.pathname,
      search: newParams.toString(),
    });
  };

  const attachmentCreateEnable = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_CREATE
  );

  const headerButtons = [
    {
      label: 'Upload file',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleOpen(),
      sx: { ...BUTTON_STYLES, width: '90px', minWidth: '90px' },
      hide: !attachmentCreateEnable,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { ...BUTTON_STYLES, width: '125px', minWidth: '125px' },
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

  // Permissions
  const attachmentViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ATTACHMENT_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    attachmentViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [attachmentViewEditFields]);

  const attachmentEnable = checkPermission(modules, AllModules.ATTACHMENTS);

  const isAttachmentViewEnable = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_VIEW_EDIT
  );

  const isAttachmentExportEnable = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_EXPORT
  );

  const fieldOptions = {
    fiscalYears: fiscalYears,
    docCategories: memoizedDocumentCategories,
    docTypes: memoizedDocumentTypes,
  };

  const handleDocumentCategory = (rid: string) => {
    setCurrentCategory(rid);
  };
  const handleCategory = (fieldName: string, value: FilterValue) => {
    if (fieldName === 'document_category_rid' && value) {
      setCurrentCategory(String(value));
    }
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

  const attachmentColumns = useMemo(
    () =>
      getAttachmentTableColumns(
        fiscalYears,
        memoizedDocumentCategories,
        memoizedDocumentTypes,
        handleDocumentCategory,
        handleDownload,
        permissionMap,
        isAttachmentExportEnable,
        categoryTypes.isLoading
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memoizedDocumentTypes]
  );

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<AttachmentList>[]
  >(attachmentColumns.filter((col) => !col.hide));

  useEffect(() => {
    const updatedColumns = attachmentColumns.filter((col) => !col.hide);
    setVisibleColumns(updatedColumns);
  }, [memoizedDocumentTypes, attachmentColumns]);

  const handleFieldChange = async (event: FieldChangeEvent) => {
    if (event.columnId === 'document_category' && event.value) {
      setCurrentCategory(String(event.value));
    }
  };

  const attachmentsFilterFields = getAttachmentsFilterFields(
    fieldOptions,
    permissionMap
  );

  const getRowId = (row: AttachmentList) => row.rid;

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousAttachments = [...attachmentList];
    // Find account_id
    const rowData = attachmentList.find((att) => att.rid === rowId);
    if (!rowData) {
      errorToast('Row not found.');
      return;
    }
    // Flags
    let hasDocType = false;
    let hasDocTypeOther = false;
    let hasDocCategory = false;
    let hasDocCategoryOther = false;

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (attach, item) => {
        const key = item.editId || item.columnId;

        attach[key] = key === 'fiscal_year' ? Number(item.value) : item.value;
        if (item.columnId === 'document_type') hasDocType = true;
        if (item.columnId === 'document_type_others') hasDocTypeOther = true;
        if (item.columnId === 'document_category') hasDocCategory = true;
        if (item.columnId === 'document_category_others')
          hasDocCategoryOther = true;

        return attach;
      },
      {
        rid: rowId,
        account_rid: rowData.account_rid,
      }
    );

    if (
      hasDocCategory &&
      hasDocType &&
      !hasDocCategoryOther &&
      !hasDocTypeOther
    ) {
      updateData['document_category_others'] = '';
      updateData['document_type_others'] = '';
    }

    try {
      const res = await updateAttachment({
        variables: { data: updateData },
      });
      const result = res.data?.updateAttachmentInline;
      if (result?.statusCode === 200 && result.data) {
        const updateAttachment = result.data;
        setAttachmentList((prev) =>
          prev.map((att) => {
            if (att.rid === updateAttachment.document_rid) {
              return {
                ...att,
                ...updateAttachment,
              };
            }
            return att;
          })
        );
      } else {
        errorToast(result?.statusMessage || 'Failed to update filed');
        setAttachmentList(previousAttachments);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update filed');
      setAttachmentList(previousAttachments);
    }
  };

  const RestrictedColumns = [
    {
      id: 'document_name',
      canHide: false,
      canDrag: false,
    },
  ];

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<AttachmentList>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'account-attachment-list-column-visibility-popover'
    : undefined;

  if (!attachmentEnable || !isAttachmentViewEnable) return <AccessRestricted />;

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={AttachmentTabs}
        filterMenu={attachmentsFilterFields}
        filterVisibility={showUploads ? false : true}
        showFilter={showFilter}
        contextKey='account-attachments'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={showUploads ? false : true}
        onRefreshClick={onRefreshClick}
        onFilterChange={handleCategory}
        showSearch={showUploads ? false : true}
        onSearch={(text) => setSearchText(text)}
        showAddActivity={showUploads ? false : true}
        activityMenuItems={activityMenuItems}
      />
      {showUploads ? (
        <Uploads
          accountId={accountid}
          attachID={accountid}
          onUploadSuccess={onRefreshClick}
        />
      ) : (
        <>
          <ResourceTableHeader
            value={'attachments'}
            title='Attachments'
            count={totalItems}
            titleIcon={
              <AttachmentsSideIcon
                alt='attachment-header-icon'
                className={`[&>path]:stroke-[${colorCode.accountTextColor}] w-[14px] h-[14px]`}
              />
            }
            headerButtons={headerButtons}
             iconBg={colorCode.accountBgColor}
              bgType='circle'
          />
          <div className='border border-[#CBD6E2]'>
            <ManageColumnsPopover
              anchorEl={columnAnchorEl}
              open={isModalOpen}
              popoverId={modalId}
              onClose={handlePopoverClose}
              columns={attachmentColumns}
              onColumnsChange={handleColumnsChange}
              columnRestrictions={RestrictedColumns}
            />
            <ListTable
              data={attachmentList}
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
              error={isError ? 'Failed to load Attachment data' : undefined}
              rowsPerPageOptions={[25, 50, 100]}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sortBy={sortField}
              sortOrder={sortOrder}
              onSort={handleSortRequest}
              onFieldChange={handleFieldChange}
              onCellEdit={handleCellEdit}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Attachments;
