import { capitalize } from '@mui/material';
import { ActivityListURLParams } from '../../types';

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
    searchParams.set('activityType', capitalize(activity_type));
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
