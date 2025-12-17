import React from 'react';
import { AttachmentsSideIcon, CloseCircleIcon } from '../../assets';

interface ExistingFile {
  name: string;
  url?: string;
  size?: string;
  format?: string;
}

interface FileListProps {
  selectedFiles: File[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  setSelectedFiles: (files: File[]) => void;
  existingFiles?: ExistingFile[];
  onRemoveExistingFile?: (index: number) => void;
  disabled?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  selectedFiles,
  existingFiles = [],
  fileInputRef,
  setSelectedFiles,
  onRemoveExistingFile,
  disabled,
}) => {
  const hasFiles = selectedFiles.length > 0 || existingFiles.length > 0;

  if (!hasFiles) return null;

  return (
    <div className='w-[502px] max-w-[502px] space-y-2'>
      <div className='text-sm font-medium text-[#2D3E4F] mb-2'>
        Selected File:
      </div>

      {/* Existing uploaded files */}
      {existingFiles.map((file, index) => (
        <div
          key={`existing-${index}`}
          className='flex items-center justify-between bg-white border border-[#CBD6E2] rounded-md px-3 py-1 shadow-sm'
          style={{
            opacity: disabled ? '0.7' : '1',
            pointerEvents: disabled ? 'none' : 'all',
          }}
        >
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <React.Suspense fallback={null}>
              <AttachmentsSideIcon className='w-[14px] h-[14px]' />
            </React.Suspense>
            <span
              className='text-sm text-[#2D3E4F] truncate'
              title={`${file.name}${file.format ? ` ${file.format}` : ''}`}
            >
              {`${file.name}${file.format ? ` ${file.format}` : ''}`}
            </span>
            <span className='text-xs text-[#6B7280] flex-shrink-0'>
              {`(${file.size})`}
            </span>
          </div>

          {onRemoveExistingFile && (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                onRemoveExistingFile(index);
              }}
              className='ml-2 p-1 cursor-pointer'
              title='Remove file'
            >
              <React.Suspense fallback={null}>
                <CloseCircleIcon
                  alt='close-icon'
                  className='hover:[&>path]:stroke-[#F16137] hover:[&>rect]:fill-[#ffede7]'
                />
              </React.Suspense>
            </button>
          )}
        </div>
      ))}

      {/* Newly selected files */}
      {selectedFiles.map((file, index) => (
        <div
          key={index}
          className='flex items-center justify-between bg-white border border-[#CBD6E2] rounded-md px-3 py-1 shadow-sm'
          style={{
            opacity: disabled ? '0.7' : '1',
            pointerEvents: disabled ? 'none' : 'all',
          }}
        >
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <AttachmentsSideIcon className='w-[14px] h-[14px]' />
            <span className='text-sm text-[#2D3E4F] truncate' title={file.name}>
              {file.name}
            </span>
            <span className='text-xs text-[#6B7280] flex-shrink-0'>
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              const newFiles = selectedFiles.filter((_, i) => i !== index);
              setSelectedFiles(newFiles);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className='ml-2 p-1 cursor-pointer'
            title='Remove file'
          >
            <CloseCircleIcon
              alt='close-icon'
              className='hover:[&>path]:stroke-[#F16137] hover:[&>rect]:fill-[#ffede7]'
            />
          </button>
        </div>
      ))}
    </div>
  );
};
