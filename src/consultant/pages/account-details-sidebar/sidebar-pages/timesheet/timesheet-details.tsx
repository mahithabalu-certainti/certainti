import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  downloadTimesheetFailureData,
  useTimesheetDetails,
} from '../../../../services/import';
import DetailsSectionSkeleton from '../../../../../components/skeleton-component/detailsskeleton';
import { Tab, Tabs, Typography } from '@mui/material';
import DetailsSection, {
  DetailItem,
} from '../../../../../components/details-section/details';
import SectionHeader from '../../../../../components/details-section/section-header';
import { TimeSheetIcon } from '../../../../../assets';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../common-utils';
import { FailureType, ImportEntityType } from '../../../../types/imports';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { AllPermissions } from '../../../../../common-service';
import { TabMenus } from '../resources/resources';
import TimesheetProjectTab from './timesheet-details-tab/project-tab/project-tab';
import { ExportType, TimeSheetListURLParams } from '../../../../types';

interface TimesheetDetailsProps {
  handleBackClick: () => void;
  setExportType?: (type: ExportType) => void;
  setTimesheetParams?: React.Dispatch<
    React.SetStateAction<TimeSheetListURLParams>
  >;
  onRefreshClick?: number;

}

const tabs: TabMenus[] = [
  {
    label: 'Details',
    value: 'details',
    hide: false,
    id: AllPermissions.ACCOUNT_TIMESHEET_VIEW,
  },
  {
    label: 'Project',
    value: 'timesheet_project',
    hide: false,
    id: AllPermissions.ACCOUNT_TIMESHEET_PROJECT_VIEW,
  },
  {
    label: 'Resource',
    value: 'timesheet_projectResource',
    hide: false,
    id: AllPermissions.ACCOUNT_TIMESHEET_RESOURCE_VIEW,
  },
  {
    label: 'Project Task',
    value: 'timesheet_projectTask',
    hide: false,
    id: AllPermissions.ACCOUNT_TIMESHEET_PROJECT_TASK_VIEW,
  },
];

const TimesheetDetails: React.FC<TimesheetDetailsProps> = ({
  handleBackClick,
  setExportType,
  onRefreshClick,
}) => {
  const navigate = useNavigate();
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get('timesheet_id') || undefined;
  const { permission } = useSelector((state: RootState) => state.permission);

  const [value, setValue] = useState('details'); // Resource inner tab value

  const { data, isLoading, error } = useTimesheetDetails(accountid, fileId);

  const handleExportFailureData = (
    type: FailureType,
    entity: ImportEntityType
  ) => {
    downloadTimesheetFailureData(accountid || '', fileId || '', type, entity);
  };

  const timesheetViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.TIMESHEET_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    timesheetViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [timesheetViewEditFields]);

  const basicInfo: DetailItem[] = [
    {
      label: 'File Name',
      value: data?.file_name,
      key: 'file_name',
    },
    {
      label: 'Format',
      value: data?.format,
      key: 'format',
    },
    {
      label: 'Total Records',
      value: data?.total_records,
      key: 'total_records',
    },
    {
      label: 'Size',
      value: data?.size,
      key: 'size',
    },
    {
      label: 'Fiscal Year',
      value: data?.fiscal ? `FY-${data?.fiscal}` : '',
      key: 'fiscal',
    },
    {
      label: 'Records Failed to Load',
      value: data?.records_failed_to_load ? (
        <span
          className='cursor-pointer no-underline hover:underline text-[#1755E7] font-semibold'
          onClick={() =>
            handleExportFailureData(
              'loadFailure',
              data?.entity as ImportEntityType
            )
          }
        >
          View Load Failures
          {`(${data.records_failed_to_load})`}
        </span>
      ) : (
        '-'
      ),
      key: 'records_failed_to_load',
    },
    {
      label: 'Entity',
      value: data?.entity,
      key: 'entity',
    },
    {
      label: 'Status',
      value: (
        <span
          className={`font-semibold ${
            data?.status === 'Failed'
              ? 'text-red-600'
              : data?.status === 'Completed'
                ? 'text-green-600'
                : data?.status === 'Processing'
                  ? 'text-yellow-600'
                  : 'text-gray-700'
          }`}
        >
          {data?.status}
        </span>
      ),
      key: 'status',
    },
    {
      label: 'Records Failed to Stage',
      value: data?.records_failed_to_stage ? (
        <span
          className='cursor-pointer no-underline hover:underline text-[#1755E7] font-semibold'
          onClick={() =>
            handleExportFailureData(
              'stagingFailure',
              data?.entity as ImportEntityType
            )
          }
        >
          View staging failures
          {`(${data.records_failed_to_stage})`}
        </span>
      ) : (
        '-'
      ),
      key: 'records_with_warning',
    },
    {
      label: 'Status Description',
      value: data?.status_description,
      key: 'status_description',
    },
    {
      label: 'Records Loaded Successfully',
      value: data?.records_loaded_successfully,
      key: 'records_loaded_successfully',
    },
    {
      label: 'Records with Warning',
      value: data?.records_with_warning,
      key: 'records_with_warning',
    },
  ];

  const auditInfo: DetailItem[] = [
    {
      label: 'Record ID',
      value: data?.rid,
      key: 'rid',
    },
    {
      label: 'Import ID',
      value: data?.r_number,
      key: 'r_number',
    },
    {
      label: 'Imported On',
      value: formatDateToYYYYMMDDWithTime(data?.imported_on),
      key: 'imported_on',
    },
    {
      label: 'Imported By',
      value: data?.imported_by,
      key: 'imported_by',
    },
  ];

  const basicDetails = applyHidePermission(basicInfo, permissionMap);
  const auditDetails = applyHidePermission(auditInfo, permissionMap);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    // update the URL with the tab value
    searchParams.set('tab', newValue);
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  useEffect(() => {
    // update tab when refereshing the page
    const tab = searchParams.get('tab');
    if (tab) {
      setValue(tab);
    }
  }, [searchParams]);

  return (
    <div className='border border-[#CBD6E2]'>
      <SectionHeader
        title='Timesheet'
        subValue={data?.r_number}
        titleIcon={
          <TimeSheetIcon
            className='[&>path]:stroke-white'
            alt='Timesheet-header-icon'
          />
        }
        className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
        showBackArrow={true}
        onBackClick={handleBackClick}
        buttons={[]}
        iconBg='#34CFCA'
        bgType='react'
      />

      {isLoading ? (
        <DetailsSectionSkeleton className='p-0 m-0' />
      ) : error ? (
        <div className='flex items-center justify-center h-64 p-4'>
          <Typography variant='h6' color='error' className='mb-2'>
            Error loading import details
          </Typography>
        </div>
      ) : (
        <>
          <Tabs
            value={value}
            onChange={handleTabChange}
            aria-label='navigation tabs'
            className='border-l-0 border-r-0 border-[1px] pl-4.5 border-solid border-[#CBD6E2]'
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#0B5CAB',
              },
            }}
          >
            {tabs.map((tab, index) => {
              if (tab.hide) return null;
              return (
                <Tab
                  key={index}
                  label={tab.label}
                  value={tab.value}
                  sx={{
                    textTransform: 'none',
                    '&.Mui-selected': {
                      color: '#2D3E4F',
                      fontWeight: 600,
                    },
                  }}
                />
              );
            })}
          </Tabs>
          {value === 'details' && (
            <>
              <DetailsSection
                title='Basic Information'
                data={basicDetails}
                customStyle='pt-0 mt-0'
              />
              <DetailsSection
                title='Audit Information'
                data={auditDetails}
                customStyle='pt-0 mt-0'
                isAudit={true}
              />
            </>
          )}
          {value === 'timesheet_project' && (
              <TimesheetProjectTab
              setExportType={setExportType}
              onRefreshClick={onRefreshClick}
              /> 
          )}
        </>
      )}
    </div>
  );
};

export default TimesheetDetails;
