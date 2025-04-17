import { Skeleton } from '@mui/material';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useManageUserDetail } from '../../../admin/service';
import { accountHomeIcon } from '../../../assets/icons';
import { CheckErrorMsg } from '../../../common-service';
import {
  checkError,
  checkErrorMsg,
  formatAddress,
  getDateTimeFormat,
} from '../../../common-utils';
import TextButton from '../../../components/button/text-button';
import { useToast } from '../../../hooks';
import { RootState } from '../../../store/store';
import { ProfileField } from '../../types';

export const Profile: React.FC = () => {
  const { errorToast } = useToast();
  const { userId } = useSelector((state: RootState) => state.auth);
  const userDetails = useManageUserDetail(userId as string);
  const userDatas = userDetails.data?.data?.users;

  // Hook Error Handling
  const commonError = checkError([userDetails]);
  const commonErrorMsg = checkErrorMsg([userDetails] as CheckErrorMsg[]);

  useEffect(() => {
    if (commonError) {
      errorToast(commonErrorMsg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonError, commonErrorMsg]);

  const goBack = () => {
    window.history.back();
  };

  const createField = (
    label: string,
    value?: string,
    isFirstCaps?: boolean
  ) => ({
    label,
    value: value || ' N/A',
    isFirstCaps,
  });

  const data: ProfileField[] = [
    createField('User ID', userDatas?.rid),
    createField('User Number', userDatas?.r_number),
    createField('First Name', userDatas?.first_name),
    createField('Last Name', userDatas?.last_name),
    createField('Email', userDatas?.email),
    createField('Phone Number', userDatas?.phone),
    createField('Profile (Role)', userDatas?.business_teams.business_teams),
    createField('Status', userDatas?.status, true),
    createField(
      'Created On / Created By',
      getDateTimeFormat(userDatas?.created_datetime) +
        ' / ' +
        userDatas?.created_by
    ),
    createField(
      'Last Updated On / Last Updated By',
      getDateTimeFormat(userDatas?.modified_datetime) +
        ' / ' +
        userDatas?.modified_by
    ),
    {
      label: 'Address (Street, City, State/Province, Zip Code, Country)',
      value: formatAddress(userDatas) || ' N/A',
    },
  ];

  return (
    <>
      <div className='flex justify-between items-center border-b-2 border-gray-200 px-10 py-6'>
        <div className='flex items-center'>
          <img
            src={accountHomeIcon}
            alt='menu-icon'
            className='h-10 w-10 bg-[#7D98B6] p-2.5 rounded'
          />
          <div>
            <h4 className='font-bold text-lg ml-2 leading-4'>
              View Profile Details
            </h4>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Back'
            variant='outlined'
            color='inherit'
            onClick={goBack}
          />
        </div>
      </div>
      <div className='p-10'>
        <div className='grid md:grid-cols-2 gap-4'>
          {data.map((field, j) => (
            <div key={j} className='grid md:grid-cols-6 gap-4'>
              <label className='text-md text-gray-500 md:text-right col-span-2'>
                {field.label}
              </label>
              <label
                className={
                  'text-md col-span-4 font-bold ' +
                  (field.isFirstCaps ? 'capitalize' : '')
                }
              >
                {userDetails.isLoading ? (
                  <Skeleton variant='rounded' width='100%' height={24} />
                ) : (
                  field.value
                )}
              </label>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
