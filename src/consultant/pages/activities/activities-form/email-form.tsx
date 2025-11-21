import React from 'react';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import { DraftEmailIcon } from '../../../../assets';
import { useSearchParams } from 'react-router-dom';
import TextButton from '../../../../components/button/text-button';

const EmailForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const sourcePath = searchParams.get('source') || '';
  const activityData = { r_number: 'test' };

  const goBack = () => {
    window.history.back();
  };
  const isLoading = false;

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white border-b border-[#CBD6E2]'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <DraftEmailIcon
            alt='email-icon'
            className='w-7 h-7 p-1.5 [&>path]:stroke-white bg-[#FF73C3] rounded-[2px]'
          />
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {sourcePath
                  ? `${sourcePath}${isEditView ? ` > ${activityData?.r_number}` : ''}`
                  : `Activity ${isEditView ? `> ${activityData?.r_number}` : ''}`}
              </div>
            )}
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              {isEditView ? 'Edit Email' : 'Create Email'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            onClick={goBack}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Cancel'
            onClick={goBack}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EmailForm;
