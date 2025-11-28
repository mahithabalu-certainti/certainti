import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Activity, Comment, Task } from './types';
import { PencilIcon, DeleteIcon, AddIcon, ErrorInfoIcon } from '../../assets';
import { Tooltip } from '@mui/material';
import TextButton from '../button/text-button';
import { useInfiniteTaskCommentsList } from '../../consultant/services/case-task/case-task-service';
import { useInfiniteTaskActivities } from '../../consultant/services/work-breakdown/work-breakdown-service';
import { transformComments, transformActivities, type TaskCommentRaw, type TaskActivityRaw } from '../../consultant/pages/case/case-details/work-breakdown/helper';
import { generateInitials, generateColorFromName } from './helper';
import LoadingSkeleton from './loading-skeleton';
import { caseServiceApi } from '../../api/api';

interface TaskCommentsSectionProps {
  fieldVisibility: Record<string, boolean | undefined>;
  fieldDisabled: Record<string, boolean | undefined>;
  activeTab: 'comments' | 'activity';
  setActiveTab: (tab: 'comments' | 'activity') => void;
  comments: Comment[];
  activities: Activity[];
  editingCommentId: string | null;
  editingCommentText: string;
  setEditingCommentId: (id: string | null) => void;
  setEditingCommentText: (text: string) => void;
  task: Task | null;
  accountId?: string;
  caseId?: string;
  taskId?: string;
  onAddComment?: (
    taskId: string,
    comment: string,
    files: File[]
  ) => Promise<void>;
  onUpdateComment?:
  | ((
    commentId: string,
    comment: string,
    taskId: string,
    files?: File[],
    deletedFileIds?: string[]
  ) => Promise<void>)
  | undefined;
  onDeleteComment:
  | ((commentId: string, taskId: string) => Promise<void>)
  | undefined;
  loadingComments?: boolean;
  loadingActivities?: boolean;
  useInfiniteScroll?: boolean; // New prop to enable infinite scrolling
}

const TaskCommentsSection: React.FC<TaskCommentsSectionProps> = ({
  fieldVisibility,
  fieldDisabled,
  activeTab,
  setActiveTab,
  comments: propComments,
  activities: propActivities,
  editingCommentId,
  editingCommentText,
  setEditingCommentId,
  setEditingCommentText,
  accountId,
  caseId,
  taskId,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  useInfiniteScroll = true,
}) => {
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
      <span className='cursor-pointer mr-2 inline-flex align-middle'>
        <ErrorInfoIcon className='w-4 h-4 text-red-500' />
      </span>
    </Tooltip>
  );

  const queryClient = useQueryClient();
  const { name: loggedInUserName, userId: loggedInUserId } = useSelector((state: RootState) => state.auth);

  const loggedInUser = {
    initials: generateInitials(loggedInUserName || ''),
    color: generateColorFromName(loggedInUserName || ''),
  };

  const [comment, setComment] = useState('');

  const handleDownload = async (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string,
    fileName: string
  ) => {
    e.preventDefault();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    commentId: string | null;
  }>({
    isOpen: false,
    commentId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [showAddCommentForm, setShowAddCommentForm] = useState(false);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [editingNewFiles, setEditingNewFiles] = useState<File[]>([]);
  const [editingDeletedFileIds, setEditingDeletedFileIds] = useState<string[]>(
    []
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const activityObserverTarget = useRef<HTMLDivElement>(null);
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingInfinite,
  } = useInfiniteTaskCommentsList(
    {
      case_rid: caseId || '',
      account_rid: accountId || '',
      task_rid: taskId || '',
    },
    {
      enabled: useInfiniteScroll && !!accountId && !!caseId && !!taskId,
    }
  );

  const {
    data: infiniteActivitiesData,
    fetchNextPage: fetchNextActivitiesPage,
    hasNextPage: hasNextActivitiesPage,
    isFetchingNextPage: isFetchingNextActivitiesPage,
    isLoading: isLoadingActivitiesInfinite,
  } = useInfiniteTaskActivities(
    {
      case_rid: caseId || '',
      account_rid: accountId || '',
      task_rid: taskId || '',
    },
    {
      enabled: useInfiniteScroll && !!accountId && !!caseId && !!taskId,
    }
  );

  const comments = React.useMemo(() => {
    if (!useInfiniteScroll) {
      return propComments;
    }

    if (!infiniteData?.pages) {
      return [];
    }

    try {
      const allRawComments = infiniteData.pages.flatMap(
        (page) => page.data.data || []
      );
      return transformComments(allRawComments as TaskCommentRaw[]);
    } catch (error) {
      console.error('Error transforming infinite comments:', error);
      return [];
    }
  }, [infiniteData, useInfiniteScroll, propComments]);

  const activities = React.useMemo(() => {
    if (!useInfiniteScroll) {
      return propActivities;
    }

    if (!infiniteActivitiesData?.pages) {
      return [];
    }

    try {
      const allRawActivities = infiniteActivitiesData.pages.flatMap(
        (page) => page.data.data || []
      );
      return transformActivities(allRawActivities as TaskActivityRaw[]);
    } catch (error) {
      console.error('Error transforming infinite activities:', error);
      return [];
    }
  }, [infiniteActivitiesData, useInfiniteScroll, propActivities]);

  const totalCommentsCount = React.useMemo(() => {
    if (!useInfiniteScroll || !infiniteData?.pages || infiniteData.pages.length === 0) {
      return 0;
    }
    return infiniteData.pages[0]?.data?.total_result || 0;
  }, [infiniteData, useInfiniteScroll]);

  const totalActivitiesCount = React.useMemo(() => {
    if (!useInfiniteScroll || !infiniteActivitiesData?.pages || infiniteActivitiesData.pages.length === 0) {
      return 0;
    }
    return infiniteActivitiesData.pages[0]?.data?.total_result || 0;
  }, [infiniteActivitiesData, useInfiniteScroll]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  const handleActivityObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextActivitiesPage && !isFetchingNextActivitiesPage) {
        fetchNextActivitiesPage();
      }
    },
    [fetchNextActivitiesPage, hasNextActivitiesPage, isFetchingNextActivitiesPage]
  );
  useEffect(() => {
    if (!useInfiniteScroll || activeTab !== 'comments') return;

    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver, useInfiniteScroll, activeTab]);

  useEffect(() => {
    if (!useInfiniteScroll || activeTab !== 'activity') return;

    const element = activityObserverTarget.current;

    if (!element) return;

    const observer = new IntersectionObserver(handleActivityObserver, {
      root: null, // Use viewport as root, similar to comments
      rootMargin: '100px', // Start loading 100px before reaching the bottom
      threshold: 0.1,
    });

    observer.observe(element);
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleActivityObserver, useInfiniteScroll, activities.length, activeTab]);



  useEffect(() => {
    if (editingCommentId && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.setSelectionRange(
        editingCommentText.length,
        editingCommentText.length
      );
    }
  }, [editingCommentId, editingCommentText]);

  // Auto-focus add comment textarea when expanding add form
  useEffect(() => {
    if (showAddCommentForm && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showAddCommentForm]);

  const invalidateCommentQueries = () => {
    if (accountId && caseId && taskId) {
      // Invalidate regular comments query
      queryClient.invalidateQueries({
        queryKey: [
          'taskComments',
          {
            account_rid: accountId,
            case_rid: caseId,
            task_rid: taskId,
            page: 1,
            limit: 100,
          },
        ],
      });

      // Invalidate infinite comments query
      queryClient.invalidateQueries({
        queryKey: [
          'taskCommentsInfinite',
          {
            case_rid: caseId,
            account_rid: accountId,
            task_rid: taskId,
          },
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'taskAttachments',
          {
            account_rid: accountId,
            case_rid: caseId,
            task_rid: taskId,
            page: 1,
            limit: 100,
          },
        ],
      });

      // Invalidate activities queries
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
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmModal.commentId && onDeleteComment && taskId) {
      setIsDeleting(true);
      try {
        await onDeleteComment(deleteConfirmModal.commentId, taskId);
        setDeleteConfirmModal({ isOpen: false, commentId: null });
        invalidateCommentQueries();
      } catch (error) {
        console.error('Error deleting comment:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmModal({ isOpen: false, commentId: null });
  };

  const handleUpdateComment = async (commentId: string) => {
    if (
      !onUpdateComment ||
      !editingCommentText.trim() ||
      !taskId ||
      !accountId ||
      !caseId
    ) {
      return;
    }

    if (editingCommentText.length > 2000) {
      setCommentError('Maximum 2000 characters allowed');
      return;
    }

    setIsUpdating(true);
    setCommentError(null);
    try {
      await onUpdateComment(
        commentId,
        editingCommentText.trim(),
        taskId,
        editingNewFiles,
        editingDeletedFileIds
      );
      setEditingCommentId(null);
      setEditingCommentText('');
      setEditingNewFiles([]);
      setEditingDeletedFileIds([]);
      invalidateCommentQueries();
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !taskId) {
      return;
    }

    if (!onAddComment) {
      console.error('onAddComment callback is not provided');
      return;
    }

    if (comment.length > 2000) {
      setCommentError('Maximum 2000 characters allowed');
      return;
    }

    setIsAddingComment(true);
    setCommentError(null);
    try {
      await onAddComment(taskId, comment.trim(), commentFiles);
      setComment('');
      setCommentFiles([]);
      setShowAddCommentForm(false);
      invalidateCommentQueries();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleCommentAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const arr = Array.from(files);
      setCommentFiles((prev) => [...prev, ...arr]);
      e.target.value = '';
    } else {
      console.log('Add Comment - No files selected');
    }
  };

  const handleRemoveCommentAttachment = (indexToRemove: number) => {
    setCommentFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleEditAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const arr = Array.from(files);
      setEditingNewFiles((prev) => [...prev, ...arr]);
      e.target.value = '';
    } else {
      console.log('Edit Comment - No files selected');
    }
  };

  const handleRemoveEditNewAttachment = (indexToRemove: number) => {
    setEditingNewFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleRemoveExistingAttachment = (attachmentId: string) => {
    setEditingDeletedFileIds((prev) => [...prev, attachmentId]);
  };

  const handleUndoRemoveExistingAttachment = (attachmentId: string) => {
    setEditingDeletedFileIds((prev) =>
      prev.filter((id) => id !== attachmentId)
    );
  };

  const handleCancelAdd = () => {
    setComment('');
    setCommentFiles([]);
    setShowAddCommentForm(false);
  };

  const isCommentUnchanged = (original: string, edited: string) => {
    return original.trim() === edited.trim();
  };

  if (fieldVisibility.comments) return null;

  return (
    <div className='border-t border-gray-200 pt-6 overflow-x-hidden overscroll-x-none'>
      <input
        ref={addFileInputRef}
        type='file'
        multiple
        onChange={handleCommentAttachmentChange}
        className='hidden'
        disabled={fieldDisabled.comments || isAddingComment}
      />
      <input
        ref={editFileInputRef}
        type='file'
        multiple
        onChange={handleEditAttachmentChange}
        className='hidden'
        disabled={isUpdating}
      />
      {/* Tab Navigation */}
      <div className='flex gap-6 mb-6 border-b border-gray-200'>
        <button
          onClick={() => setActiveTab('comments')}
          className={`text-sm font-semibold pb-3 px-1 transition-all duration-200 ${activeTab === 'comments'
            ? 'text-gray-900 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-800 border-b-2 border-transparent'
            }`}
        >
          Comments {totalCommentsCount > 0 && <span className='ml-1 text-xs text-gray-500'>({totalCommentsCount})</span>}
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`text-sm font-semibold pb-3 px-1 transition-all duration-200 ${activeTab === 'activity'
            ? 'text-gray-900 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-800 border-b-2 border-transparent'
            }`}
        >
          Activity {totalActivitiesCount > 0 && <span className='ml-1 text-xs text-gray-500'>({totalActivitiesCount})</span>}
        </button>
      </div>

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className='space-y-4 relative'>
          {deleteConfirmModal.isOpen && (
            <div className='absolute top-0 left-0 right-0 flex items-start justify-center z-50 pt-4'>
              <div className='bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4'>
                <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                  Delete comment
                </h3>
                <p className='text-sm text-gray-700 mb-6'>
                  Are you sure you want to delete this comment? This action
                  cannot be undone.
                </p>
                <div className='flex items-center justify-end gap-2'>
                  <TextButton
                    label='Cancel'
                    onClick={handleDeleteCancel}
                    disabled={isDeleting}
                    sx={{ padding: '6px 12px' }}
                  />
                  <TextButton
                    label={isDeleting ? 'Deleting...' : 'Delete'}
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    sx={{ padding: '6px 12px' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className='space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden scrollbar-hide pr-1'>
            {comments.length > 0 ? (
              comments.map((commentItem, idx) => (
                <div
                  key={commentItem.id || idx}
                  onMouseEnter={() =>
                    setHoveredCommentId(commentItem.id || null)
                  }
                  onMouseLeave={() => setHoveredCommentId(null)}
                  className='group'
                >
                  {/* Edit Mode */}
                  {editingCommentId === commentItem.id ? (
                    <div className='bg-white border border-gray-300 rounded-lg p-4 shadow-sm'>
                      <div className='flex gap-3 mb-3'>
                        <div
                          className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white'
                          style={{
                            backgroundColor:
                              commentItem.createdBy === loggedInUserId
                                ? loggedInUser.color
                                : commentItem.color || '#999',
                            fontSize: '8px',
                          }}
                        >
                          {commentItem.createdBy === loggedInUserId
                            ? loggedInUser.initials
                            : commentItem.initials ||
                            generateInitials(commentItem.user)}
                        </div>
                        <div>
                          <p className='text-sm font-semibold text-gray-900'>
                            {commentItem.user}
                          </p>
                          <p className='text-xs text-gray-500'>Editing...</p>
                        </div>
                      </div>
                      <div className='relative'>
                        <textarea
                          ref={editTextareaRef}
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className='w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500 min-h-[100px] pr-8'
                          placeholder='Edit your comment'
                          disabled={isUpdating}
                        />
                        {commentError && editingCommentId === commentItem.id && (
                          <div className='absolute right-2 top-3'>
                            <ErrorIconTooltip error={commentError} />
                          </div>
                        )}
                      </div>

                      {/* Edit Mode Attachments */}
                      <div className='mt-3 space-y-3'>
                        {/* Existing Attachments */}
                        {commentItem.attachments &&
                          commentItem.attachments.length > 0 && (
                            <div className='space-y-2'>
                              <p className='text-xs font-medium text-gray-500'>
                                Existing Attachments:
                              </p>
                              {commentItem.attachments.map((att) => {
                                const isMarkedForDeletion =
                                  editingDeletedFileIds.includes(att.rid);
                                return (
                                  <div
                                    key={att.rid}
                                    className={`flex items-center justify-between p-2 rounded text-xs ${isMarkedForDeletion
                                      ? 'bg-red-50 text-gray-400'
                                      : 'bg-gray-50 text-gray-700'
                                      }`}
                                  >
                                    <div className='flex items-center gap-2 overflow-hidden'>
                                      <span
                                        className={
                                          isMarkedForDeletion
                                            ? 'line-through'
                                            : ''
                                        }
                                      >
                                        📎 {att.documentName}
                                      </span>
                                      {isMarkedForDeletion && (
                                        <span className='text-red-500 text-[10px]'>
                                          (Marked for deletion)
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() =>
                                        isMarkedForDeletion
                                          ? handleUndoRemoveExistingAttachment(
                                            att.rid
                                          )
                                          : handleRemoveExistingAttachment(
                                            att.rid
                                          )
                                      }
                                      className={`ml-2 p-1 rounded hover:bg-opacity-80 ${isMarkedForDeletion
                                        ? 'text-green-600 hover:bg-green-100'
                                        : 'text-red-600 hover:bg-red-100'
                                        }`}
                                      title={
                                        isMarkedForDeletion
                                          ? 'Undo delete'
                                          : 'Delete attachment'
                                      }
                                      disabled={isUpdating}
                                    >
                                      {isMarkedForDeletion ? '↩' : '✕'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        {/* New Attachments Input */}
                        <div className='space-y-2'>
                          <button
                            type='button'
                            onClick={() => editFileInputRef.current?.click()}
                            className='block w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer bg-gray-50'
                            disabled={isUpdating}
                          >
                            <p className='text-xs text-gray-600 font-medium'>
                              📎 Click to upload attachments
                            </p>
                          </button>
                        </div>

                        {/* Show selected files for edit comment */}
                        {editingNewFiles.length > 0 && (
                          <div className='space-y-1 max-w-full'>
                            {editingNewFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className='text-xs text-blue-900 bg-blue-50 p-2 rounded flex items-center gap-2 justify-between min-w-0'
                              >
                                <div className='flex items-center gap-2 min-w-0'>
                                  <span className='flex-shrink-0'>📎</span>
                                  <span className='truncate break-all min-w-0'>
                                    {file.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    handleRemoveEditNewAttachment(idx)
                                  }
                                  className='text-blue-700 hover:text-blue-900 transition-colors flex-shrink-0'
                                  disabled={isUpdating}
                                  title='Remove attachment'
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className='flex gap-2 justify-end mt-3 items-center'>
                        <TextButton
                          label='Cancel'
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText('');
                            setEditingNewFiles([]);
                            setEditingDeletedFileIds([]);
                          }}
                          disabled={isUpdating}
                          sx={{ padding: '6px 12px' }}
                        />
                        <TextButton
                          label={isUpdating ? 'Saving...' : 'Save'}
                          onClick={() =>
                            handleUpdateComment(commentItem.id || '')
                          }
                          disabled={
                            isUpdating ||
                            !editingCommentText.trim() ||
                            (!editingNewFiles.length &&
                              !editingDeletedFileIds.length &&
                              isCommentUnchanged(
                                commentItem.text,
                                editingCommentText
                              ))
                          }
                          sx={{ padding: '6px 12px' }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className='flex gap-3 pb-3 border-b border-gray-200 last:border-b-0 transition-colors group-hover:bg-gray-50 rounded-lg p-3 -mx-3'>
                      <div
                        className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white'
                        style={{
                          backgroundColor:
                            commentItem.createdBy === loggedInUserId
                              ? loggedInUser.color
                              : commentItem.color || '#999',
                          fontSize: '8px',
                        }}
                      >
                        {commentItem.createdBy === loggedInUserId
                          ? loggedInUser.initials
                          : commentItem.initials ||
                          generateInitials(commentItem.user)}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between gap-2'>
                          <div>
                            <p className='text-sm font-semibold text-gray-900'>
                              {commentItem.user}
                            </p>
                            {commentItem.createdDateTime && (
                              <p className='text-xs text-gray-500 mt-0.5'>
                                {commentItem.createdDateTime}
                              </p>
                            )}
                          </div>

                          {/* Action Icons - Hover Reveal */}
                          <div
                            className={`flex gap-2 flex-shrink-0 transition-opacity duration-200 ${hoveredCommentId === commentItem.id
                              ? 'opacity-100'
                              : 'opacity-0'
                              }`}
                          >
                            <Suspense fallback={null}>
                              <button
                                onClick={() => {
                                  setEditingCommentId(commentItem.id || null);
                                  setEditingCommentText(commentItem.text);
                                  setEditingNewFiles([]);
                                  setEditingDeletedFileIds([]);
                                }}
                                className='p-1.5 hover:bg-blue-100 rounded-md transition-colors group/edit'
                                title='Edit comment'
                              >
                                <PencilIcon className='w-4 h-4 text-blue-600' />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirmModal({
                                    isOpen: true,
                                    commentId: commentItem.id || null,
                                  });
                                }}
                                className='p-1.5 hover:bg-red-100 rounded-md transition-colors group/delete'
                                title='Delete comment'
                              >
                                <DeleteIcon className='w-4 h-4 text-red-600' />
                              </button>
                            </Suspense>
                          </div>
                        </div>

                        <p className='text-sm text-gray-700 mt-2 break-words'>
                          {commentItem.text}
                        </p>

                        {commentItem.attachments &&
                          commentItem.attachments.length > 0 && (
                            <div className='mt-2 space-y-2'>
                              {commentItem.attachments.map((att) => (
                                <div
                                  key={att.rid}
                                  className='bg-gray-50 p-2 rounded border border-gray-200'
                                >
                                  <div className='flex items-center gap-2'>
                                    <svg
                                      className='w-4 h-4 text-gray-400 flex-shrink-0'
                                      fill='none'
                                      stroke='currentColor'
                                      viewBox='0 0 24 24'
                                    >
                                      <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
                                      />
                                    </svg>
                                    <div className='flex-1 min-w-0'>
                                      <a
                                        href={att.browseFile}
                                        onClick={(e) =>
                                          handleDownload(
                                            e,
                                            att.browseFile,
                                            att.documentName
                                          )
                                        }
                                        className='text-sm text-blue-600 hover:underline font-medium block truncate'
                                      >
                                        {att.documentName}
                                      </a>
                                      {(att.uploadedBy || att.uploadedDate) && (
                                        <p className='text-xs text-gray-500 mt-0.5'>
                                          Uploaded by{' '}
                                          {att.uploadedBy || 'Unknown'} on{' '}
                                          {att.uploadedDate ||
                                            'Recently uploaded'}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : isLoadingInfinite && useInfiniteScroll ? (
              <LoadingSkeleton count={3} variant='comment' />
            ) : (
              <div className='text-center py-2'>
                <p className='text-sm text-gray-500'>No comments yet.</p>
              </div>
            )}

            {/* Intersection Observer Target for Infinite Scroll */}
            {useInfiniteScroll && comments.length > 0 && (
              <div ref={observerTarget} className='h-4' />
            )}

            {/* Loading Next Page Indicator */}
            {useInfiniteScroll && isFetchingNextPage && (
              <LoadingSkeleton count={2} variant='comment' />
            )}

            {/* End of List Indicator */}
            {useInfiniteScroll && !hasNextPage && comments.length > 0 && (
              <></>
            )}
          </div>

          {/* Add Comment Section */}
          <div className='border-t border-gray-200 pt-4 mt-4'>
            {!showAddCommentForm ? (
              /* Add Comment Button */
              <button
                onClick={() => setShowAddCommentForm(true)}
                disabled={fieldDisabled.comments}
                className='flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200'
              >
                <Suspense fallback={null}>
                  <AddIcon className='w-4 h-4' />
                </Suspense>
                Add a comment
              </button>
            ) : (
              /* Add Comment Form */
              <div className='flex items-start gap-3 bg-white border border-gray-300 rounded-lg p-4 shadow-sm'>
                <div
                  className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white'
                  style={{
                    backgroundColor: loggedInUser.color,
                    fontSize: '8px',
                  }}
                >
                  {loggedInUser.initials}
                </div>
                <div className='flex-1 space-y-3 min-w-0'>
                  <div className='relative'>
                    <textarea
                      ref={textareaRef}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder='Add your comment here...'
                      className='w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500 min-h-[100px] pr-8'
                      disabled={fieldDisabled.comments || isAddingComment}
                    />
                    {commentError && !editingCommentId && (
                      <div className='absolute right-2 top-3'>
                        <ErrorIconTooltip error={commentError} />
                      </div>
                    )}
                  </div>

                  {/* File upload area */}
                  <button
                    type='button'
                    onClick={() => addFileInputRef.current?.click()}
                    className='block w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer bg-gray-50'
                    disabled={fieldDisabled.comments || isAddingComment}
                  >
                    <p className='text-xs text-gray-600 font-medium'>
                      📎 Click to upload attachments
                    </p>
                  </button>

                  {/* Show selected files for add comment */}
                  {commentFiles.length > 0 && (
                    <div className='space-y-1 max-w-full'>
                      {commentFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className='text-xs text-gray-700 bg-gray-100 p-2.5 rounded flex items-center gap-2 justify-between min-w-0'
                        >
                          <div className='flex items-center gap-2 min-w-0'>
                            <span className='flex-shrink-0'>📎</span>
                            <span className='truncate break-all min-w-0'>
                              {file.name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveCommentAttachment(idx)}
                            className='text-red-600 hover:text-red-700 transition-colors flex-shrink-0'
                            disabled={fieldDisabled.comments || isAddingComment}
                            title='Remove attachment'
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className='flex gap-2 justify-end pt-2 items-center'>
                    <TextButton
                      label='Cancel'
                      onClick={handleCancelAdd}
                      disabled={isAddingComment}
                      sx={{ padding: '6px 12px' }}
                    />
                    <TextButton
                      label={isAddingComment ? 'Adding...' : 'Add'}
                      onClick={handleAddComment}
                      disabled={
                        isAddingComment ||
                        !comment.trim() ||
                        fieldDisabled.comments ||
                        !!commentError
                      }
                      sx={{ padding: '6px 12px' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className='space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden overscroll-x-none scrollbar-hide pr-1'>
          {activities.length > 0 ? (
            activities.map((activity, idx) => (
              <div
                key={activity.id || idx}
                className='flex gap-3 pb-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 rounded-lg p-3 -mx-3 transition-colors'
              >
                <div
                  className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white'
                  style={{
                    backgroundColor: activity.color || '#8B5CF6',
                    fontSize: '8px',
                  }}
                >
                  {activity.initials || generateInitials(activity.user)}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm text-gray-900 break-words'>
                    <span className='font-semibold'>{activity.user}</span>{' '}
                    <span className='text-gray-700'>{activity.action}</span>
                    {activity.link && (
                      <span className='text-blue-600 font-medium'>
                        {' '}
                        {activity.link}
                      </span>
                    )}
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>{activity.date}</p>
                </div>
              </div>
            ))
          ) : isLoadingActivitiesInfinite && useInfiniteScroll ? (
            <LoadingSkeleton count={3} variant='activity' />
          ) : (
            <div className='text-center py-2'>
              <p className='text-sm text-gray-500'>No activities yet</p>
            </div>
          )}

          {/* Intersection Observer Target for Infinite Scroll Activities */}
          {useInfiniteScroll && activities.length > 0 && (
            <div ref={activityObserverTarget} className='h-4' />
          )}

          {/* Loading Next Page Indicator for Activities */}
          {useInfiniteScroll && isFetchingNextActivitiesPage && (
            <LoadingSkeleton count={2} variant='activity' />
          )}

          {/* End of List Indicator for Activities */}
          {useInfiniteScroll && !hasNextActivitiesPage && activities.length > 0 && (
            <></>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCommentsSection;
