import React, { useState } from 'react';
import { Activity, Comment, Task } from './types';
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
  comment: string;
  setComment: (text: string) => void;
  editedTask: Task | null;
  task: Task | null;
  onUpdateComment:
    | ((commentId: string, comment: string) => Promise<void>)
    | undefined;
  onDeleteComment: ((commentId: string) => Promise<void>) | undefined;
  handleCommentAttachmentChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  handleRemoveCommentAttachment: (indexToRemove: number) => void;
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
  comment,
  setComment,
  editedTask,
  task,
  onUpdateComment,
  onDeleteComment,
  handleCommentAttachmentChange,
  handleRemoveCommentAttachment,
}) => {
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    commentId: string | null;
  }>({
    isOpen: false,
    commentId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (deleteConfirmModal.commentId && onDeleteComment) {
      setIsDeleting(true);
      try {
        await onDeleteComment(deleteConfirmModal.commentId);
        setDeleteConfirmModal({ isOpen: false, commentId: null });
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

  if (fieldVisibility.comments) return null;

  return (
    <div className='border-t border-gray-200 pt-6'>
      <div className='flex gap-6 mb-4 border-b border-gray-200'>
        <button
          onClick={() => setActiveTab('comments')}
          className={`text-sm font-medium pb-3 transition-colors ${
            activeTab === 'comments'
              ? 'text-gray-900 border-b-2 border-blue-500'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Comments
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`text-sm font-medium pb-3 transition-colors ${
            activeTab === 'activity'
              ? 'text-gray-900 border-b-2 border-blue-500'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          All Activity
        </button>
      </div>

      {activeTab === 'comments' && (
        <div className='space-y-3 max-h-[300px] overflow-y-auto pr-2'>
          {comments.length > 0 ? (
            comments.map((commentItem, idx) => (
              <div
                key={commentItem.id || idx}
                className='flex gap-3 pb-3 border-b border-gray-200 last:border-b-0'
              >
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
                <div className='flex-1'>
                  <div className='flex items-center justify-between mb-2'>
                    <div>
                      <p className='text-sm font-semibold text-gray-700'>
                        {commentItem.user}
                      </p>
                      {commentItem.createdDateTime && (
                        <p className='text-xs text-gray-500'>
                          {commentItem.createdDateTime}
                        </p>
                      )}
                    </div>
                    {editingCommentId !== commentItem.id && (
                      <div className='flex gap-3'>
                        <button
                          onClick={() => {
                            setEditingCommentId(commentItem.id || null);
                            setEditingCommentText(commentItem.text);
                          }}
                          className='text-xs text-blue-500 hover:text-blue-700 transition-colors'
                          title='Edit comment'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmModal({
                              isOpen: true,
                              commentId: commentItem.id || null,
                            });
                          }}
                          className='text-xs text-red-500 hover:text-red-700 transition-colors'
                          title='Delete comment'
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === commentItem.id ? (
                    <div className='space-y-2'>
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className='w-full bg-white border border-gray-300 rounded-lg p-2 text-sm resize-none focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500'
                        rows={3}
                        autoFocus
                      />
                      <div className='flex gap-2 justify-end'>
                        <button
                          onClick={() => {
                            if (
                              commentItem.id &&
                              onUpdateComment &&
                              editingCommentText.trim()
                            ) {
                              onUpdateComment(
                                commentItem.id,
                                editingCommentText.trim()
                              );
                              setEditingCommentId(null);
                              setEditingCommentText('');
                            }
                          }}
                          className='text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium'
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText('');
                          }}
                          className='text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium'
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className='text-sm text-gray-600 mt-2'>
                        {commentItem.text}
                      </p>
                      {commentItem.attachments &&
                        commentItem.attachments.length > 0 && (
                          <div className='mt-2 space-y-1'>
                            {commentItem.attachments.map((attachment, idx) => (
                              <div
                                key={idx}
                                className='text-xs text-gray-500 bg-gray-50 p-1 rounded inline-block'
                              >
                                📎 {attachment}
                              </div>
                            ))}
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-4'>
              <p className='text-sm text-gray-500'>No comments yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className='border-t border-gray-200 pt-4 mt-4'>
          <div className='flex items-start gap-3'>
            <div
              className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white'
              style={{
                backgroundColor: task?.assignee?.color || '#999',
                fontSize: '8px',
              }}
            >
              {task?.assignee?.initials || '?'}
            </div>
            <div className='flex-1 space-y-3'>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder='Add a comment'
                className='w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500 min-h-[80px]'
                disabled={fieldDisabled.comments}
              />
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50'>
                <input
                  type='file'
                  multiple
                  onChange={handleCommentAttachmentChange}
                  className='hidden'
                  id='comment-attachments-input'
                  disabled={fieldDisabled.comments}
                />
                <label
                  htmlFor='comment-attachments-input'
                  className='cursor-pointer block'
                >
                  <p className='text-xs text-gray-600'>
                    📎 Click to upload attachments
                  </p>
                </label>
              </div>
              {editedTask?.commentAttachments &&
                editedTask.commentAttachments.length > 0 && (
                  <div className='space-y-1'>
                    {editedTask.commentAttachments.map((file, idx) => (
                      <div
                        key={idx}
                        className='text-xs text-gray-600 bg-gray-50 p-2 rounded flex items-center gap-2'
                      >
                        <span>📎</span> {file}
                        <button
                          onClick={() => handleRemoveCommentAttachment(idx)}
                          className='ml-auto text-red-500 hover:text-red-700 transition-colors'
                          disabled={fieldDisabled.comments}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className='space-y-3 max-h-[190px] overflow-y-auto pr-2'>
          {activities.length > 0 ? (
            activities.map((activity, idx) => (
              <div
                key={activity.id || idx}
                className='flex gap-3 pb-3 border-b border-gray-200 last:border-b-0'
              >
                <div
                  className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-amber-500 text-white'
                  style={{ fontSize: '8px' }}
                >
                  {activity.user
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className='flex-1'>
                  <p className='text-sm text-gray-700'>
                    <span className='font-semibold'>{activity.user}</span>{' '}
                    {activity.action}
                    {activity.link && (
                      <span className='text-blue-600'> {activity.link}</span>
                    )}
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>{activity.date}</p>
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-4'>
              <p className='text-sm text-gray-500'>No activities yet</p>
            </div>
          )}
        </div>
      )}

      {deleteConfirmModal.isOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]'>
          <div className='bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-3'>
              Delete Comment
            </h3>
            <p className='text-sm text-gray-600 mb-6'>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </p>
            <div className='flex items-center justify-end gap-3'>
              <TextButton
                label='Cancel'
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              />
              <TextButton
                label={isDeleting ? 'Deleting...' : 'Delete'}
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                sx={{
                  backgroundColor: isDeleting ? '#D1D5DB' : '#EF4444',
                  color: '#FFFFFF',
                  padding: '6px 12px',
                  '&:hover': {
                    backgroundColor: isDeleting ? '#D1D5DB' : '#DC2626',
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCommentsSection;
