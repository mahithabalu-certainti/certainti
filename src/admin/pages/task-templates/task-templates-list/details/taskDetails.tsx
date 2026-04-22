import React from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { RootState } from '../../../../../store/store';
import { HEADER_STYLES } from '../../../manage-user-detail/styles';
import { DetailsIcon, ManageUserIcon } from '../../../../../assets';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { AllPermissions } from '../../../../../common-service';
import { checkPermission } from '../../../../../common-utils';
import { useSelector } from 'react-redux';
import { useTaskTemplateDetails } from '../../../../service/task-template/task-template-service';
import { ManageDetailComponent } from './manage-detail';
import TextButton from '../../../../../components/button/text-button';

export const ManageTaskDetails: React.FC = () => {
  // Get userId from URL params
  const { templateId } = useParams();
  const { data: taskTemplateData, isLoading } = useTaskTemplateDetails(
    templateId || ''
  );
  const userDetail = taskTemplateData;
  const goBack = () => {
    window.history.back();
  };
  // Permission Mangement
  const { permission } = useSelector((state: RootState) => state.permission);
  const isUserViewEnable = checkPermission(
    permission,
    AllPermissions.TASK_TEMPLATE_VIEW_EDIT
  );

  if (!isUserViewEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col h-[calc(100vh-64px)] w-full overflow-y-auto p-4 gap-3'>
      <div className='w-full h-[55px] min-h-[50px] px-4 flex items-center justify-between border border-[#CBD6E2] rounded-[4px]'>
        <div className='flex items-center justify-center'>
          <ManageUserIcon alt='manage user' className='h-7 w-7 rounded' />
          <div className='flex flex-col mx-2.5 pb-1'>
            <div className={HEADER_STYLES.adminPermission}>
              {`Admin Permission > Task Template > ${userDetail?.task_name}`}
            </div>
            <div className={HEADER_STYLES.manageUser}>
              View Task Template Details
            </div>
          </div>
        </div>
        <div>
          <TextButton
            label='Back To Task Template'
            onClick={goBack}
            sx={{
              width: '150px',
              minWidth: '150px',
              fontWeight: 400,
              fontSize: '13px',
            }}
          />
        </div>
      </div>
      {/* User Details section  */}
      <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px]'>
        <Box className='flex items-center justify-between gap-4 h-[38px] py-1 px-2'>
          <Box className='flex items-center gap-2'>
            <div className='w-[24px] h-[24px] flex items-center justify-center rounded-full bg-[#D7E5FF]'>
              <DetailsIcon
                alt='details'
                className='[&>path]:stroke-[#294F98] w-[14px] h-[14px]'
              />
            </div>
            <Box className='text-[13px] text-[#2D3E4F] font-semibold'>
              Details
            </Box>
          </Box>
        </Box>
        <Box>
          <ManageDetailComponent data={userDetail} loading={isLoading} />
        </Box>
      </div>
    </div>
  );
};

export default ManageTaskDetails;
