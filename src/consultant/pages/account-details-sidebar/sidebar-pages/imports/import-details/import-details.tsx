import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useImportDetails } from '../../../../../services/import';
import DetailsSectionSkeleton from '../../../../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';
import DetailsSection, {
  DetailItem,
} from '../../../../../../components/details-section/details';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { ImportDetailsIcon } from '../../../../../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../../../../../common-utils';
import ImportErrorTable from './table/import-error-table';

interface ImportDetailsProps {
  handleBackClick: () => void;
}
type ViewType = 'basic' | 'warning' | 'failed';

const ImportDetails: React.FC<ImportDetailsProps> = ({ handleBackClick }) => {
  const { accountid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get('file_id') || undefined;

  const initialViewType = (() => {
    const type = searchParams.get('view_type');
    return type === 'warning' || type === 'failed' ? type : 'basic';
  })();
  const [viewType, setViewType] = useState<ViewType>(initialViewType);

  const shouldFetchDetails = viewType === 'basic';
  const { data, isLoading, error } = useImportDetails(
    accountid,
    fileId,
    shouldFetchDetails
  );

  const updateViewType = (newType: ViewType) => {
    const newParams = new URLSearchParams(searchParams);
    if (newType === 'basic') {
      newParams.delete('view_type');
    } else {
      newParams.set('view_type', newType);
    }
    navigate({ search: newParams.toString() }, { replace: true });
    setViewType(newType);
  };

  const headerButtons = [
    {
      label: 'Back',
      variant: 'outlined' as const,
      disabled: false,
      onClick: () => updateViewType('basic'),
      sx: { width: '48px', minWidth: '48px' },
      hide: viewType === 'basic',
    },
  ];

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
          onClick={() => updateViewType('failed')}
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
          onClick={() => updateViewType('warning')}
        >
          View staging failures
          {`(${data.records_failed_to_stage})`}
        </span>
      ) : (
        '-'
      ),
      key: 'records_with_warning',
    },
    // {
    //   label: 'Status Description',
    //   value: data?.status_description,
    //   key: 'status_description',
    // },
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

  return (
    <div className='border border-[#CBD6E2]'>
      <SectionHeader
        title='Imports'
        subValue={data?.r_number}
        titleIcon={
          <ImportDetailsIcon
            alt='import-header-icon'
            className='bg-[#FF73C3] h-[23px] w-[23px] p-1 rounded-[2px]'
          />
        }
        className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
        showBackArrow={viewType === 'basic'}
        onBackClick={handleBackClick}
        buttons={headerButtons}
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
          {viewType === 'basic' ? (
            <>
              <DetailsSection
                title='Basic Information'
                data={basicInfo}
                customStyle='pt-0 mt-0'
              />
              <DetailsSection
                title='Audit Information'
                data={auditInfo}
                customStyle='pt-0 mt-0'
                isAudit={true}
              />
            </>
          ) : (
            <ImportErrorTable fileId={fileId || ''} type={viewType} />
          )}
        </>
      )}
    </div>
  );
};

export default ImportDetails;
