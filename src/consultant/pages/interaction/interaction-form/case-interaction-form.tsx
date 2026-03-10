/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Autocomplete,
  MenuItem,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  ColorCode,
  InteractionFormData,
  InteractionFormErrors,
  InteractionFormQuestion,
  InteractionFormTableColumn,
  InteractionProjectKeyContacts,
  InteractionQuestionErrors,
  InteractionTemplateList,
  IRecipient,
  StatusTypeEnum,
} from '../../../types';
import { useToast } from '../../../../hooks';
import {
  useAccountCreateInteraction,
  useCreateInteraction,
  useGetAssessmentSource,
  useGetInteractionTemplate,
  useGetInteractionTemplateDetails,
  useInteractionDetails,
  useInteractionProjectList,
  useUpdateInteractionDetails,
} from '../../../services/interactions/interactions-service';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import {
  getQuestionTableColumns,
  hasFormValuesChanged,
  ProjectDetails,
  shouldDisableField,
  shouldHideField,
  transFormPayload,
  validateInteractionForm,
} from './helper';
import {
  EditIcon,
  ErrorInfoIcon,
  InteractionsIcon,
  KeyContactAddIcon,
  KeyContactRemoveIcon,
} from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import {
  AllPermissions,
  useGetInteractionLevel,
  useGetInteractionStatus,
  useGetStatus,
  // useGetInteractionStatusById,
} from '../../../../common-service';
import { RootState } from '../../../../store/store';
import { useSelector } from 'react-redux';
import { ArrowDropDownIcon } from '@mui/x-date-pickers/icons';
import { ListOption } from '../../../../components/table/types';
import ConfirmationPopup from '../../../../common-utils/confirmation-popup';
import { PreviewDialog } from './preview-model';
import { useAssignProjectsList } from '../../../services/cases-assign-projects/assign-project-service';

const CaseInteractionForm = () => {
  const { interactionId } = useParams();
  const [searchParams] = useSearchParams();
  const { successToast } = useToast();
  const [caseLevelProjectCode, setCaseLevelProjectCode] = useState<string>('');
  const accountName = searchParams.get('accountName');

  const { fiscalYear } = useSelector((state: RootState) => state.account);
  const { permission } = useSelector((state: RootState) => state.permission);
  const [selectedProject, setSelectedProject] = useState<ProjectDetails>({
    account_name: accountName || '',
    project_code: '',
    project_name: '',
    fiscal_year: Number(fiscalYear),
    project_fiscal_rid: '',
    project_rid: '',
    account_rid: '',
  });
  const [formData, setFormData] = useState<InteractionFormData>({
    accountName: accountName || '',
    projectCode: '',
    projectName: '',
    fiscalYear: Number(fiscalYear),
    status: '',
    questions: [
      {
        question_seq_num: 'SNO_1',
        question: '',
        is_mandatory: false,
        is_editable: true,
        notes: '',
      },
    ],
    rid: '',
    interaction_id: '',
    created_on: '',
    created_by: '',
    updated_on: '',
    updated_by: '',
  });
  const [errors, setErrors] = useState<InteractionFormErrors>({});
  const [interactionTemplate, setInteractionTemplate] = useState<ListOption[]>(
    []
  );
  const [currentTemplate, setCurrentTemplate] = useState<ListOption>({
    label: 'Choose Template',
    value: '',
  });
  const [confirmationState, setConfirmationState] = React.useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} });
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [recipiants, setRecipiants] = React.useState<IRecipient>({
    name: '',
    email: '',
  });

  const interactionsViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.INTERACTIONS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    interactionsViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [interactionsViewEditFields]);

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const accountId = searchParams.get('accountId') || '';
  const caseId = searchParams.get('caseId') || '';
  const projectFiscalRid = searchParams.get('project_fiscal_rid') || '';
  const source = searchParams.get('source');

  const caseName = searchParams.get('case_name');

  const { data: otherInteractionData, isLoading } = useInteractionDetails(
    accountId,
    interactionId,
    projectFiscalRid
  );

  const createInteraction = useCreateInteraction();
  const accountCreateInteraction = useAccountCreateInteraction();
  const updateInteraction = useUpdateInteractionDetails();
  const interactionStatus = useGetInteractionStatus();
  const getInteractionLevel = useGetInteractionLevel();
  const interactionTemplates = useGetInteractionTemplate();
  const accountStatusOptions = useGetStatus();
  const assessmentSource = useGetAssessmentSource();
  const interactionTemplateDetails = useGetInteractionTemplateDetails(
    currentTemplate.value as string
  );
  const {
    data: projectListData,
    isLoading: projectListLoading,
    // isError: projectListError,
  } = useAssignProjectsList({
    page: 1,
    limit: 100,
    sort: 'project_type_name',
    sort_by: 'ASC',
    search: '',
    filter: {},
    case_rid: caseId,
    account_rid: accountId, // Replace with the actual account_rid
    fiscal_year: Number(fiscalYear),
  });
  const { data: ProjectList } = useInteractionProjectList(accountId, caseId);
  const interactionData = otherInteractionData;
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      projectCode: caseLevelProjectCode,
      projectName: '',
    }));
  }, [caseLevelProjectCode]);

  useEffect(() => {
    if (caseLevelProjectCode && source !== 'account') {
      try {
        const foundProject = projectListData?.projects?.find(
          (item) => item.project_code === caseLevelProjectCode
        );
        if (!foundProject) return;
        const details: ProjectDetails = {
          account_name: accountName || '',
          project_code: foundProject.project_code || '',
          project_name: foundProject.project_name || '',
          fiscal_year: foundProject.fiscal_year || 0,
          project_fiscal_rid: foundProject.rid || '',
          project_rid: foundProject.project_rid || '',
          account_rid: foundProject.account_rid || '',
        };

        setFormData((prev) => ({
          ...prev,
          accountName: details.account_name,
          projectCode: details.project_code,
          projectName: details.project_name,
          fiscalYear: details.fiscal_year,
        }));
        setSelectedProject(details);
      } catch (error) {
        console.error('Error parsing projectDetails', error);
      }
    }
  }, [accountName, caseLevelProjectCode, searchParams, source]);

  // Fixed useEffect for setting recipients - removed the condition that prevented it from running during creation
  useEffect(() => {
    if (isEditView) {
      // Edit view: use interaction data
      setRecipiants({
        name: interactionData?.recipient_name || '',
        email: interactionData?.recipient_email || '',
      });
    } else {
      const match = ProjectList?.find(
        (item: InteractionProjectKeyContacts) =>
          item.project_fiscal_rid === selectedProject.project_fiscal_rid
      );

      if (match) {
        setRecipiants({
          name: match.key_contact_name || '',
          email: match.key_contact_email || '',
        });
      }
      // Don't reset to empty if no match - keep whatever was there before
    }
  }, [isEditView, selectedProject, formData, ProjectList, interactionData]);

  const isProjectInteractionLevel =
    interactionData?.interaction_level_name?.toLocaleLowerCase() === 'project';
  const commonSuccess =
    createInteraction.isSuccess ||
    accountCreateInteraction.isSuccess ||
    updateInteraction.isSuccess;
  const questionTableColumns = getQuestionTableColumns(isEditView);
  const formLoading = isLoading || interactionStatus.isLoading;

  const statusOptions = useMemo(
    () =>
      interactionStatus.data?.data.interactionStatus.map((status) => ({
        label: status.status_name,
        value: status.rid,
        disable: !status.status_type,
      })) || [],
    [interactionStatus.data?.data.interactionStatus]
  );
  const memoizedInteractionLevel = useMemo(
    () =>
      getInteractionLevel.data?.data.interactionLevel
        .filter((it) => it.interaction_level_name.toLowerCase() !== 'all')
        .map((status) => ({
          option: status.interaction_level_name,
          value: status.rid,
        })) || [],
    [getInteractionLevel.data?.data.interactionLevel]
  );
  const memoizedProjectOptions = useMemo(
    () =>
      projectListData?.projects?.map((p) => ({
        option: p.project_code,
        value: p.project_code,
        name: p.project_name,
        rid: p.project_rid,
      })) || [],
    [projectListData?.projects]
  );

  useEffect(() => {
    if (interactionData && isEditView) {
      setFormData((prev) => ({
        ...prev,
        created_by: interactionData.created_by,
        created_on: formatDateToYYYYMMDDWithTime(
          interactionData.created_datetime
        ),
        updated_by: interactionData.modified_by,
        updated_on: formatDateToYYYYMMDDWithTime(
          interactionData.modified_datetime
        ),
        rid: interactionData.interaction_rid || interactionId,
        interaction_id: interactionData.r_number,
        projectCode:
          interactionData.project_code || selectedProject.project_code,
        projectName:
          interactionData.project_name || selectedProject.project_name || '',
        accountName:
          interactionData.account_name ||
          selectedProject.account_name ||
          accountName ||
          '',
        fiscalYear: Number(interactionData.fiscal_year),
        status: interactionData?.status_name || '',
        questions:
          interactionData.questions.length > 0
            ? interactionData.questions.map((qus, index) => ({
                question_seq_num: qus.question_seq_num || `Q00-${index + 1}`,
                question: qus.question.trim() || '',
                is_mandatory: qus.is_mandatory ?? false,
                notes: qus.notes.trim() || '',
                is_editable: qus.is_editable ?? true,
                rid: qus.rid,
              }))
            : [
                {
                  question_seq_num: 'SNO_1',
                  question: '',
                  is_mandatory: false,
                  is_editable: true,
                  notes: '',
                },
              ],
      }));
    }
  }, [
    selectedProject.account_name,
    selectedProject.project_code,
    selectedProject.project_name,
    interactionData,
    interactionId,
    isEditView,
    accountName,
  ]);
  const goBack = () => {
    window.history.back();
  };
  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Interaction updated successfully'
          : 'Interaction created successfully'
      );
      goBack();
    }
  }, [commonSuccess, isEditView]);
  useEffect(() => {
    if (memoizedInteractionLevel.length > 0) {
      interactionTemplates.mutate(
        {
          sortBy: 'template_name',
          sortOrder: 'ASC',
          apiSource: 'interaction',
          templateType: 'Project',
          filters: {},
        },
        {
          onSuccess: (res: {
            interactions: InteractionTemplateList[];
            count: number;
          }) => {
            setInteractionTemplate(
              res.interactions.map((it, i) => ({
                label: it.template_name || i.toString(),
                value: it.rid,
              }))
            );
          },
        }
      );
    }
  }, [memoizedInteractionLevel, isProjectInteractionLevel]);
  useEffect(() => {
    if (interactionTemplateDetails.data) {
      setFormData((prev) => ({
        ...prev,
        questions:
          interactionTemplateDetails?.data?.questions &&
          interactionTemplateDetails.data.questions.length > 0
            ? interactionTemplateDetails.data.questions.map((qus, index) => ({
                question_seq_num: qus.question_seq_num || `Q00-${index + 1}`,
                question: qus.question.trim() || '',
                is_mandatory: qus.is_mandatory ?? false,
                notes: qus.notes.trim() || '',
                is_editable: qus.is_editable ?? true,
              }))
            : [
                {
                  question_seq_num: 'SNO_1',
                  question: '',
                  is_mandatory: false,
                  is_editable: true,
                  notes: '',
                },
              ],
      }));
    }
  }, [interactionTemplateDetails.data]);

  const handleAddQuestion = () => {
    setFormData((prev) => {
      // Find the highest sequence number
      const highestSeq = prev.questions.reduce((max, q) => {
        const seqNum = parseInt(q.question_seq_num.replace('SNO_', ''));
        return isNaN(seqNum) ? max : Math.max(max, seqNum);
      }, 0);

      return {
        ...prev,
        questions: [
          ...prev.questions,
          {
            question_seq_num: `SNO_${highestSeq + 1}`,
            question: '',
            is_mandatory: false,
            is_editable: true,
            notes: '',
          },
        ],
      };
    });
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
        is_editable: true,
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
  const handleQuestionChange = (
    index: number,
    field: keyof InteractionFormQuestion,
    value: string | boolean
  ) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value,
      };
      return {
        ...prev,
        questions: updatedQuestions,
      };
    });

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
  const validateForm = (): boolean => {
    const { isValid, errors: validationErrors } = validateInteractionForm(
      formData,
      searchParams.get('source')
    );

    // Add project code validation
    if (!caseLevelProjectCode) {
      validationErrors.projectCode = 'Project Code is required';
    }

    setErrors(validationErrors);
    return isValid && !!caseLevelProjectCode;
  };
  const handleSubmit = () => {
    if (isEditView && !hasFormValuesChanged(formData, interactionData)) {
      goBack(); // No changes, just go back
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Set loading state based on action
    setSaveLoading(true);

    // update flow
    if (isEditView && interactionData) {
      updateInteractionComplete();
    } else {
      createInteractionComplete();
    }
  };
  const saveAndSend = () => {
    if (validateForm()) {
      setPreviewDialog(true);
    }
  };
  const updateInteractionComplete = (
    trigger_send?: boolean,
    recipiants?: IRecipient
  ) => {
    const draftStatus = statusOptions.find(
      (option) => option.label.toLowerCase() === StatusTypeEnum.draft
    );
    const payload = transFormPayload(
      accountId,
      formData,
      isEditView,
      draftStatus?.value || '',
      interactionData,
      selectedProject
    );
    // if (isAccountFields) {
    //   updateInteraction.mutate(
    //     {
    //       account_rid: payload.account_rid,
    //       status_rid: payload.status_rid,
    //       questions: payload.questions,
    //       interaction_rid: payload.interaction_rid,
    //       interaction_level_rid:
    //         getInteractionLevel.data?.data.interactionLevel.find(
    //           (it) =>
    //             it.interaction_level_name.toLocaleLowerCase() === 'account'
    //         )?.rid,
    //       fiscal_year: formData.fiscalYear,
    //       trigger_send: !!trigger_send,
    //       ...(recipiants?.email && { email_info: recipiants }),
    //     },
    //     {
    //       onError: () => {
    //         setSaveLoading(false);
    //       },
    //       onSuccess: () => {
    //         setSaveLoading(false);
    //       },
    //     }
    //   );
    // } else {
    updateInteraction.mutate(
      {
        account_rid: payload.account_rid,
        project_rid: payload.project_rid,
        project_fiscal_rid: payload.project_fiscal_rid,
        status_rid: payload.status_rid,
        questions: payload.questions,
        interaction_rid: payload.interaction_rid,
        interaction_level_rid:
          getInteractionLevel.data?.data.interactionLevel.find(
            (it) => it.interaction_level_name.toLocaleLowerCase() === 'project'
          )?.rid,
        trigger_send: !!trigger_send,
        ...(recipiants?.email && { email_info: recipiants }),
      },
      {
        onError: () => {
          setSaveLoading(false);
        },
        onSuccess: () => {
          setSaveLoading(false);
        },
      }
    );
    // }
  };
  const createInteractionComplete = (
    trigger_send?: boolean,
    recipiants?: IRecipient
  ) => {
    const draftStatus = statusOptions.find(
      (option) => option.label.toLowerCase() === StatusTypeEnum.draft
    );
    const payload = transFormPayload(
      accountId,
      formData,
      isEditView,
      draftStatus?.value || '',
      interactionData,
      selectedProject
    );
    createInteraction.mutate(
      {
        ...payload,
        trigger_send: !!trigger_send,
        ...(recipiants?.email && { email_info: recipiants }),
        interaction_assessment_source_rid: assessmentSource.data?.data.find(
          (option) =>
            option.interaction_assessment_source_name.toLowerCase() === 'manual'
        )?.rid,
        interaction_status_rid: accountStatusOptions?.data?.data?.status.find(
          (option) => option.status_name.toLowerCase() === 'active'
        )?.rid,
      },
      {
        onError: () => {
          setSaveLoading(false);
        },
        onSuccess: () => {
          setSaveLoading(false);
        },
      }
    );
  };

  // Handle project code change with error validation
  const handleProjectCodeChange = (value: string) => {
    setCaseLevelProjectCode(value);

    // Clear project code error when user selects a project
    if (value) {
      setErrors((prev) => ({
        ...prev,
        projectCode: undefined,
      }));
    }
  };

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          {isEditView ? (
            <EditIcon
              alt='projrct-icon'
              className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${ColorCode.projectTextColor}] bg-[${ColorCode.caseBgColor}]`}
            />
          ) : (
            <InteractionsIcon
              alt='menu-icon'
              className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${ColorCode.projectTextColor}] bg-[${ColorCode.caseBgColor}]`}
            />
          )}
          <div className='w-[90%]'>
            {isEditView && (
              <>
                {isLoading ? (
                  <div className='ml-2'>
                    <SingleSkeleton width={150} height={12} />
                  </div>
                ) : (
                  <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                    {`Cases > ${caseName} > ${interactionData?.r_number}`}
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
          <Autocomplete
            disableClearable
            forcePopupIcon
            popupIcon={<ArrowDropDownIcon />}
            slotProps={{ paper: { style: { fontSize: '0.7rem' } } }}
            options={interactionTemplate}
            size='small'
            sx={{
              height: '24px',
              fontSize: '13px',
              width: '160px',
              '&.MuiAutocomplete-root .MuiOutlinedInput-root': {
                height: '24px',
                background: 'transparent',
              },
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
                color: 'black',
              },
              '&.Mui-disabled': {
                backgroundColor: '#f3f4f6',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #CBD6E2',
                borderRadius: '2px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #CBD6E2',
              },
              '& svg': {
                color: '#7D98B6',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#7D98B6',
                opacity: 1,
              },
            }}
            onChange={(_e, newValue) => {
              if (isEditView || currentTemplate.value) {
                //If template already choose
                setConfirmationState({
                  isOpen: true,
                  message:
                    'The current questions will be deleted, are you sure you want to continue?',
                  onConfirm: () => {
                    setCurrentTemplate(newValue);
                  },
                  onCancel: () => {
                    setCurrentTemplate(currentTemplate);
                  },
                });
              } else {
                setCurrentTemplate(newValue);
              }
            }}
            value={currentTemplate}
            renderInput={(params) => (
              <TextField
                {...params}
                variant='outlined'
                size='small'
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    fontSize: '0.8rem',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#7D98B6',
                    opacity: 1,
                  },
                }}
                placeholder='Choose Template'
              />
            )}
          />
          <TextButton
            label='Save and Send'
            disabled={saveLoading}
            onClick={saveAndSend}
            sx={{
              width: '120px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Save'
            loading={saveLoading}
            disabled={saveLoading}
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
            disabled={saveLoading}
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
            <div
              className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10`}
            >
              Basic Information
            </div>

            <div
              className={`grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-1`}
            >
              <div
                style={{
                  display: shouldHideField(
                    'account_name',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
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
                  className='placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs'
                  disabled={true}
                  value={formData.accountName}
                />
              </div>

              {/* {isAccountInteractionLevel && isAccountFields && (
                <div>
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='account_name'
                  >
                    Fiscal Year
                    <span className='text-red-500 text-[16px]'>*</span>
                  </label>
                  <FormFiscalYearDropdown
                    fiscalYear={String(formData.fiscalYear)}
                    fiscalYearsOptions={getFiscalYears(
                      DATE_CONFIG.COST_FISCAL_YEARS_RANGE
                    )}
                    isError={!!errors.fiscalYear}
                    onChange={(e) => {
                      setFormData((prev) => {
                        return {
                          ...prev,
                          fiscalYear: Number(e.target.value),
                        };
                      });
                      setErrors((prev) => {
                        return {
                          ...prev,
                          fiscalYear: '',
                        };
                      });
                    }}
                  />
                  {errors?.fiscalYear && (
                    <span className='text-[12px] text-red-400 col-span-full'>
                      {errors.fiscalYear}
                    </span>
                  )}
                </div>
              )} */}
            </div>
            <div
              className={`grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-1 mb-5`}
            >
              <>
                <div>
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='account_name'
                  >
                    Project Code
                    <span className='text-red-500 text-[16px]'>*</span>
                  </label>
                  {projectListLoading ? (
                    <Skeleton variant='rounded' width='100%' height={32} />
                  ) : (
                    <Select
                      name='CasesLevel'
                      className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                      displayEmpty
                      fullWidth
                      value={caseLevelProjectCode}
                      disabled={isEditView}
                      size='small'
                      error={!!errors.projectCode}
                      renderValue={(selected) => {
                        if (!selected) {
                          return (
                            <span style={{ color: '#9ca3af' }}>
                              Choose Project
                            </span>
                          ); // <-- placeholder
                        }
                        return selected;
                      }}
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
                        borderRadius: '2px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#d1d5db',
                        },
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
                          color: 'black',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: '#f3f4f6',
                        },
                        '& svg': {
                          color: '#7D98B6',
                        },
                        ...(errors.projectCode && {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ef4444',
                          },
                        }),
                      }}
                      onChange={(e) => {
                        handleProjectCodeChange(e.target.value);
                      }}
                    >
                      {/* Placeholder MenuItem for internal value */}
                      <MenuItem value='' disabled style={{ display: 'none' }}>
                        Select Project
                      </MenuItem>

                      {memoizedProjectOptions.map((it, i) => (
                        <MenuItem
                          sx={{
                            color: '#425A76',
                            fontSize: '13px',
                            fontWeight: '500',
                          }}
                          value={it.value}
                          title={it.value}
                          key={i}
                        >
                          {it.option}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                  {errors.projectCode && (
                    <p className='text-red-500 text-xs mt-1 ml-1'>
                      {errors.projectCode}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: shouldHideField(
                      'project_name',
                      isEditView,
                      permissionMap
                    )
                      ? 'none'
                      : 'block',
                  }}
                >
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='project_name'
                  >
                    Project Name
                  </label>
                  <input
                    type='text'
                    name='project_name'
                    placeholder='-'
                    autoComplete='off'
                    className='placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs'
                    disabled={true}
                    value={formData.projectName}
                  />
                </div>
                <div
                  style={{
                    display: shouldHideField(
                      'fiscal_year',
                      isEditView,
                      permissionMap
                    )
                      ? 'none'
                      : 'block',
                  }}
                >
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='fiscal_year'
                  >
                    Fiscal Year
                  </label>
                  <input
                    type='text'
                    name='fiscal_year'
                    placeholder='-'
                    autoComplete='off'
                    className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.fiscalYear && 'border-red-500 disabled:!bg-[#FEF2F2] bg-[#FEF2F2]'}`}
                    disabled={true}
                    value={
                      formData.fiscalYear ? `FY-${formData.fiscalYear}` : ''
                    }
                  />
                  {errors?.fiscalYear && (
                    <span className='text-[12px] text-red-400 col-span-full'>
                      {errors.fiscalYear}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display:
                      isEditView &&
                      !shouldHideField('status', isEditView, permissionMap)
                        ? 'block'
                        : 'none',
                  }}
                >
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='status'
                  >
                    Status
                  </label>
                  <input
                    type='text'
                    name='status'
                    placeholder='Choose status'
                    autoComplete='off'
                    className='placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs'
                    disabled={true}
                    value={formData.status}
                  />
                  {errors.status && (
                    <span className='text-[12px] text-red-400 col-span-full'>
                      {errors.status}
                    </span>
                  )}
                </div>
              </>
            </div>

            <div
              className='w-full mb-5'
              style={{
                display: shouldHideField(
                  'interaction_questions',
                  isEditView,
                  permissionMap
                )
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
                          .map((col: InteractionFormTableColumn) => (
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
                          className={`${(!question.is_editable && isEditView) || shouldDisableField('interaction_questions', isEditView, permissionMap) ? 'bg-[#f3f4f6] cursor-default' : ''}`}
                        >
                          {questionTableColumns
                            .filter((col) => !col.hide)
                            .map((col: InteractionFormTableColumn) => {
                              const permissionDisabled = shouldDisableField(
                                'interaction_questions',
                                isEditView,
                                permissionMap
                              );
                              const isDisabled =
                                (!question.is_editable && isEditView) ||
                                permissionDisabled ||
                                col.disabled;
                              const isBtnDisabled =
                                (!question.is_editable && isEditView) ||
                                permissionDisabled ||
                                col.disabled;
                              const error =
                                errors.questions?.[index]?.[
                                  col.name as keyof InteractionQuestionErrors
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
                                      {`Q${index + 1}`}
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
                    'interaction_questions',
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
                    label: 'Interaction ID',
                    value: formData.interaction_id,
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
      <ConfirmationPopup
        isOpen={confirmationState.isOpen}
        message={confirmationState.message}
        onConfirm={() => {
          confirmationState.onConfirm();
          setConfirmationState((prev) => ({
            ...prev,
            isOpen: false,
            message: '',
          }));
        }}
        onCancel={() => {
          confirmationState.onCancel();
          setConfirmationState((prev) => ({
            ...prev,
            isOpen: false,
            message: '',
          }));
        }}
      />
      <PreviewDialog
        previewDialog={previewDialog}
        formData={formData}
        createLoading={
          createInteraction.isPending || updateInteraction.isPending
        }
        recipiants={recipiants}
        setPreviewDialog={setPreviewDialog}
        isAccountLevel={isProjectInteractionLevel}
        saveAndSendComplete={(recipiants) => {
          if (isEditView && interactionData) {
            updateInteractionComplete(true, recipiants);
          } else {
            createInteractionComplete(true, recipiants);
          }
        }}
      />
    </div>
  );
};

export default CaseInteractionForm;
