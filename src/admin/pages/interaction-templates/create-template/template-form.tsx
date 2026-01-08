import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import TextButton from '../../../../components/button/text-button';
import { useToast } from '../../../../hooks';
import {
  AllPermissions,
  useGetInteractionLevel,
  useGetStatus,
} from '../../../../common-service';
import {
  TemplateFormData,
  TemplateFormQuestion,
  TemplateFormErrors,
  validateTemplateForm,
  transformTemplatePayload,
  getQuestionTableColumns,
  TemplateFormTableColumn,
  TemplateQuestionErrors,
  shouldHideField,
  shouldDisableField,
} from './helper';
import {
  ErrorInfoIcon,
  InteractionTemplateIcon,
  KeyContactAddIcon,
  KeyContactRemoveIcon,
} from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import {
  useCreateInteractionTemplate,
  useInteractionTemplateDetails,
  useUpdateInteractionTemplateDetails,
} from '../../../service/interaction-template/template-service';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { ColorCode } from '../../../../consultant/types';

const TemplateForm: React.FC = () => {
  const { successToast } = useToast();
  const { templateId } = useParams();
  const [formData, setFormData] = useState<TemplateFormData>({
    templateName: '',
    interactionLevel: '',
    status: '',
    questions: [
      {
        question_seq_num: 'SNO_1',
        question: '',
        is_mandatory: false,
        notes: '',
      },
    ],
    rid: '',
    template_rid: '',
    created_on: '',
    created_by: '',
    updated_on: '',
    updated_by: '',
  });
  const [errors, setErrors] = useState<TemplateFormErrors>({});

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  // Permission
  const { permission } = useSelector((state: RootState) => state.permission);

  const templateViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.INTERACTION_TEMPLATES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    templateViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [templateViewEditFields]);

  const templateStatus = useGetStatus();
  const interactionLevel = useGetInteractionLevel();
  const createInteractionTemplate = useCreateInteractionTemplate();
  const updateInteractionTemplate = useUpdateInteractionTemplateDetails();

  const { data: templateData, isLoading } = useInteractionTemplateDetails(
    templateId || ''
  );

  const commonSuccess =
    createInteractionTemplate.isSuccess || updateInteractionTemplate.isSuccess;

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Interaction Template updated successfully'
          : 'Interaction Template created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  useEffect(() => {
    if (templateData && isEditView) {
      setFormData((prev) => ({
        ...prev,
        templateName: templateData?.template_name,
        interactionLevel: templateData.interaction_level_rid,
        status: templateData.status_rid,
        rid: templateData.template_rid,
        template_rid: templateData.r_number,
        created_by: templateData.created_by,
        created_on: formatDateToYYYYMMDDWithTime(templateData.created_datetime),
        updated_by: templateData.modified_by || '',
        updated_on: formatDateToYYYYMMDDWithTime(
          templateData.modified_datetime || ''
        ),
        questions:
          templateData.questions.length > 0
            ? templateData.questions.map((qus, index) => ({
                question_seq_num: qus.question_seq_num || `Q00-${index + 1}`,
                question: qus.question.trim() || '',
                is_mandatory: qus.is_mandatory ?? false,
                notes: qus.notes.trim() || '',
                rid: qus.rid,
              }))
            : [
                {
                  question_seq_num: 'SNO_1',
                  question: '',
                  is_mandatory: false,
                  notes: '',
                },
              ],
      }));
    }
  }, [isEditView, templateData]);

  const statusOptions = useMemo(
    () =>
      templateStatus.data?.data?.status.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [templateStatus.data?.data?.status]
  );

  const levelOptions = useMemo(
    () =>
      interactionLevel.data?.data.interactionLevel.map((level) => ({
        label: level.interaction_level_name,
        value: level.rid,
      })) || [],
    [interactionLevel.data?.data.interactionLevel]
  );

  const handleInputChange = (field: keyof TemplateFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field changes
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const handleQuestionChange = (
    index: number,
    field: keyof TemplateFormQuestion,
    value: string | boolean
  ) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));

    // Clear error when field changes
    setErrors((prev) => {
      const newQuestionErrors = [...(prev.questions || [])];
      if (newQuestionErrors[index]) {
        newQuestionErrors[index] = {
          ...newQuestionErrors[index],
          [field]: undefined,
        };
      }
      return {
        ...prev,
        questions: newQuestionErrors,
      };
    });
  };

  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question_seq_num: `SNO_${prev.questions.length + 1}`,
          question: '',
          is_mandatory: false,
          notes: '',
        },
      ],
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions.splice(index, 1);

    // If this was the last question, add a new empty one
    if (updatedQuestions.length === 0) {
      updatedQuestions.push({
        question_seq_num: 'SNO_1',
        question: '',
        is_mandatory: false,
        notes: '',
      });
    }

    setFormData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));

    // Clear errors for the removed question and reindex remaining errors
    setErrors((prev) => {
      if (!prev.questions) return prev;

      const newQuestionErrors = [...prev.questions];
      newQuestionErrors.splice(index, 1);

      return {
        ...prev,
        questions: newQuestionErrors,
      };
    });
  };

  const validateForm = (): boolean => {
    const { isValid, errors: validationErrors } =
      validateTemplateForm(formData);
    setErrors(validationErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    const payload = transformTemplatePayload(
      formData,
      isEditView,
      templateData
    );

    if (isEditView && templateData) {
      updateInteractionTemplate.mutate(payload);
    } else {
      createInteractionTemplate.mutate(payload);
    }
  };

  const goBack = () => {
    window.history.back();
  };

  const questionTableColumns = getQuestionTableColumns(isEditView);
  const formLoading =
    isLoading || interactionLevel.isLoading || templateStatus.isLoading;

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <InteractionTemplateIcon
            alt='interaction-template-icon'
            className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${ColorCode.manageAccountTextColor}] bg-[${ColorCode.manageTemplateBgcolor}]`}
          />
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {`Interaction Template ${isEditView ? `> ${templateData?.r_number}` : ''}`}
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
              createInteractionTemplate.isPending ||
              updateInteractionTemplate.isPending
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
              createInteractionTemplate.isPending ||
              updateInteractionTemplate.isPending
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
      <div className={`${isEditView ? 'pb-10' : 'pb-4'}`}>
        {formLoading ? (
          <SkeletonForm />
        ) : (
          <form>
            <div className='border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10'>
              Template Information
            </div>

            <div className='grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-4'>
              <div
                style={{
                  display: shouldHideField(
                    'template_name',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
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
                  onChange={(e) =>
                    handleInputChange('templateName', e.target.value)
                  }
                  disabled={shouldDisableField(
                    'template_name',
                    isEditView,
                    permissionMap
                  )}
                  autoComplete='off'
                  className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.templateName ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                  value={formData.templateName}
                />
                {errors?.templateName && (
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {errors.templateName}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: shouldHideField(
                    'interaction_level_rid',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='interaction_level'
                >
                  Interaction Level
                  <span className='text-red-500'> *</span>
                </label>

                <Select
                  name='interaction_level'
                  value={formData.interactionLevel}
                  onChange={(e) =>
                    handleInputChange('interactionLevel', e.target.value)
                  }
                  displayEmpty
                  required
                  fullWidth
                  size='small'
                  disabled={shouldDisableField(
                    'interaction_level_rid',
                    isEditView,
                    permissionMap
                  )}
                  className={`custom-select-no-arrow sm:text-sm ${
                    formData.interactionLevel === ''
                      ? 'text-[#7D98B6]'
                      : 'text-black'
                  } ${errors?.interactionLevel ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
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
                      color:
                        formData.interactionLevel === '' ? '#7D98B6' : 'black',
                    },
                    '&.Mui-disabled': { backgroundColor: '#f3f4f6' },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: errors?.interactionLevel
                        ? '1px solid #ef4444'
                        : '1px solid #CBD6E2',
                      borderRadius: '2px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: errors?.interactionLevel
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
                    Choose Interaction Level
                  </MenuItem>

                  {levelOptions?.map((option, i) => (
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

                {errors?.interactionLevel && (
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {errors.interactionLevel}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: shouldHideField(
                    'status_rid',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
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
                  disabled={shouldDisableField(
                    'status_rid',
                    isEditView,
                    permissionMap
                  )}
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

            <div
              className='w-full mb-5 mt-5'
              style={{
                display: shouldHideField('questions', isEditView, permissionMap)
                  ? 'none'
                  : 'block',
              }}
            >
              <div
                className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10`}
              >
                Interaction Information
              </div>
              <div className='px-10'>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table className='border-l border-[#CBD6E2]'>
                    <TableHead
                      sx={{
                        '& .MuiTableCell-root': {
                          fontWeight: 700,
                          fontSize: '13px',
                          color: '#2A2A2A',
                          padding: '0px 8px',
                          height: '29px',
                          boxSizing: 'border-box',
                        },
                      }}
                    >
                      <TableRow sx={{ height: 29 }}>
                        {questionTableColumns
                          .filter((col) => !col.hide)
                          .map((col: TemplateFormTableColumn) => (
                            <TableCell
                              key={col.name}
                              style={{
                                width: col.width,
                                textAlign: col.align ?? 'left',
                                textWrap: 'nowrap',
                              }}
                            >
                              {col.label}{' '}
                              {col.required && (
                                <span className='text-red-500 text-[16px]'>
                                  *
                                </span>
                              )}
                            </TableCell>
                          ))}
                      </TableRow>
                    </TableHead>
                    <TableBody
                      sx={{
                        '& .MuiTableCell-root': {
                          padding: '0px',
                          '& input, & textarea': {
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                            background: 'transparent',
                            '&:disabled': {
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                            },
                            '&:focus': {
                              border: '1px solid #60a5fa',
                              backgroundColor: 'white',
                            },
                          },
                          '& radio': {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                        },
                      }}
                    >
                      {formData.questions.map((question, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            position: 'relative',
                            p: 0,
                          }}
                          className={`${shouldDisableField('questions', isEditView, permissionMap) ? 'bg-[#f3f4f6] cursor-default' : ''}`}
                        >
                          {questionTableColumns
                            .filter((col) => !col.hide)
                            .map((col: TemplateFormTableColumn) => {
                              const permissionDisabled = shouldDisableField(
                                'questions',
                                isEditView,
                                permissionMap
                              );
                              const isDisabled =
                                permissionDisabled || col.disabled;
                              const isBtnDisabled =
                                permissionDisabled || col.disabled;
                              const error =
                                errors.questions?.[index]?.[
                                  col.name as keyof TemplateQuestionErrors
                                ];

                              return (
                                <TableCell
                                  key={`${col.name}-${index}`}
                                  style={{
                                    width: col.width,
                                    textAlign: col.align ?? 'left',
                                    position: 'relative',
                                    backgroundColor: error
                                      ? '#FEF2F2'
                                      : 'transparent',
                                  }}
                                  sx={{ padding: 0 }}
                                >
                                  {col.name === 'questionNo' && (
                                    <div
                                      style={{
                                        textAlign: 'center',
                                        padding: '4px',
                                      }}
                                    >
                                      {question.question_seq_num.startsWith(
                                        'SNO'
                                      )
                                        ? '-'
                                        : question.question_seq_num}
                                    </div>
                                  )}

                                  {col.name === 'question' && (
                                    <div
                                      className={`flex relative ${error ? 'bg-[#FEF2F2]' : ''}`}
                                    >
                                      <textarea
                                        name='interaction_question'
                                        placeholder='Enter Interaction Question'
                                        autoComplete='off'
                                        className={`outline-none placeholder-custom-color w-full sm:text-sm p-2 resize-none focus:border-2 focus:border-blue-400 ${error ? 'bg-[#FEF2F2] focus:!bg-[#FEF2F2]' : ''}`}
                                        onChange={(e) =>
                                          handleQuestionChange(
                                            index,
                                            'question',
                                            e.target.value
                                          )
                                        }
                                        value={question.question}
                                        disabled={isDisabled}
                                        style={{
                                          scrollbarWidth: 'thin',
                                          scrollbarColor: '#9ca3af transparent',
                                        }}
                                      />
                                      {error && (
                                        <Tooltip
                                          title={error}
                                          arrow
                                          placement='top'
                                          slotProps={{
                                            tooltip: {
                                              sx: {
                                                backgroundColor: '#FEF2F2',
                                                mr: 1,
                                              },
                                            },
                                          }}
                                        >
                                          <span className='h-[28px] w-5 flex items-center justify-center absolute top-[3px] bg-[#FEF2F2] right-[2px] cursor-pointer'>
                                            <React.Suspense fallback={null}>
                                              <ErrorInfoIcon
                                                alt='error'
                                                className='w-5 h-3.5'
                                              />
                                            </React.Suspense>
                                          </span>
                                        </Tooltip>
                                      )}
                                    </div>
                                  )}

                                  {col.name === 'mandatory' && (
                                    <div style={{ textAlign: 'center' }}>
                                      <input
                                        type='checkbox'
                                        checked={question.is_mandatory}
                                        onChange={(e) =>
                                          handleQuestionChange(
                                            index,
                                            'is_mandatory',
                                            e.target.checked
                                          )
                                        }
                                        disabled={isDisabled}
                                        className='cursor-pointer disabled:cursor-default scale-105'
                                      />
                                    </div>
                                  )}

                                  {col.name === 'notes' && (
                                    <div
                                      className={`flex ${isDisabled && !question.notes ? '' : 'relative'} ${error ? 'bg-[#FEF2F2]' : ''}`}
                                    >
                                      <textarea
                                        name='notes'
                                        placeholder='Enter Notes'
                                        autoComplete='off'
                                        className={`outline-none placeholder-custom-color w-full sm:text-sm py-2 px-3 resize-none focus:border-2 focus:border-blue-400 ${error ? 'bg-[#FEF2F2] focus:!bg-[#FEF2F2]' : ''}`}
                                        value={question.notes}
                                        style={{
                                          scrollbarWidth: 'thin',
                                          scrollbarColor: '#9ca3af transparent',
                                        }}
                                        onChange={(e) =>
                                          handleQuestionChange(
                                            index,
                                            'notes',
                                            e.target.value
                                          )
                                        }
                                        disabled={isDisabled}
                                      />
                                      {error && (
                                        <Tooltip
                                          title={error}
                                          arrow
                                          placement='top'
                                          slotProps={{
                                            tooltip: {
                                              sx: {
                                                backgroundColor: '#FEF2F2',
                                                mr: 1,
                                              },
                                            },
                                          }}
                                        >
                                          <span className='h-[28px] w-5 flex items-center justify-center absolute top-[3px] bg-[#FEF2F2] right-[2px] cursor-pointer'>
                                            <React.Suspense fallback={null}>
                                              <ErrorInfoIcon
                                                alt='error'
                                                className='w-5 h-3.5'
                                              />
                                            </React.Suspense>
                                          </span>
                                        </Tooltip>
                                      )}
                                    </div>
                                  )}

                                  {col.name === 'action' && (
                                    <Tooltip
                                      title={'Remove question'}
                                      disableHoverListener={isBtnDisabled}
                                      arrow
                                      placement='top'
                                    >
                                      <button
                                        type='button'
                                        onClick={() =>
                                          handleRemoveQuestion(index)
                                        }
                                        style={{
                                          cursor: isBtnDisabled
                                            ? 'default'
                                            : 'pointer',
                                          background: 'transparent',
                                          border: 'none',
                                          padding: 0,
                                          marginTop: '6px',
                                        }}
                                        aria-label='Remove question'
                                        disabled={isBtnDisabled}
                                      >
                                        <React.Suspense fallback={null}>
                                          <KeyContactRemoveIcon
                                            alt='Remove'
                                            style={{ width: 20, height: 20 }}
                                          />
                                        </React.Suspense>
                                      </button>
                                    </Tooltip>
                                  )}
                                </TableCell>
                              );
                            })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
              <div className='mt-2 pl-10'>
                <button
                  className='flex items-center cursor-pointer gap-1 bg-[#EAF0F5] h-[30px] rounded-[2px] color-[#2D3E4F] px-2 text-[12px] font-semibold disabled:bg-gray-100 disabled:opacity-75 disabled:cursor-default'
                  type='button'
                  onClick={handleAddQuestion}
                  disabled={shouldDisableField(
                    'questions',
                    isEditView,
                    permissionMap
                  )}
                >
                  <span>
                    <React.Suspense fallback={null}>
                      <KeyContactAddIcon alt='add-btn' className='w-5 h-5' />
                    </React.Suspense>
                  </span>
                  Add New Question
                </button>
              </div>
            </div>

            <div className={`${isEditView ? 'block' : 'hidden'}`}>
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
                    hide: shouldHideField('rid', isEditView, permissionMap),
                  },
                  {
                    label: 'Created On',
                    value: formData.created_on,
                    hide: shouldHideField(
                      'created_datetime',
                      isEditView,
                      permissionMap
                    ),
                  },
                  {
                    label: 'Created By',
                    value: formData.created_by,
                    hide: shouldHideField(
                      'created_by',
                      isEditView,
                      permissionMap
                    ),
                  },
                  {
                    label: 'Template ID',
                    value: formData.template_rid,
                    hide: shouldHideField(
                      'r_number',
                      isEditView,
                      permissionMap
                    ),
                  },
                  {
                    label: 'Updated On',
                    value: formData.updated_on,
                    hide: shouldHideField(
                      'modified_datetime',
                      isEditView,
                      permissionMap
                    ),
                  },
                  {
                    label: 'Updated By',
                    value: formData.updated_by,
                    hide: shouldHideField(
                      'modified_by',
                      isEditView,
                      permissionMap
                    ),
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

export default TemplateForm;
