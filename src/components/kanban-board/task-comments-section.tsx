import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Activity, Comment, Task } from './types';
import { PencilIcon, DeleteIcon, AddIcon } from '../../assets';
import TextButton from '../button/text-button';

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
  onAddComment?: (taskId: string, comment: string, files: File[]) => Promise<void>;
  onUpdateComment?:
  | ((
    commentId: string,
    comment: string,
    taskId: string,
    files?: File[],
    deletedFileIds?: string[]
  ) => Promise<void>)
  | undefined;
  onDeleteComment: ((commentId: string) => Promise<void>) | undefined;
  loadingComments?: boolean;
  loadingActivities?: boolean;
}

const TaskCommentsSection: React.FC<TaskCommentsSectionProps> = ({
  fieldVisibility,
  fieldDisabled,
  activeTab,
  setActiveTab,
  comments,
  activities,
  editingCommentId,
  editingCommentText,
  setEditingCommentId,
  setEditingCommentText,
  task,
  accountId,
  caseId,
  taskId,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}) => {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
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

  // Auto-focus edit textarea when entering edit mode
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
      queryClient.invalidateQueries({
        queryKey: ['taskComments', accountId, caseId, taskId],
      });
      queryClient.invalidateQueries({
        queryKey: ['taskAttachments', accountId, caseId, taskId],
      });
      queryClient.invalidateQueries({
        queryKey: ['collaborators', accountId, caseId, taskId],
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmModal.commentId && onDeleteComment) {
      setIsDeleting(true);
      try {
        await onDeleteComment(deleteConfirmModal.commentId);
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

    setIsUpdating(true);
    try {
      // Create FormData payload with all required fields
      const formData = new FormData();
      formData.append('account_rid', accountId);
      formData.append('case_rid', caseId);
      formData.append('task_rid', taskId);
      formData.append('comments', editingCommentText.trim());
      formData.append('rid', commentId);
      formData.append('deleted_file_ids', JSON.stringify([]));

      // Pass formData to the parent component's onUpdateComment handler
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

    setIsAddingComment(true);
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
      setCommentFiles((prev) => [...prev, ...Array.from(files)]);
      e.target.value = '';
    }
  };

  const handleRemoveCommentAttachment = (indexToRemove: number) => {
    setCommentFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleEditAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setEditingNewFiles((prev) => [...prev, ...Array.from(files)]);
      e.target.value = '';
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
    setEditingDeletedFileIds((prev) => prev.filter((id) => id !== attachmentId));
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
    <div className='border-t border-gray-200 pt-6'>
      {/* Tab Navigation */}
      <div className='flex gap-6 mb-6 border-b border-gray-200'>
        <button
          onClick={() => setActiveTab('comments')}
          className={`text-sm font-semibold pb-3 px-1 transition-all duration-200 ${activeTab === 'comments'
            ? 'text-gray-900 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-800 border-b-2 border-transparent'
            }`}
        >
          Comments ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`text-sm font-semibold pb-3 px-1 transition-all duration-200 ${activeTab === 'activity'
            ? 'text-gray-900 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-800 border-b-2 border-transparent'
            }`}
        >
          Activity ({activities.length})
        </button>
      </div>

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className='space-y-4 relative'>
          {/* Delete Confirmation Modal - Inline Centered */}
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
          <div className='space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin-comments pr-1'>
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
                            backgroundColor: commentItem.color || '#999',
                            fontSize: '8px',
                          }}
                        >
                          {commentItem.initials ||
                            commentItem.user
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                        </div>
                        <div>
                          <p className='text-sm font-semibold text-gray-900'>
                            {commentItem.user}
                          </p>
                          <p className='text-xs text-gray-500'>Editing...</p>
                        </div>
                      </div>
                      <textarea
                        ref={editTextareaRef}
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className='w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500 min-h-[100px]'
                        placeholder='Edit your comment'
                        disabled={isUpdating}
                      />

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
                                          isMarkedForDeletion ? 'line-through' : ''
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
                                          : handleRemoveExistingAttachment(att.rid)
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
                          <label className='block border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer bg-gray-50'>
                            <input
                              type='file'
                              multiple
                              onChange={handleEditAttachmentChange}
                              className='hidden'
                              disabled={isUpdating}
                              onClick={(e) => (e.target as HTMLInputElement).value = ''}
                            />
                            <p className='text-xs text-gray-600 font-medium'>
                              📎 Click to upload attachments
                            </p>
                          </label>

                          {/* New Attachments List */}
                          {editingNewFiles.length > 0 && (
                            <div className='space-y-1'>
                              {editingNewFiles.map((file, idx) => (
                                <div
                                  key={idx}
                                  className='flex items-center justify-between p-2 bg-blue-50 text-blue-900 rounded text-xs'
                                >
                                  <span className='truncate'>
                                    + {file.name}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleRemoveEditNewAttachment(idx)
                                    }
                                    className='text-blue-700 hover:text-blue-900'
                                    disabled={isUpdating}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className='flex gap-2 justify-end mt-3'>
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
                          backgroundColor: commentItem.color || '#999',
                          fontSize: '8px',
                        }}
                      >
                        {commentItem.initials ||
                          commentItem.user
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
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
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='text-sm text-blue-600 hover:underline font-medium block truncate'
                                      >
                                        {att.documentName}
                                      </a>
                                      {(att.uploadedBy || att.uploadedDate) && (
                                        <p className='text-xs text-gray-500 mt-0.5'>
                                          Uploaded by {att.uploadedBy || 'Unknown'} on{' '}
                                          {att.uploadedDate || 'Recently uploaded'}
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
            ) : (
              <div className='text-center py-8'>
                <p className='text-sm text-gray-500'>
                  No comments yet.
                </p>
              </div>
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
                    backgroundColor: task?.assignee?.color || '#999',
                    fontSize: '8px',
                  }}
                >
                  {task?.assignee?.initials || '?'}
                </div>
                <div className='flex-1 space-y-3 min-w-0'>
                  <textarea
                    ref={textareaRef}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder='Add your comment here...'
                    className='w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500 min-h-[100px]'
                    disabled={fieldDisabled.comments || isAddingComment}
                  />

                  {/* File upload area */}
                  <label className='block border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer bg-gray-50'>
                    <input
                      type='file'
                      multiple
                      onChange={handleCommentAttachmentChange}
                      className='hidden'
                      disabled={fieldDisabled.comments || isAddingComment}
                      onClick={(e) => (e.target as HTMLInputElement).value = ''}
                    />
                    <p className='text-xs text-gray-600 font-medium'>
                      📎 Click to upload attachments
                    </p>
                  </label>

                  {/* Attached files list */}
                  {commentFiles.length > 0 && (
                    <div className='space-y-1 max-w-full'>
                      {commentFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className='text-xs text-gray-700 bg-gray-100 p-2.5 rounded flex items-center gap-2 justify-between min-w-0'
                        >
                          <div className='flex items-center gap-2 min-w-0'>
                            <span className='flex-shrink-0'>📎</span>
                            <span className='truncate'>{file.name}</span>
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
                  <div className='flex gap-2 justify-end pt-2'>
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
                        fieldDisabled.comments
                      }
                      sx={{ padding: '6px 12px' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div >
      )}

      {/* Activity Tab */}
      {
        activeTab === 'activity' && (
          <div className='space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin-comments pr-1'>
            {activities.length > 0 ? (
              activities.map((activity, idx) => (
                <div
                  key={activity.id || idx}
                  className='flex gap-3 pb-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 rounded-lg p-3 -mx-3 transition-colors'
                >
                  <div
                    className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white'
                    style={{
                      backgroundColor: '#8B5CF6',
                      fontSize: '8px',
                    }}
                  >
                    {activity.user
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
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
            ) : (
              <div className='text-center py-8'>
                <p className='text-sm text-gray-500'>No activities yet</p>
              </div>
            )}
          </div>
        )
      }
    </div >
  );
};

export default TaskCommentsSection;
