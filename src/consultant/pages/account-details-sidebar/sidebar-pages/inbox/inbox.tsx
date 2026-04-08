import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Popover,
  Tooltip,
} from '@mui/material';
import type { AxiosError } from 'axios';
import {
  DraftEmailIcon,
  InteractionDetailIcon,
  SearchIcon,
  PaperclipIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
} from '../../../../../assets';
import {
  fetchInboxAttachmentById,
  useInboxMessageById,
  useMailboxFolders,
  useMailboxMessages,
  type InboxMessageListItem,
  type MailboxFolder,
} from '../../../../services/interactions/mailbox-service';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';

type FlattenedMailboxFolder = MailboxFolder & {
  level: number;
};

/**
 * Flattens the nested mailbox folder tree into a list while preserving nesting level.
 *
 * Input:
 * - `folders`: nested mailbox folders from the backend.
 * - `level`: current nesting depth used for indentation.
 *
 * Output:
 * - Returns a flat array of folders with an added `level` property.
 */
const flattenFolders = (
  folders: MailboxFolder[],
  level = 0
): FlattenedMailboxFolder[] =>
  folders.flatMap((folder: MailboxFolder): FlattenedMailboxFolder[] => [
    { ...folder, level },
    ...flattenFolders(folder.children || [], level + 1),
  ]);

/**
 * Chooses the default folder to show when the mailbox first loads.
 *
 * Input:
 * - `folders`: top-level mailbox folder tree.
 *
 * Output:
 * - Returns the inbox folder when available, otherwise the first folder, otherwise `null`.
 */
const findDefaultFolder = (
  folders: MailboxFolder[]
): FlattenedMailboxFolder | null => {
  const allFolders = flattenFolders(folders);
  return (
    allFolders.find(
      (folder: FlattenedMailboxFolder) => folder.well_known_name === 'inbox'
    ) ||
    allFolders[0] ||
    null
  );
};

const FAVORITE_WELL_KNOWN_NAMES = [
  'inbox',
  'drafts',
  'sentitems',
  'deleteditems',
];
const HIDDEN_FOLDER_TOKENS = ['conversationhistory'];
const STATUS_FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
] as const;

type MailboxStatusFilterKey = (typeof STATUS_FILTER_OPTIONS)[number]['key'];

type MailboxFilters = {
  status: MailboxStatusFilterKey;
  hasAttachments: boolean;
  highImportance: boolean;
  from: string;
  to: string;
  receivedFrom: string;
  receivedTo: string;
};

/**
 * Normalizes folder names and well-known names for case-insensitive comparisons.
 *
 * Input:
 * - `value`: raw folder name or well-known token.
 *
 * Output:
 * - Returns a lowercase token with whitespace removed.
 */
const normalizeFolderToken = (value?: string | null) =>
  (value || '').toLowerCase().replace(/\s+/g, '');

/**
 * Normalizes free-text filter input before applying message filters.
 *
 * Input:
 * - `value`: user-entered filter text.
 *
 * Output:
 * - Returns trimmed lowercase text for case-insensitive matching.
 */
const normalizeFilterText = (value: string) => value.trim().toLowerCase();

/**
 * Builds a local start-of-day timestamp for a mailbox date filter.
 *
 * Input:
 * - `dateValue`: date string in `YYYY-MM-DD` format.
 *
 * Output:
 * - Returns the local timestamp representing `00:00:00.000` for that day.
 */
const getStartOfDayTime = (dateValue: string) =>
  new Date(`${dateValue}T00:00:00.000`).getTime();

/**
 * Builds a local end-of-day timestamp for a mailbox date filter.
 *
 * Input:
 * - `dateValue`: date string in `YYYY-MM-DD` format.
 *
 * Output:
 * - Returns the local timestamp representing `23:59:59.999` for that day.
 */
const getEndOfDayTime = (dateValue: string) => {
  return new Date(`${dateValue}T23:59:59.999`).getTime();
};

/**
 * Renders the visual icon for a mailbox folder row.
 *
 * Input:
 * - `folder`: normalized mailbox folder.
 * - `collapsed`: whether the folder pane is collapsed.
 *
 * Output:
 * - Returns the JSX icon matching the folder type.
 */
const renderFolderIcon = (folder: MailboxFolder, collapsed = false) => {
  const token = normalizeFolderToken(folder.well_known_name || folder.name);
  const className = collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4';

  if (token.includes('delete')) {
    return (
      <svg
        viewBox='0 0 20 20'
        fill='none'
        className={className}
        aria-hidden='true'
      >
        <path
          d='M6.5 6.5V15.5C6.5 16.05 6.95 16.5 7.5 16.5H12.5C13.05 16.5 13.5 16.05 13.5 15.5V6.5'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
        <path
          d='M5 6.5H15'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
        <path
          d='M8 6.5V4.75C8 4.34 8.34 4 8.75 4H11.25C11.66 4 12 4.34 12 4.75V6.5'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
        <path
          d='M8.75 9.25V13.25M11.25 9.25V13.25'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      </svg>
    );
  }

  if (token.includes('draft')) {
    return (
      <svg
        viewBox='0 0 20 20'
        fill='none'
        className={className}
        aria-hidden='true'
      >
        <path
          d='M4.75 13.75L5.75 10.75L12.75 3.75L15.75 6.75L8.75 13.75L5.75 14.75L4.75 13.75Z'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinejoin='round'
        />
        <path
          d='M11.75 4.75L14.75 7.75'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      </svg>
    );
  }

  if (token.includes('sent')) {
    return (
      <svg
        viewBox='0 0 20 20'
        fill='none'
        className={className}
        aria-hidden='true'
      >
        <path
          d='M4 15.5L16 10L4 4.5L6.25 10L4 15.5Z'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinejoin='round'
        />
        <path
          d='M6.25 10H11.5'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      </svg>
    );
  }

  if (token.includes('archive')) {
    return (
      <svg
        viewBox='0 0 20 20'
        fill='none'
        className={className}
        aria-hidden='true'
      >
        <rect
          x='4'
          y='5.5'
          width='12'
          height='10.5'
          rx='1.5'
          stroke='currentColor'
          strokeWidth='1.5'
        />
        <path d='M4.5 7.5H15.5' stroke='currentColor' strokeWidth='1.5' />
        <path
          d='M8 11H12'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      </svg>
    );
  }

  if (token.includes('search')) {
    return (
      <svg
        viewBox='0 0 20 20'
        fill='none'
        className={className}
        aria-hidden='true'
      >
        <path
          d='M8.5 13.5C11.2614 13.5 13.5 11.2614 13.5 8.5C13.5 5.73858 11.2614 3.5 8.5 3.5C5.73858 3.5 3.5 5.73858 3.5 8.5C3.5 11.2614 5.73858 13.5 8.5 13.5Z'
          stroke='currentColor'
          strokeWidth='1.5'
        />
        <path
          d='M12.25 12.25L16.5 16.5'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      </svg>
    );
  }

  if (token.includes('conversation')) {
    return (
      <svg
        viewBox='0 0 20 20'
        fill='none'
        className={className}
        aria-hidden='true'
      >
        <path
          d='M4 5.75C4 4.78 4.78 4 5.75 4H10.25C11.22 4 12 4.78 12 5.75V8.25C12 9.22 11.22 10 10.25 10H7L4.75 12V10C4.34 10 4 9.66 4 9.25V5.75Z'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinejoin='round'
        />
        <path
          d='M10 11H11.75C12.72 11 13.5 10.22 13.5 9.25V8.75L15.75 10.75H14.25C14.25 11.72 13.47 12.5 12.5 12.5H10'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    );
  }

  if (token.includes('junk')) {
    return (
      <svg
        viewBox='0 0 20 20'
        fill='none'
        className={className}
        aria-hidden='true'
      >
        <path
          d='M5.5 4.5H10.75C11.16 4.5 11.55 4.66 11.84 4.95L14.55 7.66C14.84 7.95 15 8.34 15 8.75V14.5C15 15.05 14.55 15.5 14 15.5H5.5C4.95 15.5 4.5 15.05 4.5 14.5V5.5C4.5 4.95 4.95 4.5 5.5 4.5Z'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinejoin='round'
        />
        <path
          d='M10.5 4.75V8H13.75'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
        <path
          d='M7 12.5L12.5 7'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox='0 0 20 20'
      fill='none'
      className={className}
      aria-hidden='true'
    >
      <path
        d='M5.5 4.5H10.75C11.16 4.5 11.55 4.66 11.84 4.95L14.55 7.66C14.84 7.95 15 8.34 15 8.75V14.5C15 15.05 14.55 15.5 14 15.5H5.5C4.95 15.5 4.5 15.05 4.5 14.5V5.5C4.5 4.95 4.95 4.5 5.5 4.5Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
      />
      <path
        d='M10.5 4.75V8H13.75'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );
};

const Inbox = () => {
  const { accountid } = useParams();
  const [selectedFolder, setSelectedFolder] =
    useState<FlattenedMailboxFolder | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [searchText, setSearchText] = useState('');
  const deferredSearchText = useDeferredValue(searchText.trim());
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [messageItems, setMessageItems] = useState<InboxMessageListItem[]>([]);
  const [attachmentActionId, setAttachmentActionId] = useState('');
  const [folderPaneWidth, setFolderPaneWidth] = useState(280);
  const [messagePaneWidth, setMessagePaneWidth] = useState(390);
  const [activeDivider, setActiveDivider] = useState<
    'folders' | 'messages' | null
  >(null);
  const [isFolderPaneCollapsed, setIsFolderPaneCollapsed] = useState(false);
  const [filters, setFilters] = useState<MailboxFilters>({
    status: 'all',
    hasAttachments: false,
    highImportance: false,
    from: '',
    to: '',
    receivedFrom: '',
    receivedTo: '',
  });
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const [isDesktopLayout, setIsDesktopLayout] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const [previewAttachment, setPreviewAttachment] = useState<{
    name: string;
    contentType: string;
    objectUrl: string;
    textContent?: string;
  } | null>(null);
  const desktopLayoutRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startFolderWidth: number;
    startMessageWidth: number;
  } | null>(null);

  const {
    data: folderData,
    isLoading: isFolderLoading,
    isError: isFolderError,
    error: folderError,
  } = useMailboxFolders(accountid || '');

  const flatFolders = useMemo(
    () => flattenFolders(folderData?.folders || []),
    [folderData]
  );

  const favoriteFolders = useMemo(
    () =>
      flatFolders.filter((folder: FlattenedMailboxFolder) =>
        FAVORITE_WELL_KNOWN_NAMES.includes(
          normalizeFolderToken(folder.well_known_name || folder.name)
        )
      ),
    [flatFolders]
  );

  const regularFolders = useMemo(
    () =>
      flatFolders.filter(
        (folder: FlattenedMailboxFolder) =>
          !HIDDEN_FOLDER_TOKENS.includes(
            normalizeFolderToken(folder.well_known_name || folder.name)
          ) &&
          !FAVORITE_WELL_KNOWN_NAMES.includes(
            normalizeFolderToken(folder.well_known_name || folder.name)
          )
      ),
    [flatFolders]
  );

  useEffect(() => {
    if (!selectedFolder && folderData?.folders?.length) {
      setSelectedFolder(findDefaultFolder(folderData.folders));
    }
  }, [folderData, selectedFolder]);

  useEffect(() => {
    setPageToken(null);
    setMessageItems([]);
    setSelectedMessageId('');
  }, [selectedFolder?.id, deferredSearchText]);

  const {
    data: mailboxMessages,
    isLoading: isMessagesLoading,
    isError: isMessagesError,
    error: messagesError,
    refetch: refetchMessages,
  } = useMailboxMessages({
    accountRid: accountid || '',
    folderId: selectedFolder?.id,
    folderPath: selectedFolder?.path,
    limit: 50,
    pageToken,
    search: deferredSearchText,
  });

  useEffect(() => {
    if (!mailboxMessages) return;

    setMessageItems((previous) =>
      pageToken
        ? [...previous, ...mailboxMessages.messages]
        : mailboxMessages.messages
    );
  }, [mailboxMessages, pageToken]);

  useEffect(() => {
    if (pageToken) {
      refetchMessages();
    }
  }, [pageToken, refetchMessages]);

  const filteredMessageItems = useMemo(() => {
    const fromFilter = normalizeFilterText(filters.from);
    const toFilter = normalizeFilterText(filters.to);

    return messageItems.filter((message) => {
      if (filters.status === 'unread' && message.is_read) return false;
      if (filters.status === 'read' && !message.is_read) return false;
      if (filters.hasAttachments && !message.has_attachments) return false;
      if (
        filters.highImportance &&
        message.importance?.toLowerCase() !== 'high'
      ) {
        return false;
      }

      if (fromFilter) {
        const senderText =
          `${message.sender || ''} ${message.sender_email || ''}`.toLowerCase();
        if (!senderText.includes(fromFilter)) return false;
      }

      if (toFilter) {
        const recipientsText = (message.to_recipients || [])
          .map((recipient) =>
            `${recipient.name || ''} ${recipient.email || ''}`
              .trim()
              .toLowerCase()
          )
          .join(' ');
        if (!recipientsText.includes(toFilter)) return false;
      }

      const receivedTime = new Date(message.received_datetime).getTime();
      if (filters.receivedFrom) {
        const startTime = getStartOfDayTime(filters.receivedFrom);
        if (receivedTime < startTime) return false;
      }
      if (filters.receivedTo) {
        const endTime = getEndOfDayTime(filters.receivedTo);
        if (receivedTime > endTime) return false;
      }

      return true;
    });
  }, [filters, messageItems]);

  useEffect(() => {
    if (
      filteredMessageItems.length > 0 &&
      !filteredMessageItems.some((message) => message.id === selectedMessageId)
    ) {
      setSelectedMessageId(filteredMessageItems[0].id);
      return;
    }

    if (!filteredMessageItems.length) {
      setSelectedMessageId('');
    }
  }, [filteredMessageItems, selectedMessageId]);

  const selectedListMessage = useMemo(
    () =>
      filteredMessageItems.find((message) => message.id === selectedMessageId),
    [filteredMessageItems, selectedMessageId]
  );

  const {
    data: messageDetails,
    isLoading: isMessageLoading,
    isError: isMessageError,
  } = useInboxMessageById(accountid || '', selectedMessageId);

  useEffect(() => {
    const syncDesktopLayout = () => {
      const isDesktop = window.innerWidth >= 1024;
      setIsDesktopLayout(isDesktop);
      if (!isDesktop) {
        setActiveDivider(null);
        dragStateRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    syncDesktopLayout();
    window.addEventListener('resize', syncDesktopLayout);

    return () => {
      window.removeEventListener('resize', syncDesktopLayout);
    };
  }, []);

  /**
   * Formats recipients for display in the reading pane.
   *
   * Input:
   * - `recipients`: optional list of recipient name/email pairs.
   *
   * Output:
   * - Returns a comma-separated string or `-` when no recipients exist.
   */
  const renderRecipientList = (
    recipients: { name: string; email: string }[] | undefined
  ) => {
    if (!recipients?.length) return '-';
    return recipients
      .map((recipient) =>
        recipient.name
          ? `${recipient.name} <${recipient.email}>`
          : recipient.email || '-'
      )
      .join(', ');
  };

  /**
   * Converts base64 attachment content into a browser `Blob`.
   *
   * Input:
   * - `content`: base64-encoded attachment payload.
   * - `contentType`: MIME type returned by the backend.
   *
   * Output:
   * - Returns a blob suitable for previewing or downloading in the browser.
   */
  const convertBase64ToBlob = (content: string, contentType: string) => {
    const binary = window.atob(content);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], { type: contentType });
  };

  /**
   * Determines whether an attachment can be previewed inline in the mailbox UI.
   *
   * Input:
   * - `contentType`: attachment MIME type.
   *
   * Output:
   * - Returns `true` for previewable image, PDF, text, and JSON files.
   */
  const isInlinePreviewable = (contentType: string) => {
    const normalizedType = contentType.toLowerCase();

    return (
      normalizedType.startsWith('image/') ||
      normalizedType === 'application/pdf' ||
      normalizedType.startsWith('text/') ||
      normalizedType.includes('json')
    );
  };

  /**
   * Loads a mailbox attachment and either previews or downloads it.
   *
   * Input:
   * - `attachmentId`: selected attachment identifier.
   * - `attachmentName`: attachment filename used for downloads.
   * - `action`: whether the user wants to `view` or `download` the attachment.
   *
   * Output:
   * - Opens a preview dialog, opens a browser tab, or starts a download depending on the attachment type.
   */
  const handleAttachmentAction = async (
    attachmentId: string,
    attachmentName: string,
    action: 'view' | 'download'
  ) => {
    if (!accountid || !selectedMessageId) return;

    try {
      setAttachmentActionId(`${attachmentId}-${action}`);
      const attachment = await fetchInboxAttachmentById(
        accountid,
        selectedMessageId,
        attachmentId
      );
      const blob = convertBase64ToBlob(
        attachment.content_bytes,
        attachment.content_type
      );
      const objectUrl = window.URL.createObjectURL(blob);

      if (action === 'view') {
        if (isInlinePreviewable(attachment.content_type)) {
          const previewData: {
            name: string;
            contentType: string;
            objectUrl: string;
            textContent?: string;
          } = {
            name: attachment.name,
            contentType: attachment.content_type,
            objectUrl,
          };

          if (
            attachment.content_type.toLowerCase().startsWith('text/') ||
            attachment.content_type.toLowerCase().includes('json')
          ) {
            previewData.textContent = await blob.text();
          }

          setPreviewAttachment(previewData);
          return;
        }

        window.open(objectUrl, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
        return;
      }

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = attachmentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } finally {
      setAttachmentActionId('');
    }
  };

  /**
   * Closes the inline attachment preview and releases the preview object URL.
   *
   * Input:
   * - No direct arguments; uses the current preview state.
   *
   * Output:
   * - Clears the preview state and revokes the browser object URL when present.
   */
  const closePreview = () => {
    if (previewAttachment?.objectUrl) {
      window.URL.revokeObjectURL(previewAttachment.objectUrl);
    }
    setPreviewAttachment(null);
  };

  useEffect(() => {
    return () => {
      if (previewAttachment?.objectUrl) {
        window.URL.revokeObjectURL(previewAttachment.objectUrl);
      }
    };
  }, [previewAttachment]);

  useEffect(() => {
    if (!activeDivider || !isDesktopLayout) return;

    const handlePointerMove = (event: PointerEvent) => {
      const container = desktopLayoutRef.current;
      const dragState = dragStateRef.current;
      if (!container || !dragState) return;

      const containerWidth = container.getBoundingClientRect().width;
      const totalDividerWidth = 20;
      const minReadingPaneWidth = 320;
      const deltaX = event.clientX - dragState.startX;

      if (activeDivider === 'folders') {
        const maxFolderWidth =
          containerWidth -
          dragState.startMessageWidth -
          minReadingPaneWidth -
          totalDividerWidth;
        const nextWidth = Math.min(
          Math.max(dragState.startFolderWidth + deltaX, 220),
          Math.max(220, maxFolderWidth)
        );
        setFolderPaneWidth(nextWidth);
        return;
      }

      const maxMessageWidth =
        containerWidth -
        dragState.startFolderWidth -
        minReadingPaneWidth -
        totalDividerWidth;
      const nextMessageWidth = Math.min(
        Math.max(dragState.startMessageWidth + deltaX, 280),
        Math.max(280, maxMessageWidth)
      );
      setMessagePaneWidth(nextMessageWidth);
    };

    const stopDragging = () => {
      setActiveDivider(null);
      dragStateRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [activeDivider, isDesktopLayout]);

  const desktopLayoutStyle = useMemo(
    () =>
      isDesktopLayout
        ? {
            gridTemplateColumns: `${isFolderPaneCollapsed ? 58 : folderPaneWidth}px 10px ${messagePaneWidth}px 10px minmax(360px, 1fr)`,
          }
        : undefined,
    [folderPaneWidth, isFolderPaneCollapsed, messagePaneWidth, isDesktopLayout]
  );

  const renderFolder = (folder: FlattenedMailboxFolder) => {
    const active = selectedFolder?.id === folder.id;

    if (isFolderPaneCollapsed) {
      return (
        <Tooltip key={folder.id} title={folder.name} placement='right' arrow>
          <button
            type='button'
            onClick={() => setSelectedFolder(folder)}
            className={`flex min-h-[36px] w-full items-center justify-center rounded-[10px] transition-colors ${
              active
                ? 'bg-[#D8E9FB] text-[#0B57A3]'
                : 'text-[#3A4A5B] hover:bg-[#EDF3FA]'
            }`}
            style={{
              marginLeft: '6px',
              marginRight: '8px',
            }}
            aria-label={folder.name}
          >
            <span className='flex h-8 w-8 items-center justify-center rounded-[8px]'>
              {renderFolderIcon(folder, true)}
            </span>
          </button>
        </Tooltip>
      );
    }

    return (
      <button
        key={folder.id}
        type='button'
        onClick={() => setSelectedFolder(folder)}
        className={`flex min-h-[36px] w-full items-center gap-2 rounded-[6px] px-3 py-1.5 text-left text-[14px] leading-5 transition-colors ${
          active
            ? 'bg-[#CFE5FF] font-medium text-[#1B1B1B]'
            : 'text-[#2C2C2C] hover:bg-[#F3F6FA]'
        }`}
        style={{
          marginLeft: `${12 + folder.level * 16}px`,
          marginRight: '12px',
        }}
        title={folder.name}
      >
        <span className='flex-shrink-0 text-[#5F6368]'>
          {renderFolderIcon(folder)}
        </span>
        <span className='min-w-0 truncate'>{folder.name}</span>
      </button>
    );
  };

  const renderFolderGroup = (
    title: string,
    folders: FlattenedMailboxFolder[],
    groupClassName = ''
  ) => {
    if (!folders.length) return null;

    return (
      <div className={groupClassName}>
        {!isFolderPaneCollapsed ? (
          <div className='flex items-center gap-1 px-3 pb-2 pt-3'>
            <ChevronDownIcon className='h-3 w-3 text-[#6B7280]' />
            <p className='text-[12px] font-semibold text-[#202124]'>{title}</p>
          </div>
        ) : null}
        <div
          className={isFolderPaneCollapsed ? 'space-y-1 px-1' : 'space-y-0.5'}
        >
          {folders.map(renderFolder)}
        </div>
      </div>
    );
  };

  const renderMailCard = (message: InboxMessageListItem) => {
    const isSelected = selectedMessageId === message.id;

    return (
      <button
        key={message.id}
        type='button'
        onClick={() => setSelectedMessageId(message.id)}
        className={`w-full border-b border-[#E7ECF2] px-3 py-2.5 text-left transition-colors ${
          isSelected
            ? 'border-l-4 border-l-[#0F6CBD] bg-[#EAF3FF] pl-2'
            : message.is_read
              ? 'bg-white hover:bg-[#F8FAFD]'
              : 'bg-[#F8FBFF] hover:bg-[#EEF5FC]'
        }`}
      >
        <div className='mb-0.5 flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <p
              className={`truncate text-[13px] leading-5 ${
                message.is_read ? 'font-medium' : 'font-semibold'
              } text-[#16202A]`}
            >
              {message.sender || message.sender_email || '-'}
            </p>
            <p className='truncate text-[13px] leading-5 text-[#16202A]'>
              {message.subject || '(No Subject)'}
            </p>
          </div>
          <span className='shrink-0 pl-2 text-[11px] text-[#5E6B78]'>
            {formatDateToYYYYMMDDWithTime(message.received_datetime)}
          </span>
        </div>
        <p className='line-clamp-2 text-[12px] leading-4 text-[#5E6B78]'>
          {message.body_preview || 'No preview available'}
        </p>
        <div className='mt-1.5 flex items-center gap-1.5 text-[10px] text-[#5E6B78]'>
          {!message.is_read && (
            <span className='rounded-full bg-[#0F6CBD] px-2 py-[2px] text-white'>
              New
            </span>
          )}
          {message.has_attachments && (
            <span className='rounded-full bg-[#EEF2F6] px-2 py-[2px]'>
              Attachment
            </span>
          )}
          {message.importance?.toLowerCase() === 'high' && (
            <span className='rounded-full bg-[#FDECEC] px-2 py-[2px] text-[#C62828]'>
              High
            </span>
          )}
        </div>
      </button>
    );
  };

  const showInitialLoading =
    isFolderLoading || (!selectedFolder && isMessagesLoading);
  const activeFilterCount = [
    filters.status !== 'all',
    filters.hasAttachments,
    filters.highImportance,
    Boolean(filters.from.trim()),
    Boolean(filters.to.trim()),
    Boolean(filters.receivedFrom),
    Boolean(filters.receivedTo),
  ].filter(Boolean).length;

  const mailboxErrorMessage =
    (
      (folderError as AxiosError<{ statusMessage?: string }>)?.response?.data
        ?.statusMessage ||
      (messagesError as AxiosError<{ statusMessage?: string }>)?.response?.data
        ?.statusMessage
    )?.trim() || 'Unable to load the mailbox for this account.';

  // Check if error is due to missing email configuration
  const isNoEmailConfigError = mailboxErrorMessage
    ?.toLowerCase()
    .includes('email configuration');

  return (
    <div className='h-[calc(100vh-235px)] w-full overflow-hidden p-2 pr-4'>
      <div className='flex h-full flex-col overflow-hidden rounded-[6px] border border-[#CBD6E2] bg-white shadow-[0_10px_32px_rgba(15,23,42,0.06)]'>
        <div className='flex h-[49px] items-center justify-between border-b border-[#CBD6E2] bg-white px-4'>
          <div className='flex min-w-0 items-center gap-2'>
            <DraftEmailIcon className='h-7 w-7 rounded-[2px] bg-[#0F6CBD] p-1 text-white' />
            <div className='min-w-0'>
              <p className='truncate text-[14px] font-semibold text-[#253240]'>
                Mailbox
              </p>
              <p className='truncate text-[11px] text-[#5E6B78]'>
                {filteredMessageItems.length} items
              </p>
            </div>
          </div>
          <div className='ml-4 flex items-center gap-2'>
            <Tooltip title='Filter messages' placement='bottom' arrow>
              <button
                type='button'
                onClick={(event) => setFilterAnchorEl(event.currentTarget)}
                className='inline-flex h-[32px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[4px] border border-[#C3CFDB] bg-white px-3 text-[12px] font-medium text-[#344054] transition-colors hover:bg-[#F8FAFC]'
                aria-label='Filter messages'
              >
                <svg
                  viewBox='0 0 20 20'
                  fill='none'
                  className='h-4 w-4 text-[#5E6B78]'
                  aria-hidden='true'
                >
                  <path
                    d='M4 5H16'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                  />
                  <path
                    d='M6.5 10H13.5'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                  />
                  <path
                    d='M8.75 15H11.25'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                  />
                </svg>
                <span className='hidden sm:inline'>Filter</span>
                {activeFilterCount ? (
                  <span className='hidden min-w-[18px] rounded-full bg-[#EAF3FF] px-1.5 text-center text-[11px] font-semibold leading-5 text-[#0F6CBD] sm:inline-block'>
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </Tooltip>
            <div className='flex h-[32px] w-full max-w-[300px] items-center rounded-[4px] border border-[#C3CFDB] bg-white pl-3 pr-2'>
              <SearchIcon className='mr-2 h-4 w-4 shrink-0 text-[#5E6B78]' />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder='Search'
                className='w-full border-0 bg-transparent text-[13px] text-[#16202A] outline-none placeholder:text-[#7B8794]'
              />
            </div>
          </div>
        </div>

        <Popover
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: '8px',
              width: 320,
              boxShadow: '0 10px 28px rgba(15, 23, 42, 0.14)',
              border: '1px solid #E5EAF0',
              overflow: 'hidden',
            },
          }}
        >
          <div className='border-b border-[#E5EAF0] px-4 py-3'>
            <p className='text-[13px] font-semibold text-[#16202A]'>
              Filter mailbox
            </p>
            <p className='mt-1 text-[11px] text-[#5E6B78]'>
              Narrow the current folder like Outlook.
            </p>
          </div>
          <div className='space-y-4 px-4 py-4'>
            <div>
              <p className='mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#5E6B78]'>
                Status
              </p>
              <div className='flex flex-wrap gap-2'>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type='button'
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        status: option.key,
                      }))
                    }
                    className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                      filters.status === option.key
                        ? 'border-[#0F6CBD] bg-[#EAF3FF] text-[#0F6CBD]'
                        : 'border-[#D6DEE8] bg-white text-[#344054] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className='grid grid-cols-1 gap-3'>
              <label className='text-[12px] text-[#344054]'>
                <span className='mb-1 block font-medium'>From</span>
                <input
                  value={filters.from}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      from: event.target.value,
                    }))
                  }
                  placeholder='Sender name or email'
                  className='h-9 w-full rounded-[6px] border border-[#C3CFDB] px-3 text-[13px] text-[#16202A] outline-none placeholder:text-[#7B8794]'
                />
              </label>
              <label className='text-[12px] text-[#344054]'>
                <span className='mb-1 block font-medium'>To</span>
                <input
                  value={filters.to}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      to: event.target.value,
                    }))
                  }
                  placeholder='Recipient name or email'
                  className='h-9 w-full rounded-[6px] border border-[#C3CFDB] px-3 text-[13px] text-[#16202A] outline-none placeholder:text-[#7B8794]'
                />
              </label>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <label className='text-[12px] text-[#344054]'>
                <span className='mb-1 block font-medium'>Received from</span>
                <input
                  type='date'
                  value={filters.receivedFrom}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      receivedFrom: event.target.value,
                    }))
                  }
                  className='h-9 w-full rounded-[6px] border border-[#C3CFDB] px-3 text-[13px] text-[#16202A] outline-none'
                />
              </label>
              <label className='text-[12px] text-[#344054]'>
                <span className='mb-1 block font-medium'>Received to</span>
                <input
                  type='date'
                  value={filters.receivedTo}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      receivedTo: event.target.value,
                    }))
                  }
                  className='h-9 w-full rounded-[6px] border border-[#C3CFDB] px-3 text-[13px] text-[#16202A] outline-none'
                />
              </label>
            </div>

            <div className='flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    hasAttachments: !current.hasAttachments,
                  }))
                }
                className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                  filters.hasAttachments
                    ? 'border-[#0F6CBD] bg-[#EAF3FF] text-[#0F6CBD]'
                    : 'border-[#D6DEE8] bg-white text-[#344054] hover:bg-[#F8FAFC]'
                }`}
              >
                Has attachments
              </button>
              <button
                type='button'
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    highImportance: !current.highImportance,
                  }))
                }
                className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                  filters.highImportance
                    ? 'border-[#0F6CBD] bg-[#EAF3FF] text-[#0F6CBD]'
                    : 'border-[#D6DEE8] bg-white text-[#344054] hover:bg-[#F8FAFC]'
                }`}
              >
                High importance
              </button>
            </div>
          </div>
          <div className='flex items-center justify-between border-t border-[#E5EAF0] bg-[#FBFCFE] px-4 py-3'>
            <button
              type='button'
              onClick={() =>
                setFilters({
                  status: 'all',
                  hasAttachments: false,
                  highImportance: false,
                  from: '',
                  to: '',
                  receivedFrom: '',
                  receivedTo: '',
                })
              }
              className='text-[12px] font-medium text-[#5E6B78] hover:text-[#16202A]'
            >
              Clear filters
            </button>
            <button
              type='button'
              onClick={() => setFilterAnchorEl(null)}
              className='rounded-[6px] bg-[#0F6CBD] px-3 py-1.5 text-[12px] font-semibold text-white'
            >
              Apply
            </button>
          </div>
        </Popover>

        <div className='border-t border-[#CBD6E2]' />

        {showInitialLoading ? (
          <div className='flex min-h-[520px] items-center justify-center'>
            <CircularProgress size={28} />
          </div>
        ) : isFolderError || isMessagesError ? (
          isNoEmailConfigError ? (
            <div className='flex h-full flex-col'>
              <div className='flex items-center gap-3 bg-[#FFEBEE] px-4 py-3 border-b border-[#EF5350]'>
                <div className='h-5 w-5 rounded-full bg-[#D32F2F] flex items-center justify-center flex-shrink-0'>
                  <span className='text-white text-xs font-bold'>!</span>
                </div>
                <p className='text-[14px] font-medium text-[#B71C1C]'>
                  Email isn't configured for this account. Configure it in
                  Account Settings.
                </p>
              </div>
              <div className='flex-1 bg-[#FAFAFA]' />
            </div>
          ) : (
            <div className='p-4 text-sm text-[#B42318]'>
              {mailboxErrorMessage}
            </div>
          )
        ) : (
          <div
            ref={desktopLayoutRef}
            className='grid h-full min-h-0 grid-cols-1 lg:grid-cols-[280px_10px_390px_10px_minmax(0,1fr)]'
            style={desktopLayoutStyle}
          >
            <aside className='flex min-h-0 flex-col bg-[#F7F9FC]'>
              <div
                className={`flex h-[56px] border-b border-[#E5EAF0] bg-[#FDFEFF] ${isFolderPaneCollapsed ? 'px-2' : 'px-3'}`}
              >
                <div
                  className={`flex w-full items-center ${isFolderPaneCollapsed ? 'justify-center' : 'justify-between'} gap-2`}
                >
                  {!isFolderPaneCollapsed ? (
                    <div className='min-w-0 flex-1'>
                      <p className='text-[13px] font-semibold text-[#202124]'>
                        Folders
                      </p>
                    </div>
                  ) : null}
                  {isDesktopLayout ? (
                    <Tooltip
                      title={
                        isFolderPaneCollapsed
                          ? 'Expand folders'
                          : 'Collapse folders'
                      }
                      placement='bottom'
                      arrow
                    >
                      <button
                        type='button'
                        onClick={() =>
                          setIsFolderPaneCollapsed((current) => !current)
                        }
                        className={`inline-flex items-center justify-center rounded-[6px] text-[#5E6B78] transition-colors hover:bg-[#EEF3F8] hover:text-[#253240] ${isFolderPaneCollapsed ? 'h-8 w-8' : 'h-7 w-7'}`}
                        aria-label={
                          isFolderPaneCollapsed
                            ? 'Expand folders'
                            : 'Collapse folders'
                        }
                      >
                        <ChevronLeftIcon
                          className={`h-4 w-4 transition-transform ${isFolderPaneCollapsed ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </Tooltip>
                  ) : null}
                </div>
              </div>
              <div
                className={`min-h-0 overflow-y-auto overflow-x-hidden ${isFolderPaneCollapsed ? 'py-2' : 'py-1.5'}`}
              >
                {flatFolders.length ? (
                  <>
                    {renderFolderGroup('Favorites', favoriteFolders)}
                    {renderFolderGroup(
                      (folderData?.support_email || 'Mailbox').split('@')[0],
                      regularFolders,
                      !isFolderPaneCollapsed
                        ? 'border-t border-[#EDF2F7] mt-2'
                        : 'mt-3'
                    )}
                  </>
                ) : (
                  <div className='p-4 text-sm text-[#5E6B78]'>
                    No folders available in this mailbox.
                  </div>
                )}
              </div>
            </aside>

            <div
              role='separator'
              aria-orientation='vertical'
              aria-label='Resize folders and messages'
              onPointerDown={(event) => {
                if (isFolderPaneCollapsed) return;
                event.preventDefault();
                dragStateRef.current = {
                  startX: event.clientX,
                  startFolderWidth: folderPaneWidth,
                  startMessageWidth: messagePaneWidth,
                };
                setActiveDivider('folders');
              }}
              className={`group relative hidden cursor-col-resize before:absolute before:left-0 before:right-0 before:top-0 before:h-[56px] before:border-b before:border-[#E5EAF0] lg:block ${
                isFolderPaneCollapsed
                  ? 'cursor-default bg-[#F7F9FC]'
                  : activeDivider === 'folders'
                    ? 'bg-[#DCEBFA]'
                    : 'bg-[#F3F6FA]'
              }`}
            >
              <div
                className={`absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full transition-colors ${
                  isFolderPaneCollapsed
                    ? 'bg-[#E2E8F0]'
                    : activeDivider === 'folders'
                      ? 'bg-[#7DB2E8]'
                      : 'bg-[#D5DFEA] group-hover:bg-[#A9CDED]'
                }`}
              />
            </div>

            <section className='flex min-h-0 flex-col bg-white'>
              <div className='flex h-[56px] items-center justify-between gap-3 border-b border-[#E5EAF0] bg-[#FBFCFE] px-4'>
                <div className='min-w-0'>
                  <p className='text-[14px] font-semibold text-[#16202A]'>
                    {selectedFolder?.name || 'Messages'}
                  </p>
                  <p className='truncate text-[11px] text-[#5E6B78]'>
                    {filteredMessageItems.length}
                    {activeFilterCount ? ' filtered' : ' loaded'}
                  </p>
                </div>
              </div>

              <div className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden'>
                {filteredMessageItems.length ? (
                  filteredMessageItems.map(renderMailCard)
                ) : (
                  <div className='p-4 text-sm text-[#5E6B78]'>
                    No messages found for the selected filter.
                  </div>
                )}
              </div>

              <div className='border-t border-[#E5EAF0] bg-[#F8FAFC] p-3'>
                <button
                  type='button'
                  disabled={
                    !mailboxMessages?.next_page_token || isMessagesLoading
                  }
                  onClick={() =>
                    setPageToken(mailboxMessages?.next_page_token || null)
                  }
                  className='w-full rounded-[4px] border border-[#CBD6E2] bg-white px-3 py-2 text-[13px] font-medium text-[#16202A] disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {isMessagesLoading && pageToken ? 'Loading...' : 'Load More'}
                </button>
              </div>
            </section>

            <div
              role='separator'
              aria-orientation='vertical'
              aria-label='Resize messages and reading pane'
              onPointerDown={(event) => {
                event.preventDefault();
                dragStateRef.current = {
                  startX: event.clientX,
                  startFolderWidth: folderPaneWidth,
                  startMessageWidth: messagePaneWidth,
                };
                setActiveDivider('messages');
              }}
              className={`group relative hidden cursor-col-resize before:absolute before:left-0 before:right-0 before:top-0 before:h-[56px] before:border-b before:border-[#E5EAF0] lg:block ${
                activeDivider === 'messages' ? 'bg-[#DCEBFA]' : 'bg-[#F3F6FA]'
              }`}
            >
              <div
                className={`absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full transition-colors ${
                  activeDivider === 'messages'
                    ? 'bg-[#7DB2E8]'
                    : 'bg-[#D5DFEA] group-hover:bg-[#A9CDED]'
                }`}
              />
            </div>

            <section className='flex min-h-0 min-w-0 flex-col bg-white'>
              {!selectedListMessage ? (
                <div className='flex h-full min-h-0 flex-col items-center justify-center gap-3 bg-[#FCFDFE] text-sm text-[#5E6B78]'>
                  <InteractionDetailIcon className='h-12 w-12 rounded-[14px] bg-[#E8F1FB] p-2.5 text-[#0F6CBD]' />
                  <div className='text-center'>
                    <p className='text-[15px] font-semibold text-[#16202A]'>
                      Select an email to open
                    </p>
                    <p className='mt-1 text-[12px] text-[#5E6B78]'>
                      The reading pane will display the full message and
                      attachments here.
                    </p>
                  </div>
                </div>
              ) : isMessageLoading ? (
                <div className='flex h-full min-h-0 items-center justify-center'>
                  <CircularProgress size={28} />
                </div>
              ) : isMessageError || !messageDetails ? (
                <div className='p-4 text-sm text-[#B42318]'>
                  Unable to load the selected email.
                </div>
              ) : (
                <div className='flex h-full min-h-0 flex-col bg-white'>
                  <div className='flex h-[56px] items-center border-b border-[#E5EAF0] bg-[#FBFCFE] px-5'>
                    <h2 className='min-w-0 break-words text-[18px] font-semibold text-[#16202A]'>
                      {messageDetails.subject || '(No Subject)'}
                    </h2>
                  </div>

                  <div className='min-h-0 flex-1 overflow-auto bg-[#FFFFFF] p-4'>
                    <div className='min-h-full rounded-[4px] border border-[#D9E2EC] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]'>
                      <div className='flex items-start justify-between gap-4 px-3 py-2.5'>
                        <div className='flex min-w-0 items-start gap-3'>
                          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B8D8F7] text-[12px] font-semibold text-[#1D4F91]'>
                            {(
                              messageDetails.sender ||
                              messageDetails.sender_email ||
                              'M'
                            )
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part.charAt(0).toUpperCase())
                              .join('')}
                          </div>
                          <div className='min-w-0 text-[13px] text-[#16202A]'>
                            <p className='truncate'>
                              {messageDetails.sender || '-'}
                              {messageDetails.sender_email
                                ? ` <${messageDetails.sender_email}>`
                                : ''}
                            </p>
                            <p className='mt-0.5 truncate text-[12px] text-[#253240]'>
                              <span className='font-medium'>To:</span>{' '}
                              {renderRecipientList(
                                messageDetails.to_recipients
                              )}
                            </p>
                            <p className='mt-0.5 truncate text-[12px] text-[#253240]'>
                              <span className='font-medium'>Cc:</span>{' '}
                              {renderRecipientList(
                                messageDetails.cc_recipients
                              )}
                            </p>
                          </div>
                        </div>
                        <div className='flex shrink-0 flex-col items-end gap-2'>
                          <p className='text-[11px] text-[#5E6B78]'>
                            {formatDateToYYYYMMDDWithTime(
                              messageDetails.received_datetime
                            )}
                          </p>
                        </div>
                      </div>

                      <div className='px-4 pb-4 pt-2'>
                        {messageDetails.attachments?.length ? (
                          <div className='mb-4 flex flex-wrap gap-2'>
                            {messageDetails.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className='flex items-center gap-2 rounded-full border border-[#D6DEE8] bg-[#F8FAFC] px-3 py-1.5 text-[12px] text-[#16202A]'
                              >
                                <PaperclipIcon className='h-3.5 w-3.5' />
                                <span>{attachment.name}</span>
                                <button
                                  type='button'
                                  onClick={() =>
                                    handleAttachmentAction(
                                      attachment.id,
                                      attachment.name,
                                      'view'
                                    )
                                  }
                                  disabled={attachmentActionId !== ''}
                                  className='rounded-full bg-white px-2 py-[2px] text-[11px] font-medium text-[#0F6CBD] disabled:opacity-50'
                                >
                                  {attachmentActionId ===
                                  `${attachment.id}-view`
                                    ? 'Opening...'
                                    : 'View'}
                                </button>
                                <button
                                  type='button'
                                  onClick={() =>
                                    handleAttachmentAction(
                                      attachment.id,
                                      attachment.name,
                                      'download'
                                    )
                                  }
                                  disabled={attachmentActionId !== ''}
                                  className='rounded-full bg-white px-2 py-[2px] text-[11px] font-medium text-[#16202A] disabled:opacity-50'
                                >
                                  {attachmentActionId ===
                                  `${attachment.id}-download`
                                    ? 'Downloading...'
                                    : 'Download'}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {messageDetails.body.content_type?.toLowerCase() ===
                        'html' ? (
                          <iframe
                            title='inbox-message-body'
                            srcDoc={messageDetails.body.content || ''}
                            sandbox='allow-same-origin allow-popups allow-popups-to-escape-sandbox'
                            className='max-h-[calc(100vh-600px)] w-full min-h-[200px] rounded-[4px] bg-white'
                          />
                        ) : (
                          <pre className='max-h-[calc(100vh-600px)] w-full min-h-[200px] overflow-auto whitespace-pre-wrap break-words rounded-[4px] bg-white font-sans text-[13px] leading-6 text-[#16202A]'>
                            {messageDetails.body.content ||
                              messageDetails.body_preview ||
                              'No content available'}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(previewAttachment)}
        onClose={closePreview}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle className='border-b border-[#E5EAF0] text-[16px] font-semibold text-[#16202A]'>
          {previewAttachment?.name || 'Attachment Preview'}
        </DialogTitle>
        <DialogContent className='bg-[#F7F9FC] p-0 max-h-[80vh] overflow-y-auto'>
          {!previewAttachment ? null : previewAttachment.contentType
              .toLowerCase()
              .startsWith('image/') ? (
            <div className='flex items-center justify-center p-6'>
              <img
                src={previewAttachment.objectUrl}
                alt={previewAttachment.name}
                className='max-h-[70vh] max-w-full rounded-[8px] border border-[#D8E1EB] bg-white object-contain shadow-[0_1px_2px_rgba(16,24,40,0.08)]'
              />
            </div>
          ) : previewAttachment.contentType.toLowerCase() ===
            'application/pdf' ? (
            <iframe
              title='attachment-preview'
              src={previewAttachment.objectUrl}
              className='w-full h-[70vh] bg-white'
            />
          ) : (
            <pre className='min-h-[75vh] overflow-auto whitespace-pre-wrap break-words bg-white p-6 font-mono text-[13px] text-[#16202A]'>
              {previewAttachment.textContent || 'Preview unavailable'}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inbox;
