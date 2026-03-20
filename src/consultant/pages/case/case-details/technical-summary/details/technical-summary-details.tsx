/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { TechSummaryIcon } from '../../../../../../assets';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useTechnicalSummaryDetails,
  useUpdateRefinePrompt,
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
import TextButton from '../../../../../../components/button/text-button';
import { SummaryList } from '../../../../../types';

interface TechnicalSummaryDetailsProps {
  accountInActive: boolean;
  handleBackClick: () => void;
  isActionItemsExpanded?: boolean;
  setIsActionItemsExpanded?: (expanded: boolean) => void;
}

const TechnicalSummaryDetails: React.FC<TechnicalSummaryDetailsProps> = ({
  accountInActive,
  handleBackClick,
  isActionItemsExpanded,
  setIsActionItemsExpanded,
}) => {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { successToast, errorToast } = useToast();
  const accountId = searchParams.get('accountID') || '';
  const technicalSummaryId = searchParams.get('technical_summary_id') || '';
  const projectid = searchParams.get('project_id') || '';
  const isProjectSignedOff =
    searchParams.get('is_project_signed_off') === 'true';
  const isFromDossier =
    searchParams.get('navigate_source') === 'dossier_technical_summary';

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [summaryContext, setSummaryContext] = useState('');
  const [isRefinePrompt, setIsRefinePrompt] = useState<SummaryList[]>([]);
  const [savedSummaryRid, setSavedSummaryRid] = useState('');
  const { permission } = useSelector((state: RootState) => state.permission);

  const {
    data,
    isLoading,
    error,
    refetch: refetchDetails,
  } = useTechnicalSummaryDetails(
    savedSummaryRid || technicalSummaryId,
    accountId,
    projectid || '',
    caseId || ''
  );
  const updateTechSummaryText = useUpdateTechnicalSummaryText();
  const updateRefinePrompt = useUpdateRefinePrompt();

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

  const handleBack = () => {
    if (isFromDossier) {
      searchParams.set('list', 'dossier');
      searchParams.delete('technical_summary_id');
      searchParams.delete('project_id');
      searchParams.delete('navigate_source');
      searchParams.delete('is_project_signed_off');

      navigate({ search: searchParams.toString() }, { replace: true });
    } else {
      handleBackClick();
    }
  };

  const handleSave = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    const payload = {
      account_rid: accountId ?? '',
      tech_summary_rid: technicalSummaryId ?? '',
      project_fiscal_rid: projectid || '',
      technical_summary: Array.isArray(isRefinePrompt)
        ? isRefinePrompt
        : data?.technical_summary || [],
    };
    updateTechSummaryText.mutate(payload, {
      onSuccess: async (response) => {
        const returnedRid = response?.data?.technicalSummary?.rid;
        if (returnedRid) {
          setSavedSummaryRid(returnedRid);
        }
        setIsRefinePrompt([]);
        await refetchDetails();
        setIsEditing(false);
        successToast('Technical summary saved successfully');
      },
      onError: () => {
        errorToast('Failed to save technical summary. Please try again.');
      },
    });
  };
  const handleRefinePrompt = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    const payload = {
      account_rid: accountId,
      tech_summary_rid: technicalSummaryId,
      project_fiscal_rid: projectid || '',
      refinement_prompt: summaryContext.trim(),
      existing_summary: data?.technical_summary || [],
    };
    updateRefinePrompt.mutate(payload, {
      onSuccess: (response) => {
        const updatedSummary = (response as any)?.data?.data?.updated_summary;
        setIsRefinePrompt(updatedSummary);
        successToast('Refinement applied successfully. Click Save to confirm.');
      },
      onError: () => {
        errorToast('Failed to refine technical summary. Please try again.');
      },
    });
  };
  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setSummaryContext(data?.technical_summary_refinement_prompt || '');
    setIsRefinePrompt([]);
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
          onClick: () => {
            if (setIsActionItemsExpanded) setIsActionItemsExpanded(false);
            handleBack();
          },
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

  const currentSummary = useMemo(
    () =>
      Array.isArray(isRefinePrompt) && isRefinePrompt.length > 0
        ? isRefinePrompt
        : data?.technical_summary,
    [isRefinePrompt, data?.technical_summary]
  );

  const transformedData = useMemo(
    () =>
      currentSummary?.map((item) => ({
        label: item.title,
        value:
          item.summary && item.summary.trim() !== ''
            ? item.summary
            : 'No data available',
        hide: hideTechnicalSummary,
      })),
    [currentSummary, hideTechnicalSummary]
  );

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
        isExpanded={isActionItemsExpanded}
        onToggleExpand={setIsActionItemsExpanded}
        headerStatic={true}
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
            {transformedData?.map((item, index) => {
              const formattedText = (item.value || '')
                .replace(/\\n/g, '\n')
                .replace(/\.\n/g, '.\n\n')
                .replace(/^[ \t]*[-*•][ \t]*/gm, '')
                .replace(/^[ \t]+/gm, '')
                .replace(/([^ \n])\s*\*\*(.*?)\*\*/g, '$1\n\n**$2**')
                .replace(/\*\*(.*?)\*\*:\s*/g, '**$1**:\n\n')
                .replace(/^\*([^*\n]+\*\*)/gm, '**$1');
              return (
                <div key={index} className='flex flex-col'>
                  {/* Label as Header Banner */}
                  <div className='flex items-center align-middle px-3 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
                    {item.label}
                  </div>
                  {/* Value as content */}
                  <div className='py-0.5 px-6 markdown font-medium text-[13px] text-[#425A76] '>
                    <Markdown>{formattedText || ''}</Markdown>
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className={`${updateTechSummaryText.isPending ? 'pointer-events-none cursor-default' : ''} ${hideAdditionalSummaryText ? 'hidden' : ''}`}
          >
            <div className='flex justify-between items-center align-middle px-3 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
              <div>Refinement Prompt</div>
              <div>
                <TextButton
                  label='Generate Prompt'
                  onClick={handleRefinePrompt}
                  disabled={!isEditing || isProjectSignedOff}
                  loading={updateRefinePrompt.isPending}
                  sx={{
                    width: '130px',
                    minWidth: '130px',
                    fontSize: '13px',
                    // fontWeight: 400,
                  }}
                />
              </div>
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
