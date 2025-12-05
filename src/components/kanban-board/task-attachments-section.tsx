import React from 'react';
import { Task } from './types';
import { PaperclipIcon } from '../../assets';

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
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  if (fieldVisibility.attachments) return null;

  const handleLocalAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    setErrorMessage(null);
    if (files && files.length > 0) {
      const dt = new DataTransfer();
      let hasError = false;
      Array.from(files).forEach((file) => {
        const lastDotIndex = file.name.lastIndexOf('.');
        const nameWithoutExtension =
          lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;

        if (nameWithoutExtension.length > 100) {
          setErrorMessage('Document name cannot exceed 100 characters');
          hasError = true;
        } else {
          dt.items.add(file);
        }
      });

      if (hasError) {
        e.target.files = dt.files;
      }

      if (dt.files.length > 0) {
        onAttachmentChange(e);
      } else {
        e.target.value = '';
      }
    }
  };

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

  return (
    <div>
      <h3 className='text-sm font-semibold text-gray-700 mb-3'>Attachments</h3>
      <label
        htmlFor='attachments-input'
        className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50 block'
      >
        <input
          type='file'
          multiple
          accept='*/*'
          onChange={handleLocalAttachmentChange}
          className='hidden'
          id='attachments-input'
          disabled={fieldDisabled.attachments}
        />
        <p className='text-sm text-gray-600 flex items-center justify-center gap-2'>
          <PaperclipIcon className='w-3 h-3 text-gray-600' /> Click to upload
          attachments
        </p>
      </label>
      {errorMessage && (
        <div className='text-red-500 text-xs mt-2 text-center'>
          {errorMessage}
        </div>
      )}

      {/* Existing attachments from response */}
      {taskAttachments && taskAttachments.length > 0 && (
        <div className='mt-4'>
          <div className='space-y-2'>
            {taskAttachments.map((attachment) => (
              <div
                key={attachment.id || attachment.rid}
                className='text-xs text-gray-600 bg-blue-50 p-3 rounded flex items-center gap-2 border border-blue-200'
              >
                <PaperclipIcon className='w-3 h-3 text-gray-600 flex-shrink-0' />
                <div className='flex-1 min-w-0'>
                  <a
                    href={attachment.filePath}
                    onClick={(e) =>
                      handleDownload(
                        e,
                        attachment.filePath || '',
                        attachment.fileName
                      )
                    }
                    className='font-medium text-blue-600 hover:underline block truncate'
                    title={attachment.fileName}
                  >
                    {attachment.fileName}
                  </a>
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
              <PaperclipIcon className='w-3 h-3 text-gray-600 flex-shrink-0' />
              <span className='flex-1 truncate' title={file}>
                {file}
              </span>
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
