import { useState, useRef, type KeyboardEvent } from 'react';
import { Select, MenuItem } from '@mui/material';
import TextButton from '../button/text-button';

interface Template {
  id: string;
  name: string;
  content?: string;
}

interface UserData {
  toOptions?: string[];
  ccOptions?: string[];
  bccOptions?: string[];
}

interface EmailModalData {
  userName: string;
  userEmail: string;
  templates: Template[];
}

interface EmailModalProps {
  onClose: () => void;
  data: EmailModalData;
  userData?: UserData;
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

const PaperclipIcon = () => (
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
  const [fontSize, setFontSize] = useState('14px'); // Default to Normal
  const [fontFamily, setFontFamily] = useState('Arial'); // Default to Arial

  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [showCcSuggestions, setShowCcSuggestions] = useState(false);
  const [showBccSuggestions, setShowBccSuggestions] = useState(false);

  const textareaRef = useRef<HTMLDivElement>(null);

  const handleTemplateSelect = (value: string) => {
    setSelectedTemplate(value);
    if (value) {
      const selected = data.templates.find((t) => t.id === value);
      if (selected?.content) {
        setContent(selected.content);
        if (textareaRef.current) {
          textareaRef.current.innerHTML = selected.content;
        }
      }
    }
  };

  const addRecipient = (field: 'to' | 'cc' | 'bcc', email: string) => {
    if (!email.trim()) return;

    if (field === 'to' && !to.includes(email)) {
      setTo([...to, email]);
      setToInput('');
      setShowToSuggestions(false);
    } else if (field === 'cc' && !cc.includes(email)) {
      setCc([...cc, email]);
      setCcInput('');
      setShowCcSuggestions(false);
    } else if (field === 'bcc' && !bcc.includes(email)) {
      setBcc([...bcc, email]);
      setBccInput('');
      setShowBccSuggestions(false);
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

  const getFilteredSuggestions = (input: string, options?: string[]) => {
    if (!options || !input) return [];
    return options.filter((option) =>
      option.toLowerCase().includes(input.toLowerCase())
    );
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    textareaRef.current?.focus();
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      style={{ paddingLeft: '200px' }}
    >
      <div className='bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[73vh] flex flex-col'>
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
                {data.userName}
              </span>
              <span className='text-gray-500' style={{ fontSize: '12px' }}>
                {data.userEmail}
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
                To
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
                      setShowToSuggestions(true);
                    }}
                    onKeyDown={(e) => handleKeyDown('to', e, toInput)}
                    onBlur={() =>
                      setTimeout(() => setShowToSuggestions(false), 200)
                    }
                    className='w-full outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent'
                    placeholder={to.length === 0 ? 'recipient@example.com' : ''}
                  />
                  {showToSuggestions && toInput && (
                    <div className='absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto z-10'>
                      {getFilteredSuggestions(toInput, userData?.toOptions).map(
                        (email) => (
                          <button
                            key={email}
                            onClick={() => addRecipient('to', email)}
                            className='w-full text-left px-3 py-2 hover:bg-gray-50 text-sm'
                          >
                            {email}
                          </button>
                        )
                      )}
                    </div>
                  )}
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
                        setShowCcSuggestions(true);
                      }}
                      onKeyDown={(e) => handleKeyDown('cc', e, ccInput)}
                      onBlur={() =>
                        setTimeout(() => setShowCcSuggestions(false), 200)
                      }
                      className='w-full outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent'
                      placeholder={cc.length === 0 ? 'cc@example.com' : ''}
                    />
                    {showCcSuggestions && ccInput && (
                      <div className='absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto z-10'>
                        {getFilteredSuggestions(
                          ccInput,
                          userData?.ccOptions
                        ).map((email) => (
                          <button
                            key={email}
                            onClick={() => addRecipient('cc', email)}
                            className='w-full text-left px-3 py-2 hover:bg-gray-50 text-sm'
                          >
                            {email}
                          </button>
                        ))}
                      </div>
                    )}
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
                        setShowBccSuggestions(true);
                      }}
                      onKeyDown={(e) => handleKeyDown('bcc', e, bccInput)}
                      onBlur={() =>
                        setTimeout(() => setShowBccSuggestions(false), 200)
                      }
                      className='w-full outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent'
                      placeholder={bcc.length === 0 ? 'bcc@example.com' : ''}
                    />
                    {showBccSuggestions && bccInput && (
                      <div className='absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto z-10'>
                        {getFilteredSuggestions(
                          bccInput,
                          userData?.bccOptions
                        ).map((email) => (
                          <button
                            key={email}
                            onClick={() => addRecipient('bcc', email)}
                            className='w-full text-left px-3 py-2 hover:bg-gray-50 text-sm'
                          >
                            {email}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className='px-6 py-3 border-b border-gray-100 flex items-center hover:bg-gray-50/50 transition-colors'>
              <label className='text-gray-600 w-16 font-medium text-sm'>
                Subject
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

          <div className='px-6 py-3 border-b border-gray-200'>
            <div className='flex items-center gap-2 flex-wrap'>
              <Select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as string)}
                className='custom-select-no-arrow'
                displayEmpty
                size='small'
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
                sx={{
                  height: '32px',
                  fontSize: '13px',
                  minWidth: '80px',
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
                    color: 'black',
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
              >
                <MenuItem
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  value='Arial'
                >
                  Arial
                </MenuItem>
                <MenuItem
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  value='Times New Roman'
                >
                  Times
                </MenuItem>
                <MenuItem
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  value='Courier New'
                >
                  Courier
                </MenuItem>
              </Select>

              <Select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as string)}
                className='custom-select-no-arrow'
                displayEmpty
                size='small'
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
                sx={{
                  height: '32px',
                  fontSize: '13px',
                  minWidth: '70px',
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
                    color: 'black',
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
              >
                <MenuItem
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  value='12px'
                >
                  Small
                </MenuItem>
                <MenuItem
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  value='14px'
                >
                  Normal
                </MenuItem>
                <MenuItem
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  value='16px'
                >
                  Large
                </MenuItem>
              </Select>

              <button
                onClick={() => execCommand('bold')}
                className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 bg-white'
              >
                <svg
                  className='w-3.5 h-3.5 text-gray-700'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z'
                  />
                </svg>
              </button>
              <button
                onClick={() => execCommand('italic')}
                className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 bg-white'
              >
                <svg
                  className='w-3.5 h-3.5 text-gray-700'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 4h-9m4 16H5m4-8h6'
                  />
                </svg>
              </button>
              <button
                onClick={() => execCommand('underline')}
                className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 bg-white'
              >
                <svg
                  className='w-3.5 h-3.5 text-gray-700'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 19h12M8 5v8a4 4 0 008 0V5'
                  />
                </svg>
              </button>
              <button
                onClick={() => execCommand('strikeThrough')}
                className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 bg-white'
              >
                <svg
                  className='w-3.5 h-3.5 text-gray-700'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 12h12M8 5c2-1 6-1 8 0 0 2-2 3-4 3H8zm0 7c2 1 6 1 8 0 0 2-2 3-4 3H8z'
                  />
                </svg>
              </button>

              <button
                onClick={() => execCommand('insertUnorderedList')}
                className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 bg-white'
              >
                <svg
                  className='w-3.5 h-3.5 text-gray-700'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <line
                    x1='8'
                    y1='6'
                    x2='21'
                    y2='6'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <line
                    x1='8'
                    y1='12'
                    x2='21'
                    y2='12'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <line
                    x1='8'
                    y1='18'
                    x2='21'
                    y2='18'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <circle cx='4' cy='6' r='1' fill='currentColor' />
                  <circle cx='4' cy='12' r='1' fill='currentColor' />
                  <circle cx='4' cy='18' r='1' fill='currentColor' />
                </svg>
              </button>
              <button
                onClick={() => execCommand('insertOrderedList')}
                className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 bg-white'
              >
                <svg
                  className='w-3.5 h-3.5 text-gray-700'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <line
                    x1='10'
                    y1='6'
                    x2='21'
                    y2='6'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <line
                    x1='10'
                    y1='12'
                    x2='21'
                    y2='12'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <line
                    x1='10'
                    y1='18'
                    x2='21'
                    y2='18'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <text x='3' y='8' fontSize='10' fill='currentColor'>
                    1.
                  </text>
                  <text x='3' y='14' fontSize='10' fill='currentColor'>
                    2.
                  </text>
                  <text x='3' y='20' fontSize='10' fill='currentColor'>
                    3.
                  </text>
                </svg>
              </button>

              <button
                onClick={() => execCommand('justifyLeft')}
                className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 bg-white'
              >
                <svg
                  className='w-3.5 h-3.5 text-gray-700'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <line
                    x1='3'
                    y1='6'
                    x2='21'
                    y2='6'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <line
                    x1='3'
                    y1='12'
                    x2='15'
                    y2='12'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <line
                    x1='3'
                    y1='18'
                    x2='18'
                    y2='18'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                </svg>
              </button>
              <button
                onClick={() => execCommand('justifyCenter')}
                className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 bg-white'
              >
                <svg
                  className='w-3.5 h-3.5 text-gray-700'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <line
                    x1='3'
                    y1='6'
                    x2='21'
                    y2='6'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <line
                    x1='6'
                    y1='12'
                    x2='18'
                    y2='12'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <line
                    x1='3'
                    y1='18'
                    x2='21'
                    y2='18'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                </svg>
              </button>
              <button
                onClick={() => execCommand('justifyRight')}
                className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 bg-white'
              >
                <svg
                  className='w-3.5 h-3.5 text-gray-700'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <line
                    x1='3'
                    y1='6'
                    x2='21'
                    y2='6'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <line
                    x1='9'
                    y1='12'
                    x2='21'
                    y2='12'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <line
                    x1='6'
                    y1='18'
                    x2='21'
                    y2='18'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content textarea */}
          <div className='px-6 py-4 flex-1'>
            <div
              className='w-full min-h-[300px] outline-none border border-gray-200 rounded p-3 bg-white'
              contentEditable
              ref={textareaRef}
              onInput={(e) => setContent(e.currentTarget.innerHTML)}
              suppressContentEditableWarning
              style={{
                fontSize,
                fontFamily,
                lineHeight: '1.6',
              }}
            >
              {!content && (
                <div className='text-gray-400 pointer-events-none'></div>
              )}
            </div>
          </div>
        </div>

        <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between'>
          <TextButton
            onClick={() => console.log('Attachment clicked')}
            sx={{
              padding: '6px 12px',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              border: '1px solid #CBD6E2',
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: '400',
              color: '#425A76',
              minWidth: 'auto',
              height: '32px',
              '&:hover': {
                background: 'linear-gradient(180deg, #F5F5F5 0%, #E0E0E0 100%)',
              },
            }}
          >
            <PaperclipIcon />
            <span className='ml-1'>Attach</span>
          </TextButton>
          <TextButton
            onClick={() => console.log('Send clicked')}
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
                background: 'linear-gradient(180deg, #F5F5F5 0%, #E0E0E0 100%)',
              },
            }}
          >
            Send
          </TextButton>
        </div>
      </div>
    </div>
  );
}
