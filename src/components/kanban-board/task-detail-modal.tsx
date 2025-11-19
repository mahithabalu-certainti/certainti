import { useEffect, useState, useRef, useMemo } from 'react';
import { TaskDetailModalProps, Task, Activity, Comment } from './types';
import { MenuItem, SelectChangeEvent } from '@mui/material';
import dayjs from 'dayjs';
import { CalendarIcon, CloseIcon } from '../../assets';
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
import {
  enrichTask,
  enrichUserOption,
  generateInitials,
  generateColorFromName,
} from './helper';

interface CommentData {
  created_by_name?: string;
  created_datetime?: string;
  user?: string;
  date?: string;
  user_name?: string;
  created_date?: string;
  [key: string]: unknown;
}

// Extend the TaskDetailModalProps to include availableTagOptions
interface TaskDetailModalPropsExtended
  extends Omit<TaskDetailModalProps, 'tagData'> {
  tagData?: Array<{ id: string; name: string; color: string }>;
  availableTagOptions?: Array<{ id: string; name: string; color: string }>;
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
  roleOptions = [],
  checklistData = [],
  onFetchTaskDetails,
  onFetchTaskActivities,
  onFetchTaskComments,
  onFetchTaskAttachments,
  onFetchCollaborators,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onAddCollaborator,
  fieldVisibility = {},
  fieldDisabled = {},
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
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [comment, setComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>(
    'comments'
  );
  const [pendingCollaborators, setPendingCollaborators] = useState<string[]>(
    []
  );
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState<
    string[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedChecklist, setSelectedChecklist] = useState('');
  const activitiesFetchedRef = useRef<string | null>(null);
  const commentsFetchedRef = useRef<string | null>(null);
  const collaboratorsFetchedRef = useRef<string | null>(null);
  const attachmentsFetchedRef = useRef<string | null>(null);

  // Use availableTagOptions from parent, fallback to tagData or empty array
  const [availableTags, setAvailableTags] = useState(
    availableTagOptions.length > 0 ? availableTagOptions : tagData
  );

  // Update availableTags when availableTagOptions from parent changes
  useEffect(() => {
    if (availableTagOptions && availableTagOptions.length > 0) {
      setAvailableTags(availableTagOptions);
    } else if (tagData && tagData.length > 0) {
      setAvailableTags(tagData);
    }
  }, [availableTagOptions, tagData]);

  // Helper function to check if task has been modified
  const hasTaskChanged = () => {
    if (!task || !editedTask) return false;

    return (
      task.title !== editedTask.title ||
      task.description !== editedTask.description ||
      task.status !== editedTask.status ||
      task.priority !== editedTask.priority ||
      task.startDate !== editedTask.startDate ||
      task.endDate !== editedTask.endDate ||
      task.assignee?.name !== editedTask.assignee?.name ||
      JSON.stringify(task.tags) !== JSON.stringify(editedTask.tags) ||
      JSON.stringify(task.collaborators) !==
        JSON.stringify(editedTask.collaborators) ||
      JSON.stringify(task.checklist) !== JSON.stringify(editedTask.checklist)
    );
  };

  // Map collaborators and available users to enriched users
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

  // Merge collaborators with available users, avoiding duplicates - memoized
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
    let cancelled = false;
    const fetchTask = async () => {
      if (!taskId || !onFetchTaskDetails) {
        setTask(null);
        setEditedTask(null);
        setIsLoadingTaskDetails(false);
        return;
      }
      setIsLoadingTaskDetails(true);
      setTask(null);
      setEditedTask(null);
      try {
        const fetchedTask = await onFetchTaskDetails(taskId);
        if (!cancelled && taskId) {
          if (fetchedTask) {
            const enrichedTask = enrichTask(fetchedTask);
            setTask(enrichedTask);
            setEditedTask(enrichedTask);
          } else {
            setTask(null);
            setEditedTask(null);
          }
          setIsLoadingTaskDetails(false);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setTask(null);
          setEditedTask(null);
          setIsLoadingTaskDetails(false);
        }
      }
    };
    if (isOpen) {
      fetchTask();
    }
    return () => {
      cancelled = true;
    };
  }, [taskId, isOpen, onFetchTaskDetails]);

  // Fetch activities separately - with deduplication
  useEffect(() => {
    const fetchActivities = async () => {
      if (!taskId || !onFetchTaskActivities) {
        setActivities([]);
        return;
      }
      if (activitiesFetchedRef.current === taskId) {
        return;
      }
      activitiesFetchedRef.current = taskId;
      setLoadingActivities(true);
      try {
        const fetchedActivities = await onFetchTaskActivities(taskId);
        console.log('📊 Fetched activities raw response:', fetchedActivities);
        
        // Handle nested response structures
        let activitiesArray: unknown = fetchedActivities;
        if (fetchedActivities && typeof fetchedActivities === 'object' && !Array.isArray(fetchedActivities)) {
          // Try common response wrappers
          const response = fetchedActivities as Record<string, unknown>;
          activitiesArray = 
            response.data || 
            response.activities || 
            response.result ||
            [];
        }
        
        console.log('📊 Activities array after extraction:', activitiesArray);
        
        if (activitiesArray && Array.isArray(activitiesArray)) {
          setActivities(activitiesArray);
        } else {
          console.warn('⚠️ Activities data is not an array:', activitiesArray);
          setActivities([]);
        }
      } catch (error) {
        console.error('❌ Error fetching task activities:', error);
        setActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    if (isOpen && taskId) {
      fetchActivities();
    }
  }, [taskId, isOpen, onFetchTaskActivities]);

  // Fetch comments separately - with deduplication
  useEffect(() => {
    const fetchComments = async () => {
      if (taskId && onFetchTaskComments) {
        if (commentsFetchedRef.current === taskId) {
          return;
        }
        commentsFetchedRef.current = taskId;
        setLoadingComments(true);
        try {
          const fetchedComments = await onFetchTaskComments(taskId);
          console.log('💬 Fetched comments raw response:', fetchedComments);
          
          // Handle nested response structures
          let commentsArray: unknown = fetchedComments;
          if (fetchedComments && typeof fetchedComments === 'object' && !Array.isArray(fetchedComments)) {
            // Try common response wrappers
            const response = fetchedComments as Record<string, unknown>;
            commentsArray = 
              (response.data as Record<string, unknown>)?.data ||
              response.data || 
              response.comments || 
              response.result ||
              [];
          }
          
          console.log('💬 Comments array after extraction:', commentsArray);

          if (commentsArray && Array.isArray(commentsArray)) {
            const transformedComments: Comment[] = (
              commentsArray as unknown[]
            ).map((comment: unknown) => {
              const commentData = comment as CommentData;
              const userName =
                commentData.created_by_name ||
                commentData.user ||
                commentData.user_name ||
                '';
              const createdDateRaw =
                commentData.created_datetime ||
                commentData.date ||
                commentData.created_date ||
                new Date().toISOString();
              const createdDate = createdDateRaw
                ? dayjs(createdDateRaw)
                    .local()
                    .format('MMMM D, YYYY [at] h:mm A')
                : '';
              return {
                id: (commentData.id || commentData.comment_rid) as string,
                user: userName,
                text: (commentData.text ||
                  commentData.comment_text ||
                  '') as string,
                date: createdDate,
                createdDateTime: createdDate,
                initials: generateInitials(userName),
                color: generateColorFromName(userName),
                attachments: (commentData.attachments as string[]) || undefined,
              };
            });
            setComments(transformedComments);
          } else {
            console.warn('⚠️ Comments data is not an array:', commentsArray);
            setComments([]);
          }
        } catch (error) {
          console.error('❌ Error fetching task comments:', error);
          setComments([]);
        } finally {
          setLoadingComments(false);
        }
        return;
      }
      if (!taskId) {
        setComments([]);
        return;
      }
      if (commentsFetchedRef.current === taskId) {
        return;
      }
      commentsFetchedRef.current = taskId;
    };

    if (isOpen && taskId) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, isOpen]);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!taskId || !onFetchTaskAttachments) {
        setTaskAttachments([]);
        return;
      }

      if (attachmentsFetchedRef.current === taskId) {
        return;
      }
      attachmentsFetchedRef.current = taskId;

      try {
        const fetchedAttachments = await onFetchTaskAttachments(taskId);

        if (fetchedAttachments && Array.isArray(fetchedAttachments)) {
          setTaskAttachments(fetchedAttachments);
        } else {
          setTaskAttachments([]);
        }
      } catch (error) {
        console.error('Error fetching task attachments:', error);
        setTaskAttachments([]);
      }
    };

    if (isOpen && taskId) {
      fetchAttachments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, isOpen]);

  useEffect(() => {
    const fetchCollaboratorsData = async () => {
      if (!taskId || !onFetchCollaborators) {
        setCollaborators([]);
        return;
      }

      if (collaboratorsFetchedRef.current === taskId) {
        return;
      }
      collaboratorsFetchedRef.current = taskId;

      try {
        const fetchedCollaborators = await onFetchCollaborators(taskId);
        if (fetchedCollaborators && Array.isArray(fetchedCollaborators)) {
          setCollaborators(fetchedCollaborators);
        } else {
          setCollaborators([]);
        }
      } catch (error) {
        console.error('Error fetching collaborators:', error);
        setCollaborators([]);
      }
    };

    if (isOpen && taskId) {
      fetchCollaboratorsData();
    }
  }, [taskId, isOpen, onFetchCollaborators]);

  useEffect(() => {
    if (!editedTask || collaborators.length === 0) {
      return;
    }
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

    setEditedTask((prev) => {
      if (!prev) {
        return null;
      }
      return { ...prev, collaborators: mappedCollaborators };
    });
  }, [collaborators, editedTask]);

  // Keep a separate list of selected collaborator IDs to avoid relying on editedTask timing
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

  // Show loading skeleton while fetching task details
  if (isLoadingTaskDetails || (!task && !editedTask)) {
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
    setIsSaving(true);

    // Add pending collaborators first
    if (pendingCollaborators.length > 0 && taskId && onAddCollaborator) {
      try {
        for (const userId of pendingCollaborators) {
          await onAddCollaborator(taskId, userId);
        }
        // Clear pending collaborators after successful API calls
        setPendingCollaborators([]);
      } catch (error) {
        console.error('Error adding collaborators:', error);
      }
    }

    // Then update the task
    if (editedTask && taskId) {
      onTaskUpdate(taskId, editedTask);
      setIsEditing(false);
    }

    // Handle comment submission if there's a comment
    if (comment.trim()) {
      handleSubmitComment();
    }

    setIsSaving(false);
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
  };

  const handlePriorityChange = (priorityName: string) => {
    setEditedTask((prev) =>
      prev ? { ...prev, priority: priorityName } : null
    );
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
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileNames = Array.from(files).map((f) => f.name);
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

  const handleCommentAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileNames = Array.from(files).map((f) => f.name);
      setEditedTask((prev) =>
        prev
          ? {
              ...prev,
              commentAttachments: [
                ...(prev.commentAttachments || []),
                ...fileNames,
              ],
            }
          : null
      );
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setEditedTask((prev) =>
      prev
        ? {
            ...prev,
            attachments:
              prev.attachments?.filter((_, index) => index !== indexToRemove) ||
              [],
          }
        : null
    );
  };

  const handleRemoveCommentAttachment = (indexToRemove: number) => {
    setEditedTask((prev) =>
      prev
        ? {
            ...prev,
            commentAttachments:
              prev.commentAttachments?.filter(
                (_, index) => index !== indexToRemove
              ) || [],
          }
        : null
    );
  };

  const handleAssigneeChange = (
    event: SelectChangeEvent<string> | SelectChangeEvent<string[]>
  ) => {
    const selectedUserId = event.target.value as string;
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
    if (!editedTask?.assignee) return '';
    const foundUser = allEnrichedUsers.find(
      (u) => u.name === editedTask.assignee.name
    );
    return foundUser?.id || '';
  };

  const getMinEndDate = () => {
    if (editedTask?.startDate) {
      const minDate = new Date(editedTask.startDate);
      minDate.setDate(minDate.getDate() + 1);
      return dayjs(minDate);
    }
    return undefined;
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
    if (taskId) {
      onTaskUpdate(taskId, { checklist: updatedChecklist });
    }
  };

  const handleCollaboratorsChange = (event: SelectChangeEvent<string[]>) => {
    console.log('🎯 handleCollaboratorsChange triggered');
    console.log('   Event value:', event.target.value);
    console.log('   Current selectedCollaboratorIds:', selectedCollaboratorIds);

    // This handler kept for compatibility but we manage selection via toggleSelection
    const selectedUserIds = event.target.value as string[];
    console.log('   Selected user IDs:', selectedUserIds);

    setSelectedCollaboratorIds(selectedUserIds);
    console.log(
      '   selectedCollaboratorIds state updated to:',
      selectedUserIds
    );

    const selectedUsers = allEnrichedUsers.filter((user) =>
      selectedUserIds.includes(user.id)
    );
    console.log('   Selected users:', selectedUsers);

    const collaborators = selectedUsers.map((user) => ({
      name: user.name,
      initials: user.initials,
      color: user.color,
    }));
    console.log('   Collaborators mapped:', collaborators);

    setEditedTask((prev) => {
      console.log('   Previous editedTask:', prev);
      const updated = prev ? { ...prev, collaborators } : null;
      console.log('   Updated editedTask:', updated);
      return updated;
    });

    const currentCollaboratorNames =
      editedTask?.collaborators?.map((c) => c.name) || [];
    console.log('   Current collaborator names:', currentCollaboratorNames);

    const newlyAddedUsers = selectedUsers.filter(
      (user) => !currentCollaboratorNames.includes(user.name)
    );
    console.log('   Newly added users:', newlyAddedUsers);
    console.log(
      '   Setting pending collaborators to:',
      newlyAddedUsers.map((user) => user.id)
    );

    setPendingCollaborators(newlyAddedUsers.map((user) => user.id));
  };

  const toggleCollaboratorSelection = (userId: string) => {
    console.log('🎯 toggleCollaboratorSelection triggered for userId:', userId);
    console.log('   Current selectedCollaboratorIds:', selectedCollaboratorIds);
    console.log(
      '   Current editedTask.collaborators:',
      editedTask?.collaborators
    );

    setSelectedCollaboratorIds((prev) => {
      console.log('   Previous selectedCollaboratorIds:', prev);
      const exists = prev.includes(userId);
      console.log('   User exists in selection:', exists);

      const next = exists
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      console.log('   New selectedCollaboratorIds:', next);

      const selectedUsers = allEnrichedUsers.filter((u) => next.includes(u.id));
      console.log('   Selected users for this IDs:', selectedUsers);

      const collaborators = selectedUsers.map((user) => ({
        name: user.name,
        initials: user.initials,
        color: user.color,
      }));
      console.log('   Collaborators mapped:', collaborators);

      // Update edited task collaborators
      setEditedTask((prevTask) => {
        console.log('   Previous editedTask in setEditedTask:', prevTask);
        const updated = prevTask ? { ...prevTask, collaborators } : null;
        console.log('   Updated editedTask in setEditedTask:', updated);
        return updated;
      });

      // Determine newly added users for pending collaborators
      const currentCollaboratorNames =
        editedTask?.collaborators?.map((c) => c.name) || [];
      console.log('   Current collaborator names:', currentCollaboratorNames);

      const newlyAdded = selectedUsers.filter(
        (user) => !currentCollaboratorNames.includes(user.name)
      );
      console.log('   Newly added users:', newlyAdded);
      console.log(
        '   Setting pending collaborators to:',
        newlyAdded.map((u) => u.id)
      );

      setPendingCollaborators(newlyAdded.map((u) => u.id));

      return next;
    });
  };

  const handleSubmitComment = async () => {
    if (!comment.trim() || !taskId) {
      return;
    }

    if (!onAddComment) {
      console.error('onAddComment callback is not provided');
      return;
    }

    try {
      await onAddComment(taskId, comment.trim());

      // Clear comment state
      setComment('');
      setEditedTask((prev) =>
        prev ? { ...prev, commentAttachments: [] } : null
      );

      // Reset file input
      const fileInput = document.getElementById(
        'comment-attachments-input'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh comments by resetting the ref so useEffect will refetch
      commentsFetchedRef.current = null;
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  return (
    <>
      <div
        className={`fixed right-0 bottom-0 w-[650px] bg-white text-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: '38.1px' }}
      >
        <div className='sticky top-0 flex items-center justify-between p-[16.5px] border-b border-[#CBD6E2] bg-white z-50'>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded transition-colors'
          >
            <CloseIcon size={16} className='text-gray-600' />
          </button>

          <TextButton
            label='Save'
            onClick={handleSave}
            disabled={!hasTaskChanged() || isSaving}
            sx={{ padding: '6px 12px' }}
          />
        </div>

        <div className='p-6 space-y-6'>
          <div>
            {isEditing ? (
              <input
                type='text'
                value={editedTask?.title || ''}
                onChange={(e) =>
                  setEditedTask((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className='text-3xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full text-gray-900'
                autoFocus
              />
            ) : (
              <h1
                className='text-3xl font-bold cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors'
                onClick={() => setIsEditing(true)}
              >
                {task.title}
              </h1>
            )}
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
                disabled={fieldDisabled.assignee}
                width='200px'
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

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className='grid grid-cols-2 gap-4'>
              {!fieldVisibility.startDate && (
                <div>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Start Date
                  </label>
                  <DatePicker
                    disabled={fieldDisabled.startDate}
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
                              border: '1px solid #CBD6E2',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: '2px solid #60A5FA',
                            },
                          },
                        },
                        placeholder: 'Select start date',
                      },
                    }}
                  />
                </div>
              )}
              {!fieldVisibility.endDate && (
                <div>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Due Date
                  </label>
                  <DatePicker
                    disabled={fieldDisabled.endDate}
                    value={formatDateForInput(editedTask?.endDate)}
                    onChange={(newValue) =>
                      handleEndDateChange(
                        newValue ? dayjs(newValue).format('YYYY-MM-DD') : ''
                      )
                    }
                    minDate={getMinEndDate()}
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
                              border: '1px solid #CBD6E2',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: '2px solid #60A5FA',
                            },
                          },
                        },
                        placeholder: 'Select end date',
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </LocalizationProvider>

          <TaskFieldsSection
            fieldVisibility={fieldVisibility}
            fieldDisabled={fieldDisabled}
            editedTask={editedTask}
            statusData={statusData}
            priorityData={priorityData}
            roleOptions={roleOptions}
            checklistData={checklistData}
            availableTags={availableTags}
            selectedRole={selectedRole}
            selectedChecklist={selectedChecklist}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onRoleChange={(value) => setSelectedRole(value)}
            onChecklistChange={(value) => setSelectedChecklist(value)}
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
          />

          {!fieldVisibility.description && (
            <div>
              <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                Description
              </h3>
              <textarea
                value={editedTask?.description || ''}
                onChange={handleDescriptionChange}
                placeholder=''
                className='w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500 min-h-[100px]'
                disabled={fieldDisabled.description}
              />
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
              comment={comment}
              setComment={setComment}
              editedTask={editedTask}
              task={task}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              handleCommentAttachmentChange={handleCommentAttachmentChange}
              handleRemoveCommentAttachment={handleRemoveCommentAttachment}
              loadingComments={loadingComments}
              loadingActivities={loadingActivities}
            />
          )}

          {!fieldVisibility.collaborators && (
            <TaskCollaboratorsSection
              fieldVisibility={fieldVisibility}
              editedTask={editedTask}
              selectedCollaboratorIds={selectedCollaboratorIds}
              allEnrichedUsers={allEnrichedUsers}
              onCollaboratorsChange={handleCollaboratorsChange}
              onToggleCollaboratorSelection={toggleCollaboratorSelection}
              onRemoveCollaborator={(name) => {
                const updatedCollabs =
                  editedTask?.collaborators?.filter((c) => c.name !== name) ||
                  [];
                setEditedTask((prev) =>
                  prev ? { ...prev, collaborators: updatedCollabs } : null
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
