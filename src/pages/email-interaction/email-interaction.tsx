import React, { useState, useEffect } from 'react';
import { certaintiLogo } from '../../assets/images';
import InteractionQuestions from './interaction-qustions';
import { CircularProgress } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import {
  useGetInteractionQuestions,
  usePostGenerateOtp,
  usePostReSendOtp,
  usePostVerifyOtp,
} from '../../common-service';
import { StatusTypeEnum } from '../../consultant/types';

const EmailInteraction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [isAuthentic, setIsAuthentic] = useState(false);

  const timeout = localStorage.getItem('otp_timeout');
  const auth_token = localStorage.getItem('temAuth');
  const intractionId = localStorage.getItem('intractionId');
  const parseToken = auth_token ? JSON.parse(auth_token) : '';
  const account_rid = searchParams.get('acc');
  const interaction_rid = searchParams.get('int');
  const project_fiscal_rid = searchParams.get('proj');
  const checkEveryOtpValue = otp.every((digit) => digit !== '');

  // API Hooks
  const { mutate, isPending, data } = usePostGenerateOtp();

  const reSendOtp = usePostReSendOtp();
  const verifyOtp = usePostVerifyOtp();
  const {
    data: questions,
    isLoading,
    refetch,
  } = useGetInteractionQuestions(
    account_rid as string,
    interaction_rid as string,
    project_fiscal_rid as string,
    parseToken.auth_token as string,
    parseToken.email as string
  );
  const disableEditResBtn =
    questions?.status_name?.toLowerCase() === StatusTypeEnum.response_received;

  useEffect(() => {
    // clear old session when open new link
    if (interaction_rid && intractionId !== interaction_rid) {
      localStorage.removeItem('otp_timeout');
      localStorage.removeItem('temAuth');
      localStorage.setItem('intractionId', interaction_rid);
      setOtp(['', '', '', '', '', '']);
    }
  }, [interaction_rid, intractionId]);
  useEffect(() => {
    if (auth_token) {
      setIsAuthentic(true);
    } else {
      setIsAuthentic(false);
    }
  }, [auth_token]);
  useEffect(() => {
    if (timeout) {
      const startTime = JSON.parse(timeout);
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      const remainingTime = Math.max(600 - elapsedSeconds, 0); // 600 seconds = 10 minutes
      setTimer(remainingTime);
    } else {
      setTimer(0);
    }
  }, [timeout]);
  useEffect(() => {
    if (timer > 0 && (timeout || data)) {
      const countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => {
        clearInterval(countdown);
      };
    }
  }, [timer, timeout, data]);
  useEffect(() => {
    if (verifyOtp.data) {
      localStorage.setItem(
        'temAuth',
        JSON.stringify({
          auth_token: verifyOtp.data.data.auth_token,
          email: verifyOtp.data.data.email,
        })
      );
      setIsAuthentic(true);
    }
  }, [verifyOtp.data]);
  useEffect(() => {
    if (reSendOtp.data) {
      localStorage.setItem('otp_timeout', JSON.stringify(Date.now()));
      setTimer(600);
    }
  }, [reSendOtp.data]);

  // Auto-focus first input when timeout is set
  useEffect(() => {
    if (timeout) {
      const firstInput = document.getElementById('otp-0') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }
  }, [timeout]);

  const handleChange = (value: string, index: number) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input if value entered
      if (value && index < 6) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) (nextInput as HTMLInputElement).focus();
      }
    }
  };
  const resetTimer = () => {
    if (account_rid && interaction_rid) {
      reSendOtp.mutate({
        account_rid,
        interaction_rid,
      });
    }
  };
  const validateOtp = () => {
    verifyOtp.mutate(
      {
        account_rid: account_rid as string,
        interaction_rid: interaction_rid as string,
        otp: otp.join(''),
      },
      {
        onError: () => {
          setOtp(['', '', '', '', '', '']);
          const firstInput = document.getElementById('otp-0');
          if (firstInput) (firstInput as HTMLInputElement).focus();
        },
      }
    );
  };
  const sendOtp = () => {
    if (account_rid && interaction_rid) {
      mutate(
        {
          interaction_rid,
          account_rid,
        },
        {
          onSuccess: async () => {
            localStorage.removeItem('temAuth');
            localStorage.setItem('intractionId', interaction_rid);
            const timeNow = Date.now();
            localStorage.setItem('otp_timeout', JSON.stringify(timeNow));
            setTimer(timeNow);
          },
        }
      );
    }
  };

  const isOtpSent = Boolean(timeout);
  const headerData = {
    interactionId: questions?.r_number || '',
    projectId: questions?.project_rnumber || '',
    projectName: questions?.project_name || '',
    accountName: questions?.account_name || '',
    accountId: questions?.account_rnumber || '',
    projectCode: questions?.project_code || '',
    statusName: questions?.status_name || '',
  };

  return (
    <div className={isAuthentic ? '' : 'bg-[#f4f4f4]'}>
      <header className='w-full flex items-center px-10 py-4 bg-[#2D3E4F] shadow-sm'>
        <img src={certaintiLogo} alt='Logo' className='h-[16px]' />
      </header>
      {isLoading && (
        <div className='flex-1 flex justify-center items-center w-full min-h-[calc(100vh-48px)]'>
          <CircularProgress />
        </div>
      )}
      {(!isPending || !reSendOtp.isPending) &&
        (isAuthentic ? (
          <div className='px-10 py-4'>
            {questions?.questions && (
              <InteractionQuestions
                questions={questions?.questions}
                globalAttachments={questions?.global_attachments}
                actionButtonEnable
                refetchDeetails={refetch}
                createdBy={questions.recipient_name}
                parseToken={parseToken}
                isEditEnable={!disableEditResBtn}
                formData={{
                  account_rid: questions?.account_rid || '',
                  project_rid: questions?.project_rid || '',
                  project_fiscal_rid: questions?.project_fiscal_rid || '',
                  interaction_rid: questions?.interaction_rid || '',
                }}
                headerData={headerData}
              />
            )}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center min-h-[calc(100vh-48px)]'>
            {/* Card */}
            <div className='bg-white p-8 rounded-2xl shadow-lg w-full max-w-md'>
              <h2 className='text-2xl font-bold text-[#2F4357] mb-2'>
                OTP verification
              </h2>
              <p className='text-gray-500 text-sm mb-6'>
                {isOtpSent
                  ? 'Please enter the OTP(One-Time Password) sent to your registered email to complete your verification'
                  : 'Please click the Send OTP button to get the One Time Password (OTP) to your registered email'}
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
                    disabled={!timeout}
                    autoComplete='off'
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace') {
                        e.preventDefault();
                        const newOtp = [...otp];
                        if (digit) {
                          newOtp[idx] = '';
                          setOtp(newOtp);
                        } else if (idx > 0) {
                          const prevInput = document.getElementById(
                            `otp-${idx - 1}`
                          );
                          if (prevInput) {
                            (prevInput as HTMLInputElement).focus();
                            newOtp[idx - 1] = '';
                            setOtp(newOtp);
                          }
                        }
                      }
                      // Submit on Enter
                      if (
                        e.key === 'Enter' &&
                        checkEveryOtpValue &&
                        !verifyOtp.isPending
                      ) {
                        validateOtp();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasteData = e.clipboardData.getData('Text').trim();
                      if (/^\d+$/.test(pasteData)) {
                        const pasteArray = pasteData.split('').slice(0, 6);
                        const newOtp = [...otp];
                        pasteArray.forEach((char, i) => {
                          newOtp[i] = char;
                        });
                        setOtp(newOtp);

                        const lastIndex = pasteArray.length - 1;
                        const nextInput = document.getElementById(
                          `otp-${lastIndex}`
                        );
                        if (nextInput) {
                          (nextInput as HTMLInputElement).focus();
                        }
                      }
                    }}
                  />
                ))}
              </div>

              {/* Timer & Resend */}
              <div className='flex justify-between text-sm mb-6'>
                <span>
                  Remaining time :{' '}
                  <span className='text-red-500 font-medium'>
                    {Math.floor(timer / 60)
                      .toString()
                      .padStart(2, '0')}
                    :{(timer % 60).toString().padStart(2, '0')}m
                  </span>
                </span>
                <span>
                  Didn’t get the code?{' '}
                  <button
                    className={`text-[#F16137] hover:underline transition ${
                      timer > 0 || !timeout
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer'
                    }`}
                    onClick={resetTimer}
                    disabled={timer > 0 || !timeout}
                  >
                    Resend
                  </button>
                </span>
              </div>

              {/* Buttons */}
              {timeout ? (
                <button
                  className={`w-full h-[36px] flex items-center justify-center rounded-sm transition ${
                    checkEveryOtpValue
                      ? 'bg-[#F16137] text-white hover:bg-[#e4572e] cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={validateOtp}
                  disabled={
                    !checkEveryOtpValue ||
                    verifyOtp.isPending ||
                    reSendOtp.isPending
                  }
                >
                  {verifyOtp.isPending || reSendOtp.isPending ? (
                    <span
                      className='loader'
                      style={
                        {
                          '--c1': checkEveryOtpValue ? '#fff' : '#6b7280',
                          '--c2': checkEveryOtpValue ? '#ccc' : '#9ca3af',
                        } as React.CSSProperties
                      }
                    />
                  ) : (
                    'Verify'
                  )}
                </button>
              ) : (
                <button
                  className={`w-full h-[36px] flex items-center justify-center rounded-sm transition bg-[#F16137] text-white hover:bg-[#e4572e] cursor-pointer`}
                  onClick={sendOtp}
                  disabled={isPending}
                >
                  {isPending ? (
                    <span
                      className='loader'
                      style={
                        {
                          '--c1': '#fff',
                          '--c2': '#ccc',
                        } as React.CSSProperties
                      }
                    />
                  ) : (
                    'Send OTP'
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
    </div>
  );
};

export default EmailInteraction;
