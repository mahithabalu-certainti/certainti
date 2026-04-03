import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { interactionServiceApi } from '../../../api/api';

export interface MailboxFolder {
  id: string;
  name: string;
  path: string;
  parent_folder_id: string | null;
  child_folder_count: number;
  total_item_count: number;
  unread_item_count: number;
  well_known_name: string | null;
  children: MailboxFolder[];
}

export interface InboxMessageListItem {
  id: string;
  subject: string;
  sender: string;
  sender_email: string;
  to_recipients: { name: string; email: string }[];
  received_datetime: string;
  is_read: boolean;
  has_attachments: boolean;
  body_preview: string;
  importance: string;
  conversation_id: string;
  web_link: string;
}

export interface InboxMessageDetails {
  id: string;
  subject: string;
  sender: string;
  sender_email: string;
  to_recipients: { name: string; email: string }[];
  cc_recipients: { name: string; email: string }[];
  received_datetime: string;
  created_datetime: string;
  modified_datetime: string;
  body: {
    content_type: string;
    content: string;
  };
  body_preview: string;
  is_read: boolean;
  has_attachments: boolean;
  importance: string;
  attachments: {
    id: string;
    name: string;
    content_type: string;
    size: number;
    is_inline: boolean;
  }[];
}

export interface InboxAttachmentDetails {
  id: string;
  name: string;
  content_type: string;
  size: number;
  is_inline: boolean;
  content_bytes: string;
}

export interface MailboxFoldersResponse {
  support_email: string;
  folders: MailboxFolder[];
}

export interface MailboxMessagesResponse {
  support_email: string;
  selected_folder: MailboxFolder | null;
  next_page_token: string | null;
  messages: InboxMessageListItem[];
}

/**
 * Fetches the mailbox folder tree for the supplied account.
 *
 * Input:
 * - `accountRid`: account RID used by the backend to resolve mailbox configuration.
 *
 * Output:
 * - Returns the mailbox owner email and the normalized folder hierarchy.
 */
export const fetchMailboxFolders = async (
  accountRid: string
): Promise<MailboxFoldersResponse> => {
  const { data } = await interactionServiceApi.get<{
    data: MailboxFoldersResponse;
  }>('/api/interactions/mailbox/folders', {
    params: {
      account_rid: accountRid,
    },
  });

  return data.data;
};

/**
 * Fetches mailbox messages for a folder, search term, or pagination cursor.
 *
 * Input:
 * - `params.accountRid`: account RID used to resolve the mailbox.
 * - `params.folderId` / `params.folderPath`: optional folder selection.
 * - `params.limit`: optional page size.
 * - `params.pageToken`: optional pagination token from the previous response.
 * - `params.search`: optional server-side mailbox search text.
 *
 * Output:
 * - Returns mailbox owner details, the selected folder, the next page token, and message rows.
 */
export const fetchMailboxMessages = async (params: {
  accountRid: string;
  folderId?: string;
  folderPath?: string;
  limit?: number;
  pageToken?: string | null;
  search?: string;
}): Promise<MailboxMessagesResponse> => {
  const { data } = await interactionServiceApi.get<{
    data: MailboxMessagesResponse;
  }>('/api/interactions/mailbox/messages', {
    params: {
      account_rid: params.accountRid,
      folderId: params.folderId,
      folderPath: params.folderPath,
      limit: params.limit ?? 50,
      pageToken: params.pageToken || undefined,
      search: params.search || undefined,
    },
  });

  return data.data;
};

/**
 * Fetches full details for a single mailbox message.
 *
 * Input:
 * - `accountRid`: account RID used to resolve the mailbox.
 * - `messageId`: Microsoft Graph message identifier.
 *
 * Output:
 * - Returns the selected message with sender, recipients, body, metadata, and attachment summary data.
 */
export const fetchInboxMessageById = async (
  accountRid: string,
  messageId: string
): Promise<InboxMessageDetails> => {
  const { data } = await interactionServiceApi.get<{
    data: InboxMessageDetails;
  }>(`/api/interactions/mailbox/messages/${encodeURIComponent(messageId)}`, {
    params: {
      account_rid: accountRid,
    },
  });

  return data.data;
};

/**
 * Fetches a single mailbox attachment payload for preview or download.
 *
 * Input:
 * - `accountRid`: account RID used to resolve the mailbox.
 * - `messageId`: parent message identifier.
 * - `attachmentId`: attachment identifier from the message details response.
 *
 * Output:
 * - Returns attachment metadata and inline base64 content when the backend allows it.
 */
export const fetchInboxAttachmentById = async (
  accountRid: string,
  messageId: string,
  attachmentId: string
): Promise<InboxAttachmentDetails> => {
  const { data } = await interactionServiceApi.get<{
    data: InboxAttachmentDetails;
  }>(
    `/api/interactions/mailbox/messages/attachments`,
    {
      params: {
        account_rid: accountRid,
        messageId,
        attachmentId,
      },
    }
  );

  return data.data;
};

/**
 * React Query hook for the mailbox folder tree.
 *
 * Input:
 * - `accountRid`: account RID to load folders for.
 *
 * Output:
 * - Returns the folder query state and normalized mailbox folder data.
 */
export const useMailboxFolders = (accountRid: string) =>
  useQuery<MailboxFoldersResponse, AxiosError>({
    queryKey: ['mailbox-folders', accountRid],
    queryFn: () => fetchMailboxFolders(accountRid),
    enabled: Boolean(accountRid),
    retry: 0,
  });

/**
 * React Query hook for mailbox message pages.
 *
 * Input:
 * - `params`: mailbox account, folder, page token, limit, and search options.
 *
 * Output:
 * - Returns the message query state and a paged mailbox message response.
 */
export const useMailboxMessages = (params: {
  accountRid: string;
  folderId?: string;
  folderPath?: string;
  limit?: number;
  pageToken?: string | null;
  search?: string;
}) =>
  useQuery<MailboxMessagesResponse, AxiosError>({
    queryKey: [
      'mailbox-messages',
      params.accountRid,
      params.folderId,
      params.folderPath,
      params.search,
    ],
    queryFn: () => fetchMailboxMessages(params),
    enabled: Boolean(params.accountRid),
    retry: 0,
  });

/**
 * React Query hook for a single mailbox message detail payload.
 *
 * Input:
 * - `accountRid`: account RID for mailbox resolution.
 * - `messageId`: selected mailbox message identifier.
 *
 * Output:
 * - Returns the detail query state and the selected mailbox message payload.
 */
export const useInboxMessageById = (accountRid: string, messageId?: string) =>
  useQuery<InboxMessageDetails, AxiosError>({
    queryKey: ['account-mailbox-message', accountRid, messageId],
    queryFn: () => fetchInboxMessageById(accountRid, messageId || ''),
    enabled: Boolean(accountRid && messageId),
    retry: 0,
  });
