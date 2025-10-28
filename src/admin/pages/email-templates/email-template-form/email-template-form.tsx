import React, { useEffect, useMemo, useState } from 'react';
import { TemplateImportIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import { MenuItem, Select } from '@mui/material';
import { EmailTemplateFormData, EmailTemplateFormErrors } from '../../../types';
import ReactQuill from 'react-quill';
import {
  normalizeQuillValue,
  transformEmailTemplatePayload,
  validateEmailTemplateForm,
} from './helper';
import { useGetStatus } from '../../../../common-service';
import { useParams } from 'react-router-dom';
import {
  useCreateEmailTemplate,
  useEmailTemplateDetails,
  useUpdateEmailTemplateDetails,
} from '../../../service/email-template/email-template-service';
import { useToast } from '../../../../hooks';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';

const EmailTemplateForm: React.FC = () => {
  const { templateId } = useParams();
  const { successToast } = useToast();
  const [formData, setFormData] = useState<EmailTemplateFormData>({
    templateName: '',
    subject: '',
    description: '',
    status: '',
    emailBody: '',
    rid: '',
    template_rid: '',
    created_on: '',
    created_by: '',
    updated_on: '',
    updated_by: '',
  });

  const [errors, setErrors] = useState<EmailTemplateFormErrors>({});
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  const emailTemplateStatus = useGetStatus();
  const createEmailTemplate = useCreateEmailTemplate();
  const updateEmailTemplate = useUpdateEmailTemplateDetails();

  const { data: emailTemplateData, isLoading } = useEmailTemplateDetails(
    templateId || ''
  );

  const commonSuccess =
    createEmailTemplate.isSuccess || updateEmailTemplate.isSuccess;

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Email Template updated successfully'
          : 'Email Template created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  useEffect(() => {
    if (emailTemplateData && isEditView) {
      setFormData((prev) => ({
        ...prev,
        templateName: emailTemplateData?.template_name,
        status: emailTemplateData.status_rid,
        subject: emailTemplateData.subject,
        description: emailTemplateData.description,
        emailBody: emailTemplateData.email_body,
        rid: emailTemplateData.template_rid,
        template_rid: emailTemplateData.r_number,
        created_by: emailTemplateData.created_by,
        created_on: formatDateToYYYYMMDDWithTime(
          emailTemplateData.created_datetime
        ),
        updated_by: emailTemplateData.modified_by || '',
        updated_on: formatDateToYYYYMMDDWithTime(
          emailTemplateData.modified_datetime || ''
        ),
      }));
    }
  }, [isEditView, emailTemplateData]);

  const statusOptions = useMemo(
    () =>
      emailTemplateStatus.data?.data?.status.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [emailTemplateStatus.data?.data?.status]
  );

  const handleInputChange = (
    field: keyof EmailTemplateFormData,
    value: string
  ) => {
    if (field === 'emailBody') {
      value = normalizeQuillValue(value);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' })); // clear field error on change
  };

  const validateForm = (): boolean => {
    const { isValid, errors: validationErrors } =
      validateEmailTemplateForm(formData);
    setErrors(validationErrors);
    return isValid;
  };

  const goBack = () => {
    window.history.back();
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    const payload = transformEmailTemplatePayload(
      formData,
      isEditView,
      emailTemplateData
    );

    if (isEditView && emailTemplateData) {
      updateEmailTemplate.mutate(payload);
    } else {
      createEmailTemplate.mutate(payload);
    }
  };

  const formLoading = emailTemplateStatus.isPending || isLoading;

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <TemplateImportIcon
            alt='email-template-icon'
            className='h-7 w-7 p-1.5 rounded [&>path]:fill-[#fff] [&>path]:stroke-[#EA0084] bg-[#EA0084]'
          />
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {`Email Template ${isEditView ? `> ${emailTemplateData?.r_number}` : ''}`}
              </div>
            )}
            <h5 className='text-[16px] font-bold ml-2 mt-0.5 text-[#2D3E4F]'>
              {isEditView ? 'Edit Template' : 'Create Template'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={
              createEmailTemplate.isPending || updateEmailTemplate.isPending
            }
            onClick={handleSubmit}
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
            disabled={
              createEmailTemplate.isPending || updateEmailTemplate.isPending
            }
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
      <div className={`${isEditView ? 'pb-6' : 'pb-4'}`}>
        {formLoading ? (
          <SkeletonForm />
        ) : (
          <form>
            <div className='border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10'>
              Email Template Information
            </div>
            <div className='grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-4'>
              <div>
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='template_name'
                >
                  Template Name
                  <span className='text-red-500'> *</span>
                </label>
                <input
                  type='text'
                  name='template_name'
                  required
                  placeholder='Enter Template Name'
                  value={formData.templateName}
                  onChange={(e) =>
                    handleInputChange('templateName', e.target.value)
                  }
                  autoComplete='off'
                  className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.templateName ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                />
                {errors?.templateName && (
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {errors.templateName}
                  </span>
                )}
              </div>

              <div>
                <label
                  htmlFor='subject'
                  className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                >
                  Subject<span className='text-red-500'> *</span>
                </label>
                <input
                  type='text'
                  name='subject'
                  required
                  placeholder='Enter Subject'
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  autoComplete='off'
                  className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.subject ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                />
                {errors?.subject && (
                  <span className='text-[12px] text-red-400'>
                    {errors.subject}
                  </span>
                )}
              </div>

              <div>
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='status'
                >
                  Status
                  <span className='text-red-500'> *</span>
                </label>

                <Select
                  name='status'
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  displayEmpty
                  required
                  fullWidth
                  size='small'
                  className={`custom-select-no-arrow sm:text-sm ${
                    formData.status === '' ? 'text-[#7D98B6]' : 'text-black'
                  } ${errors?.status ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
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
                    padding: '6px 4px',
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: '2px solid #60A5FA',
                    },
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused': { boxShadow: 'none' },
                    },
                    '.MuiSelect-select': {
                      padding: '6px 6px',
                      color: formData.status === '' ? '#7D98B6' : 'black',
                    },
                    '&.Mui-disabled': { backgroundColor: '#f3f4f6' },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: errors?.status
                        ? '1px solid #ef4444'
                        : '1px solid #CBD6E2',
                      borderRadius: '2px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: errors?.status
                        ? '1px solid #ef4444'
                        : '1px solid #CBD6E2',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#7D98B6',
                    },
                  }}
                >
                  <MenuItem
                    value=''
                    sx={{ color: '#425A76', fontSize: '13px', fontWeight: 500 }}
                  >
                    Choose Status
                  </MenuItem>

                  {statusOptions?.map((option, i) => (
                    <MenuItem
                      key={`${option.value}-${i}`}
                      value={option.value}
                      title={option.label}
                      sx={{
                        color: '#425A76',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>

                {errors?.status && (
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {errors.status}
                  </span>
                )}
              </div>
            </div>
            <div className='grid grid-cols-1 px-10 pt-4'>
              <label
                htmlFor='description'
                className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
              >
                Description<span className='text-red-500'> *</span>
              </label>
              <textarea
                name='description'
                required
                placeholder='Enter Description'
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                className={`outline-none placeholder-custom-color h-[95px] w-full sm:text-sm py-2 px-3 resize-none focus:border-2 focus:border-blue-400 border border-[#CBD6E2] rounded-xs ${
                  errors?.description
                    ? 'border-red-500 bg-[#FEF2F2] focus:!bg-[#FEF2F2]'
                    : ''
                }`}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#9ca3af transparent',
                }}
              />
              {errors?.description && (
                <span className='text-[12px] text-red-400'>
                  {errors.description}
                </span>
              )}
            </div>

            {/* Email Body */}
            <div className='email-template-editor grid grid-cols-1 px-10 pt-4'>
              <label
                htmlFor='email_body'
                className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
              >
                Email Body<span className='text-red-500'> *</span>
              </label>
              <div className='w-full'>
                <ReactQuill
                  value={formData.emailBody}
                  onChange={(value) => handleInputChange('emailBody', value)}
                  theme='snow'
                  className={`rounded-[2px] ${errors?.emailBody ? 'border border-red-500 bg-[#FEF2F2]' : 'bg-white'}`}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, 4, 5, 6, false] }],
                      [{ font: [] }],
                      [{ size: [] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ color: [] }, { background: [] }],
                      [{ script: 'sub' }, { script: 'super' }],
                      ['blockquote', 'code-block'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      [{ indent: '-1' }, { indent: '+1' }],
                      [{ direction: 'rtl' }],
                      [{ align: [] }],
                      ['link', 'image', 'video'],
                      ['clean'],
                    ],
                  }}
                  formats={[
                    'header',
                    'font',
                    'size',
                    'bold',
                    'italic',
                    'underline',
                    'strike',
                    'color',
                    'background',
                    'script',
                    'blockquote',
                    'code-block',
                    'list',
                    'bullet',
                    'indent',
                    'direction',
                    'align',
                    'link',
                    'image',
                    'video',
                    'clean',
                  ]}
                />
                {errors?.emailBody && (
                  <span className='text-[12px] text-red-400'>
                    {errors.emailBody}
                  </span>
                )}
              </div>
            </div>
            <div className={`${isEditView ? 'block pt-5' : 'hidden'}`}>
              <div
                className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10`}
              >
                Audit Information
              </div>
              <div className='grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-1 mb-4'>
                {[
                  {
                    label: 'Record ID',
                    value: formData.rid,
                    hide: false,
                  },
                  {
                    label: 'Created On',
                    value: formData.created_on,
                    hide: false,
                  },
                  {
                    label: 'Created By',
                    value: formData.created_by,
                    hide: false,
                  },
                  {
                    label: 'Template ID',
                    value: formData.template_rid,
                    hide: false,
                  },
                  {
                    label: 'Updated On',
                    value: formData.updated_on,
                    hide: false,
                  },
                  {
                    label: 'Updated By',
                    value: formData.updated_by,
                    hide: false,
                  },
                ]
                  .filter((field) => !field.hide)
                  .map((field, idx) => (
                    <div key={idx}>
                      <label className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] md:text-left mt-1 block'>
                        {field.label}
                      </label>
                      <div className='placeholder-[#7D98B6] bg-gray-100 text-black w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs flex items-center cursor-not-allowed select-none text-nowrap overflow-hidden'>
                        <span className='overflow-hidden text-ellipsis whitespace-nowrap'>
                          {field.value || '-'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EmailTemplateForm;
