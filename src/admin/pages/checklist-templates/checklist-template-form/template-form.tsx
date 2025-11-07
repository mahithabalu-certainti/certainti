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
import { useParams, useLocation } from 'react-router-dom';
import TextButton from '../../../../components/button/text-button';
import { useToast } from '../../../../hooks';
import { AllPermissions, useGetStatus } from '../../../../common-service';
import {
  validateTemplateForm,
  ChecklistTemplateFormData,
  ChecklistTemplateFormErrors,
  ChecklistTemplateFormQuestion,
  transformToNewCreateTemplatePayload,
  transformToEditTemplatePayload,
  getQuestionTableColumns,
  ChecklistTemplateFormTableColumn,
  ChecklistTemplateQuestionErrors,
  COMMON_MENU_PROPS,
  getSelectStyles,
  shouldDisableField,
  shouldHideField,
} from './helper';
import {
  ChecklistIcon,
  ErrorInfoIcon,
  KeyContactAddIcon,
  KeyContactRemoveIcon,
} from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import {
  useChecklistTemplateDetails,
  useCreateTemplate,
  useUpdateChecklistTemplateDetails,
} from '../../../service/checklist-templates/checklist-template-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';

const ChecklistTemplateForm: React.FC = () => {
  const { successToast } = useToast();
  const { caseId } = useParams();
  const location = useLocation();
  const [formData, setFormData] = useState<ChecklistTemplateFormData>({
    checklist_name: '',
    description: '',
    status: '',
    questions: [
      {
        question_seq_num: 'SNO_1',
        question: '',
        description: '',
        // is_mandatory: false,
        // notes: '',
      },
    ],
    rid: '',
    checklist_rid: '',
    created_on: '',
    created_by: '',
    updated_on: '',
    updated_by: '',
  });
  const [errors, setErrors] = useState<ChecklistTemplateFormErrors>({});

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  // Permission
  const { permission } = useSelector((state: RootState) => state.permission);

  const checklistTemplateViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.CHECKLIST_TEMPLATES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    checklistTemplateViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [checklistTemplateViewEditFields]);

  const statusData = useGetStatus();
  const createChecklistTemplate = useCreateTemplate();
  const updateChecklistTemplate = useUpdateChecklistTemplateDetails();

  const { data: templateData, isLoading } = useChecklistTemplateDetails(
    caseId || ''
  );

  const commonSuccess =
    createChecklistTemplate.isSuccess || updateChecklistTemplate.isSuccess;

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Checklist Template updated successfully'
          : 'Checklist Template created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  useEffect(() => {
    if (templateData && isEditView) {
      setFormData((prev) => ({
        ...prev,
        checklist_name: templateData.checklist_name || '',
        description: templateData.checklist_description || '',
        status: templateData.status_rid || '',
        rid: templateData.checklist_template_rid || '',
        checklist_rid: templateData.r_number || '',
        created_by: templateData.created_by || '',
        created_on: templateData.created_datetime
          ? formatDateToYYYYMMDDWithTime(templateData.created_datetime)
          : '',
        updated_by: templateData.modified_by || '',
        updated_on: templateData.modified_datetime
          ? formatDateToYYYYMMDDWithTime(templateData.modified_datetime)
          : '',
        questions:
          templateData.checklist_items &&
          templateData.checklist_items.length > 0
            ? templateData.checklist_items.map((qus, index) => ({
                question_seq_num: qus.sequence_no || `SNO-${index + 1}`,
                question: (qus.checklist_item_name || '').trim(),
                description: qus.description || '',
                rid: qus.rid,
              }))
            : [
                {
                  question_seq_num: 'SNO_1',
                  question: '',
                  description: '',
                },
              ],
      }));
    }
  }, [isEditView, templateData]);

  const statusOptions = useMemo(
    () =>
      statusData.data?.data?.status?.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [statusData.data?.data?.status]
  );

  const handleInputChange = (
    field: keyof ChecklistTemplateFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const handleQuestionChange = (
    index: number,
    field: keyof ChecklistTemplateFormQuestion,
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
          description: '',
        },
      ],
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions.splice(index, 1);

    if (updatedQuestions.length === 0) {
      updatedQuestions.push({
        question_seq_num: 'SNO_1',
        question: '',
        description: '',
      });
    }

    setFormData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));

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

    if (isEditView && templateData) {
      const editPayload = transformToEditTemplatePayload(
        formData,
        templateData
      );
      updateChecklistTemplate.mutate(editPayload);
    } else {
      const newPayload = transformToNewCreateTemplatePayload(formData);
      createChecklistTemplate.mutate(newPayload);
    }
  };

  const goBack = () => {
    window.history.back();
  };

  const questionTableColumns = getQuestionTableColumns();
  const formLoading = isLoading || statusData.isLoading;

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white border-b border-[#CBD6E2]'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <ChecklistIcon
            alt='checklist-template-icon'
            className='h-[24px] w-[24px] p-1 rounded [&>path]:stroke-[#fff] bg-[#3EBEB5]'
          />
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {`Checklist Template ${isEditView ? `> ${templateData?.r_number}` : ''}`}
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
              createChecklistTemplate.isPending ||
              updateChecklistTemplate.isPending
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
              createChecklistTemplate.isPending ||
              updateChecklistTemplate.isPending
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
            <div className='border-b capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10'>
              Checklist Information
            </div>

            <div className='grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-4'>
              <div
              // style={{
              //   display: shouldHideField(
              //     'checklist_name',
              //     isEditView,
              //     permissionMap
              //   )
              //     ? 'none'
              //     : 'block',
              // }}
              >
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='checklist_name'
                >
                  Checklist Name
                  <span className='text-red-500'> *</span>
                </label>
                <input
                  type='text'
                  name='checklist_name'
                  required
                  placeholder='Enter Checklist Name'
                  onChange={(e) =>
                    handleInputChange('checklist_name', e.target.value)
                  }
                  // disabled={shouldDisableField(
                  //   'checklist_name',
                  //   isEditView,
                  //   permissionMap
                  // )}
                  autoComplete='off'
                  className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.checklist_name ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                  value={formData.checklist_name}
                />
                {errors?.checklist_name && (
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {errors.checklist_name}
                  </span>
                )}
              </div>

              <div
              // style={{
              //   display: shouldHideField(
              //     'status_rid',
              //     isEditView,
              //     permissionMap
              //   )
              //     ? 'none'
              //     : 'block',
              // }}
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
                  MenuProps={COMMON_MENU_PROPS}
                  sx={getSelectStyles(!!errors?.status, formData.status === '')}
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
              className='grid grid-cols-1 px-10 pt-4'
              style={{
                display: shouldHideField(
                  'description',
                  isEditView,
                  permissionMap
                )
                  ? 'none'
                  : 'block',
              }}
            >
              <label
                htmlFor='description'
                className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
              >
                Description
              </label>
              <textarea
                name='description'
                placeholder='Enter Description'
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                disabled={shouldDisableField(
                  'description',
                  isEditView,
                  permissionMap
                )}
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
                Checkist Template Items
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
                          .map((col: ChecklistTemplateFormTableColumn) => (
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
                            .map((col: ChecklistTemplateFormTableColumn) => {
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
                                  col.name as keyof ChecklistTemplateQuestionErrors
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
                                        name='checklist_question'
                                        placeholder='Enter Checklist Item'
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

                                  {col.name === 'description' && (
                                    <div
                                      className={`flex relative ${error ? 'bg-[#FEF2F2]' : ''}`}
                                    >
                                      <textarea
                                        name='checklist_description'
                                        placeholder='Enter Description'
                                        autoComplete='off'
                                        className={`outline-none placeholder-custom-color w-full sm:text-sm p-2 resize-none focus:border-2 focus:border-blue-400 ${error ? 'bg-[#FEF2F2] focus:!bg-[#FEF2F2]' : ''}`}
                                        onChange={(e) =>
                                          handleQuestionChange(
                                            index,
                                            'description',
                                            e.target.value
                                          )
                                        }
                                        value={question.description}
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
                  // disabled={shouldDisableField(
                  //   'questions',
                  //   isEditView,
                  //   permissionMap
                  // )}
                >
                  <span>
                    <React.Suspense fallback={null}>
                      <KeyContactAddIcon alt='add-btn' className='w-5 h-5' />
                    </React.Suspense>
                  </span>
                  Add New Item
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
                    // hide: shouldHideField('rid', isEditView, permissionMap),
                    hide: false,
                  },
                  {
                    label: 'Created On',
                    value: formData.created_on,
                    // hide: shouldHideField(
                    //   'created_datetime',
                    //   isEditView,
                    //   permissionMap
                    // ),
                    hide: false,
                  },
                  {
                    label: 'Created By',
                    value: formData.created_by,
                    // hide: shouldHideField(
                    //   'created_by',
                    //   isEditView,
                    //   permissionMap
                    // ),
                    hide: false,
                  },
                  {
                    label: 'Checklist ID',
                    value: formData.checklist_rid,
                    // hide: shouldHideField(
                    //   'r_number',
                    //   isEditView,
                    //   permissionMap
                    // ),
                    hide: false,
                  },
                  {
                    label: 'Updated On',
                    value: formData.updated_on,
                    // hide: shouldHideField(
                    //   'modified_datetime',
                    //   isEditView,
                    //   permissionMap
                    // ),
                    hide: false,
                  },
                  {
                    label: 'Updated By',
                    value: formData.updated_by,
                    // hide: shouldHideField(
                    //   'modified_by',
                    //   isEditView,
                    //   permissionMap
                    // ),
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

export default ChecklistTemplateForm;
