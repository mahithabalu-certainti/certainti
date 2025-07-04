import { AttachmentsListURLParams } from '../../types/attchment';
const baseUrl = import.meta.env.VITE_RESOURCE_URL;
export const AttachmentListURL = ({
  page,
  sortBy,
  sortOrder,
  filters,
  limit,
  accountNumber,
}: AttachmentsListURLParams) => {
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);
  searchParams.set('limit', limit.toString());
  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  return `${baseUrl}/api/attach/list/${accountNumber}/?${searchParams.toString()}`;
};
