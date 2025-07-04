/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Attachment } from '../../../../../assets';
import { AllPermissions } from '../../../../../common-service';
import { ResourceTabs } from '../resources/resources';
import TabPanel from '../../components/tab';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { BUTTON_STYLES } from '../../../../../admin/pages/manage-user-detail/styles';
import ResourceTableHeader from '../resources/resource-table-header';
import { ListTable } from '../../../../../components/table';
import { AttachmentList } from '../../../../types/attchment';
import { getAttachmentColumns } from './column';
import { attachmentresponse } from './mock-response';
import UploadPopup from './model';
import { useNavigate } from 'react-router-dom';
import { ATTACHMENTUPLOADS, RESOURCE } from '../../../../../routes';
const AttachmentTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_PROJECTS_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.ACCOUNT_PROJECTS_TIMELINE,
    name: 'Timeline',
    hide: false,
    disable: true,
  },
];
const Attachments = () => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [Tabs, setTabs] = useState(AttachmentTabs);
  const [refreshProjectsTrigger, setRefreshProjectsTrigger] = useState<number>(
    Date.now()
  );
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('project_code');
  const [totalItems, setTotalItems] = useState<number>(0);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const onRefreshClick = () => {
    setRefreshProjectsTrigger(Date.now());
  };
  const { permission } = useSelector((state: RootState) => state.permission);
  useEffect(() => {
    const isHide = (tab: ResourceTabs) => {
      return (
        !permission?.find((item) => item.name === tab.id)?.is_enabled || false
      );
    };
    // updated sub tabs(Overview, Timeline)
    setTabs(
      AttachmentTabs.map((tab) => ({
        ...tab,
        hide: isHide(tab),
      }))
    );
  }, [permission]);
  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'project_code';
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
    // console.log('upload files');
    // setIsOpen(true);   commads for model is not use need to remove
    navigate(ATTACHMENTUPLOADS);
  };
  const handleClose = () => {
    console.log('close upload files');
    setIsOpen(false);
  };
  // setOpen(true);}
  const headerButtons = [
    {
      label: 'Upload files',
      variant: 'outlined' as const,
      disabled: false,
      onClick: () => handleOpen(),
      sx: { ...BUTTON_STYLES, width: '100px', minWidth: '100px' },
      hide: false,
    },
  ];
  const getRowId = (row: AttachmentList) => row.rid;
  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: (row: any) => console.log('Summary', row),
      hide: true,
    },
    {
      label: 'Delete',
      onClick: (row: any) => console.log('Activities', row),
      hide: true,
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
  const handleResourceClick = (row: any) => {
    console.log('Resource clicked:', row);
  };
  const attachmentsCloumn = getAttachmentColumns(handleResourceClick);
  const AttachmentList = attachmentresponse;
  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <TabPanel
        value='attachments'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        showFilter={showFilter}
        filterVisibility={true}
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
        resourceTab={Tabs}
        showRefresh={true}
        onRefreshClick={onRefreshClick}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
      />
      <ResourceTableHeader
        value={'attachments'}
        title='Attachments'
        count={attachmentsCloumn.length}
        titleIcon={<Attachment alt='attachment-header-icon' />}
        headerButtons={headerButtons}
      />
      <div className='border border-[#CBD6E2]'>
        <ListTable
          data={AttachmentList}
          columns={attachmentsCloumn}
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
          actionMenuItems={actionMenuItems}
          loading={false}
          // error={erro ? 'Failed to load Attachment data' : undefined}
          rowsPerPageOptions={[25, 50, 100]}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          totalItems={0}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          sortBy={sortField}
          sortOrder={sortOrder}
          onSort={handleSortRequest}
        />
      </div>
      <UploadPopup
        isOpen={isOpen}
        onConfirm={() => console.log('save')}
        onCancel={handleClose}
      />
    </div>
  );
};

export default Attachments;
