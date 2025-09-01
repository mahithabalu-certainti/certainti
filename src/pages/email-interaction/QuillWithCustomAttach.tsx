import React, { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';

interface QuillWithCustomAttachProps {
  value: string;
  onChange: (value: string) => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  quillId: string;
}

const QuillWithCustomAttach: React.FC<QuillWithCustomAttachProps> = ({
  value,
  onChange,
  fileInputRef,
  onFileChange,
  quillId,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      fileInputRef(inputRef.current);
    }
  }, [fileInputRef]);

  useEffect(() => {
    // Wait for Quill to render toolbar
    setTimeout(() => {
      const toolbar = document.querySelector(
        `#${quillId} .ql-toolbar .ql-attach`
      );
      if (toolbar && !toolbar.querySelector('.custom-attach-icon')) {
        toolbar.innerHTML = '';
        const icon = document.createElement('span');
        icon.className = 'custom-attach-icon';
        icon.style.display = 'inline-flex';
        icon.style.alignItems = 'center';
        icon.style.justifyContent = 'center';
        icon.innerHTML = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 13V7a5 5 0 0 0-10 0v8a5 5 0 0 0 10 0V9" stroke="#425A76" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        toolbar.appendChild(icon);
      }
    }, 0);
  }, [quillId, value]);

  return (
    <div id={quillId} className='relative'>
      <ReactQuill
        value={value}
        onChange={onChange}
        theme='snow'
        className='rounded-[2px] bg-white'
        modules={{
          toolbar: {
            container: [
              [{ header: [1, 2, 3, 4, 5, 6, false] }],
              [{ font: [] }],
              [{ size: [] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ color: [] }, { background: [] }],
              [{ script: 'sub' }, { script: 'super' }],
              ['blockquote'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ indent: '-1' }, { indent: '+1' }],
              [{ direction: 'rtl' }],
              [{ align: [] }],
              // ['image', 'video'],
              ['clean'],
              [{ attach: true }],
            ],
            handlers: {
              attach: () => {
                if (inputRef.current) {
                  inputRef.current.click();
                }
              },
            },
          },
        }}
        formats={[
          'header',
          'font',
          'size',
          'bold',
          'italic',
          'underline',
          'strike',
          'color',
          'background',
          'script',
          'blockquote',
          // 'code-block',
          'list',
          'bullet',
          'indent',
          'direction',
          'align',
          // 'link',
          // 'image',
          // 'video',
          'clean',
          'attach',
        ]}
      />
      <input
        ref={inputRef}
        type='file'
        className='hidden'
        onChange={onFileChange}
      />
    </div>
  );
};

export default QuillWithCustomAttach;
