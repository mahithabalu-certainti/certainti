/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '../../../../../../hooks';
import { useParams, useSearchParams } from 'react-router-dom';
import SkeletonForm from '../../../../../../components/form-builder/skeleton-form';
import {
  useFetchCasesConfigSettingsFields,
  useUpdateJurisdictionConfigSettings,
} from '../../../../../services/case-team';

interface JurisdictionSettingProps {
  formRef: React.RefObject<HTMLFormElement>;
  setIsFormSaving: React.Dispatch<React.SetStateAction<boolean>>;
}

const quillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ align: [] }],
      ['link'],
      ['clean'],
    ],
  },
};

const quillFormats = [
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
];

const JurisdictionSetting: React.FC<JurisdictionSettingProps> = ({
  formRef,
  setIsFormSaving,
}) => {
  const { successToast } = useToast();
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const updateconfig = useUpdateJurisdictionConfigSettings();
  const accountid = searchParams.get('accountID');
  const { data, isLoading, refetch } = useFetchCasesConfigSettingsFields(
    accountid as string,
    caseId as string
  );

  const configDetails = data?.data;

  const initialValue = useMemo(
    () => configDetails?.assessment_methodology || '',
    [configDetails]
  );

  const [assessmentMethodology, setAssessmentMethodology] =
    useState<string>(initialValue);

  // Sync when data loads
  useEffect(() => {
    setAssessmentMethodology(initialValue);
  }, [initialValue]);

  const handleFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const payload = {
      rid: caseId ?? '',
      account_rid: accountid ?? '',
      assessment_methodology: assessmentMethodology,
    };
    setIsFormSaving(true);
    updateconfig.mutate(payload, {
      onSuccess: (res: any) => {
        successToast(res.statusMessage);
        setIsFormSaving(false);
        refetch();
      },
      onError: (error) => {
        console.error('Update failed:', error);
        setIsFormSaving(false);
      },
      onSettled: () => {
        setIsFormSaving(false);
      },
    });
  };

  return (
    <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px] pt-5'>
      {isLoading ? (
        <SkeletonForm />
      ) : (
        <form ref={formRef} onSubmit={handleFormSubmit} className='pb-4 px-4'>
          <div className='email-template-editor grid grid-cols-1 relative'>
            <label
              htmlFor='assessment_methodology'
              className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] mb-1'
            >
              Assessment Methodology
            </label>
            <div className='email-body-editor w-full relative'>
              <ReactQuill
                id='assessment_methodology'
                value={assessmentMethodology}
                onChange={(value) => setAssessmentMethodology(value)}
                theme='snow'
                placeholder='Enter Assessment Methodology'
                className='rounded-[2px] bg-white'
                modules={quillModules}
                formats={quillFormats}
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default JurisdictionSetting;
