import { capitalize } from '@mui/material';
import {
  ActivityListExportURLParams,
  ActivityListURLParams,
} from '../../types';

export const ActivityListURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  entityId,
  accountRid,
  attachmentLevel,
  activity_type,
  search,
}: ActivityListURLParams) => {
  const baseUrl = `/api/activities/tasks/list`;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);
  if (attachmentLevel !== undefined) {
    searchParams.set('attachmentLevel', attachmentLevel);
  }
  if (entityId !== undefined) {
    searchParams.set('entityId', entityId);
  }
  if (accountRid !== undefined) {
    searchParams.set('accountRid', accountRid);
  }
  if (activity_type !== undefined) {
    searchParams.set(
      'activityType',
      activity_type === 'call' ? 'Call Log' : capitalize(activity_type)
    );
  }

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (search) {
    searchParams.set('search', search);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const createActivityEmailURL = () => `/api/activities/email/create`;
export const updateActivityEmailURL = () => `/api/activities/email/update`;

export const createActivityMeetingURL = () => `/api/activities/meeting/create`;
export const updateActivityMeetingURL = () => `/api/activities/meeting/update`;
export const cancelActivityMeetingURL = () => `/api/activities/meeting/cancel`;
export const completeActivityMeetingURL = () =>
  `/api/activities/meeting/complete`;

export const createActivityCallURL = () => `/api/activities/call/create`;
export const updateActivityCallURL = () => `/api/activities/call/update`;

export const createActivityTaskURL = () => `/api/activities/task/create`;
export const updateActivityTaskURL = () => `/api/activities/task/update`;

export const getActivityExportListURL = ({
  sortBy,
  sortOrder,
  filters,
  timezone,
  entityId,
  accountRid,
  attachmentLevel,
  search,
  activity_type,
}: ActivityListExportURLParams): string => {
  const baseUrl = '/api/activities/export';
  const searchParams = new URLSearchParams();

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);

  if (attachmentLevel !== undefined) {
    searchParams.set('attachmentLevel', attachmentLevel.toString());
  }
  if (entityId !== undefined) {
    searchParams.set('entityId', entityId.toString());
  }
  if (activity_type !== undefined) {
    searchParams.set(
      'activityType',
      activity_type === 'call' ? 'Call Log' : capitalize(activity_type)
    );
  }
  if (accountRid !== undefined) {
    searchParams.set('accountRid', accountRid.toString());
  }
  if (search) {
    searchParams.set('search', search);
  }
  if (timezone !== undefined) searchParams.set('timezone', timezone);
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
