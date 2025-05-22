import React  from 'react';
// import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { profileIcon } from '../../../../assets/icons';
import TextButton from '../../../../components/button/text-button';
 

const HEADER_STYLES = {
  adminPermission: 'font-medium text-[#7D98B6] text-[11px] leading-5 tracking-normal',
  manageUser: 'font-semibold text-[20px] text-[#2D3E4F] leading-5 tracking-normal',
};

export const CreateProfile: React.FC = () => {
 
    const goBack = () => {
        window.history.back();
    };
  return (
    <>
      <div className='flex flex-col gap-3'>
        {/* Header Section */}
        <div className='w-full min-h-[50px] h-[50px] px-4 flex items-center justify-between border-b-1 border-[#CBD6E2]'>
          <div className='flex items-center gap-2'>
            <img src={profileIcon} alt='create profile' className='h-8 w-8 rounded'/>
            <div className='flex flex-col mb-1'>
            <div className={HEADER_STYLES.adminPermission}>
              Admin Permission
            </div>
            <div className={HEADER_STYLES.manageUser}>Manage User</div>
          </div> 
          </div> 
          <div className='flex gap-2 items-center'>
            <TextButton
              label='Back'
              variant='outlined'
              color='inherit'
              onClick={goBack}
              sx={{ width: '45px', minWidth: '45px', fontWeight:700, fontSize: '13px', height: '20px'}}
            />
          </div>
        </div>

        <div className="px-4">
            <div className='border border-[#CBD6E2] rounded-[4px]'>
                <div className='flex justify-between items-center bg-[#FCFCFC] border-b border-[#CBD6E2] h-[38px]'>
                    <div className='px-4 font-semibold text-[14px] leading-[32px] tracking-[0%] align-middle text-[#2D3E4F]'>
                      Create Profile
                    </div>
                    <div className='flex gap-2 m-2'>
                        <TextButton
                            label='Save'
                            variant='outlined'
                            // loading={updateUser.isPending || createUser.isPending}
                            // onClick={handleExternalSubmit}
                            sx={{ width: '64px', minWidth: '64px', fontWeight:400, fontSize: '13px', height: '32px', }}
                        />
                        <TextButton
                            label='Cancel'
                            variant='outlined'
                            color='inherit'
                            onClick={goBack}
                            sx={{ width: '56px', minWidth: '56px', fontWeight:400, fontSize: '12px', height: '32px', }}
                        /> 
                    </div>
                </div>
                      <div className='flex items-center p-2'>
                    <TextButton
                    label='Next'
                    variant='outlined'
                    color='inherit'
                    onClick={goBack}
                    sx={{ width: '45px', minWidth: '45px', fontWeight:700, fontSize: '13px', height: '20px'}}
                    />
                </div>
            </div>
        </div>      
      </div>
    </>
  );
};
