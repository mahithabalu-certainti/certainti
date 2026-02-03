import {
  Activity,
  Comment,
} from '../../../../../components/kanban-board/types';
import {
  generateColorFromName,
  generateInitials,
} from '../../../../../components/kanban-board/helper';
import type {
  PriorityData,
  StatusData,
} from '../../../../services/work-breakdown/work-breakdown-service';

export interface TaskActivityRaw {
  rid: string;
  created_by_name: string;
  attribute_name: string;
  old_value: string | null;
  new_value: string;
  created_datetime: string;
  profile_url: string | null;
}

export interface TaskCommentAttachmentRaw {
  rid: string;
  size: string;
  format: string;
  browse_file: string;
  comments_rid: string;
  document_name: string;
  is_file_deleted: boolean;
  created_by_name?: string;
  created_datetime?: string;
}

export interface TaskCommentRaw {
  rid?: string;
  id?: string;
  comment_rid?: string;
  case_rid?: string;
  task_rid?: string;
  account_rid?: string;
  comments?: string;
  created_by_name?: string;
  user?: string;
  user_name?: string;
  text?: string;
  comment_text?: string;
  date?: string;
  created_date?: string;
  created_datetime?: string;
  created_by?: string;
  comments_attachments?: TaskCommentAttachmentRaw[];
  attachments?: TaskCommentAttachmentRaw[];
  profile_url?: string;
}

export interface TaskAttachmentRaw {
  id?: string;
  attachment_rid?: string;
  rid?: string;
  file_name?: string;
  document_name?: string;
  file_path?: string;
  browse_file?: string;
  file_size?: number;
  size?: string;
  file_type?: string;
  format?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  created_by_name?: string;
  uploaded_date?: string;
  created_date?: string;
  created_datetime?: string;
}

export interface TagOption {
  rid: string;
  tag_name: string;
}

/**
 * Transform raw activity data from API to Activity interface
 */
export const transformActivities = (
  activitiesData: TaskActivityRaw[]
): Activity[] => {
  return activitiesData.map((activity) => {
    let action = '';
    if (activity.old_value === 'CREATE') {
      action = activity.new_value;
    } else {
      action = `changed ${activity.attribute_name} from "${activity.old_value}" to "${activity.new_value}"`;
    }

    return {
      id: activity.rid,
      user: activity.created_by_name,
      action: action,
      date: new Date(activity.created_datetime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      initials: generateInitials(activity.created_by_name),
      color: generateColorFromName(activity.created_by_name),
      profile_url: activity.profile_url || '',
    };
  });
};

/**
 * Transform raw comment data from API to Comment interface
 */
export const transformComments = (
  commentsData: TaskCommentRaw[]
): Comment[] => {
  return commentsData.map((comment) => {
    // Get comment text - prioritize 'comments' field from new API response
    const commentText =
      comment.comments || comment.text || comment.comment_text || '';

    // Get user name - prioritize 'created_by_name' from new API response
    const userName =
      comment.created_by_name ||
      comment.user ||
      comment.user_name ||
      comment.created_by ||
      'Unknown';

    // Get comment date
    const commentDate =
      comment.created_datetime || comment.date || comment.created_date;

    const formattedDate = commentDate
      ? new Date(commentDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    // Generate initials from user name
    const initials = generateInitials(userName);

    const rawAttachments =
      comment.comments_attachments || comment.attachments || [];

    // Use comment-level metadata for attachments since they don't have their own
    const commentUploadedBy = userName;
    const commentUploadedDate = formattedDate;

    const attachments = rawAttachments.map((att) => ({
      rid: att.rid,
      size: att.size,
      format: att.format,
      browseFile: att.browse_file,
      documentName: att.document_name,
      isFileDeleted: att.is_file_deleted,
      uploadedBy: att.created_by_name || commentUploadedBy,
      uploadedDate: att.created_datetime
        ? new Date(att.created_datetime).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : commentUploadedDate,
    }));

    return {
      id: comment.rid || comment.id || comment.comment_rid,
      user: userName,
      text: commentText,
      createdBy: comment.created_by || userName,
      createdDateTime: formattedDate,
      date: formattedDate,
      initials: initials,
      color: generateColorFromName(userName),
      attachments: attachments,
      profile_url: comment.profile_url || '',
    };
  });
};

/**
 * Transform raw attachment data from API to formatted attachment object
 */
export const transformAttachments = (
  attachmentsData: TaskAttachmentRaw[]
): Array<{
  id?: string;
  fileName: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  uploadedBy: string;
  uploadedDate: string;
}> => {
  return attachmentsData.map((attachment) => {
    const uploadDate =
      attachment.created_datetime ||
      attachment.uploaded_date ||
      attachment.created_date;
    const formattedUploadDate = uploadDate
      ? new Date(uploadDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Recently uploaded';

    return {
      id: attachment.id || attachment.attachment_rid || attachment.rid,
      fileName: attachment.file_name || attachment.document_name || '',
      filePath: attachment.file_path || attachment.browse_file,
      fileSize:
        attachment.file_size ||
        (attachment.size ? parseFloat(attachment.size) : undefined),
      fileType: attachment.file_type || attachment.format,
      uploadedBy:
        attachment.created_by_name ||
        attachment.uploaded_by_name ||
        attachment.uploaded_by ||
        'Unknown',
      uploadedDate: formattedUploadDate,
    };
  });
};

/**
 * Transform priority data from API to format suitable for dropdown
 */
export const transformPriorityData = (
  prioritiesData: PriorityData[]
): Array<{ id: string; name: string; color: string }> => {
  return prioritiesData.map((priority) => ({
    id: priority.rid,
    name: priority.priority_name,
    color: generateColorFromName(priority.priority_name),
  }));
};

/**
 * Transform status data from API to format suitable for dropdown
 */
export const transformStatusData = (
  statusesData: StatusData[]
): Array<{ id: string; name: string; color: string }> => {
  return statusesData.map((status) => ({
    id: status.rid,
    name: status.task_status_name,
    color: generateColorFromName(status.task_status_name),
  }));
};

/**
 * Transform tag data from API to format suitable for dropdown
 */
export const transformTagData = (
  tagsData: TagOption[]
): Array<{ id: string; name: string; color: string }> => {
  return tagsData.map((tag) => ({
    id: tag.rid,
    name: tag.tag_name,
    color: '#3B82F6',
  }));
};
