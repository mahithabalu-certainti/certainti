import React, { useState, useEffect } from 'react';
import { certaintiLogo } from '../../assets/images';
import InteractionQuestions from './interaction-qustions';
import { CircularProgress } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useGetInteractionQuestions,
  usePostGenerateOtp,
  usePostReSendOtp,
  usePostVerifyOtp,
} from '../../common-service';
import { LOGIN } from '../../routes';

const EmailInteraction: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [isAuthentic, setIsAuthentic] = useState(false);

  const timeout = localStorage.getItem('otp_timeout');
  const auth_token = localStorage.getItem('temAuth');
  const parseToken = auth_token ? JSON.parse(auth_token) : '';
  const account_rid = searchParams.get('acc');
  const interaction_rid = searchParams.get('int');
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
    parseToken.auth_token as string,
    parseToken.email as string
  );

  useEffect(() => {
    // clear authentication when enter interaction
    if (questions?.questions && questions.questions.length > 0) {
      localStorage.removeItem('auth');
    }
  }, [questions]);
  useEffect(() => {
    if (
      account_rid &&
      interaction_rid &&
      !localStorage.getItem('otp_timeout')
    ) {
      const payload = {
        interaction_rid,
        account_rid,
      };
      mutate(payload);
    }

    if (auth_token) {
      setIsAuthentic(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, auth_token]);
  useEffect(() => {
    if (data && !timeout) {
      localStorage.setItem('otp_timeout', JSON.stringify(Date.now()));
    }
  }, [data, timeout]);
  useEffect(() => {
    if (timeout) {
      const startTime = JSON.parse(timeout);
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      const remainingTime = Math.max(600 - elapsedSeconds, 0); // 600 seconds = 10 minutes
      setTimer(remainingTime);
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
    verifyOtp.mutate({
      account_rid: account_rid as string,
      interaction_rid: interaction_rid as string,
      otp: otp.join(''),
    });
  };

  return (
    <div className={isAuthentic ? '' : 'bg-[#f4f4f4]'}>
      <header className='w-full flex items-center px-10 py-4 bg-[#2D3E4F] shadow-sm'>
        <img src={certaintiLogo} alt='Logo' className='h-[16px]' />
      </header>
      {(isPending || reSendOtp.isPending || isLoading) && (
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
                createdBy={questions.created_by}
                parseToken={parseToken}
                formData={{
                  account_rid: questions?.account_rid || '',
                  project_rid: questions?.project_rid || '',
                  project_fiscal_rid: questions?.project_fiscal_rid || '',
                  interaction_rid: questions?.interaction_rid || '',
                }}
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
                    disabled={!timeout}
                    autoComplete='off'
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
                    :{(timer % 60).toString().padStart(2, '0')}s
                  </span>
                </span>
                <span>
                  Didn’t get the code?{' '}
                  <button
                    className={`text-[#F16137] hover:underline transition ${
                      timer > 0
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer'
                    }`}
                    onClick={resetTimer}
                    disabled={timer > 0}
                  >
                    Resend
                  </button>
                </span>
              </div>

              {/* Buttons */}
              <button
                className={`w-full py-2 rounded-sm transition ${
                  checkEveryOtpValue
                    ? 'bg-[#F16137] text-white hover:bg-[#e4572e] cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={validateOtp}
                disabled={!checkEveryOtpValue || verifyOtp.isPending}
              >
                {verifyOtp.isPending ? (
                  <CircularProgress sx={{ color: 'white' }} size={16} />
                ) : (
                  'Verify'
                )}
              </button>
              <button
                className='w-full mt-3 border border-[#F16137] text-[#F16137] py-2 rounded-sm hover:bg-orange-50 transition cursor-pointer'
                onClick={() => navigate(LOGIN)}
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
    </div>
  );
};

export default EmailInteraction;
