import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useImportDetails } from '../../../../../services/import';
import DetailsSectionSkeleton from '../../../../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';
import DetailsSection, {
  DetailItem,
} from '../../../../../../components/details-section/details';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { ImportDetailsIcon } from '../../../../../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../../../../../common-utils';
import ImportErrorTable from './import-error-table';

interface ImportDetailsProps {
  handleBackClick: () => void;
}
type ViewType = 'basic' | 'warning' | 'failed';

const ImportDetails: React.FC<ImportDetailsProps> = ({ handleBackClick }) => {
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get('file_id') || undefined;
  const [viewType, setViewType] = useState<ViewType>('basic');

  const { data, isLoading, error } = useImportDetails(fileId);

  const headerButtons = [
    {
      label: 'Back',
      variant: 'outlined' as const,
      disabled: false,
      onClick: () => setViewType('basic'),
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
      label: 'Fiscal',
      value: data?.fiscal,
      key: 'fiscal',
    },
    {
      label: 'Records Loaded Successfully',
      value: data?.records_loaded_successfully,
      key: 'records_loaded_successfully',
    },
    {
      label: 'Entity',
      value: data?.entity,
      key: 'entity',
    },
    {
      label: 'Import Type',
      value: data?.import_type,
      key: 'import_type',
    },
    {
      label: 'Records with Warning',
      value: (
        <span
          className='cursor-pointer no-underline hover:underline text-[#1755E7] font-semibold'
          onClick={() => setViewType('warning')}
        >
          View staging failures
          {`(${data?.records_with_warning})`}
        </span>
      ),
      key: 'records_with_warning',
    },
    {
      label: 'Status',
      value: data?.status,
      key: 'status',
    },
    {
      label: 'Status Description',
      value: data?.status_description,
      key: 'status_description',
    },
    {
      label: 'Records Failed to Load',
      value: (
        <span
          className='cursor-pointer no-underline hover:underline text-[#1755E7] font-semibold'
          onClick={() => setViewType('failed')}
        >
          View Load Failures
          {`(${data?.records_failed_to_load})`}
        </span>
      ),
      key: 'records_failed_to_load',
    },
    {
      label: 'Imported By',
      value: data?.imported_by,
      key: 'imported_by',
    },
    {
      label: 'imported_on',
      value: formatDateToYYYYMMDDWithTime(data?.imported_on),
      key: 'imported_on',
    },
  ];

  return (
    <div className='border border-[#CBD6E2]'>
      <SectionHeader
        title='Imports'
        subValue={data?.rid}
        titleIcon={
          <ImportDetailsIcon
            alt='import-header-icon'
            className='bg-[#FF73C3] h-6 w-6 p-1 rounded-[2px]'
          />
        }
        className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
        showBackArrow={viewType === 'basic' ? true : false}
        onBackClick={handleBackClick}
        buttons={headerButtons}
      />
      {isLoading ? (
        <DetailsSectionSkeleton className='p-0 m-0' />
      ) : !isLoading && error ? (
        <div className='flex items-center justify-center h-64 p-4'>
          <Typography variant='h6' color='error' className='mb-2'>
            Error loading import details
          </Typography>
        </div>
      ) : (
        <>
          {viewType === 'basic' ? (
            <DetailsSection
              title='Basic Information'
              data={basicInfo}
              customStyle='pt-0 mt-0'
            />
          ) : (
            <ImportErrorTable fileId={fileId || ''} type={viewType} />
          )}
        </>
      )}
    </div>
  );
};

export default ImportDetails;
