import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
import { settingsFormFields } from './helper';
import { FormBuilder } from '../../../../../../components';
import { useToast } from '../../../../../../hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { AllPermissions } from '../../../../../../common-service';
import { useParams, useSearchParams } from 'react-router-dom';
import { useUpdateSettings } from '../../../../../services/settings';
import SkeletonForm from '../../../../../../components/form-builder/skeleton-form';
import { useProjectDetail } from '../../../../../services/project';

interface SettingsHandles {
  submitForm: () => void;
  resetForm: () => void;
}

interface UpdateSettingsSuccess {
  statusMessage: string;
}

type FormValueType = string | number | boolean | string[] | null;

interface FormValues extends Record<string, FormValueType> {
  max_interaction_follow_up: string;
  blended_rate_fte: string;
  blended_rate_subcon: string;
  auto_assessment: string;
  auto_send_ai_interaction: string;
}

const Settings = forwardRef<SettingsHandles>((_, ref) => {
  const formRef = useRef<HTMLFormElement>(null);
  const { successToast } = useToast();
  const updateSettings = useUpdateSettings();
  const isSaving = updateSettings.isPending;
  const [searchParams] = useSearchParams();
  const { projectid } = useParams();

  const accountId = searchParams.get('accountID') || '';

  const { data, isLoading, refetch } = useProjectDetail(
    accountId,
    projectid as string
  );
  const projectDetails = data?.data?.project;

  // Permission Management
  const { permission } = useSelector((state: RootState) => state.permission);
  const settingsViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.PROJECT_SETTINGS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    settingsViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [settingsViewEditFields]);

  const defaultValues: FormValues = {
    max_interaction_follow_up: '',
    blended_rate_fte: '',
    blended_rate_subcon: '',
    auto_assessment: 'No',
    auto_send_ai_interaction: 'No',
  };

  const formValues = useMemo<FormValues>(() => {
    if (!projectDetails) return defaultValues;

    return {
      ...defaultValues,
      max_interaction_follow_up:
        projectDetails.max_ai_interaction !== undefined
          ? String(projectDetails.max_ai_interaction)
          : '',
      blended_rate_fte: projectDetails.blended_rate_fte || '',
      blended_rate_subcon: projectDetails.blended_rate_subcon || '',
      auto_assessment: projectDetails.auto_access_rd ? 'Yes' : 'No',
      auto_send_ai_interaction: projectDetails.auto_send_ai_interaction
        ? 'Yes'
        : 'No',
    };
  }, [projectDetails]);

  const handleFormSubmit = (data: object) => {
    const formData = data as FormValues;
    console.log(accountId);
    console.log(projectid);
    console.log(projectDetails?.rid);
    console.log(projectDetails);
    const payload = {
      account_rid: accountId,
      project_rid: projectDetails?.project_rid || '',
      project_fiscal_rid: projectDetails?.rid || '',
      flag: 'project',
      max_ai_interactions: Number(formData.max_interaction_follow_up) || 0,
      autosend_interaction: formData.auto_send_ai_interaction === 'Yes',
      auto_access_rd: formData.auto_assessment === 'Yes',
      blended_rate_fte: formData.blended_rate_fte,
      blended_rate_subcon: formData.blended_rate_subcon,
    };

    updateSettings.mutate(payload, {
      onSuccess: (res: UpdateSettingsSuccess) => {
        successToast(res.statusMessage);
        refetch();
      },
    });
  };

  useImperativeHandle(ref, () => ({
    submitForm: () => {
      formRef.current?.requestSubmit();
    },
    resetForm: () => {
      formRef.current?.reset();
    },
  }));

  if (isLoading) {
    return <SkeletonForm />;
  }

  return (
    <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px] pt-5'>
      <Box
        className='bg-white'
        sx={{
          minHeight: '560px',
          maxHeight: '560px',
          overflowY: 'auto',
          '& .grid': {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr) !important',
            gap: '1rem',
          },
          '& .grid > div': {
            gridColumn: 'span 1 !important',
          },
        }}
      >
        <FormBuilder
          data={settingsFormFields(permissionMap)}
          formRef={formRef}
          outData={handleFormSubmit}
          values={formValues}
          loading={isSaving}
        />
      </Box>
    </div>
  );
});

export default Settings;
