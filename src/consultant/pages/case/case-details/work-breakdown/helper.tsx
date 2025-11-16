import {
  Activity,
  Comment,
} from '../../../../../components/kanban-board/types';

export interface TaskActivityRaw {
  rid: string;
  created_by_name: string;
  attribute_name: string;
  old_value: string | null;
  new_value: string;
  created_datetime: string;
}

export interface TaskCommentRaw {
  id?: string;
  comment_rid?: string;
  user?: string;
  user_name?: string;
  text?: string;
  comment_text?: string;
  date?: string;
  created_date?: string;
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
  return commentsData.map((comment) => ({
    id: comment.id || comment.comment_rid,
    user: comment.user || comment.user_name || 'Unknown',
    text: comment.text || comment.comment_text || '',
    date: new Date(
      comment.date || comment.created_date || new Date()
    ).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    attachments: comment.attachments,
  }));
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
  return attachmentsData.map((attachment) => ({
    id: attachment.id || attachment.attachment_rid,
    fileName: attachment.file_name,
    filePath: attachment.file_path,
    fileSize: attachment.file_size,
    fileType: attachment.file_type,
    uploadedBy:
      attachment.uploaded_by || attachment.uploaded_by_name || 'Unknown',
    uploadedDate: new Date(
      attachment.uploaded_date || attachment.created_date || new Date()
    ).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));
};
