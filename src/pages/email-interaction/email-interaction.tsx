import React, { useState, useEffect } from 'react';
import { certaintiLogo } from '../../assets/images';
import InteractionQuestions from './interaction-qustions';
import { SxProps } from '@mui/material';
import { Theme } from '@emotion/react';
import TextButton from '../../components/button/text-button';
import { DownloadIcon, PdfIcon } from '../../assets';

interface SectionHeaderButton {
  label: string;
  variant: 'text' | 'outlined' | 'contained';
  onClick?: () => void;
  sx?: SxProps<Theme>;
  hide?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const questions = [
  {
    question_id: 'Q001',
    rid: 'a1b2c3d4e5-0001',
    question:
      'What advancement in technology is being sought, what were the problems or challenges that you could not solve using commonly available tools and or resource experience that required you to seek an advance in the underlying technology to achieve the objective, or what was the new scientific knowledge sought in your work?',
    answer:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    response_received_on: '2024-04-28',
    notes:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Soluta, doloremque. Vero, nam hic. Soluta culpa possimus similique impedit a eos.',
    mandatory: true,
    attachments: [
      {
        file_id: 'f001',
        file_name: 'status_report.pdf',
        file_url: 'https://example.com/files/status_report.pdf',
      },
      {
        file_id: 'f002',
        file_name: 'summary.docx',
        file_url: 'https://example.com/files/summary.docx',
      },
    ],
  },
  {
    question_id: 'Q002',
    rid: 'a1b2c3d4e5-0002',
    question: 'What is the project status?',
    answer: '',
    response_received_on: '2024-04-28',
    notes:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Soluta, doloremque. Vero, nam hic. Soluta culpa possimus similique impedit a eos.',
    mandatory: false,
    attachments: [],
  },
  {
    question_id: 'Q003',
    rid: 'a1b2c3d4e5-0003',
    question:
      'Referring to the description of technical uncertainty above, what were the primary unsolved technical uncertainties at the outset of the project. Please include metrics if possible, for example, as relates to requirements for accuracy, performance, scalability, low latency, supportability, code maintainability, etc. ',
    answer: '',
    response_received_on: '2024-04-28',
    notes:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Soluta, doloremque. Vero, nam hic. Soluta culpa possimus similique impedit a eos.',
    mandatory: false,
    attachments: [],
  },
  {
    question_id: 'Q004',
    rid: 'a1b2c3d4e5-0004',
    question:
      'Referring to the description of a process of experimentation above, what type of technical improvements (successful or not) were made to try to meet stated requirements?',
    answer: '',
    response_received_on: '2024-04-28',
    notes:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Soluta, doloremque. Vero, nam hic. Soluta culpa possimus similique impedit a eos.',
    mandatory: false,
    attachments: [],
  },
  {
    question_id: 'Q005',
    rid: 'a1b2c3d4e5-0005',
    question:
      'How the process or tasks were performed prior to the new solution. ',
    answer: '',
    response_received_on: '2024-04-28',
    notes:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Soluta, doloremque. Vero, nam hic. Soluta culpa possimus similique impedit a eos.',
    mandatory: false,
    attachments: [],
  },
];

const EmailInteraction: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [timer, setTimer] = useState(10);
  const [isAuthentic, setIsAuthentic] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(true);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input if value entered
      if (value && index < 3) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const buttons: SectionHeaderButton[] = [
    {
      label: 'Save as Draft',
      variant: 'contained' as const,
      sx: { p: 1 },
      onClick: () => setIsEditing(false),
    },
    {
      label: 'Save & Submit',
      variant: 'contained' as const,
      sx: { p: 1 },
      onClick: () => setIsEditing(false),
    },
    {
      label: 'Upload File',
      variant: 'outlined' as const,
      sx: { p: 1 },
    },
  ];

  return (
    <div className={isAuthentic ? '' : 'bg-[#f4f4f4]'}>
      <header className='w-full flex items-center px-10 py-4 bg-[#2D3E4F] shadow-sm'>
        <img src={certaintiLogo} alt='Logo' className='h-[16px]' />
      </header>
      {isAuthentic ? (
        <div className='px-10 py-4'>
          <div className='flex justify-between py-2'>
            <span className='text-[14px] text-[#2D3E4F] font-bold'>
              Hello James
            </span>
            <div className='flex gap-2'>
              {buttons.map((button, index) => (
                <TextButton
                  key={`section-header-btn-${index}`}
                  label={button.label}
                  onClick={button.onClick}
                  loading={button.loading}
                  aria-label={button.label}
                  sx={button.sx}
                  disabled={button.disabled}
                />
              ))}
            </div>
          </div>

          <div className='my-3 border border-[#CBD6E2] rounded-[2px] p-2'>
            <div className='text-[14px] text-[#2D3E4F] font-bold mb-2'>
              Uploaded Files
            </div>
            {questions[0].attachments.map((file, index) => (
              <div
                key={index}
                className='flex items-center justify-between border border-[#CBD6E2] bg-[#FFFBFA] rounded-[2px] p-2 px-3 mb-[-1px]'
              >
                <div className='flex items-center gap-2'>
                  <PdfIcon />
                  <div className='text-[14px] text-[#425A76] font-normal'>
                    {file.file_name}
                  </div>
                </div>
                <a
                  href={file.file_url}
                  download
                  style={{
                    boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
                    background:
                      'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
                  }}
                  className='p-1 border border-[#CBD6E2] rounded-[2px]'
                >
                  <DownloadIcon />
                </a>
              </div>
            ))}
          </div>

          <InteractionQuestions questions={questions} isEditing={isEditing} />
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center min-h-[calc(100vh-48px)]'>
          {/* Card */}
          <div className='bg-white p-8 rounded-2xl shadow-lg w-full max-w-md'>
            <h2 className='text-2xl font-bold text-[#2F4357] mb-2'>
              OTP verification
            </h2>
            <p className='text-gray-500 text-sm mb-6'>
              Please enter the OTP(One-Time Password) sent to your registered
              email/phone number to complete your verification
            </p>

            {/* OTP Input Fields */}
            <div className='flex gap-3 justify-center mb-4'>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type='text'
                  value={digit}
                  maxLength={1}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  className='w-12 h-12 border border-gray-300 rounded-md text-center text-lg focus:outline-none focus:ring-2 focus:ring-[#F16137]'
                />
              ))}
            </div>

            {/* Timer & Resend */}
            <div className='flex justify-between text-sm mb-6'>
              <span>
                Remaining time :{' '}
                <span className='text-red-500 font-medium'>
                  00:{timer.toString().padStart(2, '0')}s
                </span>
              </span>
              <span>
                Didn’t get the code?{' '}
                <button
                  className='text-[#F16137] hover:underline cursor-pointer'
                  onClick={() => setTimer(10)}
                >
                  Resend
                </button>
              </span>
            </div>

            {/* Buttons */}
            <button
              className='w-full bg-[#F16137] text-white py-2 rounded-sm hover:bg-[#e4572e] transition cursor-pointer'
              onClick={() => setIsAuthentic(true)}
            >
              Verify
            </button>
            <button className='w-full mt-3 border border-[#F16137] text-[#F16137] py-2 rounded-sm hover:bg-orange-50 transition cursor-pointer'>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailInteraction;
