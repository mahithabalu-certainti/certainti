import React from 'react';
import EmailDetails from './eamil-details';
import TaskDetails from './task-details';
import { useSearchParams } from 'react-router-dom';
import { ActivityType } from '../../../types';

interface ActivityDetailsProps {
  accountInActive: boolean;
  tabValue: ActivityType;
}

const ActivityDetails: React.FC<ActivityDetailsProps> = ({
  accountInActive,
  tabValue,
}) => {
  const [searchParams] = useSearchParams();
  const activityType = searchParams.get('activity_type')?.toLowerCase() || '';

  return (
    <div className='border border-t-0 border-[#CBD6E2]'>
      {activityType === 'email' ? (
        <EmailDetails accountInActive={accountInActive} tabValue={tabValue} />
      ) : activityType === 'task' ? (
        <TaskDetails accountInActive={accountInActive} tabValue={tabValue} />
      ) : (
        <div>Activity Details</div>
      )}
    </div>
  );
};

export default ActivityDetails;
