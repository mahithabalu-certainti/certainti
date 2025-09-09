import { Box } from '@mui/material';
import { DetailsIcon } from '../../../assets';
import SectionHeader from '../../../components/details-section/section-header';
import { FormBuilder } from '../../../components';
import { ConfigureSettingsFormFields } from './helper';
import { useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { AllPermissions } from '../../../common-service';
import {
  useManageSettingDetails,
  useUpdateManageSettings,
} from '../../service/configure-manage-setting/configure-setting';
import SkeletonForm from '../../../components/form-builder/skeleton-form';
import { useToast } from '../../../hooks';

type FormValueType = string | number | boolean | object | string[] | null;
interface UpdateSettingsSuccess {
  statusMessage: string;
}
interface FormValues extends Record<string, FormValueType> {
  email: string;
  auto_assessment: string;
  auto_send_ai_interaction: string;
  rid: string;
}
const ConfigureSetting = () => {
  const formRef = useRef<HTMLFormElement>(null);
  // const [emailRequried, setEmailRequried] = useState<boolean>(false);
  const updateManageSettings = useUpdateManageSettings();
  const headerButtons = [
    {
      label: 'Save',
      variant: 'contained' as const,
      onClick: () => {
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      },
      // disabled: isSaveDisable,
      loading: updateManageSettings.isPending,
    },
  ];
  const { successToast } = useToast();
  const { data, isLoading, refetch } = useManageSettingDetails();
  const { permission } = useSelector((state: RootState) => state.permission);

  const settingsViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.ACCOUNT_SETTINGS_VIEW_EDIT
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
    email: '',
    auto_assessment: 'No',
    auto_send_ai_interaction: 'No',
    rid: '',
  };
  const formValues = useMemo<FormValues>(() => {
    if (!data) return defaultValues;

    return {
      ...defaultValues,
      auto_assessment: data?.data.settings?.auto_access_rd ? 'Yes' : 'No',
      auto_send_ai_interaction: data?.data.settings?.auto_send_interaction
        ? 'Yes'
        : 'No',
      email: data?.data.settings?.email ?? '',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleFormSubmit = (values: object) => {
    const formData = values as FormValues;
    console.log('formData', formData);

    const payload = {
      rid: data?.data.settings.rid ?? '',
      auto_send_interaction: formData.auto_send_ai_interaction === 'Yes',
      auto_access_rd: formData.auto_assessment === 'Yes',
      email: formData.email,
    };
    updateManageSettings.mutate(payload, {
      onSuccess: (res: UpdateSettingsSuccess) => {
        successToast(res.statusMessage);
        refetch();
      },
    });
  };
  // const onChangeField = (data: OnChange) => {
  //   console.log('value', data.fieldName);
  //   if (data.fieldName === 'support_email') {
  //     console.log('value', data.fieldValue);
  //     const hasValue = !!data.fieldValue;
  //     setEmailRequried(hasValue);
  //   }
  // };

  if (isLoading) {
    return <SkeletonForm />;
  }
  return (
    <>
      <div className='flex flex-col w-full'>
        <SectionHeader
          title={'Manage Setting'}
          titleIcon={
            <DetailsIcon
              alt='settings-header-icon'
              className='[&>path]:stroke-[#294F98] w-[14px] h-[14px]'
            />
          }
          buttons={headerButtons}
          count={10}
          // showItemCount={list !== 'settings'}
          // hideSection={hideSection}
          iconBg={'#D7E5FF'}
          bgType='circle'
        />
      </div>
      <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px] pt-5'>
        <Box
          className='bg-white'
          sx={{
            // minHeight: '560px',
            // maxHeight: '560px',
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
            key={JSON.stringify(data?.data.settings)}
            data={ConfigureSettingsFormFields(
              permissionMap
              // emailRequried
            )}
            formRef={formRef}
            outData={handleFormSubmit}
            values={formValues}
            // onChange={onChangeField}
          />
        </Box>
      </div>
    </>
  );
};

export default ConfigureSetting;
