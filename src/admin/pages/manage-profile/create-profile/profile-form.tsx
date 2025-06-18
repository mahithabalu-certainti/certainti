import React from 'react';
import { SelectOption } from '../../../../consultant/types';
import { ProfileIcon } from '../../../../assets';
import TextButton from '../../../../components/button/text-button';
import {
  CircularProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextareaAutosize,
} from '@mui/material';

interface ProfileFormProps {
  profileOptions: SelectOption[];
  loading: boolean;
  onSubmit: (data: {
    existingProfile: string;
    profileName: string;
    description: string;
  }) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profileOptions,
  loading,
  onSubmit,
}) => {
  const [formData, setFormData] = React.useState({
    existingProfile: '',
    profileName: '',
    description: '',
  });

  const [errors, setErrors] = React.useState({
    existingProfile: '',
    profileName: '',
    description: '',
  });
  const validateExistingProfile = (value: string) => {
    if (!value.trim()) {
      return 'Field is required';
    }
    return '';
  };
  const validateProfileName = (value: string) => {
    // Check for empty value
    if (!value.trim()) {
      return 'Field is required';
    }

    // Check length
    if (value.length < 2 || value.length > 64) {
      return 'The profile name must contain a minimum of 2 and a maximum of 64 characters.';
    }

    // Check for starting/ending spaces or special characters
    if (/^[\s\-_]|[\s\-_]$/.test(value)) {
      return 'Profile name cannot begin or end with a space or special character';
    }

    // Check for consecutive special characters
    if (/[-_]{2,}/.test(value)) {
      return 'Profile name cannot contain consecutive special characters';
    }

    // Check for allowed characters only
    if (!/^[A-Za-z\s\-_]+$/.test(value)) {
      return 'Profile name can only contain letters, spaces, hyphens (-) and underscores (_)';
    }

    return '';
  };

  const validateDescription = (value: string) => {
    if (!value.trim()) {
      return 'Field is required';
    }

    if (value.length > 2000) {
      return 'Input must be between 1 and 2,000 characters.';
    }

    return '';
  };

  const handleChange = (
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
      | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    // Validate all fields before submission
    const existingProfileError = validateExistingProfile(
      formData.existingProfile
    );
    const profileNameError = validateProfileName(formData.profileName);
    const descriptionError = validateDescription(formData.description);

    setErrors({
      existingProfile: existingProfileError,
      profileName: profileNameError,
      description: descriptionError,
    });

    if (existingProfileError || profileNameError || descriptionError) {
      return;
    }

    onSubmit(formData);
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200 sticky top-0 z-10 bg-white'>
        <div className='flex items-center gap-2 w-[80%] max-w-[80%]'>
          <ProfileIcon alt='manage-profile' className='h-6 w-6 rounded' />
          <div className='w-[90%]'>
            <div className='font-medium text-[#7D98B6] text-[11px] leading-5 tracking-normal'>
              Admin Permission
            </div>
            <div className='text-[16px] font-bold text-[#2D3E4F] -mt-0.5'>
              Create Profile
            </div>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Next'
            loading={loading}
            onClick={handleNext}
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
      {loading ? (
        <div className='flex-1 flex justify-center items-center w-full'>
          <CircularProgress />
        </div>
      ) : (
        <>
          <div
            className={`border-b h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10`}
          >
            Create Profile
          </div>
          <form className='flex flex-row w-full items-end gap-4 px-10 py-1'>
            <div className='w-full flex flex-col gap-2'>
              <div className='w-full flex flex-row gap-2'>
                <div className='w-1/2 flex flex-col gap-1'>
                  <label className='text-[13px] font-[600] text-[#2D3E4F]'>
                    Existing Profile <span className='text-red-500'> *</span>
                  </label>
                  <div className='w-full'>
                    <Select
                      name='existingProfile'
                      className={
                        'custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]  ' +
                        (formData.existingProfile === ''
                          ? 'text-[#7D98B6] '
                          : '')
                      }
                      // onChange={(e) => handleChange(e.target.value)}
                      value={formData.existingProfile}
                      onChange={handleChange}
                      displayEmpty
                      fullWidth
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
                          color:
                            formData.existingProfile === ''
                              ? '#7D98B6'
                              : 'black',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: '#f3f4f6',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: errors.existingProfile
                            ? '1px solid #ef4444'
                            : '1px solid #CBD6E2',
                          borderRadius: '2px',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          border: errors.existingProfile
                            ? '1px solid #ef4444'
                            : '1px solid #CBD6E2',
                        },
                        // '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        //   borderColor: field.error ? '#ef4444' : 'black',
                        // },
                        '& svg': {
                          color: '#7D98B6',
                        },
                      }}
                    >
                      <MenuItem
                        value=''
                        sx={{
                          color: '#425A76',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                      >
                        Choose Existing Profile
                      </MenuItem>
                      {profileOptions?.map((option, i) => (
                        <MenuItem
                          sx={{
                            color: '#425A76',
                            fontSize: '13px',
                            fontWeight: '500',
                          }}
                          key={`${option.value}_${i}`}
                          value={option.value}
                          title={option.label}
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </div>
                  {/* <div className='relative w-full'>
                    <select
                      name='existingProfile'
                      value={formData.existingProfile}
                      onChange={handleChange}
                      className={`placeholder-custom-color custom-select-no-arrow w-full sm:text-sm px-1.5 py-[6px] border-1 ${
                        errors.existingProfile
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } rounded-[2px] ${
                        formData.existingProfile
                          ? 'text-[black]'
                          : 'text-[#7D98B6]'
                      } max-h-[100px]`}
                      required
                    >
                      <option
                        value=''
                        className='text-gray-500 placeholder-custom-color'
                      >
                        Choose Existing Profile
                      </option>
                      {profileOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          className='text-[#425A76]'
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <img
                      src={arrowDownIcon}
                      alt='dropdown arrow'
                      className={`absolute right-2 ${
                        errors.existingProfile ? 'top-1/3' : 'top-1/2'
                      } -translate-y-1/2 pointer-events-none`}
                      style={{ width: 15, height: 15 }}
                    />
                    {errors.existingProfile && (
                      <span className='text-red-500 text-[11px]'>
                        {errors.existingProfile}
                      </span>
                    )}
                  </div> */}
                </div>
                <div className='w-1/2 flex flex-col gap-1'>
                  <label className='text-[13px] font-[600] text-[#2D3E4F]'>
                    Profile Name <span className='text-red-500'> *</span>
                  </label>
                  <input
                    type='text'
                    name='profileName'
                    value={formData.profileName}
                    onChange={handleChange}
                    placeholder='Enter Profile Name'
                    className={`placeholder-custom-color placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors.profileName ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  {errors.profileName && (
                    <span className='text-red-500 text-[11px]'>
                      {errors.profileName}
                    </span>
                  )}
                </div>
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-[13px] font-[600] text-[#2D3E4F]'>
                  Profile Description <span className='text-red-500'> *</span>
                </label>
                <TextareaAutosize
                  minRows={3}
                  maxRows={5}
                  name='description'
                  value={formData.description}
                  onChange={handleChange}
                  placeholder='Enter Profile Description'
                  className={`outline-none placeholder-custom-color w-full sm:text-sm py-2 px-3 border border-[#CBD6E2] rounded-xs h-[95px] resize-none focus:border-2 focus:border-blue-400 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {errors.description && (
                  <span className='text-red-500 text-[11px]'>
                    {errors.description}
                  </span>
                )}
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
};
