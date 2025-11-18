import {
  Activity,
  Comment,
} from '../../../../../components/kanban-board/types';
import { generateColorFromName } from '../../../../../components/kanban-board/helper';
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
}

export interface TaskCommentRaw {
  rid?: string;
  id?: string;
  comment_rid?: string;
  case_rid?: string;
  task_rid?: string;
  account_rid?: string;
  comments?: string;
  user?: string;
  user_name?: string;
  text?: string;
  comment_text?: string;
  date?: string;
  created_date?: string;
  created_datetime?: string;
  created_by?: string;
  comments_attachments?: string[];
  attachments?: string[];
}

export interface TaskAttachmentRaw {
  id?: string;
  attachment_rid?: string;
  file_name: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  uploaded_date?: string;
  created_date?: string;
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
  return activitiesData.map((activity) => ({
    id: activity.rid,
    user: activity.created_by_name,
    action: `changed ${activity.attribute_name} from "${activity.old_value}" to "${activity.new_value}"`,
    date: new Date(activity.created_datetime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));
};

/**
 * Transform raw comment data from API to Comment interface
 */
export const transformComments = (
  commentsData: TaskCommentRaw[]
): Comment[] => {
  return commentsData.map((comment) => {
    const commentText =
      comment.comments || comment.text || comment.comment_text || '';
    const userName =
      comment.user || comment.user_name || comment.created_by || 'Unknown';
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

    return {
      id: comment.rid || comment.id || comment.comment_rid,
      user: userName,
      text: commentText,
      createdBy: comment.created_by || userName,
      createdDateTime: formattedDate,
      date: formattedDate,
      initials:
        generateColorFromName(userName)?.substring(0, 2).toUpperCase() || 'UN',
      color: generateColorFromName(userName),
      attachments: comment.comments_attachments || comment.attachments || [],
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
    const uploadDate = attachment.uploaded_date || attachment.created_date;

    return {
      id: attachment.id || attachment.attachment_rid,
      fileName: attachment.file_name,
      filePath: attachment.file_path,
      fileSize: attachment.file_size,
      fileType: attachment.file_type,
      uploadedBy:
        attachment.uploaded_by || attachment.uploaded_by_name || 'Unknown',
      uploadedDate: uploadDate
        ? new Date(uploadDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Recently uploaded',
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
