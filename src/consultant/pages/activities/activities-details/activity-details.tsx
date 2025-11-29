import React from 'react';
import EmailDetails from './eamil-details';
import { useSearchParams } from 'react-router-dom';
import { ActivityType } from '../../../types';
import MeetingDetails from './meeting-details';
import CallDetails from './call-details';

interface ActivityDetailsProps {
  accountInActive: boolean;
  tabValue: ActivityType;
  entityDetails?: {
    r_number: string;
    module: string;
    source: string;
    fiscalYear?: string | number;
  };
  entityLevel: 'account' | 'case' | 'project';
}

const ActivityDetails: React.FC<ActivityDetailsProps> = ({
  accountInActive,
  tabValue,
  entityDetails,
  entityLevel,
}) => {
  const [searchParams] = useSearchParams();
  const activityType = searchParams.get('activity_type')?.toLowerCase() || '';

  return (
    <div className='border border-t-0 border-[#CBD6E2]'>
      {activityType === 'email' ? (
        <EmailDetails
          accountInActive={accountInActive}
          tabValue={tabValue}
          entityDetails={entityDetails}
          entityLevel={entityLevel}
        />
      ) : activityType === 'meeting' ? (
        <MeetingDetails
          accountInActive={accountInActive}
          tabValue={tabValue}
          entityDetails={entityDetails}
          entityLevel={entityLevel}
        />
      ) : activityType === 'call' ? (
        <CallDetails
          accountInActive={accountInActive}
          tabValue={tabValue}
          entityDetails={entityDetails}
          entityLevel={entityLevel}
        />
      ) : (
        <div>Activity Details</div>
      )}
    </div>
  );
};

export default ActivityDetails;
