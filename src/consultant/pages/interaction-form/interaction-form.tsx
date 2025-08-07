import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  SelectChangeEvent,
} from '@mui/material';
import {
  ErrorInfoIcon,
  InteractionDetailIcon,
  KeyContactAddIcon,
  KeyContactRemoveIcon,
} from '../../../assets';
import TextButton from '../../../components/button/text-button';
import { getQuestionTableColumns, validateInteractionForm } from './helper';
import { useInteractionDetails } from '../../services/interactions/interactions-service';
import SkeletonForm from '../../../components/form-builder/skeleton-form';
import { useAccountProjects } from '../../services/project';
import { Project } from '../../types/project';
import { SelectOption } from '../../types';
import {
  InteractionData,
  InteractionQuestion,
  InteractionTableColumn,
  ProjectDetails,
} from './types';
import SingleSkeleton from '../../../components/skeleton-component/singleskeleton';
import { TruncateWithTooltip } from '../../../components';

const InteractionForm = () => {
  const { interactionId } = useParams();
  const [searchParams] = useSearchParams();
  const [focusedField, setFocusedField] = useState<{
    index: number;
    field: string;
  } | null>(null);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [formData, setFormData] = useState<InteractionData>({
    accountName: '',
    projectCode: '',
    projectName: '',
    fiscalYear: 0,
    questions: [
      {
        questionNo: '-',
        question: '',
        mandatory: false,
        notes: '',
      },
    ],
  });

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const projectDetails = searchParams.get('projectDetails');
  const projectId = searchParams.get('projectId') || '';
  const accountId = searchParams.get('accountId') || '';
  const source = searchParams.get('source');
  const accountName = searchParams.get('account_name');
  const isProjectFields = source !== 'account';

  useEffect(() => {
    if (projectDetails && source !== 'account') {
      try {
        const details: ProjectDetails = JSON.parse(
          decodeURIComponent(projectDetails)
        );
        setFormData((prev) => ({
          ...prev,
          accountName: details.account_name,
          projectCode: details.project_code,
          projectName: details.project_name,
          fiscalYear: details.fiscal_year,
        }));
      } catch (error) {
        console.error('Error parsing projectDetails', error);
      }
    } else if (source === 'account') {
      setFormData((prev) => ({
        ...prev,
        accountName: accountName || '',
      }));
    }
  }, [accountName, projectDetails, searchParams, source]);

  const { data, isLoading } = useInteractionDetails(projectId, interactionId);

  const { data: projectsData, isLoading: projectsLoading } = useAccountProjects(
    {
      page: 1,
      limit: 1000,
      sortBy: 'project_code',
      sortOrder: 'ASC',
      accountNumber: accountId,
    },
    !isProjectFields
  );

  useEffect(() => {
    if (data && isEditView) {
      setFormData((prev) => ({
        ...prev,
        created_by: data.created_by,
        created_on: data.created_on,
        rid: data.rid,
        interaction_id: data.r_number,
        status: data.status,
        questions:
          data.questions.length > 0
            ? data.questions.map((q) => ({
                questionNo: q.question_id,
                question: q.question || '',
                mandatory: q.mandatory ?? false,
                notes: q.notes || '',
              }))
            : [
                {
                  questionNo: '-',
                  question: '',
                  mandatory: false,
                  notes: '',
                },
              ],
      }));
    }
  }, [data, isEditView]);

  useEffect(() => {
    if (projectsData) {
      setProjectList(projectsData.projects);
    }
  }, [projectsData]);

  const projectCodeList: SelectOption[] = useMemo(() => {
    return (
      projectsData?.projects.flatMap((project) =>
        project.ProjectFiscal && project.ProjectFiscal.length > 0
          ? [
              {
                label: project.project_code,
                value: project.project_code,
              },
            ]
          : []
      ) || []
    );
  }, [projectsData?.projects]);

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    const projectCode = event.target.value;

    const selectedProject = projectList.find((project) =>
      project.ProjectFiscal?.some(
        (fiscal) => fiscal.project_code === projectCode
      )
    );

    if (selectedProject) {
      const matchingFiscal = selectedProject.ProjectFiscal.find(
        (fiscal) => fiscal.project_code === projectCode
      );

      setFormData((prev) => ({
        ...prev,
        projectCode: matchingFiscal?.project_code || '',
        projectName: matchingFiscal?.project_name || '',
        fiscalYear: matchingFiscal?.fiscal_year || 0,
        errors: {
          ...prev.errors,
          projectCode: undefined,
          projectName: undefined,
          fiscalYear: undefined,
        },
      }));
    }
  };

  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          // questionNo: `${prev.questions.length + 1}`,
          questionNo: '-',
          question: '',
          mandatory: false,
          notes: '',
        },
      ],
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData((prev) => {
      const updatedQuestions = prev.questions.filter((_, i) => i !== index);

      if (updatedQuestions.length === 0) {
        updatedQuestions.push({
          questionNo: '-',
          question: '',
          mandatory: false,
          notes: '',
        });
      }

      return {
        ...prev,
        questions: updatedQuestions,
      };
    });
  };

  const handleQuestionChange = (
    index: number,
    field: keyof InteractionQuestion,
    value: string | boolean
  ) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value,
        errors: {
          ...updatedQuestions[index].errors,
          [field]: undefined,
        },
      };
      return {
        ...prev,
        questions: updatedQuestions,
      };
    });
  };

  const validateForm = (): boolean => {
    const { isValid, updatedData } = validateInteractionForm(
      formData,
      searchParams.get('source')
    );
    setFormData(updatedData);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    console.log(formData);
  };

  const handleExternalSubmit = () => {
    handleSubmit();
  };

  const statusOptions = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Created', label: 'Created' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Response Draft', label: 'Response Draft' },
    { value: 'Response Received', label: 'Response Received' },
    { value: 'On-Hold', label: 'On-Hold' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  const questionTableColumns = getQuestionTableColumns(isEditView);

  const goBack = () => {
    window.history.back();
  };

  const formLoading = isLoading || projectsLoading;

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <InteractionDetailIcon className='h-8 w-8 bg-[#6FBDA0] p-1.5 border-box rounded' />
          <div className='w-[90%]'>
            {isEditView && (
              <>
                {isLoading ? (
                  <div className='ml-2'>
                    <SingleSkeleton width={150} height={12} />
                  </div>
                ) : (
                  <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                    {isProjectFields
                      ? `Project > ${formData.projectCode} > ${data?.r_number}`
                      : `Account > ${formData.accountName} > ${formData.projectCode} > ${data?.r_number}`}
                  </div>
                )}
              </>
            )}
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              {isEditView ? 'Edit Interaction' : 'New Interaction'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            // loading={createAccount.isPending || updateAccount.isPending}
            onClick={handleExternalSubmit}
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
      <div className={`${isEditView ? 'pb-10' : 'pb-4'}`}>
        {formLoading ? (
          <SkeletonForm />
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10`}
            >
              Basic Information
            </div>

            <div
              className={`grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-1`}
            >
              <div>
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='account_name'
                >
                  Account Name
                </label>
                <input
                  type='text'
                  name='account_name'
                  placeholder='Enter Account Name'
                  autoComplete='off'
                  className='placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs'
                  disabled={true}
                  value={formData.accountName}
                />
              </div>
            </div>

            <div
              className={`grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-1 mb-5`}
            >
              {!isProjectFields ? (
                <div className='w-full'>
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='project_code'
                  >
                    Project Code
                    <span className='text-red-500'> *</span>
                  </label>
                  <Select
                    name='project_code'
                    className={`custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]
                      ${formData.projectCode === '' ? 'text-[#7D98B6] ' : ''} ${formData.errors?.projectCode && 'border-red-500 bg-[#FEF2F2]'}
                    `}
                    onChange={handleProjectChange}
                    value={formData.projectCode}
                    displayEmpty
                    required
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
                          formData.projectCode === '' ? '#7D98B6' : 'black',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: '#f3f4f6',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: formData?.errors?.projectCode
                          ? '1px solid #ef4444'
                          : '1px solid #CBD6E2',
                        borderRadius: '2px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: formData?.errors?.projectCode
                          ? '1px solid #ef4444'
                          : '1px solid #CBD6E2',
                      },
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
                      Choose Project Code
                    </MenuItem>
                    {projectCodeList?.map((option, i) => (
                      <MenuItem
                        sx={{
                          color: '#425A76',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                        key={`${option.value}-${i}`}
                        value={option.value}
                        title={option.label}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {formData.errors?.projectCode && (
                    <span className='text-[12px] text-red-400 col-span-full'>
                      {formData.errors.projectCode}
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='project_code'
                  >
                    Project Code
                  </label>
                  <input
                    type='text'
                    name='project_code'
                    placeholder='Enter Project Code'
                    autoComplete='off'
                    className='placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs'
                    disabled={true}
                    value={formData.projectCode}
                  />
                </div>
              )}
              <div>
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='project_name'
                >
                  Project Name
                </label>
                <input
                  type='text'
                  name='project_name'
                  placeholder='Enter Project Name'
                  autoComplete='off'
                  className='placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs'
                  disabled={true}
                  value={formData.projectName}
                />
              </div>

              <div>
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='fiscal_year'
                >
                  Fiscal Year
                </label>
                <input
                  type='text'
                  name='fiscal_year'
                  placeholder='Enter Fiscal Year'
                  autoComplete='off'
                  className='placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs'
                  disabled={true}
                  value={formData.fiscalYear}
                />
              </div>

              <div className={`${isEditView ? 'block' : 'hidden'}`}>
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='status'
                >
                  Status
                </label>
                <Select
                  name='status'
                  className={
                    'custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]  ' +
                    (formData.status === '' ? 'text-[#7D98B6] ' : '')
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as string,
                    })
                  }
                  value={formData.status || ''}
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
                      color: formData.status === '' ? '#7D98B6' : 'black',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#f3f4f6',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      // border: field.error
                      //   ? '1px solid #ef4444'
                      //   : '1px solid #CBD6E2',
                      borderRadius: '2px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      // border: field.error
                      //   ? '1px solid #ef4444'
                      //   : '1px solid #CBD6E2',
                    },
                    // '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    //   borderColor: field.error ? '#ef4444' : 'black',
                    // },
                    '& svg': {
                      color: '#7D98B6',
                    },
                  }}
                >
                  {statusOptions?.map((option, i) => (
                    <MenuItem
                      sx={{
                        color: '#425A76',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                      key={`${option.value}-${i}`}
                      value={option.value}
                      title={option.label}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </div>

            <div className='w-full mb-5'>
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
                          .map((col: InteractionTableColumn) => (
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
                            height: '32px !important',
                          }}
                        >
                          {questionTableColumns
                            .filter((col) => !col.hide)
                            .map((col: InteractionTableColumn) => {
                              const isDisabled = col.disabled;
                              const isBtnDisabled =
                                col.disabled ||
                                (formData.questions.length <= 1 && !isEditView);
                              const error =
                                question.errors?.[
                                  col.name as keyof typeof question.errors
                                ];

                              return (
                                <TableCell
                                  key={`${col.name}-${index}`}
                                  style={{
                                    width: col.width,
                                    textAlign: col.align ?? 'left',
                                    position: 'relative',
                                    height: '32px !important',
                                    backgroundColor: error
                                      ? '#FEF2F2'
                                      : 'transparent',
                                  }}
                                >
                                  {col.name === 'questionNo' && (
                                    <div style={{ textAlign: 'center' }}>
                                      {question.questionNo}
                                    </div>
                                  )}

                                  {col.name === 'question' && (
                                    <div>
                                      {focusedField?.index === index &&
                                      focusedField?.field === 'question' ? (
                                        <textarea
                                          name='interaction_question'
                                          placeholder='Enter Interaction Question'
                                          autoComplete='off'
                                          className='absolute top-0 z-10 outline-none w-full sm:text-sm py-2 px-3 resize-none border-2 border-blue-400 bg-white shadow-lg'
                                          onChange={(e) =>
                                            handleQuestionChange(
                                              index,
                                              'question',
                                              e.target.value
                                            )
                                          }
                                          value={question.question}
                                          onBlur={() => setFocusedField(null)}
                                          autoFocus
                                          rows={2}
                                          style={{
                                            top: 0,
                                            left: 0,
                                            minHeight: '40px',
                                          }}
                                        />
                                      ) : (
                                        <TruncateWithTooltip
                                          text={
                                            question.question ||
                                            'Enter Interaction Question'
                                          }
                                          maxWidth={col.width}
                                        >
                                          <span
                                            className='px-3'
                                            onClick={() =>
                                              setFocusedField({
                                                index,
                                                field: 'question',
                                              })
                                            }
                                          >
                                            {question.question || (
                                              <span className='text-[#7D98B6]'>
                                                Enter Interaction Question
                                              </span>
                                            )}
                                          </span>
                                        </TruncateWithTooltip>
                                      )}
                                      {error && (
                                        <Tooltip
                                          title={error}
                                          arrow
                                          placement='top'
                                        >
                                          <span className='h-[32px] w-5 flex items-center justify-center absolute top-0 bg-[#FEF2F2] right-0 pt-1 pr-1 cursor-pointer'>
                                            <ErrorInfoIcon
                                              alt='error'
                                              className='w-5 h-3.5'
                                            />
                                          </span>
                                        </Tooltip>
                                      )}
                                    </div>
                                  )}

                                  {col.name === 'mandatory' && (
                                    <div style={{ textAlign: 'center' }}>
                                      <input
                                        type='checkbox'
                                        checked={question.mandatory}
                                        onChange={(e) =>
                                          handleQuestionChange(
                                            index,
                                            'mandatory',
                                            e.target.checked
                                          )
                                        }
                                        disabled={isDisabled}
                                        className='cursor-pointer disabled:cursor-default scale-105'
                                      />
                                    </div>
                                  )}

                                  {col.name === 'notes' && (
                                    <div>
                                      {focusedField?.index === index &&
                                      focusedField?.field === 'notes' ? (
                                        <textarea
                                          name='notes'
                                          placeholder='Enter Notes'
                                          autoComplete='off'
                                          className='absolute z-10 outline-none w-full sm:text-sm py-2 px-3 resize-none border-2 border-blue-400 bg-white shadow-lg'
                                          value={question.notes}
                                          onChange={(e) =>
                                            handleQuestionChange(
                                              index,
                                              'notes',
                                              e.target.value
                                            )
                                          }
                                          onBlur={() => setFocusedField(null)}
                                          autoFocus
                                          rows={2}
                                          style={{
                                            top: 0,
                                            left: 0,
                                            minHeight: '40px',
                                          }}
                                        />
                                      ) : (
                                        <TruncateWithTooltip
                                          text={question.notes || 'Enter Notes'}
                                          maxWidth={col.width}
                                        >
                                          <span
                                            className='px-3'
                                            onClick={() =>
                                              setFocusedField({
                                                index,
                                                field: 'notes',
                                              })
                                            }
                                          >
                                            {question.notes || (
                                              <span className='text-[#7D98B6]'>
                                                Enter Notes
                                              </span>
                                            )}
                                          </span>
                                        </TruncateWithTooltip>
                                      )}
                                      {error && (
                                        <Tooltip
                                          title={error}
                                          arrow
                                          placement='top'
                                        >
                                          <span className='h-[28px] w-5 flex items-center justify-center absolute top-[3px] bg-[#FEF2F2] right-[2px] cursor-pointer'>
                                            <ErrorInfoIcon
                                              alt='error'
                                              className='w-5 h-3.5'
                                            />
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
                                        <KeyContactRemoveIcon
                                          alt='Remove'
                                          style={{ width: 20, height: 20 }}
                                        />
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
                  className='flex items-center cursor-pointer gap-1 bg-[#EAF0F5] h-[30px] rounded-[2px] color-[#2D3E4F] px-2 text-[12px] font-semibold disabled:cursor-default'
                  type='button'
                  onClick={handleAddQuestion}
                >
                  <span>
                    <KeyContactAddIcon alt='add-btn' className='w-5 h-5' />
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

              <div
                className={`grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-1 mb-4`}
              >
                <div>
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='rid'
                  >
                    Record ID
                  </label>
                  <input
                    type='text'
                    name='rid'
                    placeholder='-'
                    autoComplete='off'
                    className='placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs'
                    disabled={true}
                    value={formData.rid}
                  />
                </div>
                <div className='bg-white'></div>
                <div>
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='interaction_id'
                  >
                    Interaction ID
                  </label>
                  <input
                    type='text'
                    name='interaction_id'
                    placeholder='-'
                    autoComplete='off'
                    className='placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs'
                    disabled={true}
                    value={formData.interaction_id}
                  />
                </div>
                <div>
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='created_on'
                  >
                    Created On
                  </label>
                  <input
                    type='text'
                    name='created_on'
                    placeholder='-'
                    autoComplete='off'
                    className='placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs'
                    disabled={true}
                    value={formData.created_on}
                  />
                </div>
                <div className='bg-white'></div>
                <div>
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='created_by'
                  >
                    Created By
                  </label>
                  <input
                    type='text'
                    name='created_by'
                    placeholder='-'
                    autoComplete='off'
                    className='placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs'
                    disabled={true}
                    value={formData.created_by}
                  />
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InteractionForm;
