import { useState, useRef, useMemo, type KeyboardEvent } from 'react';
import { Select, MenuItem } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import TextButton from '../button/text-button';

interface Template {
  id: string;
  name: string;
  subject: string;
  content?: string;
}

interface EmailModalData {
  templates: Template[];
}

interface UserData {
  name: string;
  email: string;
}

interface EmailModalProps {
  onClose: () => void;
  data: EmailModalData;
  userData: UserData;
}

interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: string;
}

const MailIcon = () => (
  <svg
    className='w-4 h-4 text-white'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    />
  </svg>
);

const XIcon = () => (
  <svg
    className='w-4 h-4 text-gray-600'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M6 18L18 6M6 6l12 12'
    />
  </svg>
);

export default function EmailModal({
  onClose,
  data,
  userData,
}: EmailModalProps) {
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showBcc, setShowBcc] = useState(false);
  const [showCc, setShowCc] = useState(false);

  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');

  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const quillRef = useRef<ReactQuill>(null);

  const attachmentHandler = useMemo(() => {
    return () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', '*/*');
      input.setAttribute('multiple', 'true');
      input.click();

      input.onchange = () => {
        const files = Array.from(input.files || []);
        if (files.length > 0) {
          const newAttachments = files.map((file) => ({
            id: Date.now() + Math.random().toString(36),
            file,
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
          }));

          setAttachments((prev) => [...prev, ...newAttachments]);
          console.log('Files attached:', files);
        }
      };
    };
  }, []);

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, false] }],
          [{ font: [] }],
          [{ size: ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link', 'image'],
          ['attachment'],
          ['clean'],
        ],
        handlers: {
          attachment: attachmentHandler,
        },
      },
    }),
    [attachmentHandler]
  );

  const formats = useMemo(
    () => [
      'header',
      'font',
      'size',
      'bold',
      'italic',
      'underline',
      'strike',
      'color',
      'background',
      'list',
      'bullet',
      'align',
      'link',
      'image',
    ],
    []
  );

  const handleTemplateSelect = (value: string) => {
    setSelectedTemplate(value);
    if (value) {
      const selected = data.templates.find((t) => t.id === value);
      if (selected?.content) {
        setSubject(selected?.subject);
        setContent(selected.content);
      }
    }
  };

  const addRecipient = (field: 'to' | 'cc' | 'bcc', email: string) => {
    if (!email.trim()) return;

    if (field === 'to' && !to.includes(email)) {
      setTo([...to, email]);
      setToInput('');
    } else if (field === 'cc' && !cc.includes(email)) {
      setCc([...cc, email]);
      setCcInput('');
    } else if (field === 'bcc' && !bcc.includes(email)) {
      setBcc([...bcc, email]);
      setBccInput('');
    }
  };

  const removeRecipient = (field: 'to' | 'cc' | 'bcc', email: string) => {
    if (field === 'to') {
      setTo(to.filter((e) => e !== email));
    } else if (field === 'cc') {
      setCc(cc.filter((e) => e !== email));
    } else if (field === 'bcc') {
      setBcc(bcc.filter((e) => e !== email));
    }
  };

  const handleKeyDown = (
    field: 'to' | 'cc' | 'bcc',
    e: KeyboardEvent<HTMLInputElement>,
    input: string
  ) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      addRecipient(field, input);
    } else if (e.key === 'Backspace' && !input) {
      if (field === 'to' && to.length > 0) {
        removeRecipient('to', to[to.length - 1]);
      } else if (field === 'cc' && cc.length > 0) {
        removeRecipient('cc', cc[cc.length - 1]);
      } else if (field === 'bcc' && bcc.length > 0) {
        removeRecipient('bcc', bcc[bcc.length - 1]);
      }
    }
  };

  return (
    <>
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
        style={{ paddingLeft: '200px' }}
      >
        <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[73vh] flex flex-col'>
          <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
            <div className='flex items-center gap-3'>
              <div className='bg-pink-400 p-2 rounded'>
                <MailIcon />
              </div>
              <h2
                className='text-lg font-semibold text-gray-800'
                style={{ fontSize: '16px' }}
              >
                Compose Email
              </h2>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={onClose}
                className='p-2 hover:bg-gray-100 rounded border border-gray-300'
              >
                <XIcon />
              </button>
            </div>
          </div>

          <div className='px-6 py-4 border-b border-gray-200 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center'>
                <div className='w-6 h-6 rounded-full bg-gray-400'></div>
              </div>
              <div className='flex flex-col'>
                <span
                  className='text-gray-700 font-medium'
                  style={{ fontSize: '13px' }}
                >
                  {userData.name}
                </span>
                <span className='text-gray-500' style={{ fontSize: '12px' }}>
                  {userData.email}
                </span>
              </div>
            </div>
            <Select
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className={
                'custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px] ' +
                (selectedTemplate === '' ? 'text-[#7D98B6] ' : '')
              }
              displayEmpty
              size='small'
              sx={{
                minWidth: '180px',
                maxWidth: '180px',
                height: '32px',
                fontSize: '13px',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: '2px solid #60A5FA',
                },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused': {
                    boxShadow: 'none',
                  },
                },
                '.MuiSelect-select': {
                  padding: '6px 6px',
                  color: selectedTemplate === '' ? '#7D98B6' : 'black',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: '1px solid #CBD6E2',
                  borderRadius: '2px',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: '1px solid #CBD6E2',
                },
                '& svg': {
                  color: '#7D98B6',
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxWidth: 300,
                    maxHeight: 300,
                    marginTop: '4px',
                    boxShadow:
                      'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                    '& .MuiMenuItem-root': {
                      fontSize: '13px',
                      padding: '6px 12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  },
                },
              }}
            >
              <MenuItem
                value=''
                sx={{
                  color: '#7D98B6',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                Insert Template
              </MenuItem>
              {data.templates.map((template) => (
                <MenuItem
                  key={template.id}
                  value={template.id}
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  title={template.name}
                >
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </div>

          <div className='flex-1 overflow-y-auto'>
            <div className='space-y-0'>
              <div className='px-6 py-3 border-b border-gray-100 flex items-center hover:bg-gray-50/50 transition-colors'>
                <label className='text-gray-600 w-16 font-medium text-sm'>
                  To :
                </label>
                <div className='flex-1 flex flex-wrap gap-1 items-center'>
                  {to.map((email) => (
                    <span
                      key={email}
                      className='inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm'
                    >
                      {email}
                      <button
                        onClick={() => removeRecipient('to', email)}
                        className='hover:text-blue-900'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className='relative flex-1 min-w-[200px]'>
                    <input
                      type='text'
                      value={toInput}
                      onChange={(e) => {
                        setToInput(e.target.value);
                      }}
                      onKeyDown={(e) => handleKeyDown('to', e, toInput)}
                      onBlur={() => {}}
                      className='w-full outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent'
                      placeholder={
                        to.length === 0 ? 'recipient@example.com' : ''
                      }
                    />
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <button
                    onClick={() => setShowBcc(!showBcc)}
                    className='text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors'
                  >
                    Bcc
                  </button>
                  <button
                    onClick={() => setShowCc(!showCc)}
                    className='text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors'
                  >
                    Cc
                  </button>
                </div>
              </div>

              {showCc && (
                <div className='px-6 py-3 border-b border-gray-100 flex items-center hover:bg-gray-50/50 transition-colors'>
                  <label className='text-gray-600 w-16 font-medium text-sm'>
                    Cc
                  </label>
                  <div className='flex-1 flex flex-wrap gap-1 items-center'>
                    {cc.map((email) => (
                      <span
                        key={email}
                        className='inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm'
                      >
                        {email}
                        <button
                          onClick={() => removeRecipient('cc', email)}
                          className='hover:text-blue-900'
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <div className='relative flex-1 min-w-[200px]'>
                      <input
                        type='text'
                        value={ccInput}
                        onChange={(e) => {
                          setCcInput(e.target.value);
                        }}
                        onKeyDown={(e) => handleKeyDown('cc', e, ccInput)}
                        onBlur={() => {}}
                        className='w-full outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent'
                        placeholder={cc.length === 0 ? 'cc@example.com' : ''}
                      />
                    </div>
                  </div>
                </div>
              )}

              {showBcc && (
                <div className='px-6 py-3 border-b border-gray-100 flex items-center hover:bg-gray-50/50 transition-colors'>
                  <label className='text-gray-600 w-16 font-medium text-sm'>
                    Bcc
                  </label>
                  <div className='flex-1 flex flex-wrap gap-1 items-center'>
                    {bcc.map((email) => (
                      <span
                        key={email}
                        className='inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm'
                      >
                        {email}
                        <button
                          onClick={() => removeRecipient('bcc', email)}
                          className='hover:text-blue-900'
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <div className='relative flex-1 min-w-[200px]'>
                      <input
                        type='text'
                        value={bccInput}
                        onChange={(e) => {
                          setBccInput(e.target.value);
                        }}
                        onKeyDown={(e) => handleKeyDown('bcc', e, bccInput)}
                        onBlur={() => {}}
                        className='w-full outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent'
                        placeholder={bcc.length === 0 ? 'bcc@example.com' : ''}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className='px-6 py-3 border-b border-gray-100 flex items-center hover:bg-gray-50/50 transition-colors'>
                <label className='text-gray-600 w-16 font-medium text-sm'>
                  Subject :
                </label>
                <input
                  type='text'
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className='flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent'
                  placeholder='Enter email subject'
                />
              </div>
            </div>

            <div className='px-2 flex-1'>
              <div style={{ height: '280px' }}>
                <ReactQuill
                  ref={quillRef}
                  theme='snow'
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  formats={formats}
                  style={{
                    height: '250px',
                    fontSize: '14px',
                  }}
                  placeholder=''
                  preserveWhitespace={true}
                />
              </div>
            </div>

            {/* Attachments Section - Reduced spacing */}
            {attachments.length > 0 && (
              <div className='px-2 pb-1'>
                <div className='flex items-center gap-2 mb-2'>
                  <svg
                    className='w-4 h-4 text-gray-500'
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
                  <span className='text-sm font-medium text-gray-700'>
                    Attachments ({attachments.length})
                  </span>
                </div>
                <div className='space-y-2'>
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className='flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md'
                    >
                      <div className='flex items-center gap-2'>
                        <svg
                          className='w-4 h-4 text-gray-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                          />
                        </svg>
                        <div className='flex flex-col'>
                          <span className='text-sm font-medium text-gray-700 truncate max-w-[300px]'>
                            {attachment.name}
                          </span>
                          <span className='text-xs text-gray-500'>
                            {attachment.size}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className='p-1 hover:bg-gray-200 rounded transition-colors'
                        title='Remove attachment'
                      >
                        <svg
                          className='w-4 h-4 text-gray-500 hover:text-red-500'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M6 18L18 6M6 6l12 12'
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {attachments.length > 0 && (
                <div className='flex items-center gap-1 text-sm text-gray-600'>
                  <svg
                    className='w-4 h-4'
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
                  <span>
                    {attachments.length} file
                    {attachments.length !== 1 ? 's' : ''} attached
                  </span>
                </div>
              )}
            </div>
            <TextButton
              onClick={() => console.log('Send clicked', { attachments })}
              sx={{
                padding: '6px 24px',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
                border: '1px solid #CBD6E2',
                borderRadius: '2px',
                fontSize: '13px',
                fontWeight: '400',
                color: '#425A76',
                minWidth: 'auto',
                height: '32px',
                '&:hover': {
                  background:
                    'linear-gradient(180deg, #F5F5F5 0%, #E0E0E0 100%)',
                },
              }}
            >
              Send
            </TextButton>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .ql-attachment {
            width: 28px;
            height: 28px;
          }
          
          .ql-attachment:before {
            content: '';
            display: inline-block;
            width: 18px;
            height: 18px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49'%3E%3C/path%3E%3C/svg%3E");
            background-size: 18px 18px;
            background-repeat: no-repeat;
            background-position: center;
          }
          
          .ql-attachment:hover:before {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2306c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49'%3E%3C/path%3E%3C/svg%3E");
          }

          .ql-container {
            height: 200px !important;
            overflow-y: auto;
          }

          .ql-editor {
            min-height: 200px !important;
            height: auto !important;
            padding: 12px 15px;
            line-height: 1.42;
            font-size: 14px;
          }

          .ql-editor:focus {
            outline: none;
          }

          .ql-editor p {
            margin: 0 0 8px 0;
          }

          .ql-toolbar .ql-attachment {
            border: none;
            background: none;
            cursor: pointer;
          }

          .ql-toolbar .ql-attachment:hover {
            background-color: #f0f0f0;
            border-radius: 2px;
          }

          .ql-toolbar {
            border-bottom: 1px solid #ccc;
            position: relative;
            z-index: 1;
          }

          .ql-container {
            border-top: none;
            position: relative;
            z-index: 1;
          }
        `,
        }}
      />
    </>
  );
}
