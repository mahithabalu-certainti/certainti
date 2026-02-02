import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { DataMapperIcon, UploadIcon } from '../../../../assets';
import {
  Layout,
  OnChange,
  useGetAllCountries,
} from '../../../../common-service';
import { FormBuilder } from '../../../../components/form-builder';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import { FileList } from '../../../../components/file-list';
import { useToast } from '../../../../hooks';
import { useFetchState } from '../../../../consultant/services/account';
import {
  useCreateDataMapper,
  useUpdateDataMapper,
  useDataMapperDetails,
} from '../../../service/data-mapper/data-mapper-service';
import { DataMapperFormData } from './form-data';
import { DataMapperFormPayload } from '../../../types/data-mapper';
import { SelectOption } from '../../../../consultant/types';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';

const MAX_FILE_SIZE_MB = 100;
const RESTRICTED_EXTENSIONS = /\.(exe|bat|cmd|sh|bash)$/i;
const ACCEPTED_FILE_TYPES = ['application/pdf'];

const DataMapperForm: React.FC = () => {
  const { mapperId } = useParams();
  const location = useLocation();
  const { successToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentCountry, setCurrentCountry] = useState('');
  const [effectiveFromDate, setEffectiveFromDate] = useState<Date | undefined>(
    undefined
  );
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [existingFile, setExistingFile] = useState<{
    name: string;
    url: string;
    size: string;
    format: string;
  } | null>(null);
  const [auditInfo, setAuditInfo] = useState({
    rid: '',
    r_number: '',
    created_on: '',
    created_by: '',
    updated_on: '',
    updated_by: '',
  });

  // API Hooks
  const allCountries = useGetAllCountries();
  const states = useFetchState(currentCountry);
  const createDataMapper = useCreateDataMapper();
  const updateDataMapper = useUpdateDataMapper();
  const { data: mapperData, isLoading } = useDataMapperDetails(
    mapperId,
    isEditView
  );

  // Memoized Options
  const memoizedCountries: SelectOption[] = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  const memoizedStates: SelectOption[] = useMemo(
    () =>
      states.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [states.data?.data.states]
  );

  // Form Data
  const formData = useMemo(
    () => ({
      ...(mapperData && {
        form_name: mapperData.form_name || '',
        effective_from_date: mapperData.effective_from_date || '',
        effective_to_date: mapperData.effective_to_date || '',
        country_rid: mapperData.country_rid || '',
        state_rid: mapperData.state_rid || '',
      }),
    }),
    [mapperData]
  );

  // Set current country on edit
  useEffect(() => {
    if (mapperData?.country_rid) {
      setCurrentCountry(mapperData.country_rid);
    }
  }, [mapperData?.country_rid]);

  // Set effectiveFromDate on edit
  useEffect(() => {
    if (mapperData?.effective_from_date) {
      setEffectiveFromDate(new Date(mapperData.effective_from_date));
    }
  }, [mapperData?.effective_from_date]);

  // Set existing file on edit
  useEffect(() => {
    if (isEditView && mapperData) {
      if (
        mapperData.browse_file &&
        mapperData.document_name &&
        mapperData.size_in_mb &&
        mapperData.format
      ) {
        setExistingFile({
          name: mapperData.document_name,
          url: mapperData.browse_file,
          size: mapperData.size_in_mb,
          format: mapperData.format
            ? mapperData.format.startsWith('.')
              ? mapperData.format
              : `.${mapperData.format}`
            : mapperData.format,
        });
      }
      setAuditInfo({
        rid: mapperData.rid || '',
        r_number: mapperData.r_number || '',
        created_by: mapperData.created_by_name || '',
        updated_by: mapperData.modified_by_name || '-',
        created_on: formatDateToYYYYMMDDWithTime(
          mapperData.created_datetime || '-'
        ),
        updated_on: mapperData.modified_datetime
          ? formatDateToYYYYMMDDWithTime(mapperData.modified_datetime || '-')
          : '-',
      });
    }
  }, [isEditView, mapperData]);

  // Success handling
  const commonSuccess =
    createDataMapper.isSuccess || updateDataMapper.isSuccess;

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Data mapper updated successfully'
          : 'Data mapper created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  // File validation
  const showError = (text: string) => {
    setMessage({ type: 'error', text });
  };

  const validateFiles = (files: FileList | null): File[] => {
    if (!files) return [];
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (/\s/.test(file.name)) {
        showError(
          `"${file.name}" is invalid. File name must not contain spaces.`
        );
        continue;
      }

      const isAcceptedType =
        ACCEPTED_FILE_TYPES.includes(file.type) || /\.pdf$/i.test(file.name);

      if (!isAcceptedType) {
        showError(
          `"${file.name}" is not a valid file. Only PDF files are allowed.`
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        showError(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
        continue;
      }
      if (RESTRICTED_EXTENSIONS.test(file.name)) {
        showError(
          `"${file.name}" type is not allowed (.exe, .bat, .cmd, .sh, .bash).`
        );
        continue;
      }
      validFiles.push(file);
    }
    return validFiles;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      setSelectedFiles([validFiles[0]]);
      setExistingFile(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (selectedFiles.length > 0) return;
    setMessage(null);
    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      setSelectedFiles([validFiles[0]]);
      setExistingFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const openFileDialog = () => {
    if (selectedFiles.length === 0) {
      fileInputRef.current?.click();
    }
  };

  const handleExternalSubmit = () => {
    setMessage(null);

    if (selectedFiles.length === 0 && !existingFile) {
      showError('Please upload a PDF file.');
    }

    formRef.current?.requestSubmit();
  };

  const handleSubmitData = (data: Partial<DataMapperFormPayload>) => {
    // Safety check: Ensure file exists
    if (selectedFiles.length === 0 && !existingFile) {
      showError('Please upload a PDF file.');
      return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append('form_name', data.form_name || '');
    formDataPayload.append(
      'effective_from_date',
      data.effective_from_date || ''
    );
    formDataPayload.append('effective_to_date', data.effective_to_date || '');
    formDataPayload.append('country_rid', data.country_rid || '');
    formDataPayload.append('state_rid', data.state_rid || '');

    if (selectedFiles.length > 0) {
      formDataPayload.append('file', selectedFiles[0]);
    }

    if (isEditView) {
      formDataPayload.append('rid', mapperData?.rid || '');
      updateDataMapper.mutate(formDataPayload);
    } else {
      createDataMapper.mutate(formDataPayload);
    }
  };

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'country_rid') {
      setCurrentCountry(data.fieldValue as string);
    }
    if (data.fieldName === 'effective_from_date') {
      const dateValue = data.fieldValue as string;
      if (dateValue) {
        setEffectiveFromDate(new Date(dateValue));
      } else {
        setEffectiveFromDate(undefined);
      }
    }
  };

  const goBack = () => {
    window.history.back();
  };

  const formConfig = DataMapperFormData(
    memoizedCountries,
    memoizedStates,
    states.isLoading,
    effectiveFromDate
  );

  const formLoading = isLoading || allCountries.isLoading;

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white border-b border-[#CBD6E2]'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <React.Suspense fallback={null}>
            <DataMapperIcon
              alt='data-mapper-icon'
              className='h-7 w-7 p-1.5 rounded [&>path]:stroke-[#fff] bg-[#82BA8B]'
            />
          </React.Suspense>
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {isEditView
                  ? `Data Mapper > ${mapperData?.r_number}`
                  : 'Data Mapper'}
              </div>
            )}
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              {isEditView ? 'Edit Data Mapper' : 'Create Data Mapper'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={createDataMapper.isPending || updateDataMapper.isPending}
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
            disabled={createDataMapper.isPending || updateDataMapper.isPending}
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
          <div
            style={{
              pointerEvents:
                createDataMapper.isPending || updateDataMapper.isPending
                  ? 'none'
                  : 'all',
            }}
          >
            <FormBuilder
              loading={false}
              data={formConfig}
              values={isEditView ? { ...formData } : {}}
              outData={handleSubmitData}
              formRef={formRef}
              onChange={onChangeField}
              layout={Layout.TYPE_1}
              isFrom='data-mapper'
            />

            <div className='mt-4'>
              <div className='border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10'>
                Attachment
              </div>

              <div className='flex flex-col items-center justify-center gap-4 px-4 py-5'>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={openFileDialog}
                  className={`h-[116px] w-[502px] border-[2px] border-dashed rounded-[8px] flex flex-col items-center justify-center gap-2
              ${selectedFiles.length > 0 || existingFile ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${message?.type === 'error' ? 'border-red-600 bg-[#FEF2F2]' : 'border-[#0176D3] bg-[#F4F6F9]'}
            `}
                  style={{
                    pointerEvents:
                      selectedFiles.length > 0 || existingFile ? 'none' : 'all',
                  }}
                >
                  <React.Suspense fallback={null}>
                    <UploadIcon
                      alt='Upload Icon'
                      className='w-[36px] h-[24px]'
                    />
                  </React.Suspense>
                  <div
                    className='text-[14px] text-[#0B0B0B]'
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Drag your file or{' '}
                    <span
                      className='text-[#0176D3] underline'
                      onClick={(e) => {
                        e.stopPropagation();
                        openFileDialog();
                      }}
                    >
                      browse
                    </span>
                  </div>
                  <input
                    type='file'
                    accept='.pdf'
                    className='hidden'
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Reserved space for error messages to prevent button movement */}
                <div className='w-[502px] max-w-[502px] mt-2'>
                  {message && (
                    <div
                      className={`text-sm ${
                        message.type === 'error'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {message.text}
                    </div>
                  )}
                </div>

                <FileList
                  fileInputRef={fileInputRef}
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                  existingFiles={existingFile ? [existingFile] : []}
                  onRemoveExistingFile={() => setExistingFile(null)}
                />
              </div>
            </div>

            <div className={`${isEditView ? 'block' : 'hidden'}`}>
              <div className='border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10'>
                Audit Information
              </div>
              <div className='grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-1 mb-4'>
                {[
                  {
                    label: 'Record ID',
                    value: auditInfo.rid,
                  },
                  {
                    label: 'Created On',
                    value: auditInfo.created_on,
                  },
                  {
                    label: 'Created By',
                    value: auditInfo.created_by,
                  },
                  {
                    label: 'Form ID',
                    value: auditInfo.r_number,
                  },
                  {
                    label: 'Updated On',
                    value: auditInfo.updated_on,
                  },
                  {
                    label: 'Updated By',
                    value: auditInfo.updated_by,
                  },
                ].map((field, idx) => (
                  <div key={idx}>
                    <label className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] md:text-left mt-1 block'>
                      {field.label}
                    </label>
                    <div className='placeholder-[#7D98B6] bg-gray-100 text-black w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs flex items-center cursor-default select-none text-nowrap overflow-hidden'>
                      <span className='overflow-hidden text-ellipsis whitespace-nowrap'>
                        {field.value.trim() || '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataMapperForm;
