import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import { useTaskActivityDetails } from '../../../services/activities/activities-service';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import DetailsSection, {
  DetailItem,
} from '../../../../components/details-section/details';
import SectionHeader from '../../../../components/details-section/section-header';
import DetailsSectionSkeleton from '../../../../components/skeleton-component/detailsskeleton';
import { TaskCreateIcon } from '../../../../assets';
import { ActivityType } from '../../../types';

interface TaskDetailsProps {
  accountInActive: boolean;
  tabValue: ActivityType;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({
  accountInActive,
  tabValue,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const activityId = searchParams.get('activity_id') || '';

  const { data, isLoading, error } = useTaskActivityDetails(
    accountId,
    activityId,
    true
  );

  const handleEdit = () => {
    console.log('edit task');
  };

  const handleBackClick = () => {
    searchParams.delete('activity_id');
    searchParams.delete('activity_type');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const headerButtons = [
    {
      label: 'Edit',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: handleEdit,
      sx: { width: '48px', minWidth: '48px' },
    },
    {
      label: tabValue === 'all' ? 'Back To All' : 'Back To Task',
      variant: 'contained' as const,
      onClick: handleBackClick,
      sx: { width: 'auto', px: '9px' },
    },
  ];

  const taskInformation: DetailItem[] = [
    { label: 'Task ID', value: data?.r_number, key: 'r_number' },
    { label: 'Task Status', value: data?.task_status, key: 'task_status' },
    {
      label: 'Created By',
      value: data?.created_by_name,
      key: 'created_by_name',
    },
    { label: 'Due Date', value: data?.due_date, key: 'due_date' },
    { label: 'Related To', value: data?.attached_to, key: 'attached_to' },
    { label: 'Subject', value: data?.subject, key: 'subject' },
  ];

  const descriptionBlock: DetailItem[] = [
    { label: 'Description', value: data?.description, key: 'description' },
  ];

  const auditDetails: DetailItem[] = [
    { label: 'Record ID', value: data?.rid || activityId, key: 'rid' },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(data?.created_datetime),
      key: 'created_datetime',
    },
    {
      label: 'Created By',
      value: data?.created_by_name,
      key: 'created_by_name',
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: data?.modified_by_name,
      key: 'modified_by_name',
    },
  ];

  return (
    <div>
      <SectionHeader
        title='Task'
        subValue={data?.r_number || ''}
        titleIcon={
          <TaskCreateIcon
            alt='task-icon'
            className='w-7 h-7 p-1.5 [&>path]:stroke-white bg-[#2E5AAC] rounded-[2px]'
          />
        }
        className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
        buttons={headerButtons}
      />

      {isLoading ? (
        <DetailsSectionSkeleton className='p-0 m-0' />
      ) : error ? (
        <div className='flex items-center justify-center h-64 p-4'>
          <Typography variant='h6' color='error'>
            Error loading task details
          </Typography>
        </div>
      ) : (
        <>
          <DetailsSection
            title='Task Information'
            data={taskInformation}
            customStyle='pt-0 mt-0'
          />
          <DetailsSection
            title=''
            data={descriptionBlock}
            fullColumn={true}
            customStyle='pt-[1px]'
          />
          <DetailsSection
            title='Audit Information'
            data={auditDetails}
            isAudit={true}
            customStyle='pt-0 mt-0'
          />
        </>
      )}
    </div>
  );
};

export default TaskDetails;
