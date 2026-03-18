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

export const fetchInboxAttachmentById = async (
  accountRid: string,
  messageId: string,
  attachmentId: string
): Promise<InboxAttachmentDetails> => {
  const { data } = await interactionServiceApi.get<{
    data: InboxAttachmentDetails;
  }>(
    `/api/interactions/mailbox/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`,
    {
      params: {
        account_rid: accountRid,
      },
    }
  );

  return data.data;
};

export const useMailboxFolders = (accountRid: string) =>
  useQuery<MailboxFoldersResponse, AxiosError>({
    queryKey: ['mailbox-folders', accountRid],
    queryFn: () => fetchMailboxFolders(accountRid),
    enabled: Boolean(accountRid),
    retry: 0,
  });

export const useMailboxMessages = (params: {
  accountRid: string;
  folderId?: string;
  folderPath?: string;
  limit?: number;
  pageToken?: string | null;
  search?: string;
}) =>
  useQuery<MailboxMessagesResponse, AxiosError>({
    queryKey: ['mailbox-messages', params],
    queryFn: () => fetchMailboxMessages(params),
    enabled: Boolean(params.accountRid),
    retry: 0,
  });

export const useInboxMessageById = (accountRid: string, messageId?: string) =>
  useQuery<InboxMessageDetails, AxiosError>({
    queryKey: ['account-mailbox-message', accountRid, messageId],
    queryFn: () => fetchInboxMessageById(accountRid, messageId || ''),
    enabled: Boolean(accountRid && messageId),
    retry: 0,
  });
