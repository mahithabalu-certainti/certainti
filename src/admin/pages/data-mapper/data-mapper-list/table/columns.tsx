import { Tooltip } from '@mui/material';
import { DownloadIcon, ErrorInfoIcon } from '../../../../../assets';
import {
  formatDateToYYYYMMDDWithTime,
  getDateFormat,
  REGEX_PATTERNS,
} from '../../../../../common-utils';
import {
  DependencyRowData,
  ListTableColumn,
} from '../../../../../components/table/types';
import { DataMapperListItem } from '../../../../types';
import React from 'react';

export const getDataMapperColumns = (
  handleConfig: (row: DataMapperListItem) => void,
  handleDownload: (documentUrl: string) => void,
  countryOptions: { label: string; value: string }[],
  regionOptions: { label: string; value: string }[],
  onCountryClick: (country: string) => void,
  dateRange: { endMin?: string; endMax?: string },
  handleDateRange: (date: string) => void,
  regionLoading?: boolean
  // permissionMap?: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<DataMapperListItem>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Form ID',
    width: 140,
    sortable: true,
    sticky: true,
    sx: {
      position: 'sticky',
      left: 32,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    // hide:
    //   !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
  {
    id: 'form_name',
    editId: 'form_name',
    sortId: 'form_name',
    label: 'Name',
    width: 200,
    sortable: true,
    editable: true,
    // hide:
    //   !permissionMap?.['form_name']?.read &&
    //   !permissionMap?.['form_name']?.edit,
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Name',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_3,
          errorMessage: 'Name must be more than 2 characters long',
        },
        {
          regex: REGEX_PATTERNS.MAX_64,
          errorMessage: 'Name must not exceed 64 characters',
        },
        {
          regex: REGEX_PATTERNS.TEMPLATE_NAME_REGEX,
          errorMessage:
            "Name must contain only letters, numbers, spaces, apostrophes('), and hyphens(-).",
        },
      ],
    },
  },
  {
    id: 'document_name',
    sortId: 'document_name',
    label: 'Document Name',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['document_name']?.read &&
    //   !permissionMap?.['document_name']?.edit,
  },
  {
    id: 'format',
    sortId: 'format',
    label: 'Format',
    width: 90,
    sortable: false,
    // hide: !permissionMap?.['format']?.read && !permissionMap?.['format']?.edit,
  },
  {
    id: 'size_in_mb',
    sortId: 'size_in_mb',
    label: 'Size (MB)',
    width: 105,
    sortable: true,
    // hide:
    //   !permissionMap?.['size_in_mb']?.read &&
    //   !permissionMap?.['size_in_mb']?.edit,
  },
  {
    id: 'country_name',
    editId: 'country_rid',
    sortId: 'country_name',
    label: 'Country',
    width: 140,
    sortable: true,
    editable: true,
    // hide:
    //   !permissionMap?.['country_name']?.read &&
    //   !permissionMap?.['country_name']?.edit,
    field: {
      type: 'select',
      required: true,
      placeholder: 'Choose Country',
      options: countryOptions,
      resetDependentFields: ['state_name'],
      onChange: true,
      getFieldData: (rowData: DependencyRowData) => {
        onCountryClick(String(rowData.country_rid || ''));
        return String(rowData.country_rid || '');
      },
      dependencies: [
        {
          dependsOn: 'state_name',
          condition: (value) => !value,
          action: 'enable',
          message: '',
        },
      ],
    },
  },
  {
    id: 'state_name',
    editId: 'state_rid',
    sortId: 'state_name',
    label: 'Region',
    width: 140,
    sortable: true,
    editable: true,
    // hide:
    //   !permissionMap?.['state_name']?.read &&
    //   !permissionMap?.['state_name']?.edit,
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Region',
      options: regionOptions,
      loading: regionLoading,
      getFieldData: (rowData: DependencyRowData) => {
        return String(rowData.state_rid || '');
      },
      dependencies: [
        {
          dependsOn: 'country_name',
          condition: (value) => !value,
          action: 'enable',
          message: '',
        },
      ],
    },
  },
  {
    id: 'effective_from_date',
    editId: 'effective_from_date',
    sortId: 'effective_from_date',
    label: 'Effective From Date',
    sortable: true,
    editable: true,
    width: 165,
    // hide:
    //   !permissionMap?.['effective_from_date']?.read &&
    //   !permissionMap?.['effective_from_date']?.edit,
    render: (row) =>
      row.effective_from_date ? getDateFormat(row.effective_from_date) : '-',
    field: {
      type: 'date',
      required: true,
      placeholder: 'YYYY-MM-DD',
      onChange: true,
      dateConfig: {
        disableFutureDates: false,
        startFieldId: 'effective_from_date',
        endFieldId: 'effective_to_date',
        startFieldLabel: 'Effective From Date',
        endFieldLabel: 'Effective To Date',
        bothStartEndRequireValidate: false,
      },
      getFieldData: (rowData: DependencyRowData) => {
        handleDateRange?.(String(rowData.effective_from_date) || '');
        return String(rowData.effective_from_date) || '';
      },
      resetDependentFields: ['effective_to_date'],
      dependencies: [
        {
          dependsOn: ['effective_to_date'],
          action: 'enable',
          condition: (value) => !value,
          message: '',
        },
      ],
    },
  },
  {
    id: 'effective_to_date',
    editId: 'effective_to_date',
    sortId: 'effective_to_date',
    label: 'Effective To Date',
    sortable: true,
    editable: true,
    width: 160,
    // hide:
    //   !permissionMap?.['effective_to_date']?.read &&
    //   !permissionMap?.['effective_to_date']?.edit,
    render: (row) =>
      row.effective_to_date ? getDateFormat(row.effective_to_date) : '-',
    field: {
      type: 'date',
      required: false,
      placeholder: 'YYYY-MM-DD',
      dateConfig: {
        disableFutureDates: false,
        startFieldId: 'effective_from_date',
        endFieldId: 'effective_to_date',
        startFieldLabel: 'Effective From Date',
        endFieldLabel: 'Effective To Date',
        minDate: dateRange.endMin || '',
        bothStartEndRequireValidate: false,
      },
      getFieldData: (rowData: DependencyRowData) => {
        handleDateRange?.(String(rowData.effective_from_date) || '');
        return String(rowData.effective_to_date) || '';
      },
      dependencies: [
        {
          dependsOn: ['effective_from_date'],
          action: 'enable',
          condition: (_, rowData) => {
            const startDate = rowData.effective_from_date;
            return !startDate;
          },
          message: '',
        },
      ],
    },
  },
  {
    id: 'status_name',
    sortId: 'status_name',
    label: 'Status',
    width: 120,
    sortable: true,
    render: (row) => {
      const failedStatus = row?.status_name?.toLowerCase() === 'failed';
      return (
        <div>
          {failedStatus && (
            <Tooltip
              title={row.error_message || ''}
              disableHoverListener={!failedStatus}
              arrow
              placement='top'
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: '#FEF2F2',
                    mr: 1,
                  },
                },
              }}
            >
              <span className='h-[20px] w-5 flex items-center justify-center absolute -top-1 -right-1 cursor-pointer'>
                <React.Suspense fallback={null}>
                  <ErrorInfoIcon alt='error' className='w-4 h-3' />
                </React.Suspense>
              </span>
            </Tooltip>
          )}
          {row.status_name || '-'}
        </div>
      );
    },
    // hide:
    //   !permissionMap?.['status_name']?.read &&
    //   !permissionMap?.['status_name']?.edit,
  },
  {
    id: 'created_by_name',
    sortId: 'created_by_name',
    label: 'Created By',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['created_by_name']?.read &&
    //   !permissionMap?.['created_by_name']?.edit,
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: 200,
    sortable: true,
    render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
    // hide:
    //   !permissionMap?.['created_datetime']?.read &&
    //   !permissionMap?.['created_datetime']?.edit,
  },
  {
    id: 'modified_by_name',
    sortId: 'modified_by_name',
    label: 'Updated By',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['modified_by_name']?.read &&
    //   !permissionMap?.['modified_by_name']?.edit,
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Updated On',
    width: 200,
    sortable: true,
    render: (row) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
    // hide:
    //   !permissionMap?.['modified_datetime']?.read &&
    //   !permissionMap?.['modified_datetime']?.edit,
  },
  {
    id: 'config',
    sortId: 'config',
    label: 'Config',
    width: 90,
    sortable: false,
    render: (row) => {
      const enableConfig = row?.status_name?.toLowerCase() === 'completed';
      return (
        <span
          onClick={() => {
            if (enableConfig) {
              handleConfig(row);
            }
          }}
          className={`${
            enableConfig
              ? 'cursor-pointer !text-[#1755E7] underline hover:text-[#1755E7]'
              : 'cursor-default text-gray-500 underline'
          }`}
        >
          Config
        </span>
      );
    },
  },
  {
    id: 'attachment',
    sortId: 'attachment',
    label: 'Attachment',
    width: 90,
    hide: false,
    render: (row) =>
      row?.browse_file ? (
        <button
          className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
          onClick={() => handleDownload?.(row.browse_file)}
        >
          <DownloadIcon alt='download-icon' className='h-4' />
        </button>
      ) : (
        <div className='text-center'>-</div>
      ),
  },
];
