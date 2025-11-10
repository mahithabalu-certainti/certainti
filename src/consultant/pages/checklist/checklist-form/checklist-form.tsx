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
  Autocomplete,
  TextField,
} from '@mui/material';
import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import TextButton from '../../../../components/button/text-button';
import { useToast } from '../../../../hooks';
import { useGetStatus } from '../../../../common-service';
import {
  validateChecklistForm,
  ChecklistFormData,
  ChecklistFormErrors,
  ChecklistFormItem,
  getChecklistTableColumns,
  ChecklistFormTableColumn,
  ChecklistItemErrors,
  COMMON_MENU_PROPS,
  getSelectStyles,
  transformChecklistTemplatePayload,
  BasePayload,
} from './helper';
import {
  ChecklistIcon,
  ErrorInfoIcon,
  KeyContactAddIcon,
  KeyContactRemoveIcon,
} from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import {
  formatDateToYYYYMMDDWithTime,
  getFiscalYears,
} from '../../../../common-utils';
import {
  useChecklistDetails,
  useCreateChecklist,
  useUpdateChecklistDetails,
  useConsultantChecklistTemplateList,
  useConsultantChecklistTemplateDetails,
  useGetChecklistStatus,
} from '../../../services/checklist/checklist-service';
import FormFiscalYearDropdown from '../../../../components/fiscal-dropdown/form-fiscal-dropdown';
import ConfirmationPopup from '../../../../common-utils/confirmation-popup';
import { ArrowDropDownIcon } from '@mui/x-date-pickers/icons';

const ChecklistForm: React.FC = () => {
  const { successToast } = useToast();
  const { checklistId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get query parameters
  const accountId = searchParams.get('accountId') || '';
  const entityLevel = searchParams.get('entityLevel') || 'account';
  const entityId = searchParams.get('entityId') || '';
  const entityFiscalYear =
    searchParams.get('projectFiscalYear') ||
    searchParams.get('caseFiscalYear') ||
    '';
  const sourcePath = searchParams.get('source') || '';

  const [formData, setFormData] = useState<ChecklistFormData>({
    checklist_name: '',
    checklist_description: '',
    fiscalYear: '',
    status: '',
    checklist_items: [
      {
        checklist_seq_num: 'SNO_1',
        checklist_item_name: '',
        description: '',
        status: '',
      },
    ],
    rid: '',
    checklist_rid: '',
    created_on: '',
    created_by: '',
    updated_on: '',
    updated_by: '',
    checklist_template_rid: '',
  });
  const [errors, setErrors] = useState<ChecklistFormErrors>({});
  const [disableFiscalYear, setDisableFiscalYear] = useState<boolean>(false);
  const [currentTemplate, setCurrentTemplate] = useState<{
    label: string;
    value: string;
  }>({
    label: 'Choose Template',
    value: '',
  });
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  // Permission
  // const { permission } = useSelector((state: RootState) => state.permission);

  // const checklistViewEditFields = useMemo(
  //   () =>
  //     permission.find((item) => item.name === AllPermissions.CHECKLIST_OVERVIEW)
  //       ?.fields ?? [],
  //   [permission]
  // );

  // const permissionMap = useMemo(() => {
  //   const map: Record<string, { read: boolean; edit: boolean }> = {};
  //   checklistViewEditFields.forEach((item) => {
  //     map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
  //   });
  //   return map;
  // }, [checklistViewEditFields]);

  const statusData = useGetStatus();
  const checklistStatus = useGetChecklistStatus();
  const createChecklist = useCreateChecklist();
  const updateChecklist = useUpdateChecklistDetails();

  const { data: checklistData, isLoading } = useChecklistDetails(
    entityId,
    checklistId || '',
    isEditView && !!checklistId
  );

  // Template dropdown functionality
  const checklistTemplates = useConsultantChecklistTemplateList(
    {
      page: 1,
      limit: 1000,
      sortBy: 'checklist_name',
      sortOrder: 'ASC',
      filters: {},
    },
    !isEditView
  );

  const { data: templateDetails } = useConsultantChecklistTemplateDetails(
    currentTemplate.value
  );

  const templateOptions = useMemo(
    () =>
      checklistTemplates.data?.checklistTemplates.map((template) => ({
        label: template.checklist_name,
        value: template.rid,
      })) || [],
    [checklistTemplates.data?.checklistTemplates]
  );

  const minYear = 1950;
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - minYear + 1);

  const commonSuccess = createChecklist.isSuccess || updateChecklist.isSuccess;

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Checklist updated successfully'
          : 'Checklist created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  useEffect(() => {
    if (checklistData && isEditView) {
      setFormData((prev) => ({
        ...prev,
        checklist_name: checklistData.checklist_name || '',
        checklist_description: checklistData.checklist_description || '',
        status: checklistData?.status_rid,
        fiscalYear: checklistData?.fiscal_year,
        rid: checklistData.checklist_rid || '',
        checklist_rid: checklistData.r_number || '',
        created_by: checklistData.created_by || '',
        created_on: checklistData.created_datetime
          ? formatDateToYYYYMMDDWithTime(checklistData.created_datetime)
          : '',
        updated_by: checklistData.modified_by || '',
        updated_on: checklistData.modified_datetime
          ? formatDateToYYYYMMDDWithTime(checklistData.modified_datetime)
          : '',
        checklist_items:
          checklistData.checklist_items &&
          checklistData.checklist_items.length > 0
            ? checklistData.checklist_items.map((item, index) => ({
                checklist_seq_num: item.sequence_no || `SNO-${index + 1}`,
                checklist_item_name: (item.checklist_item_name || '').trim(),
                description: item.checklist_item_description || '',
                status: item.status_rid || '', // Add status from API data
                rid: item.rid || '',
              }))
            : [
                {
                  checklist_seq_num: 'SNO_1',
                  checklist_item_name: '',
                  description: '',
                  status: '',
                },
              ],
      }));
    }
  }, [isEditView, checklistData]);

  useEffect(() => {
    if (isEditView && checklistData) {
      const disableLevel =
        checklistData?.attachment_level?.toLowerCase() === 'project' ||
        checklistData?.attachment_level?.toLowerCase() === 'case';
      setDisableFiscalYear(disableLevel);
    }
  }, [checklistData, isEditView]);

  // Handle template selection and populate form
  useEffect(() => {
    if (templateDetails && currentTemplate.value) {
      setFormData((prev) => ({
        ...prev,
        checklist_name: templateDetails.checklist_name || prev.checklist_name,
        checklist_description:
          templateDetails.checklist_description || prev.checklist_description,
        status: templateDetails?.status_rid || prev.status,
        checklist_items:
          templateDetails.checklist_items &&
          templateDetails.checklist_items.length > 0
            ? templateDetails.checklist_items.map((item, index) => ({
                checklist_seq_num: item.sequence_no || `SNO_${index + 1}`,
                checklist_item_name: item.checklist_item_name || '',
                description: item.description || '',
                status: '', // Initialize status as empty for new items from template
              }))
            : [
                {
                  checklist_seq_num: 'SNO_1',
                  checklist_item_name: '',
                  description: '',
                  status: '',
                },
              ],
        checklist_template_rid: currentTemplate.value,
      }));
    }
  }, [templateDetails, currentTemplate.value]);

  const statusOptions = useMemo(
    () =>
      statusData.data?.data?.status?.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [statusData.data?.data?.status]
  );

  const checklistStatusOptions = useMemo(
    () =>
      checklistStatus.data?.data?.checklistStatus?.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [checklistStatus.data?.data?.checklistStatus]
  );

  const handleInputChange = (field: keyof ChecklistFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof ChecklistFormItem,
    value: string
  ) => {
    const updatedItems = [...formData.checklist_items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      checklist_items: updatedItems,
    }));

    setErrors((prev) => {
      const newItemErrors = [...(prev.checklist_items || [])];
      if (newItemErrors[index]) {
        newItemErrors[index] = {
          ...newItemErrors[index],
          [field]: undefined,
        };
      }
      return {
        ...prev,
        checklist_items: newItemErrors,
      };
    });
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      checklist_items: [
        ...prev.checklist_items,
        {
          checklist_seq_num: `SNO_${prev.checklist_items.length + 1}`,
          checklist_item_name: '',
          description: '',
          status: '',
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...formData.checklist_items];
    updatedItems.splice(index, 1);

    if (updatedItems.length === 0) {
      updatedItems.push({
        checklist_seq_num: 'SNO_1',
        checklist_item_name: '',
        description: '',
        status: '',
      });
    }

    setFormData((prev) => ({
      ...prev,
      checklist_items: updatedItems,
    }));

    setErrors((prev) => {
      if (!prev.checklist_items) return prev;

      const newItemErrors = [...prev.checklist_items];
      newItemErrors.splice(index, 1);

      return {
        ...prev,
        checklist_items: newItemErrors,
      };
    });
  };

  const validateForm = (): boolean => {
    const ignoreFiscalYear = disableFiscalYear || !!entityFiscalYear;
    const { isValid, errors: validationErrors } = validateChecklistForm(
      formData,
      ignoreFiscalYear
    );
    setErrors(validationErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Prepare payload with required fields
    const basePayload: BasePayload = {
      account_rid: accountId,
      attach_to: entityId,
      attachment_level: entityLevel,
      ...(!isEditView && currentTemplate.value
        ? {
            checklist_template_rid: currentTemplate.value,
          }
        : {}),
    };

    const payload = transformChecklistTemplatePayload(
      formData,
      isEditView,
      basePayload,
      checklistData
    );
    if (isEditView && checklistData) {
      updateChecklist.mutate(payload);
    } else {
      createChecklist.mutate(payload);
    }
  };

  const goBack = () => {
    window.history.back();
  };

  const checklistTableColumns = getChecklistTableColumns(isEditView);
  const formLoading =
    isLoading ||
    statusData.isLoading ||
    checklistStatus.isLoading ||
    checklistTemplates.isLoading;

  return (
    <React.Suspense fallback={null}>
      <div>
        <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white border-b border-[#CBD6E2]'>
          <div className='flex items-center w-[80%] max-w-[80%]'>
            <ChecklistIcon
              alt='checklist-icon'
              className='h-[24px] w-[24px] p-1 rounded [&>path]:stroke-[#fff] bg-[#FFB46E]'
            />
            <div className='w-[90%]'>
              {isLoading ? (
                <div className='ml-2'>
                  <SingleSkeleton width={150} height={12} />
                </div>
              ) : (
                <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                  {sourcePath
                    ? `${sourcePath}${isEditView ? ` > ${checklistData?.r_number}` : ''}`
                    : `Note ${isEditView ? `> ${checklistData?.r_number}` : ''}`}
                </div>
              )}
              <h5 className='text-[16px] font-bold ml-2 mt-0.5 text-[#2D3E4F]'>
                {isEditView ? 'Edit Checklist' : 'Create Checklist'}
              </h5>
            </div>
          </div>
          <div className='flex gap-3'>
            {!isEditView && (
              <Autocomplete
                disableClearable
                forcePopupIcon
                popupIcon={<ArrowDropDownIcon />}
                slotProps={{ paper: { style: { fontSize: '12px' } } }}
                options={templateOptions}
                size='small'
                sx={{
                  height: '24px',
                  fontSize: '10px',
                  width: '160px',
                  '&.MuiAutocomplete-root .MuiOutlinedInput-root': {
                    height: '24px',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#7D98B6',
                    opacity: 1,
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                    {
                      border: '2px solid #60A5FA',
                    },
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused': {
                      boxShadow: 'none',
                    },
                  },
                  '.MuiSelect-select': {
                    padding: '6px 6px',
                    color: currentTemplate.value === '' ? '#7D98B6' : 'black',
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
                }}
                onChange={(_e, newValue) => {
                  if (currentTemplate.value) {
                    //If template already choose
                    setConfirmationState({
                      isOpen: true,
                      message:
                        'The current checklist items will be replaced with template items. Are you sure you want to continue?',
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
                        fontSize: '12px',
                      },
                    }}
                    placeholder={currentTemplate.label}
                  />
                )}
              />
            )}
            <TextButton
              label='Save'
              loading={createChecklist.isPending || updateChecklist.isPending}
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
              disabled={createChecklist.isPending || updateChecklist.isPending}
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
                  className={`${disableFiscalYear || !!entityFiscalYear ? 'hidden' : 'block'}`}
                  // style={{
                  //   display: shouldHideField(
                  //     'fiscal_year',
                  //     isEditView,
                  //     permissionMap
                  //   )
                  //     ? 'none'
                  //     : 'block',
                  // }}
                >
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='fiscal_year'
                  >
                    Fiscal Year
                    <span className='text-red-500'> *</span>
                  </label>
                  <FormFiscalYearDropdown
                    fiscalYear={String(formData.fiscalYear)}
                    fiscalYearsOptions={fiscalYears}
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
                    disabled={disableFiscalYear}
                  />
                  {errors?.fiscalYear && (
                    <span className='text-[12px] text-red-400 col-span-full'>
                      {errors.fiscalYear}
                    </span>
                  )}
                </div>

                <div
                // style={{
                //   display: shouldHideField('status', isEditView, permissionMap)
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
                    onChange={(e) =>
                      handleInputChange('status', e.target.value)
                    }
                    displayEmpty
                    required
                    fullWidth
                    size='small'
                    // disabled={shouldDisableField(
                    //   'status',
                    //   isEditView,
                    //   permissionMap
                    // )}
                    className={`custom-select-no-arrow sm:text-sm ${
                      formData.status === '' ? 'text-[#7D98B6]' : 'text-black'
                    } ${errors?.status ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                    MenuProps={COMMON_MENU_PROPS}
                    sx={getSelectStyles(
                      !!errors?.status,
                      formData.status === ''
                    )}
                  >
                    <MenuItem
                      value=''
                      sx={{
                        color: '#425A76',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
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
                // style={{
                //   display: shouldHideField(
                //     'checklist_description',
                //     isEditView,
                //     permissionMap
                //   )
                //     ? 'none'
                //     : 'block',
                // }}
              >
                <label
                  htmlFor='checklist_description'
                  className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                >
                  Description
                </label>
                <textarea
                  name='checklist_description'
                  placeholder='Enter Description'
                  value={formData.checklist_description}
                  onChange={(e) =>
                    handleInputChange('checklist_description', e.target.value)
                  }
                  // disabled={shouldDisableField(
                  //   'checklist_description',
                  //   isEditView,
                  //   permissionMap
                  // )}
                  className={`outline-none placeholder-custom-color h-[95px] w-full sm:text-sm py-2 px-3 resize-none focus:border-2 focus:border-blue-400 border border-[#CBD6E2] rounded-xs ${
                    errors?.checklist_description
                      ? 'border-red-500 bg-[#FEF2F2] focus:!bg-[#FEF2F2]'
                      : ''
                  }`}
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#9ca3af transparent',
                  }}
                />
                {errors?.checklist_description && (
                  <span className='text-[12px] text-red-400'>
                    {errors.checklist_description}
                  </span>
                )}
              </div>

              <div
                className='w-full mb-5 mt-5'
                // style={{
                //   display: shouldHideField(
                //     'checklist_items',
                //     isEditView,
                //     permissionMap
                //   )
                //     ? 'none'
                //     : 'block',
                // }}
              >
                <div
                  className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10`}
                >
                  Checkist Items
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
                          {checklistTableColumns
                            .filter((col) => !col.hide)
                            .map((col: ChecklistFormTableColumn) => (
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
                                  <span className='text-red-500'>*</span>
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
                          },
                        }}
                      >
                        {formData.checklist_items.map((item, index) => (
                          <TableRow
                            key={index}
                            sx={{
                              position: 'relative',
                              p: 0,
                            }}
                            // className={`${shouldDisableField('checklist_items', isEditView, permissionMap) ? 'bg-[#f3f4f6] cursor-default' : ''}`}
                          >
                            {checklistTableColumns
                              .filter((col) => !col.hide)
                              .map((col: ChecklistFormTableColumn) => {
                                // const permissionDisabled = shouldDisableField(
                                //   'checklist_items',
                                //   isEditView,
                                //   permissionMap
                                // );
                                const permissionDisabled = false;
                                const isDisabled =
                                  permissionDisabled || col.disabled;
                                const isBtnDisabled =
                                  permissionDisabled || col.disabled;
                                const error =
                                  errors.checklist_items?.[index]?.[
                                    col.name as keyof ChecklistItemErrors
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
                                    {col.name === 'checklist_seq_num' && (
                                      <div
                                        style={{
                                          textAlign: 'center',
                                          padding: '4px',
                                        }}
                                      >
                                        {item.checklist_seq_num.startsWith(
                                          'SNO'
                                        )
                                          ? '-'
                                          : item.checklist_seq_num}
                                      </div>
                                    )}

                                    {col.name === 'checklist_item_name' && (
                                      <div
                                        className={`flex relative ${error ? 'bg-[#FEF2F2]' : ''}`}
                                      >
                                        <textarea
                                          name='checklist_item_name'
                                          placeholder='Enter Checklist Item Name'
                                          autoComplete='off'
                                          className={`outline-none placeholder-custom-color w-full sm:text-sm p-2 resize-none focus:border-2 focus:border-blue-400 ${error ? 'bg-[#FEF2F2] focus:!bg-[#FEF2F2]' : ''}`}
                                          value={item.checklist_item_name}
                                          onChange={(e) =>
                                            handleItemChange(
                                              index,
                                              'checklist_item_name',
                                              e.target.value
                                            )
                                          }
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

                                    {col.name === 'description' && (
                                      <div
                                        className={`flex relative ${error ? 'bg-[#FEF2F2]' : ''}`}
                                      >
                                        <textarea
                                          name='description'
                                          placeholder='Enter Description'
                                          autoComplete='off'
                                          className={`outline-none placeholder-custom-color w-full sm:text-sm p-2 resize-none focus:border-2 focus:border-blue-400 ${error ? 'bg-[#FEF2F2] focus:!bg-[#FEF2F2]' : ''}`}
                                          value={item.description}
                                          onChange={(e) =>
                                            handleItemChange(
                                              index,
                                              'description',
                                              e.target.value
                                            )
                                          }
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

                                    {col.name === 'status' && (
                                      <div className='px-2 py-1'>
                                        <Select
                                          value={item.status || ''}
                                          onChange={(e) =>
                                            handleItemChange(
                                              index,
                                              'status',
                                              e.target.value
                                            )
                                          }
                                          displayEmpty
                                          fullWidth
                                          size='small'
                                          disabled={isDisabled}
                                          className={`custom-select-no-arrow sm:text-sm ${
                                            item.status === ''
                                              ? 'text-[#7D98B6]'
                                              : 'text-black'
                                          }`}
                                          MenuProps={COMMON_MENU_PROPS}
                                          sx={getSelectStyles(
                                            false,
                                            item.status === ''
                                          )}
                                        >
                                          <MenuItem
                                            value=''
                                            sx={{
                                              color: '#425A76',
                                              fontSize: '13px',
                                              fontWeight: 500,
                                            }}
                                          >
                                            Choose Status
                                          </MenuItem>
                                          {checklistStatusOptions?.map(
                                            (option, i) => (
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
                                            )
                                          )}
                                        </Select>
                                      </div>
                                    )}

                                    {col.name === 'action' && (
                                      <Tooltip
                                        title={'Remove Item'}
                                        disableHoverListener={isBtnDisabled}
                                        arrow
                                        placement='top'
                                      >
                                        <button
                                          type='button'
                                          onClick={() =>
                                            handleRemoveItem(index)
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
                    onClick={handleAddItem}
                    // disabled={shouldDisableField(
                    //   'checklist_items',
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
      </div>
    </React.Suspense>
  );
};

export default ChecklistForm;
