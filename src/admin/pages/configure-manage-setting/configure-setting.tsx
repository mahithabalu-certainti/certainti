import { ManageSettingsIcon } from '../../../assets';
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
import TextButton from '../../../components/button/text-button';
import { BUTTON_STYLES } from '../manage-user-detail/styles';
import { ColorCode } from '../../../consultant/types';

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
  const updateManageSettings = useUpdateManageSettings();
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
    four_part_assessment: 'Yes',
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
      four_part_assessment: data?.data.settings?.four_part_assessment
        ? 'Yes'
        : 'No',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleFormSubmit = (values: object) => {
    const formData = values as FormValues;

    const payload = {
      rid: data?.data.settings.rid ?? '',
      auto_send_interaction: formData.auto_send_ai_interaction === 'Yes',
      auto_access_rd: formData.auto_assessment === 'Yes',
      four_part_assessment: formData.four_part_assessment === 'Yes',
    };
    updateManageSettings.mutate(payload, {
      onSuccess: (res: UpdateSettingsSuccess) => {
        successToast(res.statusMessage);
        refetch();
      },
    });
  };

  return (
    <>
      <div className='flex flex-col w-full'>
        <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
          <div className='flex h-[33px]'>
            <div className='flex items-center justify-center'>
              <ManageSettingsIcon
                alt='manage user group'
                className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${ColorCode.manageAccountTextColor}] bg-[${ColorCode.manageTemplateBgcolor}]`}
              />
              <div className='flex flex-col mx-2.5 pb-1'>
                <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                  Configure Settings
                </div>
                <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                  Manage Settings
                </div>
              </div>
            </div>
          </div>
          <div className='flex gap-3 justify-center items-center'>
            <TextButton
              label='Save'
              // onClick={() => navigate(MANAGE_USER_GROUP_CREATE)}
              onClick={() => {
                if (formRef.current) {
                  formRef.current.requestSubmit();
                }
              }}
              sx={{
                ...BUTTON_STYLES,
                width: '59px',
                minWidth: '59px',
                maxWidth: '59px',
              }}
              loading={updateManageSettings.isPending}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
      {isLoading ? (
        <SkeletonForm />
      ) : (
        <div className='flex flex-col gap-0 border-b border-[#CBD6E2] rounded-[2px]'>
          <FormBuilder
            key={JSON.stringify(data?.data.settings)}
            data={ConfigureSettingsFormFields(permissionMap)}
            formRef={formRef}
            outData={handleFormSubmit}
            values={formValues}
          />
        </div>
      )}
    </>
  );
};

export default ConfigureSetting;
