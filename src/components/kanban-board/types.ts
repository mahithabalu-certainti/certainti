// Import AddCollaboratorResponse from work-breakdown service
import type { AddCollaboratorResponse } from '../../consultant/services/work-breakdown/work-breakdown-service';

export interface Assignee {
  name: string;
  initials: string;
  color: string;
}

export interface User extends Assignee {
  id: string;
}

export interface Activity {
  id?: string;
  user: string;
  action: string;
  date: string;
  link?: string;
  initials?: string;
  color?: string;
}

export interface CommentAttachment {
  rid: string;
  size: string;
  format: string;
  browseFile: string;
  documentName: string;
  isFileDeleted: boolean;
  uploadedBy?: string;
  uploadedDate?: string;
}

export interface Comment {
  id?: string;
  user: string;
  text: string;
  date: string;
  createdBy?: string;
  createdDateTime?: string;
  initials?: string;
  color?: string;
  attachments?: CommentAttachment[];
}

// New interface for simple status options (active/inactive)
export interface StatusOption {
  label: string;
  value: string;
}

export interface Task {
  id: string;
  r_number?: string;
  title: string;
  status: string;
  priority?: string;
  assignee: Assignee;
  commentCount: number;
  createdAt: Date;
  createdBy?: string;
  modifiedBy?: string;
  description?: string;
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
  checklistName?: string;
  checklistInfo?: {
    rid: string;
    name: string;
    description: string;
    totalItems: number;
    completedItems: number;
  };
  tags?: string[];
  tagsDetails?: Array<{ id: string; name: string }>;
  collaborators?: Assignee[];
  startDate?: Date;
  endDate?: Date;
  attachments?: string[];
  commentAttachments?: string[];
  activities?: Activity[];
  sequenceNo?: number;
  statusRid?: string;
  priorityRid?: string;
  account_rid?: string;
  case_rid?: string;
  caseTeamMemberRoleName?: string;
  linkedType?: string;
  linkedTypeRid?: string;
  linkTaskTypes?: string[];
  linkTaskTypeRids?: string[];
  weightage?: string;
  weightageRid?: string;
  category?: string;
  categoryRid?: string;
  workflow_connector?: Array<{
    rid: string;
    source_rid: string;
    target_rid: string;
    relationship_connector_rid: string;
    source_task_name: string;
    target_task_name: string;
    relationship_name: string;
  }>;
  fiscal_year?: string;
}

export interface TaskCard {
  rid: string;
  sequence_no: number;
  r_number: string;
  task_name: string;
  created_by: string;
  status_rid: string;
  assigned_to: string | null;
  priority_rid: string;
  task_type_rid: string;
  effort_in_days: number;
  checklists_count: number;
  completed_checklist_items_count: number;
  task_description: string | null;
  reminder_interval: number;
  effective_end_datetime: string;
  effective_start_datetime: string;
  case_team_member_role_rid: string;
  milestone_template_rid: string;
  priority_name: string;
  assigned_to_name: string | null;
  case_team_member_role_name: string;
  task_type_name: string;
  status_name: string;
  task_status_name?: string;
  tags?: string[];
  comments_count: number;
}

export interface KanbanColumn {
  rid: string;
  milestone_name: string;
  tasks: TaskCard[];
  task_count: number;
}

export interface FieldVisibility {
  assignee?: boolean;
  status?: boolean;
  priority?: boolean;
  tags?: boolean;
  startDate?: boolean;
  endDate?: boolean;
  description?: boolean;
  attachments?: boolean;
  comments?: boolean;
  collaborators?: boolean;
  checklist?: boolean;
  activities?: boolean;
  role?: boolean;
  checklistTemplate?: boolean;
  [key: string]: boolean | undefined;
}

export interface FieldDisabled {
  assignee?: boolean;
  status?: boolean;
  priority?: boolean;
  tags?: boolean;
  startDate?: boolean;
  endDate?: boolean;
  description?: boolean;
  attachments?: boolean;
  comments?: boolean;
  collaborators?: boolean;
  checklist?: boolean;
  role?: boolean;
  checklistTemplate?: boolean;
  taskName?: boolean;
  [key: string]: boolean | undefined;
}

export interface UserOption {
  rid: string;
  name: string;
  email?: string;
  status?: string;
}

export interface KanbanBoardProps {
  data: KanbanColumn[];
  isCreateTaskDisabled?: boolean;
  isCreateTaskHide?: boolean;
  showCommentCount?: boolean;
  showTaskCount?: boolean;
  showProfileIndicator?: boolean;
  statusData?: Array<{ id: string; name: string; color: string }>;
  statusOptions?: StatusOption[]; // New prop for active/inactive status
  priorityData?: Array<{ id: string; name: string; color: string }>;
  tagData?: Array<{ id: string; name: string; color: string }>;
  checklistData?: Array<{ id: string; name: string }>;
  userData?: UserOption[];
  roleOptions?: Array<{
    rid: string;
    role_name: string;
    role_description?: string;
    status?: string;
  }>;
  isDragable?: boolean;
  isDragablebetweenBoards?: boolean;
  onTaskClick?: (taskId: string) => void; // New callback for task selection
  onFetchTaskDetails?: (taskId: string) => Promise<Task | null>;
  onFetchTaskActivities?: (taskId: string) => Promise<Activity[]>;
  onFetchTaskComments?: (taskId: string) => Promise<Comment[]>;
  onFetchTaskAttachments?: (taskId: string) => Promise<
    Array<{
      id?: string;
      fileName: string;
      filePath?: string;
      fileSize?: number;
      fileType?: string;
      uploadedBy: string;
      uploadedDate: string;
    }>
  >;
  onFetchCollaborators?: (taskId: string) => Promise<
    Array<{
      assigned_to: string;
      assigned_to_name: string;
    }>
  >;
  onAddComment?: (
    taskId: string,
    comment: string,
    files: File[]
  ) => Promise<void>;
  onUpdateComment?: (
    commentId: string,
    comment: string,
    taskId: string,
    files?: File[],
    deletedFileIds?: string[]
  ) => Promise<void>;
  onDeleteComment?: (commentId: string, taskId: string) => Promise<void>;
  onAddCollaborator?: (
    taskId: string,
    userId: string
  ) => Promise<AddCollaboratorResponse>;
  fieldVisibility?: FieldVisibility;
  fieldDisabled?: FieldDisabled;
  isLoading?: boolean;
  onCreateTask?: (
    columnId: string,
    taskData: Partial<TaskCard>
  ) => Promise<void>;
  accountId?: string; // New prop for task detail modal
  caseId?: string; // New prop for task detail modal
  caseStartDate?: string | null;
  caseEndDate?: string | null;
  isExpanded?: boolean;
}

export interface TaskCardProps {
  taskId: string;
  showCommentCount?: boolean;
  showProfileIndicator?: boolean;

  onTaskClick?: (taskId: string) => void;
  statusData?: Array<{ id: string; name: string; color: string }>;
  statusOptions?: StatusOption[]; // New prop for active/inactive status
  priorityData?: Array<{ id: string; name: string; color: string }>;
}

export interface KanbanColumnProps {
  column: KanbanColumn;
  showTaskCount?: boolean;
  showCommentCount?: boolean;
  showProfileIndicator?: boolean;
  isCreateTaskDisabled?: boolean;
  isCreateTaskHide?: boolean;

  onTaskClick?: (taskId: string) => void;
  statusData?: Array<{ id: string; name: string; color: string }>;
  statusOptions?: StatusOption[]; // New prop for active/inactive status
  priorityData?: Array<{ id: string; name: string; color: string }>;
  tagData?: Array<{ id: string; name: string; color: string }>;
  checklistData?: Array<{ id: string; name: string }>;
  roleOptions?: Array<{
    rid: string;
    role_name: string;
    role_description?: string;
    status?: string;
  }>;
  collaboratorData?: Array<{ rid: string; name: string; email?: string }>;
  availableUsers?: UserOption[];

  onFetchTaskDetails?: (taskId: string) => Promise<Task | null>;
  onCreateTask?: (
    columnId: string,
    taskData: Partial<TaskCard>
  ) => Promise<void>;
  fieldVisibility?: FieldVisibility;
  fieldDisabled?: FieldDisabled;
  accountId?: string;
  caseId?: string;
  caseStartDate?: string | null;
  caseEndDate?: string | null;
}

export interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate?: () => void;

  statusData?: Array<{ id: string; name: string; color: string }>;
  statusOptions?: StatusOption[]; // New prop for active/inactive status
  priorityData?: Array<{ id: string; name: string; color: string }>;
  tagData?: Array<{ id: string; name: string; color: string }>;
  checklistData?: Array<{ id: string; name: string }>;
  roleOptions?: Array<{
    rid: string;
    role_name: string;
    role_description?: string;
    status?: string;
  }>;
  availableUsers?: UserOption[];
  onFetchTaskDetails?: (taskId: string) => Promise<Task | null>;
  onFetchTaskActivities?: (taskId: string) => Promise<Activity[]>;
  onFetchTaskComments?: (taskId: string) => Promise<Comment[]>;
  onFetchTaskAttachments?: (taskId: string) => Promise<
    Array<{
      id?: string;
      fileName: string;
      filePath?: string;
      fileSize?: number;
      fileType?: string;
      uploadedBy: string;
      uploadedDate: string;
    }>
  >;
  onFetchCollaborators?: (taskId: string) => Promise<
    Array<{
      assigned_to: string;
      assigned_to_name: string;
    }>
  >;
  onAddComment?: (
    taskId: string,
    comment: string,
    files: File[]
  ) => Promise<void>;
  onUpdateComment?: (
    commentId: string,
    comment: string,
    taskId: string,
    files?: File[],
    deletedFileIds?: string[]
  ) => Promise<void>;
  onDeleteComment?: (commentId: string, taskId: string) => Promise<void>;
  onAddCollaborator?: (
    taskId: string,
    userId: string
  ) => Promise<AddCollaboratorResponse>;
  fieldVisibility?: FieldVisibility;
  fieldDisabled?: FieldDisabled;
  caseStartDate?: string | null;
  caseEndDate?: string | null;
}
