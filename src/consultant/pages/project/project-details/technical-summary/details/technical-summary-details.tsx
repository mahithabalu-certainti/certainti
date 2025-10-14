import React, { useEffect, useMemo, useRef, useState } from 'react';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { TechSummaryIcon } from '../../../../../../assets';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  useTechnicalSummaryDetails,
  useUpdateTechnicalSummaryText,
} from '../../../../../services/technical-summary/technical-summary-service';
import DetailsSectionSkeleton from '../../../../../../components/skeleton-component/detailsskeleton';
import { Typography, TextareaAutosize } from '@mui/material';
import DetailsSection, {
  DetailItem,
} from '../../../../../../components/details-section/details';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../../common-utils';
import { useToast } from '../../../../../../hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { AllPermissions } from '../../../../../../common-service';
import Markdown from 'react-markdown';

interface TechnicalSummaryDetailsProps {
  accountInActive: boolean;
  handleBackClick: () => void;
}

const TechnicalSummaryDetails: React.FC<TechnicalSummaryDetailsProps> = ({
  accountInActive,
  handleBackClick,
}) => {
  const [searchParams] = useSearchParams();
  const { projectid } = useParams();
  const { successToast, errorToast } = useToast();
  const accountId = searchParams.get('accountID') || '';
  const technicalSummaryId = searchParams.get('technical_summary_id') || '';

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [summaryContext, setSummaryContext] = useState('');

  const { permission } = useSelector((state: RootState) => state.permission);

  const {
    data,
    isLoading,
    error,
    refetch: refetchDetails,
  } = useTechnicalSummaryDetails(
    technicalSummaryId,
    accountId,
    projectid || ''
  );
  const updateTechSummaryText = useUpdateTechnicalSummaryText();

  useEffect(() => {
    if (data?.technical_summary_refinement_prompt !== undefined) {
      setSummaryContext(data.technical_summary_refinement_prompt || '');
    }
  }, [data?.technical_summary_refinement_prompt]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isEditing]);

  // Permissions
  const technicalSummaryViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) =>
          item.name === AllPermissions.PROJECT_TECHNICAL_SUMMARY_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    technicalSummaryViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [technicalSummaryViewEditFields]);

  const handleSave = () => {
    const payload = {
      account_rid: accountId,
      tech_summary_rid: technicalSummaryId,
      project_fiscal_rid: projectid || '',
      summary_context: summaryContext.trim(),
    };
    updateTechSummaryText.mutate(payload, {
      onSuccess: async () => {
        await refetchDetails();
        setIsEditing(false);
        successToast('Refinement prompt updated successfully');
      },
      onError: () => {
        errorToast('Failed to update refinement prompt. Please try again.');
      },
    });
  };

  const handleCancel = () => {
    setSummaryContext(data?.technical_summary_refinement_prompt || '');
    setIsEditing(false);
  };

  const hideTechnicalSummary =
    !permissionMap['technical_summary']?.read &&
    !permissionMap['technical_summary']?.edit;

  const hideAdditionalSummaryText =
    !permissionMap['technical_summary_refinement_prompt']?.read &&
    !permissionMap['technical_summary_refinement_prompt']?.edit;

  const disabledAdditionalSummaryText =
    permissionMap['technical_summary_refinement_prompt']?.read &&
    !permissionMap['technical_summary_refinement_prompt']?.edit;

  const headerButtons = isEditing
    ? [
        {
          label: 'Save',
          variant: 'contained' as const,
          disabled: updateTechSummaryText.isPending,
          loading: updateTechSummaryText.isPending,
          sx: { width: '50px', minWidth: '50px' },
          onClick: handleSave,
        },
        {
          label: 'Cancel',
          variant: 'outlined' as const,
          onClick: handleCancel,
          sx: { width: '60px', minWidth: '60px' },
          disabled: updateTechSummaryText.isPending,
        },
      ]
    : [
        {
          label: 'Edit',
          variant: 'outlined' as const,
          disabled: accountInActive || disabledAdditionalSummaryText,
          onClick: () => setIsEditing(true),
          sx: { width: '48px', minWidth: '48px' },
          hide: hideAdditionalSummaryText,
        },
        {
          label: 'Back To Technical Summary',
          variant: 'outlined' as const,
          disabled: false,
          onClick: handleBackClick,
          sx: { width: '178px', minWidth: '178px' },
          hide: hideAdditionalSummaryText,
        },
      ];

  const auditInfo: DetailItem[] = [
    {
      label: 'Sequence Number',
      value: data?.r_number,
      key: 'r_number',
    },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(data?.created_datetime),
      key: 'created_datetime',
    },
    {
      label: 'Created By',
      value: data?.created_user_name,
      key: 'created_by',
    },
    {
      label: 'Sequence Version',
      value: data?.version,
      key: 'version',
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: data?.modified_user_name,
      key: 'modified_by',
    },
  ];

  const auditDetails = applyHidePermission(auditInfo, permissionMap);
  const transformedData = data?.technical_summary.map((item) => ({
    label: item.title,
    value:
      item.summary && item.summary.trim() !== ''
        ? item.summary
        : 'No information available',
    hide: hideTechnicalSummary,
  }));

  return (
    <div className='border border-[#CBD6E2] mb-6'>
      <SectionHeader
        title='Technical Summary'
        subValue={data?.r_number || ''}
        titleIcon={
          <TechSummaryIcon
            alt='financial-header-icon'
            className='w-7 h-7 p-1.5 rounded-[2px] bg-[#DFE8FF] [&>path]:stroke-[#1755E7]'
          />
        }
        className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
        buttons={headerButtons}
        onBackClick={handleBackClick}
        showBackArrow={true}
      />
      {isLoading ? (
        <DetailsSectionSkeleton className='p-0 m-0' />
      ) : error ? (
        <div className='flex items-center justify-center h-64 p-4'>
          <Typography variant='h6' color='error' className='mb-2'>
            Error loading technical summary details
          </Typography>
        </div>
      ) : (
        <>
          <div>
            <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
              Project Summary - Technical Summary
            </div>

            {/* Label + Paragraph */}
            <div className='py-2 px-6 flex flex-col gap-4'>
              {transformedData?.map((item, index) => {
                const formattedText = (item.value || '')
                  .replace(/\\n/g, '\n')
                  .replace(/•/g, '-');
                return (
                  <div key={index} className='flex flex-col gap-1'>
                    {/* Label */}
                    <div className='text-left font-extrabold text-[16px] text-[#425A76]'>
                      {item.label}
                    </div>
                    {/* Value as paragraph */}
                    <div className='markdown'>
                      <Markdown>{formattedText || ''}</Markdown>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div
            className={`${updateTechSummaryText.isPending ? 'pointer-events-none cursor-default' : ''} ${hideAdditionalSummaryText ? 'hidden' : ''}`}
          >
            <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
              Refinement Prompt
            </div>
            <div className='py-2 px-6'>
              <TextareaAutosize
                ref={textareaRef}
                name='summary_context'
                placeholder='Enter Refinement Prompt'
                autoComplete='off'
                minRows={3}
                maxRows={5}
                value={summaryContext}
                readOnly={!isEditing}
                disabled={!isEditing}
                onChange={(e) => setSummaryContext(e.target.value)}
                className={`outline-none mt-1.5 placeholder-custom-color rounded-[2px] w-full sm:text-sm p-3 resize-none focus:border-1 focus:border-blue-400 disabled:bg-[#f3f4f6] disabled:cursor-default border border-gray-300`}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#9ca3af transparent',
                }}
              />
            </div>
          </div>

          <DetailsSection
            title='Audit Information'
            data={auditDetails}
            customStyle='pt-0 mt-0'
          />
        </>
      )}
    </div>
  );
};

export default TechnicalSummaryDetails;
