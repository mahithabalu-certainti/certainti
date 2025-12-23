import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  downloadImportFailureData,
  useImportDetails,
} from '../../../../../services/import';
import DetailsSectionSkeleton from '../../../../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';
import DetailsSection, {
  DetailItem,
} from '../../../../../../components/details-section/details';
import SectionHeader from '../../../../../../components/details-section/section-header';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../../common-utils';
import { FailureType, ImportEntityType } from '../../../../../types/imports';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { AllPermissions } from '../../../../../../common-service';
import { ImportsIcon } from '../../../../../../assets';

interface ImportDetailsProps {
  handleBackClick: () => void;
}

const ImportDetails: React.FC<ImportDetailsProps> = ({ handleBackClick }) => {
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get('file_id') || undefined;
  const { permission } = useSelector((state: RootState) => state.permission);

  const { data, isLoading, error } = useImportDetails(accountid, fileId);

  const handleExportFailureData = (
    type: FailureType,
    entity: ImportEntityType
  ) => {
    downloadImportFailureData(accountid || '', fileId || '', type, entity);
  };

  const importsViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.IMPORTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    importsViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [importsViewEditFields]);

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
    // {
    //   label: 'Import Type',
    //   value: data?.import_type,
    //   key: 'import_type',
    // },
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
      value: data?.records_with_warning ? (
        <span
          className='cursor-pointer no-underline hover:underline text-[#1755E7] font-semibold'
          onClick={() =>
            handleExportFailureData(
              'warnings',
              data?.entity as ImportEntityType
            )
          }
        >
          View Warning
          {`(${data?.records_with_warning})`}
        </span>
      ) : (
        '-'
      ),
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
  const headerButtons = [
    {
      label: 'Back To Imports',
      variant: 'contained' as const,
      onClick: () => handleBackClick(),
      sx: { width: '125px', minWidth: '125px' },
    },
  ];

  const basicDetails = applyHidePermission(basicInfo, permissionMap);
  const auditDetails = applyHidePermission(auditInfo, permissionMap);

  return (
    <div className='border border-[#CBD6E2]'>
      <SectionHeader
        title='Imports'
        subValue={data?.r_number}
        className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
        buttons={headerButtons}
        titleIcon={
          <ImportsIcon
            className='[&>path]:stroke-white'
            alt='Imports-header-icon'
          />
        }
        iconBg='#ff73c3'
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
    </div>
  );
};

export default ImportDetails;
