import React, { useCallback, useRef, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import TextButton from '../button/text-button';
import { MenuItem, Select } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { CloseIcon, DocumentIcon } from '../../assets';

// Mock data
const templates = [
  {
    id: '1',
    subject: 'Greetings',
    name: 'Welcome Email Template',
    content: 'Dear recipient,<br><br>Welcome to our platform!',
  },
  {
    id: '2',
    subject: 'Follow up',
    name: 'Follow-up Template',
    content: 'Hi there,<br><br>Just following up on our previous conversation.',
  },
  {
    id: '3',
    subject: 'Meeting Scheduled',
    name: 'Meeting Invitation',
    content: 'Hello,<br><br>I would like to invite you to a meeting.',
  },
];

interface EmailRecipients {
  to: string[];
  cc: string[];
  bcc: string[];
}

interface Attachment {
  id: string;
  file: File;
  name: string;
  size: string;
}

interface DraftEmailModalProps {
  onCloseModal: () => void;
}

const icons = Quill.import('ui/icons');

icons['attachment'] = `
  <svg 
    class="ql-stroke" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="1.5" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  >
    <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
`;

const DraftEmailModal: React.FC<DraftEmailModalProps> = ({ onCloseModal }) => {
  const { email: userEmail, name: userName } = useSelector(
    (state: RootState) => state.auth
  );

  const [recipients, setRecipients] = useState<EmailRecipients>({
    to: [],
    cc: [],
    bcc: [],
  });
  const [recipientInputs, setRecipientInputs] = useState({
    to: '',
    cc: '',
    bcc: '',
  });
  const [showFields, setShowFields] = useState({ cc: false, bcc: false });
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const quillRef = useRef<ReactQuill>(null);

  // Attachment handler
  const handleAttachment = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.multiple = true;
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
      }
    };
  }, []);

  // Quill modules configuration
  const modules = {
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
      handlers: { attachment: handleAttachment },
    },
  };

  const formats = [
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
  ];

  // Template selection
  const handleTemplateSelect = (value: string) => {
    setSelectedTemplate(value);
    if (value) {
      const template = templates.find((t) => t.id === value);
      if (template) {
        setSubject(template.subject);
        setContent(template.content);
      }
    }
  };

  // Recipient management
  const addRecipient = (field: keyof EmailRecipients, email: string) => {
    if (!email.trim()) return;

    setRecipients((prev) => ({
      ...prev,
      [field]: [...prev[field], email],
    }));

    setRecipientInputs((prev) => ({ ...prev, [field]: '' }));
  };

  const removeRecipient = (field: keyof EmailRecipients, email: string) => {
    setRecipients((prev) => ({
      ...prev,
      [field]: prev[field].filter((e) => e !== email),
    }));
  };

  const handleKeyDown = (
    field: keyof EmailRecipients,
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string
  ) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      addRecipient(field, input);
    } else if (
      e.key === 'Backspace' &&
      !input &&
      recipients[field].length > 0
    ) {
      removeRecipient(field, recipients[field][recipients[field].length - 1]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const toggleField = (field: 'cc' | 'bcc') => {
    setShowFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    console.log('Send clicked', { attachments });
    onCloseModal();
  };

  // Render recipient input field
  const renderRecipientField = (
    field: keyof EmailRecipients,
    label: string
  ) => (
    <div className='px-6 py-3 border-b border-[#CBD6E2] flex items-center hover:bg-gray-50/50 transition-colors'>
      <label className='text-gray-600 w-16 font-medium text-sm'>{label}</label>
      <div className='flex-1 flex flex-wrap gap-1 items-center'>
        {recipients[field].map((email) => (
          <span
            key={email}
            className='inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm'
          >
            {email}
            <button
              onClick={() => removeRecipient(field, email)}
              className='hover:text-blue-900'
            >
              ×
            </button>
          </span>
        ))}
        <div className='relative flex-1 min-w-[200px]'>
          <input
            type='text'
            value={recipientInputs[field]}
            onChange={(e) =>
              setRecipientInputs((prev) => ({
                ...prev,
                [field]: e.target.value,
              }))
            }
            onKeyDown={(e) => handleKeyDown(field, e, recipientInputs[field])}
            className='w-full outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent'
            placeholder={
              recipients[field].length === 0 ? `${field}@example.com` : ''
            }
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className='flex flex-col justify-between'>
      <div className='min-h-[450px] max-h-[450px] overflow-y-auto'>
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center'>
              <div className='w-6 h-6 rounded-full bg-gray-400'></div>
            </div>
            <div className='flex flex-col'>
              <span className='text-gray-700 font-medium text-sm'>
                {userName}
              </span>
              <span className='text-gray-500 text-xs'>{userEmail}</span>
            </div>
          </div>

          <Select
            value={selectedTemplate}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className={`custom-select-no-arrow w-full h-full text-sm px-1.5 py-[7px] ${
              selectedTemplate === '' ? 'text-[#7D98B6]' : ''
            }`}
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
                '&.Mui-focused': { boxShadow: 'none' },
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
              '& svg': { color: '#7D98B6' },
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
              sx={{ color: '#7D98B6', fontSize: '13px', fontWeight: '500' }}
            >
              Insert Template
            </MenuItem>
            {templates.map((template) => (
              <MenuItem
                key={template.id}
                value={template.id}
                sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
              >
                {template.name}
              </MenuItem>
            ))}
          </Select>
        </div>

        {/* Recipient Fields */}
        <div>
          {/* To Field */}
          <div className='px-6 py-3 border-b border-[#CBD6E2] flex items-center hover:bg-gray-50/50 transition-colors'>
            <label className='text-gray-600 w-16 font-medium text-sm'>
              To :
            </label>
            <div className='flex-1 flex flex-wrap gap-1 items-center'>
              {recipients.to.map((email) => (
                <span
                  key={email}
                  className='inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm'
                >
                  {email}
                  <button
                    onClick={() => removeRecipient('to', email)}
                    className='hover:text-blue-900 cursor-pointer'
                  >
                    <CloseIcon />
                  </button>
                </span>
              ))}
              <div className='relative flex-1 min-w-[200px]'>
                <input
                  type='text'
                  value={recipientInputs.to}
                  onChange={(e) =>
                    setRecipientInputs((prev) => ({
                      ...prev,
                      to: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => handleKeyDown('to', e, recipientInputs.to)}
                  className='w-full outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent'
                  placeholder={
                    recipients.to.length === 0 ? 'recipient@example.com' : ''
                  }
                />
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <button
                onClick={() => toggleField('bcc')}
                className='text-blue-600 hover:text-blue-700 text-sm font-medium hover:font-semibold cursor-pointer transition-colors'
              >
                Bcc
              </button>
              <button
                onClick={() => toggleField('cc')}
                className='text-blue-600 hover:text-blue-700 text-sm font-medium hover:font-semibold cursor-pointer transition-colors'
              >
                Cc
              </button>
            </div>
          </div>

          {/* Conditional Fields */}
          {showFields.cc && renderRecipientField('cc', 'Cc')}
          {showFields.bcc && renderRecipientField('bcc', 'Bcc')}

          {/* Subject Field */}
          <div className='px-6 py-3 border-b border-[#CBD6E2] flex items-center hover:bg-gray-50/50 transition-colors'>
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

        {/* Editor */}
        <div className='draft-email-body-editor'>
          <ReactQuill
            ref={quillRef}
            theme='snow'
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            style={{ fontSize: '13px', border: 'none' }}
            placeholder=''
            preserveWhitespace={true}
          />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className='p-6 border-t border-[#CBD6E2]'>
            <div className='flex items-center gap-2 mb-2'>
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
                    <DocumentIcon className='w-6 h-6' />
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
                    className='p-2 hover:bg-gray-200 rounded-full cursor-pointer transition-colors'
                  >
                    <CloseIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Footer */}
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
                {attachments.length} file{attachments.length !== 1 ? 's' : ''}{' '}
                attached
              </span>
            </div>
          )}
        </div>
        <div className='flex justify-end gap-3'>
          <TextButton
            label='Cancel'
            onClick={onCloseModal}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Save'
            onClick={handleSave}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DraftEmailModal;
