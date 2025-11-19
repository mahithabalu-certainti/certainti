import React from 'react';
import { Task } from './types';

interface TaskAttachmentsSectionProps {
  fieldVisibility: Record<string, boolean | undefined>;
  fieldDisabled: Record<string, boolean | undefined>;
  editedTask: Task | null;
  taskAttachments: Array<{
    id?: string;
    fileName: string;
    filePath?: string;
    fileSize?: number;
    fileType?: string;
    uploadedBy: string;
    uploadedDate: string;
  }>;
  onAttachmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (indexToRemove: number) => void;
}

const TaskAttachmentsSection: React.FC<TaskAttachmentsSectionProps> = ({
  fieldVisibility,
  fieldDisabled,
  editedTask,
  taskAttachments,
  onAttachmentChange,
  onRemoveAttachment,
}) => {
  if (fieldVisibility.attachments) return null;

  return (
    <div>
      <h3 className='text-sm font-semibold text-gray-700 mb-3'>Attachments</h3>
      <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50'>
        <input
          type='file'
          multiple
          accept='*/*'
          onChange={onAttachmentChange}
          className='hidden'
          id='attachments-input'
          disabled={fieldDisabled.attachments}
        />
        <label htmlFor='attachments-input' className='cursor-pointer block'>
          <p className='text-sm text-gray-600'>
            📎 Click to upload attachments
          </p>
        </label>
      </div>
      {editedTask?.attachments && editedTask.attachments.length > 0 && (
        <div className='mt-3 space-y-2'>
          {editedTask.attachments.map((file, idx) => (
            <div
              key={idx}
              className='text-xs text-gray-600 bg-gray-50 p-2 rounded flex items-center gap-2'
            >
              <span>📎</span> {file}
              <button
                onClick={() => onRemoveAttachment(idx)}
                className='ml-auto text-red-500 hover:text-red-700 transition-colors'
                disabled={fieldDisabled.attachments}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      {taskAttachments && taskAttachments.length > 0 ? (
        <div className='mt-4'>
          <div className='space-y-2'>
            {taskAttachments.map((attachment, idx) => (
              <div
                key={attachment.id || idx}
                className='text-xs text-gray-600 bg-gray-50 p-3 rounded flex items-center gap-2 border border-gray-200'
              >
                <span>📎</span>
                <div className='flex-1'>
                  <p className='font-medium text-gray-700'>
                    {attachment.fileName}
                  </p>
                  <p className='text-gray-500 text-xs mt-1'>
                    Uploaded by {attachment.uploadedBy} on{' '}
                    {attachment.uploadedDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TaskAttachmentsSection;
