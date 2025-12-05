import React, { Suspense, useMemo, useState } from 'react';
import { FilterCondition } from '../../../types/manage-user';
import {
  NewFilterIcon,
  RefreshIcon,
  TemplateImportIcon,
} from '../../../../assets';
import { ActionsDropdown, FilterModal } from '../../../../components';
import TextButton from '../../../../components/button/text-button';
import { useNavigate } from 'react-router-dom';
import { EmailTemplateListParams } from '../../../types';
import { EMAIL_TEMPLATES_CREATE } from '../../../../routes';
import { EmailTemplateTable } from './table/email-templates-table';
import { getEmailTemplateFilterFields } from './helpers';
import {
  ExportEmailTemplateList,
  useGetEmailCategory,
} from '../../../service/email-template/email-template-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission } from '../../../../common-utils';
import {
  AllModules,
  AllPermissions,
  useGetStatus,
} from '../../../../common-service';
import { AccessRestricted } from '../../../../components/account-restricted';

const EmailTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterCondition>
  >({});
  const [page, setPage] = useState<number>(1);
  const [tableParams, setTableParams] = useState<EmailTemplateListParams>({
    page: page,
    limit: 100,
    sortBy: 'r_number',
    sortOrder: 'ASC',
  });
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>();
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Permission
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );

  const isEmailTemplatesEnable = checkPermission(
    modules,
    AllModules.EMAIL_TEMPLATES
  );
  const isEmailTemplateCreateEnable = checkPermission(
    permission,
    AllPermissions.EMAIL_TEMPLATES_CREATE
  );
  const isEmailTemplateViewAllEnable = checkPermission(
    permission,
    AllPermissions.EMAIL_TEMPLATES_VIEW_EDIT
  );
  const isEmailTemplateExportEnable = checkPermission(
    permission,
    AllPermissions.EMAIL_TEMPLATES_EXPORT
  );

  const emailTemplateViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.EMAIL_TEMPLATES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    emailTemplateViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [emailTemplateViewEditFields]);

  const emailTemplateStatus = useGetStatus();
  const emailCategory = useGetEmailCategory();

  const statusOptions = useMemo(
    () =>
      emailTemplateStatus.data?.data?.status.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [emailTemplateStatus.data?.data?.status]
  );

  const categoryOptions = useMemo(
    () =>
      emailCategory.data?.data?.categories.map((status) => ({
        label: status.category_name,
        value: status.rid,
      })) || [],
    [emailCategory.data?.data?.categories]
  );

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'email-template-column-visibility-popover'
    : undefined;

  const onRefreshClick = () => {
    setRefreshTrigger(Date.now());
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'email-template-filter-popover' : undefined;

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setTableParams((prev) => ({
        ...prev,
        sortBy: defaultSortField,
        sortOrder: defaultSortOrder,
      }));
    } else {
      setSortFilterCount(1);
      setTableParams((prev) => ({
        ...prev,
        sortBy,
        sortOrder: apiOrder,
      }));
    }
  };

  const MENU_ITEMS = [
    {
      label: 'Export',
      onClick: () =>
        ExportEmailTemplateList({
          ...tableParams,
          filters: appliedFilters,
          timezone: systemTimezone,
        }),
      hide: !isEmailTemplateExportEnable,
    },
  ];

  const emailTemplateFilterfields = getEmailTemplateFilterFields(
    permissionMap,
    statusOptions,
    categoryOptions
  );

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  if (!isEmailTemplatesEnable || !isEmailTemplateViewAllEnable)
    return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <TemplateImportIcon
              alt='email-template-icon'
              className='h-7 w-7 p-1.5 rounded [&>path]:fill-[#fff] [&>path]:stroke-[#EA0084] bg-[#EA0084]'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Admin Template
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Email Templates
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <ActionsDropdown actions={MENU_ITEMS} />
          <button
            className='flex border border-[#CBD6E2] rounded-[2px] w-[24px] h-[23px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </button>
          <TextButton
            label='Create Template'
            hide={!isEmailTemplateCreateEnable}
            onClick={() => navigate(EMAIL_TEMPLATES_CREATE)}
            sx={{
              width: '120px',
              minWidth: '120px',
              maxWidth: '120px',
            }}
          />
        </div>
      </div>

      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
          All Email Templates
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex gap-1 relative'>
            <button
              aria-describedby={modalId}
              className={`w-[120px] h-[24px] mt-1 text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 rounded-[2px] relative border border-[#CBD6E2] px-0 py-0 normal-case ${isModalOpen ? 'bg-[#F3F3F3]' : 'bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'} hover:text-[#425A76] transition-colors duration-150`}
              style={{
                boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
              }}
              onClick={handleColumnVisibility}
            >
              Show/Hide Fields
            </button>
            <button
              aria-describedby={filterId}
              className={`w-[64px] h-[24px] text-[13px] mt-[4px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
              ${isFilterOpen || (appliedFilters && Object.keys(appliedFilters).length > 0) || sortFilterCount > 0 ? 'bg-[#F3F3F3]' : ''}`}
              onClick={handleFilterModal}
            >
              <NewFilterIcon alt='filter-icon' />
              Filter
              {(appliedFilters && Object.keys(appliedFilters).length > 0) ||
              sortFilterCount > 0 ? (
                <div className='absolute -top-[5px] -right-2 w-4 h-4 flex items-center justify-center text-xs'>
                  <span className='absolute w-full h-full bg-[#FF6666] rounded-full animate-ping opacity-75 z-0'></span>
                  <span className='w-4 h-4 bg-[#FF6666] text-white rounded-full flex items-center justify-center z-10 font-semibold'>
                    {(appliedFilters ? Object.keys(appliedFilters).length : 0) +
                      sortFilterCount}
                  </span>
                </div>
              ) : null}
            </button>
            <Suspense fallback={null}>
              <FilterModal
                isOpen={isFilterOpen}
                filterAnchorEl={anchorEl}
                filterId={filterId}
                filterFields={emailTemplateFilterfields}
                setAppliedFilters={(filters) =>
                  setAppliedFilters(filters as Record<string, FilterCondition>)
                }
                setPage={setPage}
                handleCloseFilter={handleCloseFilter}
                handleSorting={handleSorting}
              />
            </Suspense>
          </div>
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <EmailTemplateTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={setTableParams}
          refreshTrigger={refreshTrigger}
          setColumnAnchorEl={setColumnAnchorEl}
          columnAnchorEl={columnAnchorEl}
          statusOptions={statusOptions}
          categoryOptions={categoryOptions}
        />
      </div>
    </div>
  );
};

export default EmailTemplates;
