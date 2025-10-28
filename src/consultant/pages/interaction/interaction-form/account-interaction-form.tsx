import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MenuItem,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  InteractionFormData,
  InteractionFormErrors,
  InteractionFormQuestion,
  InteractionFormTableColumn,
  InteractionQuestionErrors,
  StatusTypeEnum,
} from '../../../types';
import { useToast } from '../../../../hooks';
import { useAccountCreateInteraction } from '../../../services/interactions/interactions-service';
import {
  getProjectColumns,
  getQuestionTableColumns,
  shouldDisableField,
  shouldHideField,
  transFormPayload,
  validateInteractionForm,
} from './helper';
import {
  ErrorInfoIcon,
  InteractionDetailIcon,
  KeyContactAddIcon,
  KeyContactRemoveIcon,
  NewFilterIcon,
} from '../../../../assets';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import {
  AllPermissions,
  useGetInteractionLevel,
  useGetInteractionStatus,
  useGetStatus,
} from '../../../../common-service';
import { RootState } from '../../../../store/store';
import { useSelector } from 'react-redux';
import {
  useAccountProjects,
  useGetProjectType,
} from '../../../services/project';
import { ListTable } from '../../../../components/table';
import { Project, ProjectFiscalSummary } from '../../../types/project';
import Filter from '../../account-details-sidebar/components/filter/filter';
import { projectFilterFields } from '../../account-details-sidebar/sidebar-pages/projects/utils';
import { useFetchClassification } from '../../../services/account';

const AccountInteractionForm = () => {
  const [searchParams] = useSearchParams();
  const { successToast, errorToast } = useToast();

  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('project_code');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [interactionLevel, setInteractionLevel] = useState<string>('');
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean>
  >({});
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selectedTableId, setSelectedTableIds] = useState<
    ProjectFiscalSummary[]
  >([]);
  const [filterAnchorEl, setFilterAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [tab, setTab] = useState<number>(1);
  const [saveAndSendLoading, setSaveAndSendLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<InteractionFormData>({
    accountName: '',
    projectCode: '',
    projectName: '',
    fiscalYear: 0,
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

  const { fiscalYear, filters } = useSelector(
    (state: RootState) => state.account
  );
  const { permission } = useSelector((state: RootState) => state.permission);

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const accountId = searchParams.get('accountId') || '';
  const accountName = searchParams.get('account_name');

  const accountCreateInteraction = useAccountCreateInteraction();
  const accountStatusOptions = useGetStatus();
  const interactionStatus = useGetInteractionStatus();
  const getInteractionLevel = useGetInteractionLevel();
  const projectData = useAccountProjects(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      accountNumber: accountId,
      apiSource: 'interaction',
    },
    true,
    1
  );
  const Classification = useFetchClassification();
  const projectTypeOptions = useGetProjectType();

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
  const projectViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const projectPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);
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
  const memoizedClassification = useMemo(
    () =>
      Classification.data?.data.projectClassifications.map((data) => ({
        option: data.classification_name,
        value: data.classification_name,
      })) || [],
    [Classification.data?.data.projectClassifications]
  );
  const memoizedProjectTypes = useMemo(
    () =>
      projectTypeOptions?.data?.data?.projectType.map((item) => ({
        option: item.project_type_name,
        value: item.rid,
      })) || [],
    [projectTypeOptions?.data?.data?.projectType]
  );
  const memoizedStatus = useMemo(
    () =>
      accountStatusOptions?.data?.data?.status.map((status) => ({
        option: status.status_name,
        value: status.rid,
      })) || [],
    [accountStatusOptions?.data?.data?.status]
  );

  const commonSuccess = accountCreateInteraction.isSuccess;
  const formLoading = interactionStatus.isLoading;
  const questionTableColumns = getQuestionTableColumns(false);
  const isAccountLevel =
    memoizedInteractionLevel
      .find((it) => it.value === interactionLevel)
      ?.option.toLocaleLowerCase() === 'account';
  const totalItems = projectData?.data?.count || 0;
  const isFilterOpen = Boolean(filterAnchorEl);
  const filterId = isFilterOpen ? `resourceprojects-filter-popover` : undefined;

  // Clear account name only when filters change
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      accountName: '',
    }));
    setErrors((prev) => ({
      ...prev,
      accountName: undefined,
    }));
  }, [filters]);
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      accountName: accountName || '',
    }));
  }, [accountName, searchParams]);
  // Clear project details when either fiscalYear or filters change
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      projectCode: '',
      projectName: '',
      fiscalYear: 0,
    }));
    setErrors((prev) => ({
      ...prev,
      projectCode: undefined,
      projectName: undefined,
      fiscalYear: undefined,
    }));
  }, [fiscalYear, filters]);
  useEffect(() => {
    if (commonSuccess) {
      successToast('Interaction created successfully');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess]);
  useEffect(() => {
    const interactionOptions = getInteractionLevel.data?.data?.interactionLevel;
    if (interactionOptions && (interactionOptions?.length ?? 0) > 0) {
      setInteractionLevel(interactionOptions[0].rid);
    }
  }, [getInteractionLevel.data?.data]);
  useEffect(() => {
    if (projectData.data?.projects) {
      const updatedProjectList =
        projectData.data.projects.map((project) => {
          const updatedFiscal =
            project.ProjectFiscal?.map((item) => {
              const checkBoxMessage = !item?.isKeyContactIncluded
                ? 'Key Contact is not available or inactive for this interaction'
                : '';
              return {
                ...item,
                disableCheckBox: !item?.isKeyContactIncluded,
                checkBoxMessage,
              };
            }) || [];

          return {
            ...project,
            ProjectFiscal: updatedFiscal,
          };
        }) || [];

      setProjectList(updatedProjectList);
    }
  }, [projectData.data?.projects]);

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
    setFormData((prev) => {
      const updatedQuestions = prev.questions.filter((_, i) => i !== index);

      if (updatedQuestions.length === 0) {
        updatedQuestions.push({
          question_seq_num: 'SNO_1',
          question: '',
          is_mandatory: false,
          is_editable: true,
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
    setErrors(validationErrors);
    return isValid;
  };
  const handleSubmit = (trigger_send?: boolean) => {
    if (!validateForm()) {
      return;
    }

    // Set loading state based on action
    if (trigger_send) {
      setSaveAndSendLoading(true);
    } else {
      setSaveLoading(true);
    }

    if (isAccountLevel) {
      createInteraction(trigger_send);
    } else {
      if (tab === 2) {
        if (selectedTableId.length === 0) {
          errorToast('Please select atleast one Project!');
          // Reset loading state on error
          if (trigger_send) {
            setSaveAndSendLoading(false);
          } else {
            setSaveLoading(false);
          }
        } else {
          createInteraction(trigger_send);
        }
      } else {
        //If project Level
        setTab(2);
        // Reset loading state when just changing tabs
        if (trigger_send) {
          setSaveAndSendLoading(false);
        } else {
          setSaveLoading(false);
        }
      }
    }
  };
  const createInteraction = (trigger_send?: boolean) => {
    const draftStatus = statusOptions.find(
      (option) => option.label.toLowerCase() === StatusTypeEnum.draft
    );
    const payload = transFormPayload(
      accountId,
      formData,
      false,
      draftStatus?.value || ''
    );

    accountCreateInteraction.mutate(
      {
        account_rid: payload.account_rid,
        status_rid: interactionStatus.data?.data.interactionStatus.find(
          (option) => option.status_name.toLowerCase() === 'draft'
        )?.rid,
        trigger_send: !!trigger_send,
        interaction_level_rid: interactionLevel,
        projects: selectedTableId.map((it) => {
          return {
            fiscal_year: it.fiscal_year.toString(),
            project_fiscal_rid: it.project_fiscal_rid,
            project_rid: it.project_rid,
          };
        }),
        questions: payload.questions,
      },
      {
        onError: () => {
          // Reset loading states on error
          setSaveAndSendLoading(false);
          setSaveLoading(false);
        },
        onSuccess: () => {
          // Reset loading states on success
          setSaveAndSendLoading(false);
          setSaveLoading(false);
          window.history.back();
        },
      }
    );
  };
  const goBack = () => {
    if (tab === 2) {
      setTab(1);
    } else {
      window.history.back();
    }
  };
  const getRowId = (row: Project & { _level?: number }) => {
    if (row._level === 1 && 'project_fiscal_rid' in row) {
      return row.project_fiscal_rid || '';
    }
    return row.project_rid || '';
  };
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setSortOrder(apiOrder);
    setSortField(sortBy);
  };
  const handleselectedList = (id: string[]) => {
    const childIds: ProjectFiscalSummary[] = [];
    projectList.forEach((it) => {
      it.ProjectFiscal.forEach((item) => {
        if (id.includes(item.rid)) {
          childIds.push(item);
        }
      });
    });
    setSelectedTableIds(childIds);
  };
  const handleCloseFilter = () => {
    setFilterAnchorEl(null);
  };
  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'project_code';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setSortOrder(defaultSortOrder);
      setSortField(defaultSortField);
    } else {
      setSortFilterCount(1);
      setSortOrder(apiOrder);
      setSortField(sortBy);
    }
  };
  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <InteractionDetailIcon className='h-8 w-8 bg-[#6FBDA0] p-1.5 border-box rounded' />
          <div className='w-[90%]'>
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              New Interaction
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          {tab === 2 && (
            <TextButton
              label='Save and Send'
              loading={saveAndSendLoading}
              disabled={saveAndSendLoading || saveLoading}
              onClick={() => handleSubmit(true)}
              sx={{
                width: '120px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
          )}
          <TextButton
            label={isAccountLevel ? 'Save' : tab === 2 ? 'Save' : 'Next'}
            loading={saveLoading}
            disabled={saveAndSendLoading || saveLoading}
            onClick={() => handleSubmit()}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label={tab === 1 ? 'Cancel' : 'Back'}
            onClick={goBack}
            disabled={saveAndSendLoading || saveLoading}
            sx={{
              padding: '0px 6px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
      <div>
        {formLoading ? (
          <SkeletonForm />
        ) : (
          <>
            <div
              className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10`}
            >
              {tab === 2 ? 'Projects' : 'Basic Information'}
            </div>

            {tab === 1 ? (
              <>
                <div
                  className={`grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-1 mb-5`}
                >
                  <div
                    style={{
                      display: shouldHideField(
                        'account_name',
                        false,
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
                  <div
                    style={{
                      display: shouldHideField(
                        'account_name',
                        false,
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
                      Interaction Level
                    </label>
                    {getInteractionLevel.isPending ? (
                      <Skeleton variant='rounded' width='100%' height={32} />
                    ) : (
                      <Select
                        name='InteractionLevel'
                        className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                        displayEmpty
                        fullWidth
                        value={interactionLevel}
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
                        }}
                        onChange={(e) => setInteractionLevel(e.target.value)}
                      >
                        {memoizedInteractionLevel.map((it, i) => {
                          return (
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
                          );
                        })}
                      </Select>
                    )}
                  </div>
                </div>

                <div
                  className='w-full mb-5'
                  style={{
                    display: shouldHideField(
                      'interaction_questions',
                      false,
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
                              className={`${!question.is_editable || shouldDisableField('interaction_questions', false, permissionMap) ? 'bg-[#f3f4f6] cursor-default' : ''}`}
                            >
                              {questionTableColumns
                                .filter((col) => !col.hide)
                                .map((col: InteractionFormTableColumn) => {
                                  const permissionDisabled = shouldDisableField(
                                    'interaction_questions',
                                    false,
                                    permissionMap
                                  );
                                  const isDisabled =
                                    !question.is_editable ||
                                    permissionDisabled ||
                                    col.disabled;
                                  const isBtnDisabled =
                                    !question.is_editable ||
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
                                              scrollbarColor:
                                                '#9ca3af transparent',
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
                                              scrollbarColor:
                                                '#9ca3af transparent',
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
                                                style={{
                                                  width: 20,
                                                  height: 20,
                                                }}
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
                        false,
                        permissionMap
                      )}
                    >
                      <span>
                        <React.Suspense fallback={null}>
                          <KeyContactAddIcon
                            alt='add-btn'
                            className='w-5 h-5'
                          />
                        </React.Suspense>
                      </span>
                      Add New Question
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <React.Suspense fallback={null}>
                <div className='border-b border-[#CBD6E2] px-10 py-1 flex justify-end'>
                  <button
                    aria-describedby={filterId}
                    className={`w-[64px] h-[24px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
                                ${isFilterOpen || (appliedFilters && Object.keys(appliedFilters).length > 0) || sortFilterCount > 0 ? 'bg-[#F3F3F3]' : ''}`}
                    onClick={handleFilterModal}
                  >
                    <NewFilterIcon alt='filter-icon' />
                    Filter
                    {(appliedFilters &&
                      Object.keys(appliedFilters).length > 0) ||
                    sortFilterCount > 0 ? (
                      <div className='absolute -top-[5px] -right-2 w-4 h-4 flex items-center justify-center text-xs'>
                        <span className='absolute w-full h-full bg-[#FF6666] rounded-full animate-ping opacity-75 z-0'></span>
                        <span className='w-4 h-4 bg-[#FF6666] text-white rounded-full flex items-center justify-center z-10 font-semibold'>
                          {(appliedFilters
                            ? Object.keys(appliedFilters).length
                            : 0) + sortFilterCount}
                        </span>
                      </div>
                    ) : null}
                  </button>
                  <React.Suspense fallback={null}>
                    <Filter
                      value='projects'
                      isOpen={isFilterOpen}
                      filterAnchorEl={filterAnchorEl}
                      filterId={filterId}
                      filterMenu={projectFilterFields(
                        memoizedClassification.map((item) => ({
                          label: item.option,
                          value: item.value,
                        })),
                        memoizedProjectTypes,
                        memoizedStatus,
                        projectPermissionMap
                      )}
                      setAppliedFilters={setAppliedFilters}
                      handleCloseFilter={handleCloseFilter}
                      setCurrentPage={setCurrentPage}
                      mode={'date'}
                      handleSorting={handleSorting}
                    />
                  </React.Suspense>
                </div>

                <ListTable
                  data={projectList as Project[]}
                  columns={getProjectColumns(projectPermissionMap)}
                  getRowId={getRowId}
                  hoverHighlight={false}
                  tableStyle={{
                    height: '100%',
                    maxHeight: 'calc(100vh - 205px)',
                    overflow: 'auto',
                  }}
                  stickyHeader={true}
                  expandAllParent={true}
                  expandable={true}
                  childrenKey='ProjectFiscal'
                  maxNestingLevel={2}
                  editDisableLevel={[0]}
                  stickyColumnsCount={1}
                  actionWidth={60}
                  actionDisplayMode='dropdown'
                  actionMenuItems={[]}
                  loading={projectData.isLoading}
                  error={
                    projectData.error ? 'Failed to load projects' : undefined
                  }
                  rowsPerPageOptions={[25, 50, 100]}
                  rowsPerPage={rowsPerPage}
                  currentPage={currentPage ?? 1}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                  onRowsPerPageChange={setRowsPerPage}
                  sortBy={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  selectable={true}
                  onSelectionChange={(selectedIds) =>
                    handleselectedList(selectedIds)
                  }
                  component='project'
                />
              </React.Suspense>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AccountInteractionForm;
