import React from 'react';
import { Task } from './types';

interface TaskAttachment {
  id?: string;
  rid?: string;
  fileName: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  uploadedBy: string;
  uploadedDate: string;
}

interface TaskAttachmentsSectionProps {
  fieldVisibility: Record<string, boolean | undefined>;
  fieldDisabled: Record<string, boolean | undefined>;
  editedTask: Task | null;
  taskAttachments: TaskAttachment[];
  onAttachmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (indexToRemove: number) => void;
  onRemoveExistingAttachment?: (attachmentId: string) => void;
}

const TaskAttachmentsSection: React.FC<TaskAttachmentsSectionProps> = ({
  fieldVisibility,
  fieldDisabled,
  editedTask,
  taskAttachments,
  onAttachmentChange,
  onRemoveAttachment,
  onRemoveExistingAttachment,
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

      {/* Existing attachments from response */}
      {taskAttachments && taskAttachments.length > 0 && (
        <div className='mt-4'>
          <div className='space-y-2'>
            {taskAttachments.map((attachment) => (
              <div
                key={attachment.id || attachment.rid}
                className='text-xs text-gray-600 bg-blue-50 p-3 rounded flex items-center gap-2 border border-blue-200'
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
                <button
                  onClick={() =>
                    onRemoveExistingAttachment?.(
                      attachment.rid || attachment.id || ''
                    )
                  }
                  className='ml-auto text-red-500 hover:text-red-700 transition-colors font-bold text-lg'
                  disabled={fieldDisabled.attachments}
                  title='Remove attachment'
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newly added attachments (pending upload) */}
      {editedTask?.attachments && editedTask.attachments.length > 0 && (
        <div className='mt-3 space-y-2'>
          {editedTask.attachments.map((file, idx) => (
            <div
              key={idx}
              className='text-xs text-gray-600 bg-green-50 p-3 rounded flex items-center gap-2 border border-green-200'
            >
              <span>📎</span>
              <span className='flex-1'>{file}</span>
              {/* <span className='text-green-600 text-xs font-medium'>
                (Pending Upload)
              </span> */}
              <button
                onClick={() => onRemoveAttachment(idx)}
                className='ml-auto text-red-500 hover:text-red-700 transition-colors font-bold text-lg'
                disabled={fieldDisabled.attachments}
                title='Remove from upload queue'
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskAttachmentsSection;
