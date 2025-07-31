import { useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { settingsFormFields } from './helper';
import { FormBuilder } from '../../../../../../components';
import { useToast } from '../../../../../../hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { AllPermissions } from '../../../../../../common-service';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAccountUpdateSettings } from '../../../../../services/settings';
import { useFetchAccountFields } from '../../../../../services/account';
import SkeletonForm from '../../../../../../components/form-builder/skeleton-form';

interface SettingsProps {
  formRef: React.RefObject<HTMLFormElement>;
  setIsFormSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaveDisable: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UpdateSettingsSuccess {
  statusMessage: string;
}

type FormValueType = string | number | boolean | object | string[] | null;

interface FormValues extends Record<string, FormValueType> {
  fiscal_start_date: string;
  fiscal_end_date: string;
  max_interaction_follow_up: string;
  blended_rate_fte: string;
  blended_rate_subcon: string;
  auto_assessment: string;
  auto_send_ai_interaction: string;
}

const Settings: React.FC<SettingsProps> = ({
  formRef,
  setIsFormSaving,
  setIsSaveDisable,
}) => {
  const { successToast } = useToast();
  const updateSettings = useAccountUpdateSettings();

  const { accountid } = useParams();

  const { data, isLoading, refetch } = useFetchAccountFields(
    accountid as string
  );
  const accountDetails = data?.data?.accountDetails;

  // Permission Management
  const { permission } = useSelector((state: RootState) => state.permission);

  const settingsViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.ACCOUNT_SETTINGS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  useEffect(() => {
    const formConfig = settingsFormFields(permissionMap);

    const allFieldsDisabled = formConfig.every((section) =>
      section.fields.every((field) => field.disabled === true)
    );
    setIsSaveDisable(allFieldsDisabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    settingsViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [settingsViewEditFields]);

  const defaultValues: FormValues = {
    fiscal_start_date: '',
    fiscal_end_date: '',
    max_interaction_follow_up: '',
    blended_rate_fte: '',
    blended_rate_subcon: '',
    auto_assessment: 'No',
    auto_send_ai_interaction: 'No',
  };

  const formValues = useMemo<FormValues>(() => {
    if (!accountDetails) return defaultValues;

    return {
      ...defaultValues,
      fiscal_start_date: accountDetails.fiscal_start_date
        ? dayjs(accountDetails.fiscal_start_date).format('MM/DD')
        : '',
      fiscal_end_date: accountDetails.fiscal_end_date
        ? dayjs(accountDetails.fiscal_end_date).format('MM/DD')
        : '',
      max_interaction_follow_up:
        accountDetails.max_ai_interactions !== undefined
          ? String(accountDetails.max_ai_interactions)
          : '',
      blended_rate_fte: accountDetails.blended_rate_fte || '',
      blended_rate_subcon: accountDetails.blended_rate_subcon || '',
      auto_assessment: accountDetails.auto_access_rd ? 'Yes' : 'No',
      auto_send_ai_interaction: accountDetails.autosend_interaction
        ? 'Yes'
        : 'No',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountDetails]);

  const handleFormSubmit = (data: object) => {
    const formData = data as FormValues;

    const payload = {
      account_rid: accountDetails?.account_rid ?? accountid ?? '',
      flag: 'account',
      fiscal_start_date: formData.fiscal_start_date,
      fiscal_end_date: formData.fiscal_end_date,
      max_ai_interactions: Number(formData.max_interaction_follow_up) || 0,
      autosend_interaction: formData.auto_send_ai_interaction === 'Yes',
      auto_access_rd: formData.auto_assessment === 'Yes',
      blended_rate_fte: formData.blended_rate_fte,
      blended_rate_subcon: formData.blended_rate_subcon,
    };
    setIsFormSaving(true);
    updateSettings.mutate(payload, {
      onSuccess: (res: UpdateSettingsSuccess) => {
        successToast(res.statusMessage);
        setIsFormSaving(false);
        refetch();
      },
    });
  };

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
          key={JSON.stringify(accountDetails)}
          data={settingsFormFields(permissionMap)}
          formRef={formRef}
          outData={handleFormSubmit}
          values={formValues}
        />
      </Box>
    </div>
  );
};

export default Settings;
