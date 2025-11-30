import { useEffect, useState, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TaskDetailModalProps, Task, Activity, Comment } from './types';
import { MenuItem, SelectChangeEvent } from '@mui/material';
import dayjs from 'dayjs';
import { CalendarIcon, CloseIcon, ErrorInfoIcon } from '../../assets';
import { Tooltip } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TextButton from '../button/text-button';
import StyledSelect from './styled-select';
import TaskCommentsSection from './task-comments-section';
import TaskAttachmentsSection from './task-attachments-section';
import TaskCollaboratorsSection from './task-collaborators-section';
import TaskFieldsSection from './task-fields-section';
import TaskChecklistSection from './task-checklist-section';
import { enrichTask, enrichUserOption } from './helper';
import {
  useGetTaskDetail,
  useGetTaskActivities,
  useGetCollaborators,
  useDeleteCollaborator,
} from '../../consultant/services/work-breakdown/work-breakdown-service';
import {
  useGetTaskCommentsList,
  useGetTaskAttachmentsList,
  useUploadTaskAttachments,
  useDeleteTaskAttachment,
  useUpdateCaseTask,
  useGetTaskDropDownList,
} from '../../consultant/services/case-task/case-task-service';
import { useUpdateActivityTask } from '../../consultant/services/activities/activities-service';
import {
  useGetTagOptions,
  useDeleteTag,
} from '../../consultant/services/case-team/case-team-service';
import {
  transformComments,
  transformActivities,
  transformAttachments,
  transformTagData,
  type TaskCommentRaw,
  type TaskActivityRaw,
  type TaskAttachmentRaw,
} from '../../consultant/pages/case/case-details/work-breakdown/helper';
import { useToast } from '../../hooks';
import {
  useGetTaskConnectorTypes,
  useWeightageList,
  useGetTaskCategoryTypes,
} from '../../admin/service/task-template/task-template-service';

interface TaskDetailModalPropsExtended
  extends Omit<TaskDetailModalProps, 'tagData'> {
  tagData?: Array<{ id: string; name: string; color: string }>;
  availableTagOptions?: Array<{ id: string; name: string; color: string }>;
  accountId: string;
  caseId: string;
  onAddComment?: (
    taskId: string,
    comment: string,
    files: File[]
  ) => Promise<void>;
  caseStartDate?: string | null;
  caseEndDate?: string | null;
  fiscalYear?: string | null;
  fiscalYears?: string[];
  taskType?: string;
}

const TaskDetailModal: React.FC<TaskDetailModalPropsExtended> = ({
  taskId,
  isOpen,
  onClose,
  onTaskUpdate,
  statusData = [],
  priorityData = [],
  tagData = [],
  availableTagOptions = [],
  availableUsers = [],
  checklistData = [],
  onAddComment,
  onUpdateComment,

  onDeleteComment,
  onAddCollaborator,
  accountId,
  caseId,
  fieldVisibility = {},
  fieldDisabled = {},
  caseStartDate,
  caseEndDate,
  fiscalYear,
  fiscalYears,
  taskType,
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [collaborators, setCollaborators] = useState<
    Array<{
      assigned_to: string;
      assigned_to_name: string;
    }>
  >([]);
  const [taskAttachments, setTaskAttachments] = useState<
    Array<{
      id?: string;
      fileName: string;
      filePath?: string;
      fileSize?: number;
      fileType?: string;
      uploadedBy: string;
      uploadedDate: string;
    }>
  >([]);
  const [isLoadingTaskDetails, setIsLoadingTaskDetails] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>(
    'comments'
  );
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState<
    string[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedChecklist, setSelectedChecklist] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>(
    []
  );
  const [originalTask, setOriginalTask] = useState<Task | null>(null);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [linkedType, setLinkedType] = useState('');
  const [linkTaskTypes, setLinkTaskTypes] = useState<string[]>([]);
  const [weightage, setWeightage] = useState('');
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ErrorIconTooltip = ({ error }: { error: string }) => (
    <Tooltip
      title={error}
      placement='top'
      arrow
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: '#FEF2F2',
            color: '#EF4444',
            border: '1px solid #EF4444',
            fontSize: '12px',
          },
        },
        arrow: {
          sx: {
            color: '#FEF2F2',
            '&:before': {
              border: '1px solid #EF4444',
            },
          },
        },
      }}
    >
      <span className='cursor-pointer ml-2 inline-flex align-middle'>
        <ErrorInfoIcon className='w-4 h-4 text-red-500' />
      </span>
    </Tooltip>
  );

  const { successToast, errorToast } = useToast();
  const uploadAttachmentsMutation = useUploadTaskAttachments();
  const deleteAttachmentMutation = useDeleteTaskAttachment();
  const updateTaskMutation = useUpdateCaseTask();
  const updateActivityTaskMutation = useUpdateActivityTask();
  const deleteCollaboratorMutation = useDeleteCollaborator();
  const deleteTagMutation = useDeleteTag();
  const queryClient = useQueryClient();

  const commentsParams = useMemo(
    () => ({
      account_rid: accountId,
      ...(taskType !== 'activity' && { case_rid: caseId }),
      task_rid: taskId!,
      page: 1,
      limit: 100,
      ...(taskType === 'activity' && { task_type: 'activity' }),
    }),
    [accountId, caseId, taskId, taskType]
  );

  const attachmentsParams = useMemo(
    () => ({
      account_rid: accountId,
      ...(taskType !== 'activity' && { case_rid: caseId }),
      task_rid: taskId!,
      page: 1,
      limit: 100,
      ...(taskType === 'activity' && { task_type: 'activity' }),
    }),
    [accountId, caseId, taskId, taskType]
  );

  const { data: rawTask, isLoading: taskLoading } = useGetTaskDetail(
    accountId,
    caseId,
    taskId!,
    !!taskId && isOpen,
    taskType
  );

  const { data: rawCommentsResponse } = useGetTaskCommentsList(commentsParams, {
    enabled: !!taskId && isOpen,
  });

  const { data: rawActivities } = useGetTaskActivities(
    accountId,
    caseId,
    taskId!,
    !!taskId && isOpen
  );

  const { data: rawAttachmentsResponse } = useGetTaskAttachmentsList(
    attachmentsParams,
    { enabled: !!taskId && isOpen }
  );

  const { data: rawCollaborators } = useGetCollaborators(
    accountId,
    caseId,
    taskId!,
    !!taskId && isOpen,
    taskType
  );

  const { data: tagOptionsData } = useGetTagOptions(
    {
      task_rid: taskId || '',
      account_rid: accountId,
      case_rid: caseId,
      action: 'update',
    },
    !!taskId && isOpen
  );

  useEffect(() => {
    if (rawTask) {
      const enriched = enrichTask(rawTask);
      setTask(enriched);
      setEditedTask(enriched);
      setOriginalTask(enriched);
      if (enriched.caseTeamMemberRoleName) {
        setSelectedRole(enriched.caseTeamMemberRoleName);
      }
      if (enriched.checklistName) {
        setSelectedChecklist(enriched.checklistName);
      }
      if (enriched.weightage) {
        setWeightage(enriched.weightage);
      }
      if (enriched.category) {
        setCategory(enriched.category);
      }
      if (enriched.linkedType) {
        setLinkedType(enriched.linkedType);
      }
      if (enriched.linkTaskTypes) {
        setLinkTaskTypes(enriched.linkTaskTypes);
      }
      setIsLoadingTaskDetails(false);
    }
  }, [rawTask]);

  useEffect(() => {
    let commentsArray: TaskCommentRaw[] = [];
    if (rawCommentsResponse) {
      if (Array.isArray(rawCommentsResponse)) {
        commentsArray = rawCommentsResponse;
      } else if (
        typeof rawCommentsResponse === 'object' &&
        'data' in rawCommentsResponse
      ) {
        const innerData = (
          rawCommentsResponse as unknown as Record<string, unknown>
        ).data;
        if (Array.isArray(innerData)) {
          commentsArray = innerData;
        } else if (
          innerData &&
          typeof innerData === 'object' &&
          'data' in innerData &&
          Array.isArray((innerData as unknown as Record<string, unknown>).data)
        ) {
          commentsArray = (innerData as Record<string, unknown>)
            .data as TaskCommentRaw[];
        }
      }
    }
    try {
      setComments(transformComments(commentsArray));
    } catch (error) {
      console.error('Error transforming comments:', error);
      setComments([]);
    }
  }, [rawCommentsResponse]);

  useEffect(() => {
    let activitiesArray: TaskActivityRaw[] = [];
    if (rawActivities) {
      if (Array.isArray(rawActivities)) {
        activitiesArray = rawActivities;
      } else if (typeof rawActivities === 'object' && 'data' in rawActivities) {
        const innerData = (rawActivities as unknown as Record<string, unknown>)
          .data;
        if (Array.isArray(innerData)) {
          activitiesArray = innerData;
        } else if (
          innerData &&
          typeof innerData === 'object' &&
          'data' in innerData &&
          Array.isArray((innerData as unknown as Record<string, unknown>).data)
        ) {
          activitiesArray = (innerData as Record<string, unknown>)
            .data as TaskActivityRaw[];
        }
      }
    }
    setActivities(transformActivities(activitiesArray));
  }, [rawActivities]);

  useEffect(() => {
    let attachmentsArray: TaskAttachmentRaw[] = [];
    if (rawAttachmentsResponse) {
      if (Array.isArray(rawAttachmentsResponse)) {
        attachmentsArray = rawAttachmentsResponse;
      } else if (
        typeof rawAttachmentsResponse === 'object' &&
        'data' in rawAttachmentsResponse
      ) {
        const innerData = (
          rawAttachmentsResponse as unknown as Record<string, unknown>
        ).data;
        if (Array.isArray(innerData)) {
          attachmentsArray = innerData;
        } else if (
          innerData &&
          typeof innerData === 'object' &&
          'data' in innerData &&
          Array.isArray((innerData as unknown as Record<string, unknown>).data)
        ) {
          attachmentsArray = (innerData as Record<string, unknown>)
            .data as TaskAttachmentRaw[];
        }
      }
    }
    setTaskAttachments(transformAttachments(attachmentsArray));
  }, [rawAttachmentsResponse]);

  useEffect(() => {
    setCollaborators(rawCollaborators || []);
  }, [rawCollaborators]);

  useEffect(() => {
    setIsLoadingTaskDetails(taskLoading);
  }, [taskLoading]);

  const transformedTagOptions = useMemo(() => {
    if (tagOptionsData) {
      return transformTagData(tagOptionsData);
    }
    return [];
  }, [tagOptionsData]);

  const [availableTags, setAvailableTags] = useState<
    Array<{ id: string; name: string; color: string; is_new_tag?: boolean }>
  >([]);

  // Use ref to track if we've initialized tags to prevent infinite loops
  const prevTagsRef = useRef<string>('');

  useEffect(() => {
    let newTags: Array<{ id: string; name: string; color: string }> = [];

    if (transformedTagOptions.length > 0) {
      newTags = transformedTagOptions;
    } else if (availableTagOptions && availableTagOptions.length > 0) {
      newTags = availableTagOptions;
    } else if (tagData && tagData.length > 0) {
      newTags = tagData;
    }

    const newTagsStr = JSON.stringify(newTags);
    if (prevTagsRef.current !== newTagsStr) {
      prevTagsRef.current = newTagsStr;
      setAvailableTags(newTags);
    }
  }, [transformedTagOptions, availableTagOptions, tagData]);

  // Fetch connector types and task templates
  const taskConnectorTypesQuery = useGetTaskConnectorTypes();
  const taskTemplatesQuery = useGetTaskDropDownList({
    case_rid: caseId,
    account_rid: accountId,
    search: '',
  });

  const connectorTypesData = useMemo(() => {
    if (
      taskConnectorTypesQuery.data?.data &&
      Array.isArray(taskConnectorTypesQuery.data.data)
    ) {
      return taskConnectorTypesQuery.data.data.map(
        (connector: { rid: string; relationship_type: string }) => ({
          id: connector.rid,
          name: connector.relationship_type,
        })
      );
    }
    return [];
  }, [taskConnectorTypesQuery.data]);

  const taskTemplatesData = useMemo(() => {
    if (
      taskTemplatesQuery.data?.data &&
      Array.isArray(taskTemplatesQuery.data.data)
    ) {
      return taskTemplatesQuery.data.data
        .filter((template: { rid: string; task_name: string }) => {
          // Filter out the current task by name if available
          if (task?.title && template.task_name === task.title) {
            return false;
          }
          // Also filter by ID if possible, though the request specifically mentioned name
          if (taskId && template.rid === taskId) {
            return false;
          }
          return true;
        })
        .map((template: { rid: string; task_name: string }) => ({
          id: template.rid,
          name: template.task_name,
        }));
    }
    return [];
  }, [taskTemplatesQuery.data, task?.title, taskId]);

  // Fetch weightage and category lists
  const weightageListQuery = useWeightageList();
  const categoryListQuery = useGetTaskCategoryTypes();

  const weightageData = useMemo(() => {
    // Handle nested data.data structure
    const response = weightageListQuery.data as {
      data?:
      | { data?: Array<{ rid: string; weightage_value: number }> }
      | Array<{ rid: string; weightage_value: number }>;
    };
    const dataArray = Array.isArray(response?.data)
      ? response.data
      : response?.data?.data;
    if (dataArray && Array.isArray(dataArray)) {
      return dataArray.map(
        (item: { rid: string; weightage_value: number }) => ({
          id: item.rid,
          name: String(item.weightage_value),
        })
      );
    }
    return [];
  }, [weightageListQuery.data]);

  const categoryData = useMemo(() => {
    const response = categoryListQuery.data as unknown as {
      data?: Array<{ rid: string; category_name: string }>;
    };
    if (response?.data && Array.isArray(response.data)) {
      return response.data.map(
        (item: { rid: string; category_name: string }) => ({
          id: item.rid,
          name: item.category_name,
        })
      );
    }
    return [];
  }, [categoryListQuery.data]);

  const minDate = useMemo(() => {
    return caseStartDate ? dayjs(caseStartDate) : undefined;
  }, [caseStartDate]);

  const maxDate = useMemo(() => {
    return caseEndDate ? dayjs(caseEndDate) : undefined;
  }, [caseEndDate]);

  const hasTaskChanged = () => {
    if (!task || !editedTask || !originalTask) return false;

    const tagsChanged =
      JSON.stringify(originalTask.tags) !== JSON.stringify(editedTask.tags);
    const checklistChanged =
      JSON.stringify(originalTask.checklist) !==
      JSON.stringify(editedTask.checklist);

    const linkTaskTypesChanged =
      JSON.stringify([...(linkTaskTypes || [])].sort()) !==
      JSON.stringify([...(originalTask.linkTaskTypes || [])].sort());

    return (
      originalTask.title !== editedTask.title ||
      originalTask.description !== editedTask.description ||
      originalTask.status !== editedTask.status ||
      originalTask.priority !== editedTask.priority ||
      originalTask.startDate !== editedTask.startDate ||
      originalTask.endDate !== editedTask.endDate ||
      originalTask.assignee?.name !== editedTask.assignee?.name ||
      tagsChanged ||
      checklistChanged ||
      selectedRole !== (originalTask.caseTeamMemberRoleName || '') ||
      selectedChecklist !== (originalTask.checklistName || '') ||
      linkedType !== (originalTask.linkedType || '') ||
      linkTaskTypesChanged ||
      weightage !== (originalTask.weightage || '') ||
      category !== (originalTask.category || '') ||
      originalTask.fiscal_year !== editedTask.fiscal_year ||
      pendingAttachments.length > 0 ||
      deletedAttachmentIds.length > 0
    );
  };
  const collaboratorUsers = useMemo(
    () =>
      collaborators.map((collab) =>
        enrichUserOption({
          rid: collab.assigned_to,
          name: collab.assigned_to_name,
        })
      ),
    [collaborators]
  );
  const allEnrichedUsers = useMemo(
    () => [
      ...collaboratorUsers,
      ...(availableUsers
        ?.filter((user) => !collaboratorUsers.find((cu) => cu.id === user.rid))
        .map((user) => enrichUserOption(user)) || []),
    ],
    [collaboratorUsers, availableUsers]
  );

  useEffect(() => {
    if (
      !editedTask ||
      (editedTask.collaborators && editedTask.collaborators.length > 0)
    ) {
      return;
    }
    if (collaborators && collaborators.length > 0) {
      const mappedCollaborators = collaborators.map((collab) => {
        const enrichedUser = enrichUserOption({
          rid: collab.assigned_to,
          name: collab.assigned_to_name,
        });
        return {
          name: enrichedUser.name,
          initials: enrichedUser.initials,
          color: enrichedUser.color,
        };
      });
      setEditedTask((prev) =>
        prev ? { ...prev, collaborators: mappedCollaborators } : null
      );
    }
  }, [collaborators, editedTask]);

  useEffect(() => {
    if (!editedTask) return;
    const ids = (editedTask.collaborators || [])
      .map((collab) => {
        const user = allEnrichedUsers.find((u) => u.name === collab.name);
        return user?.id || '';
      })
      .filter((id) => id !== '');
    setSelectedCollaboratorIds(ids);
  }, [editedTask, allEnrichedUsers]);

  if (!isOpen || !taskId) return null;
  if (isLoadingTaskDetails || (rawTask && !task)) {
    return (
      <div
        className='fixed right-0 bottom-0 w-[650px] bg-white text-gray-900 shadow-2xl z-50 overflow-y-auto'
        style={{ top: '38.1px' }}
      >
        <div className='sticky top-0 flex items-center justify-between p-[16.5px] border-b border-[#CBD6E2] bg-white z-50'>
          <div className='p-2 w-6 h-6'></div>
          <div className='h-8 w-20 bg-[#E4E6E7] rounded animate-pulse'></div>
        </div>

        <div className='p-6 space-y-6 animate-pulse'>
          {/* Title skeleton */}
          <div className='h-8 w-3/4 bg-[#E4E6E7] rounded'></div>

          {/* Assignee skeleton */}
          <div className='flex items-center justify-between'>
            <div className='h-4 w-20 bg-[#E4E6E7] rounded'></div>
            <div className='h-8 w-40 bg-[#E4E6E7] rounded'></div>
          </div>

          {/* Dates skeleton */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <div className='h-3 w-16 bg-[#E4E6E7] rounded mb-2'></div>
              <div className='h-8 bg-[#E4E6E7] rounded'></div>
            </div>
            <div>
              <div className='h-3 w-16 bg-[#E4E6E7] rounded mb-2'></div>
              <div className='h-8 bg-[#E4E6E7] rounded'></div>
            </div>
          </div>

          {/* Fields section skeleton */}
          <div>
            <div className='h-4 w-20 bg-[#E4E6E7] rounded mb-3'></div>
            <div className='border border-[#E4E6E7] rounded-lg space-y-0'>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className='flex items-center justify-between px-4 py-3 border-b border-[#E4E6E7]'
                >
                  <div className='h-4 w-16 bg-[#E4E6E7] rounded'></div>
                  <div className='h-8 w-32 bg-[#E4E6E7] rounded'></div>
                </div>
              ))}
            </div>
          </div>

          {/* Description skeleton */}
          <div>
            <div className='h-4 w-28 bg-[#E4E6E7] rounded mb-3'></div>
            <div className='space-y-2'>
              <div className='h-4 bg-[#E4E6E7] rounded w-full'></div>
              <div className='h-4 bg-[#E4E6E7] rounded w-5/6'></div>
              <div className='h-4 bg-[#E4E6E7] rounded w-4/5'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task || !editedTask) {
    return (
      <div
        className='fixed right-0 bottom-0 w-[650px] bg-white text-gray-900 shadow-2xl z-50 flex items-center justify-center'
        style={{ top: '38.1px' }}
      >
        <div className='text-center text-gray-500'>
          <p>Task not found</p>
          <button
            onClick={onClose}
            className='mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm'
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!editedTask?.title || !editedTask.title.trim()) {
      newErrors.taskTitle = 'Field is required';
    }
    if (!editedTask?.status) newErrors.status = 'Field is required';
    if (!editedTask?.priority) newErrors.priority = 'Field is required';

    if (linkedType && (!linkTaskTypes || linkTaskTypes.length === 0)) {
      newErrors.linkTaskType = 'Field is required';
    }
    if (!linkedType && linkTaskTypes && linkTaskTypes.length > 0) {
      newErrors.linkedType = 'Field is required';
    }

    if (editedTask?.title && editedTask.title.length > 2000) {
      newErrors.taskTitle = 'Maximum 2000 characters allowed';
    }
    if (editedTask?.description && editedTask.description.length > 2000) {
      newErrors.description = 'Maximum 2000 characters allowed';
    }
    if (editedTask?.tags && editedTask.tags.some((tag) => tag.length > 50)) {
      newErrors.tags = 'Maximum 50 characters allowed';
    }

    if (editedTask?.startDate) {
      if (minDate && dayjs(editedTask.startDate).isBefore(minDate, 'day')) {
        newErrors.startDate = 'Invalid Date';
      }
      if (maxDate && dayjs(editedTask.startDate).isAfter(maxDate, 'day')) {
        newErrors.startDate = 'Invalid Date';
      }
    }

    if (editedTask?.endDate) {
      if (minDate && dayjs(editedTask.endDate).isBefore(minDate, 'day')) {
        newErrors.endDate = 'Invalid Date';
      }
      if (maxDate && dayjs(editedTask.endDate).isAfter(maxDate, 'day')) {
        newErrors.endDate = 'Invalid Date';
      }
      if (
        editedTask?.startDate &&
        dayjs(editedTask.endDate).isBefore(dayjs(editedTask.startDate), 'day')
      ) {
        newErrors.endDate = 'Invalid Date';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      // Identify removed tags and delete them
      const removedTags: string[] = [];
      if (originalTask?.tagsDetails) {
        originalTask.tagsDetails.forEach((detail) => {
          // If the tag name is no longer in the edited tags list, it was removed
          if (!editedTask?.tags?.includes(detail.name)) {
            removedTags.push(detail.id);
          }
        });
      }

      if (removedTags.length > 0 && taskId) {
        try {
          await deleteTagMutation.mutateAsync({
            task_rid: taskId,
            account_rid: accountId,
            case_rid: caseId,
            tag_rid: removedTags,
          });
        } catch (error) {
          console.error('Error deleting tags:', error);
        }
      }

      const tagsArray: Array<{ tag_rid: string; is_new_tag: boolean }> = [];
      if (editedTask?.tags && editedTask.tags.length > 0) {
        editedTask.tags.forEach((tagName: string) => {
          const existingTag = availableTags?.find((t) => t.name === tagName);
          if (existingTag && !existingTag.is_new_tag) {
            // Existing tag from server - pass its ID
            tagsArray.push({
              tag_rid: existingTag.id,
              is_new_tag: false,
            });
          } else {
            // New tag created in this session - pass the tag name
            tagsArray.push({
              tag_rid: tagName,
              is_new_tag: true,
            });
          }
        });
      }
      const selectedStatus = statusData?.find(
        (s) => s.name === editedTask?.status
      );
      const selectedPriority = priorityData?.find(
        (p) => p.name === editedTask?.priority
      );
      const selectedChecklistObj = checklistData?.find(
        (c) => c.name === selectedChecklist
      );
      if (deletedAttachmentIds.length > 0 && taskId) {
        try {
          for (const attachmentId of deletedAttachmentIds) {
            await deleteAttachmentMutation.mutateAsync({
              account_rid: accountId,
              ...(taskType !== 'activity' && { case_rid: caseId }),
              task_rid: taskId,
              rid: attachmentId,
              ...(taskType === 'activity' && { task_type: 'activity' }),
            });
          }
          setDeletedAttachmentIds([]);
        } catch (error) {
          const errorMessage =
            (error as { response?: { data?: { statusMessage?: string } } })
              ?.response?.data?.statusMessage ||
            (error instanceof Error
              ? error.message
              : 'Failed to delete attachments');
          errorToast(errorMessage);
          console.error('Error deleting attachments:', error);
        }
      }
      if (pendingAttachments.length > 0 && taskId) {
        try {
          await uploadAttachmentsMutation.mutateAsync({
            account_rid: accountId,
            ...(taskType !== 'activity' && { case_rid: caseId }),
            task_rid: taskId,
            files: pendingAttachments,
            ...(taskType === 'activity' && { task_type: 'activity' }),
          });
          setPendingAttachments([]);
          setEditedTask((prev) => (prev ? { ...prev, attachments: [] } : null));

          queryClient.invalidateQueries({
            queryKey: ['taskAttachments', attachmentsParams],
          });
        } catch (error) {
          const errorMessage =
            (error as { response?: { data?: { statusMessage?: string } } })
              ?.response?.data?.statusMessage ||
            (error instanceof Error
              ? error.message
              : 'Failed to upload attachments');
          errorToast(errorMessage);
          console.error('Error uploading attachments:', error);
        }
      }

      if (editedTask && taskId) {
        // Get RIDs for linked type and link task types
        const linkedTypeRidValue = linkedType
          ? connectorTypesData?.find((c) => c.name === linkedType)?.id || ''
          : '';

        const linkTaskTypeRidsValue =
          linkTaskTypes && linkTaskTypes.length > 0
            ? linkTaskTypes
              .map((taskType) => {
                const template = taskTemplatesData?.find(
                  (t) => t.name === taskType
                );
                return template?.id || '';
              })
              .filter((rid) => rid !== '')
            : [];

        const weightageRidValue = weightage
          ? weightageData?.find((w) => w.name === weightage)?.id || ''
          : '';

        const categoryRidValue = category
          ? categoryData?.find(
            (c: { id: string; name: string }) => c.name === category
          )?.id || ''
          : '';

        const assignedToRid = editedTask.assignee
          ? allEnrichedUsers.find((u) => u.name === editedTask.assignee.name)
            ?.id || ''
          : '';

        const workflowConnector: Record<string, unknown> = {};

        const originalTargetRids =
          originalTask?.workflow_connector?.map((wc) => wc.target_rid) || [];
        const deleteTargetRids = originalTargetRids.filter(
          (rid) => !linkTaskTypeRidsValue.includes(rid)
        );

        if (
          linkedTypeRidValue &&
          (linkTaskTypeRidsValue.length > 0 || deleteTargetRids.length > 0)
        ) {
          workflowConnector.source_rid = taskId;
          workflowConnector.relationship_connector_rid = linkedTypeRidValue;
          workflowConnector.target_rid = linkTaskTypeRidsValue;
          workflowConnector.delete_target_rids = deleteTargetRids;
        }

        const updatePayload = {
          rid: taskId,
          ...(caseId ? { case_rid: caseId } : {}),
          account_rid: accountId,
          task_name: editedTask.title || '',
          task_description: editedTask.description || '',
          task_status_rid: selectedStatus?.id || '',
          priority_rid: selectedPriority?.id || '',
          ...(caseId || selectedChecklistObj?.id
            ? { checklist_template_rid: selectedChecklistObj?.id || '' }
            : {}),
          effective_start_datetime: editedTask.startDate
            ? dayjs(editedTask.startDate).format('YYYY-MM-DD')
            : '',
          effective_end_datetime: editedTask.endDate
            ? dayjs(editedTask.endDate).format('YYYY-MM-DD')
            : '',
          tags: tagsArray,
          ...(caseId || Object.keys(workflowConnector).length > 0
            ? { workflow_connector: workflowConnector }
            : {}),
          ...(weightageRidValue && {
            weightage_rid: weightageRidValue,
          }),
          ...(categoryRidValue && {
            task_category_rid: categoryRidValue,
          }),
          assigned_to: assignedToRid || '',
          fiscal_year: editedTask.fiscal_year,
        };

        let updateResponse;

        if (taskType === 'activity') {
          // Use activities API for tasks opened from activities page
          const activityPayload = {
            task_rid: taskId,
            attach_to: editedTask.case_rid || caseId || accountId,
            attachment_level:
              editedTask.case_rid || caseId ? 'case' : 'account',
            account_rid: accountId,
            task_name: editedTask.title || '',
            task_description: editedTask.description || '',
            task_status_rid: selectedStatus?.id || '',
            priority_rid: selectedPriority?.id || '',
            effective_start_datetime: editedTask.startDate
              ? dayjs(editedTask.startDate).format('YYYY-MM-DD')
              : '',
            effective_end_datetime: editedTask.endDate
              ? dayjs(editedTask.endDate).format('YYYY-MM-DD')
              : '',
            tags: tagsArray,
            assigned_to: assignedToRid || '',
            fiscal_year: editedTask.fiscal_year,
          };
          updateResponse =
            await updateActivityTaskMutation.mutateAsync(activityPayload);
        } else {
          // Use case task API for tasks opened from work breakdown
          updateResponse = await updateTaskMutation.mutateAsync(updatePayload);
        }

        const message =
          (updateResponse as { statusMessage?: string })?.statusMessage ||
          'Task updated successfully';
        successToast(message);
        setOriginalTask(editedTask);
        queryClient.invalidateQueries({
          queryKey: ['taskActivities', accountId, caseId, taskId],
        });
        queryClient.invalidateQueries({
          queryKey: [
            'taskActivitiesInfinite',
            {
              case_rid: caseId,
              account_rid: accountId,
              task_rid: taskId,
            },
          ],
        });
        queryClient.invalidateQueries({
          queryKey: ['taskDetail', accountId, caseId, taskId],
        });
        if (onTaskUpdate) {
          onTaskUpdate();
        }
      }
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { statusMessage?: string } } })
          ?.response?.data?.statusMessage ||
        (error instanceof Error ? error.message : 'Failed to update task');
      errorToast(errorMessage);
      console.error('Error updating task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setEditedTask((prev) =>
      prev ? { ...prev, description: e.target.value } : null
    );
  };

  const handleStatusChange = (statusName: string) => {
    setEditedTask((prev) =>
      prev
        ? {
          ...prev,
          status: statusName,
        }
        : null
    );
    if (statusName) setErrors((prev) => ({ ...prev, status: '' }));
  };

  const handlePriorityChange = (priorityName: string) => {
    setEditedTask((prev) =>
      prev ? { ...prev, priority: priorityName } : null
    );
    if (priorityName) setErrors((prev) => ({ ...prev, priority: '' }));
  };

  const handleStartDateChange = (date: string) => {
    const newStartDate = date ? new Date(date) : undefined;
    setEditedTask((prev) => {
      if (!prev) return null;
      const updatedTask = { ...prev, startDate: newStartDate };
      if (
        updatedTask.endDate &&
        newStartDate &&
        updatedTask.endDate <= newStartDate
      ) {
        updatedTask.endDate = undefined;
      }
      return updatedTask;
    });
    if (newStartDate) {
      setErrors((prev) => ({ ...prev, startDate: '' }));
    }
  };

  const handleEndDateChange = (date: string) => {
    const newEndDate = date ? new Date(date) : undefined;
    setEditedTask((prev) => {
      if (!prev) return null;
      if (newEndDate && prev.startDate && newEndDate <= prev.startDate) {
        return prev;
      }
      return { ...prev, endDate: newEndDate };
    });
    if (newEndDate) {
      setErrors((prev) => ({ ...prev, endDate: '' }));
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setPendingAttachments((prev) => [...prev, ...fileArray]);
      const fileNames = fileArray.map((f) => f.name);
      setEditedTask((prev) =>
        prev
          ? {
            ...prev,
            attachments: [...(prev.attachments || []), ...fileNames],
          }
          : null
      );
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setEditedTask((prev) => {
      if (!prev) return null;
      const updatedAttachments =
        prev.attachments?.filter((_, index) => index !== indexToRemove) || [];

      // Also remove from pending attachments if it's a pending one
      if (indexToRemove < pendingAttachments.length) {
        setPendingAttachments((prevPending) =>
          prevPending.filter((_, index) => index !== indexToRemove)
        );
      }

      return { ...prev, attachments: updatedAttachments };
    });
  };

  const handleRemoveExistingAttachment = (attachmentId: string) => {
    setDeletedAttachmentIds((prev) => [...prev, attachmentId]);
    setTaskAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
  };

  const handleAssigneeChange = (
    event: SelectChangeEvent<string> | SelectChangeEvent<string[]>
  ) => {
    const selectedUserId = event.target.value as string;
    if (!selectedUserId) {
      setEditedTask((prev) =>
        prev
          ? {
            ...prev,
            assignee: { name: '', initials: '', color: '' },
          }
          : null
      );
      return;
    }
    const selectedUser = allEnrichedUsers.find(
      (user) => user.id === selectedUserId
    );
    if (selectedUser) {
      setEditedTask((prev) =>
        prev
          ? {
            ...prev,
            assignee: {
              name: selectedUser.name,
              initials: selectedUser.initials,
              color: selectedUser.color,
            },
          }
          : null
      );
    }
  };

  const getAssigneeForSelect = () => {
    if (!editedTask?.assignee || editedTask.assignee.name === '') return '';
    const foundUser = allEnrichedUsers.find(
      (u) => u.name === editedTask.assignee.name
    );
    return foundUser?.id || '';
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return null;
    return date instanceof Date ? dayjs(date) : dayjs(date);
  };

  const handleChecklistToggle = (itemId: string) => {
    const updatedChecklist = (editedTask.checklist || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    setEditedTask((prev) =>
      prev ? { ...prev, checklist: updatedChecklist } : null
    );

    queryClient.invalidateQueries({
      queryKey: ['taskActivities', accountId, caseId, taskId],
    });
    queryClient.invalidateQueries({
      queryKey: [
        'taskActivitiesInfinite',
        {
          case_rid: caseId,
          account_rid: accountId,
          task_rid: taskId,
        },
      ],
    });
  };

  const handleCollaboratorsChange = async (selectedIds: string[]) => {
    const newUserIds = selectedIds.filter(
      (id) => !selectedCollaboratorIds.includes(id)
    );
    const removedUserIds = selectedCollaboratorIds.filter(
      (id) => !selectedIds.includes(id)
    );
    if (newUserIds.length > 0 && taskId && onAddCollaborator) {
      setIsAddingCollaborator(true);
      try {
        for (const newUserId of newUserIds) {
          await onAddCollaborator(taskId, newUserId);
        }
        setSelectedCollaboratorIds(selectedIds);
        const selectedUsers = allEnrichedUsers.filter((user) =>
          selectedIds.includes(user.id)
        );
        const collaborators = selectedUsers.map((user) => ({
          name: user.name,
          initials: user.initials,
          color: user.color,
        }));
        setEditedTask((prev) => (prev ? { ...prev, collaborators } : null));
        setOriginalTask((prev) => (prev ? { ...prev, collaborators } : null));
        setCollaborators(
          selectedUsers.map((user) => ({
            assigned_to: user.id,
            assigned_to_name: user.name,
          }))
        );
        queryClient.invalidateQueries({
          queryKey: ['taskActivities', accountId, caseId, taskId],
        });
        queryClient.invalidateQueries({
          queryKey: [
            'taskActivitiesInfinite',
            {
              case_rid: caseId,
              account_rid: accountId,
              task_rid: taskId,
            },
          ],
        });
      } catch (error) {
        console.error('Failed to add collaborator:', error);
      } finally {
        setIsAddingCollaborator(false);
      }
    }
    if (removedUserIds.length > 0 && taskId) {
      try {
        for (const removedUserId of removedUserIds) {
          const userToRemove = allEnrichedUsers.find(
            (u) => u.id === removedUserId
          );
          if (userToRemove) {
            await deleteCollaboratorMutation.mutateAsync({
              case_rid: caseId,
              account_rid: accountId,
              rid: taskId,
              assigned_to: removedUserId,
            });
          }
        }

        setSelectedCollaboratorIds(selectedIds);
        const selectedUsers = allEnrichedUsers.filter((user) =>
          selectedIds.includes(user.id)
        );
        const collaborators = selectedUsers.map((user) => ({
          name: user.name,
          initials: user.initials,
          color: user.color,
        }));
        setEditedTask((prev) => (prev ? { ...prev, collaborators } : null));
        setOriginalTask((prev) => (prev ? { ...prev, collaborators } : null));
        setCollaborators(
          selectedUsers.map((user) => ({
            assigned_to: user.id,
            assigned_to_name: user.name,
          }))
        );
        queryClient.invalidateQueries({
          queryKey: ['taskActivities', accountId, caseId, taskId],
        });
        queryClient.invalidateQueries({
          queryKey: [
            'taskActivitiesInfinite',
            {
              case_rid: caseId,
              account_rid: accountId,
              task_rid: taskId,
            },
          ],
        });
        successToast('Collaborator removed successfully');
      } catch (error) {
        console.error('Failed to remove collaborator:', error);
        errorToast('Failed to remove collaborator');
      }
    } else if (
      selectedIds.length < selectedCollaboratorIds.length &&
      removedUserIds.length === 0
    ) {
      setSelectedCollaboratorIds(selectedIds);
      const selectedUsers = allEnrichedUsers.filter((user) =>
        selectedIds.includes(user.id)
      );
      const collaborators = selectedUsers.map((user) => ({
        name: user.name,
        initials: user.initials,
        color: user.color,
      }));
      setEditedTask((prev) => (prev ? { ...prev, collaborators } : null));
      setOriginalTask((prev) => (prev ? { ...prev, collaborators } : null));
      setCollaborators(
        selectedUsers.map((user) => ({
          assigned_to: user.id,
          assigned_to_name: user.name,
        }))
      );
    }
  };

  return (
    <>
      <div
        className={`fixed right-0 bottom-0 w-[650px] bg-white text-gray-900 shadow-2xl z-50 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        style={{
          top: '38.1px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-in-out',
        }}
      >
        <div className='sticky top-0 flex items-center justify-between p-3 border-b border-[#CBD6E2] bg-white z-50'>
          <h2 className='text-[16px] font-semibold text-[#2D3E4F] truncate max-w-[400px]'>
            Edit {task?.title}
          </h2>

          <div className='flex items-center gap-2'>
            <TextButton
              label='Save'
              onClick={handleSave}
              disabled={!hasTaskChanged() || isSaving}
              sx={{ padding: '6px 12px' }}
            />
            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-100 rounded transition-colors'
            >
              <CloseIcon size={16} className='text-gray-600' />
            </button>
          </div>
        </div>

        <div className='px-6 pt-3 pb-6 space-y-3'>
          <div>
            <div className='text-[13px] font-medium text-gray-700 mb-2'>
              Task Name <span className='text-red-500'>*</span>
            </div>
            <div className='relative'>
              <input
                type='text'
                value={editedTask?.title || ''}
                onChange={(e) => {
                  setEditedTask((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  );
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, taskTitle: '' }));
                  }
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className={`w-full text-[13px] font-normal bg-transparent border-b ${errors.taskTitle ? 'border-red-500' : 'border-gray-300'} focus:border-blue-400 focus:border-b outline-none text-gray-900 placeholder-[#7D98B6] pb-2 pr-8`}
                autoFocus
              />
              {errors.taskTitle && (
                <div className='absolute right-0 top-0 bottom-2 flex items-center'>
                  <ErrorIconTooltip error={errors.taskTitle} />
                </div>
              )}
            </div>
          </div>

          {!fieldVisibility.assignee && (
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-600'>
                Assignee
              </span>
              <StyledSelect
                name='assignee'
                value={getAssigneeForSelect()}
                onChange={handleAssigneeChange}
                width='240px'
                sx={{
                  '&.Mui-disabled': {
                    backgroundColor: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#CBD6E2',
                    },
                  },
                }}
                renderValue={() => {
                  if (editedTask?.assignee) {
                    return (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: editedTask.assignee.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: '600',
                            color: 'white',
                            flexShrink: 0,
                          }}
                        >
                          {editedTask.assignee.initials}
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            color: 'black',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                          }}
                        >
                          {editedTask.assignee.name}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <span
                      style={{
                        color: '#7D98B6',
                        fontSize: '13px',
                        fontWeight: '400',
                      }}
                    >
                      Select User
                    </span>
                  );
                }}
              >
                <MenuItem
                  value=''
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                >
                  Select User
                </MenuItem>
                {allEnrichedUsers.map((user) => (
                  <MenuItem
                    sx={{
                      color: '#425A76',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                    key={user.id}
                    value={user.id}
                    title={user.name}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: user.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          fontWeight: '600',
                          color: 'white',
                          flexShrink: 0,
                        }}
                      >
                        {user.initials}
                      </div>
                      {user.name}
                    </div>
                  </MenuItem>
                ))}
              </StyledSelect>
            </div>
          )}

          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            localeText={{
              fieldMonthPlaceholder: (params) =>
                params.contentType === 'digit' ? 'MM' : params.format,
            }}
          >
            <div className='grid grid-cols-2 gap-4'>
              {!fieldVisibility.startDate && (
                <div>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Start Date
                  </label>
                  <DatePicker
                    disabled={false}
                    minDate={minDate}
                    maxDate={maxDate}
                    value={formatDateForInput(editedTask?.startDate)}
                    onChange={(newValue) =>
                      handleStartDateChange(
                        newValue ? dayjs(newValue).format('YYYY-MM-DD') : ''
                      )
                    }
                    format='YYYY-MMM-DD'
                    slots={{
                      openPickerIcon: () => (
                        <CalendarIcon className='w-4 h-4' />
                      ),
                      clearIcon: () => <CloseIcon className='w-2.5 h-2.5' />,
                    }}
                    slotProps={{
                      field: { clearable: true },
                      clearButton: { tabIndex: -1 },
                      openPickerButton: { tabIndex: -1 },
                      popper: {
                        placement: 'bottom-start',
                        sx: {
                          '& .MuiPaper-root': {
                            width: 'auto !important',
                            minWidth: '280px !important',
                            maxWidth: '320px !important',
                          },
                        },
                        modifiers: [
                          {
                            name: 'flip',
                            enabled: true,
                            options: {
                              altBoundary: true,
                              rootBoundary: 'viewport',
                              padding: 8,
                            },
                          },
                          {
                            name: 'preventOverflow',
                            enabled: true,
                            options: {
                              altAxis: true,
                              altBoundary: true,
                              tether: true,
                              rootBoundary: 'viewport',
                              padding: 8,
                            },
                          },
                          { name: 'offset', options: { offset: [0, 4] } },
                        ],
                      },
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        error: !!errors.startDate,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            height: '32px',
                            borderRadius: '2px',
                            '& input': {
                              fontWeight: 400,
                              fontSize: '13px',
                              lineHeight: '21px',
                              pl: '11px',
                              '& ::placeholder': {
                                color: '#7D98B6 !important',
                              },
                              color: 'black !important',
                              WebkitTextFillColor: 'black !important',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              border: errors.startDate
                                ? '1px solid #EF4444'
                                : '1px solid #CBD6E2',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: errors.startDate
                                ? '2px solid #EF4444'
                                : '2px solid #60A5FA',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: errors.startDate
                                ? '1px solid #EF4444'
                                : '1px solid #CBD6E2',
                              borderRadius: '2px',
                            },
                            '&.Mui-disabled': {
                              backgroundColor: '#F3F4F6',
                              opacity: 1,
                              '& input': {
                                color: 'black',
                                WebkitTextFillColor: 'black',
                              },
                            },
                          },
                        },
                        placeholder: 'Select start date',
                        inputProps: {
                          readOnly: true,
                        },
                      },
                    }}
                  />
                  {errors.startDate && (
                    <p className='text-xs text-red-500 mt-1'>
                      {errors.startDate}
                    </p>
                  )}
                </div>
              )}
              {!fieldVisibility.endDate && (
                <div>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Due Date
                  </label>
                  <DatePicker
                    disabled={false}
                    minDate={
                      editedTask?.startDate
                        ? dayjs(editedTask.startDate).add(1, 'day')
                        : minDate
                    }
                    maxDate={maxDate}
                    value={formatDateForInput(editedTask?.endDate)}
                    onChange={(newValue) =>
                      handleEndDateChange(
                        newValue ? dayjs(newValue).format('YYYY-MM-DD') : ''
                      )
                    }
                    format='YYYY-MMM-DD'
                    slots={{
                      openPickerIcon: () => (
                        <CalendarIcon className='w-4 h-4' />
                      ),
                      clearIcon: () => <CloseIcon className='w-2.5 h-2.5' />,
                    }}
                    slotProps={{
                      field: { clearable: true },
                      clearButton: { tabIndex: -1 },
                      openPickerButton: { tabIndex: -1 },
                      popper: {
                        placement: 'bottom-start',
                        sx: {
                          '& .MuiPaper-root': {
                            width: 'auto !important',
                            minWidth: '280px !important',
                            maxWidth: '320px !important',
                          },
                        },
                        modifiers: [
                          {
                            name: 'flip',
                            enabled: true,
                            options: {
                              altBoundary: true,
                              rootBoundary: 'viewport',
                              padding: 8,
                            },
                          },
                          {
                            name: 'preventOverflow',
                            enabled: true,
                            options: {
                              altAxis: true,
                              altBoundary: true,
                              tether: true,
                              rootBoundary: 'viewport',
                              padding: 8,
                            },
                          },
                          { name: 'offset', options: { offset: [0, 4] } },
                        ],
                      },
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        error: !!errors.endDate,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            height: '32px',
                            borderRadius: '2px',
                            '& input': {
                              fontWeight: 400,
                              fontSize: '13px',
                              lineHeight: '21px',
                              pl: '11px',
                              '& ::placeholder': {
                                color: '#7D98B6 !important',
                              },
                              color: 'black !important',
                              WebkitTextFillColor: 'black !important',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              border: errors.endDate
                                ? '1px solid #EF4444'
                                : '1px solid #CBD6E2',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: errors.endDate
                                ? '2px solid #EF4444'
                                : '2px solid #60A5FA',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: errors.endDate
                                ? '1px solid #EF4444'
                                : '1px solid #CBD6E2',
                              borderRadius: '2px',
                            },
                            '&.Mui-disabled': {
                              backgroundColor: '#F3F4F6',
                              opacity: 1,
                              '& input': {
                                color: 'black',
                                WebkitTextFillColor: 'black',
                              },
                            },
                          },
                        },
                        placeholder: 'Select end date',
                        inputProps: {
                          readOnly: true,
                        },
                      },
                    }}
                  />
                  {errors.endDate && (
                    <p className='text-xs text-red-500 mt-1'>
                      {errors.endDate}
                    </p>
                  )}
                </div>
              )}
            </div>
          </LocalizationProvider>

          <h3 className='text-sm font-semibold text-gray-700 mb-3'>Fields</h3>

          <TaskFieldsSection
            fieldVisibility={fieldVisibility}
            fieldDisabled={fieldDisabled}
            editedTask={editedTask}
            statusData={statusData}
            priorityData={priorityData}
            checklistData={checklistData}
            availableTags={availableTags}
            connectorTypesData={connectorTypesData}
            taskTemplatesData={taskTemplatesData}
            weightageData={weightageData}
            categoryData={categoryData}
            selectedChecklist={selectedChecklist}
            selectedLinkedType={linkedType}
            selectedLinkTaskTypes={linkTaskTypes}
            selectedWeightage={weightage}
            selectedCategory={category}
            userRole={selectedRole}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onAssigneeChange={(userId) => {
              if (!userId) {
                setEditedTask((prev) =>
                  prev
                    ? {
                      ...prev,
                      assignee: { name: '', initials: '', color: '' },
                    }
                    : null
                );
                return;
              }
              const selectedUser = allEnrichedUsers.find(
                (u) => u.id === userId
              );
              if (selectedUser) {
                setEditedTask((prev) =>
                  prev
                    ? {
                      ...prev,
                      assignee: {
                        name: selectedUser.name,
                        initials: selectedUser.initials,
                        color: selectedUser.color,
                      },
                    }
                    : null
                );
              }
            }}
            onChecklistChange={(value) => {
              setSelectedChecklist(value);
              if (value)
                setErrors((prev) => ({ ...prev, checklistTemplate: '' }));
            }}
            onLinkedTypeChange={(value) => {
              setLinkedType(value);
              setEditedTask((prev) =>
                prev ? { ...prev, linkedType: value } : null
              );
              if (value) {
                setErrors((prev) => ({ ...prev, linkedType: '' }));
              } else {
                if (!linkTaskTypes || linkTaskTypes.length === 0) {
                  setErrors((prev) => ({ ...prev, linkTaskType: '' }));
                }
              }
            }}
            onLinkTaskTypesChange={(values) => {
              setLinkTaskTypes(values);
              setEditedTask((prev) =>
                prev ? { ...prev, linkTaskTypes: values } : null
              );
              if (values.length > 0) {
                setErrors((prev) => ({ ...prev, linkTaskType: '' }));
              } else {
                if (!linkedType) {
                  setErrors((prev) => ({ ...prev, linkedType: '' }));
                }
              }
            }}
            onWeightageChange={(value) => {
              setWeightage(value);
              setEditedTask((prev) =>
                prev ? { ...prev, weightage: value } : null
              );
            }}
            onCategoryChange={(value) => {
              setCategory(value);
              setEditedTask((prev) =>
                prev ? { ...prev, category: value } : null
              );
            }}
            fiscalYear={editedTask?.fiscal_year || fiscalYear}
            fiscalYears={fiscalYears}
            onFiscalYearChange={(value) => {
              setEditedTask((prev) =>
                prev ? { ...prev, fiscal_year: value } : null
              );
            }}
            onUserRoleChange={(value) => {
              setSelectedRole(value);
            }}
            errors={errors}
            onTagsChange={(newTags) =>
              setEditedTask((prev) =>
                prev ? { ...prev, tags: newTags } : null
              )
            }
            onAddCustomTag={setAvailableTags}
            onSetEditedTask={setEditedTask}
            mode='view'
          />

          <TaskChecklistSection
            fieldVisibility={fieldVisibility}
            fieldDisabled={fieldDisabled}
            editedTask={editedTask}
            onChecklistToggle={handleChecklistToggle}
            caseId={caseId}
            accountId={accountId}
          />

          {!fieldVisibility.description && (
            <div>
              <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                Description
              </h3>
              <div className='relative'>
                <textarea
                  value={editedTask?.description || ''}
                  onChange={handleDescriptionChange}
                  placeholder=''
                  className='w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500 min-h-[100px] pr-8'
                  disabled={fieldDisabled.description}
                />
                {errors.description && (
                  <div className='absolute right-2 top-3'>
                    <ErrorIconTooltip error={errors.description} />
                  </div>
                )}
              </div>
            </div>
          )}

          {!fieldVisibility.attachments && (
            <TaskAttachmentsSection
              fieldVisibility={fieldVisibility}
              fieldDisabled={fieldDisabled}
              editedTask={editedTask}
              taskAttachments={taskAttachments}
              onAttachmentChange={handleAttachmentChange}
              onRemoveAttachment={handleRemoveAttachment}
              onRemoveExistingAttachment={handleRemoveExistingAttachment}
            />
          )}

          {!fieldVisibility.comments && (
            <TaskCommentsSection
              fieldVisibility={fieldVisibility}
              fieldDisabled={fieldDisabled}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              comments={comments}
              activities={activities}
              editingCommentId={editingCommentId}
              editingCommentText={editingCommentText}
              setEditingCommentId={setEditingCommentId}
              setEditingCommentText={setEditingCommentText}
              task={task}
              accountId={accountId}
              caseId={caseId}
              taskId={taskId}
              onAddComment={onAddComment}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              useInfiniteScroll={true}
              taskType={taskType}
            />
          )}

          {!fieldVisibility.collaborators && (
            <TaskCollaboratorsSection
              fieldVisibility={fieldVisibility}
              editedTask={editedTask}
              selectedCollaboratorIds={selectedCollaboratorIds}
              allEnrichedUsers={allEnrichedUsers}
              onCollaboratorsChange={handleCollaboratorsChange}
              isAddingCollaborator={isAddingCollaborator}
              onRemoveCollaborator={(name) => {
                const collaboratorToRemove = editedTask?.collaborators?.find(
                  (c) => c.name === name
                );
                if (!collaboratorToRemove) return;
                const userToRemove = allEnrichedUsers.find(
                  (u) => u.name === name
                );
                if (!userToRemove || !taskId) return;

                deleteCollaboratorMutation.mutate(
                  {
                    case_rid: caseId,
                    account_rid: accountId,
                    rid: taskId,
                    assigned_to: userToRemove.id,
                  },
                  {
                    onSuccess: () => {
                      const updatedCollabs =
                        editedTask?.collaborators?.filter(
                          (c) => c.name !== name
                        ) || [];
                      setEditedTask((prev) =>
                        prev ? { ...prev, collaborators: updatedCollabs } : null
                      );
                      setOriginalTask((prev) =>
                        prev ? { ...prev, collaborators: updatedCollabs } : null
                      );
                      setCollaborators((prev) =>
                        prev.filter((c) => c.assigned_to_name !== name)
                      );
                      setSelectedCollaboratorIds((prev) =>
                        prev.filter((id) => id !== userToRemove.id)
                      );
                      queryClient.invalidateQueries({
                        queryKey: ['taskActivities', accountId, caseId, taskId],
                      });
                      queryClient.invalidateQueries({
                        queryKey: [
                          'taskActivitiesInfinite',
                          {
                            case_rid: caseId,
                            account_rid: accountId,
                            task_rid: taskId,
                          },
                        ],
                      });
                      successToast('Collaborator removed successfully');
                    },
                    onError: () => {
                      errorToast('Failed to remove collaborator');
                    },
                  }
                );
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};
export default TaskDetailModal;
