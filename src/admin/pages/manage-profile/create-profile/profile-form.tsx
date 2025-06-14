import React from 'react';
import { SelectOption } from '../../../../consultant/types';
import { ArrowDownIcon } from '../../../../assets';
import TextButton from '../../../../components/button/text-button';
import { TextareaAutosize } from '@mui/material';

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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
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

  return (
    <form className='flex flex-row w-full items-end gap-4 p-2'>
      <div className='w-full flex flex-col gap-2'>
        <div className='w-full flex flex-row gap-2'>
          <div className='w-1/2 flex flex-col gap-1'>
            <label className='text-[13px] font-[600] text-[#2D3E4F]'>
              Existing Profile <span className='text-red-500'> *</span>
            </label>
            <div className='relative w-full'>
              <select
                name='existingProfile'
                value={formData.existingProfile}
                onChange={handleChange}
                className={`placeholder-custom-color custom-select-no-arrow w-full sm:text-sm px-1.5 py-[6px] border-1 ${
                  errors.existingProfile ? 'border-red-500' : 'border-gray-300'
                } rounded-[2px] ${
                  formData.existingProfile ? 'text-[black]' : 'text-[#7D98B6]'
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
              <ArrowDownIcon
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
            </div>
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
              className={`placeholder-custom-color font-[500] custom-select-no-arrow w-full sm:text-sm px-1.5 py-[6px] border-1 ${errors.profileName ? 'border-red-500' : 'border-gray-300'} rounded-[2px] text-[black]`}
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
            className={`custom-select-no-arrow placeholder-custom-color font-[500] w-full sm:text-sm px-1.5 py-[6px] border-1 ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-[2px] text-[black] resize-none`}
            required
          />
          {errors.description && (
            <span className='text-red-500 text-[11px]'>
              {errors.description}
            </span>
          )}
        </div>
      </div>
      <TextButton
        label='Next'
        color='inherit'
        loading={loading}
        onClick={handleNext}
        sx={{
          width: '64px',
          minWidth: '64px',
          fontWeight: 400,
          fontSize: '13px',
          height: '32px',
          marginBottom: errors.description === '' ? '0px' : '20px !important',
        }}
      />
    </form>
  );
};
