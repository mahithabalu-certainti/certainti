import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box } from '@mui/material';
import { settingsFormFields } from './helper';
import { FormBuilder } from '../../../../../../components';
import { useToast } from '../../../../../../hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { useUpdateSettings } from '../../../../../services/settings';
import { AllPermissions } from '../../../../../../common-service';

interface SettingsHandles {
  submitForm: () => void;
  resetForm: () => void;
}

interface SettingsProps {
  accountDetails: {
    account_id: string;
    account_rid: string;
    account_name: string;
  };
}
const Settings = forwardRef<SettingsHandles, SettingsProps>(
  ({ accountDetails }, ref) => {
    // Permission Management
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

    const formRef = useRef<HTMLFormElement>(null);

    const [formValues, setFormValues] = useState<
      Record<string, string | string[] | boolean | number | null | object>
    >({});
    const [key, setKey] = useState(0);

    const { successToast, errorToast } = useToast();
    const updateSettings = useUpdateSettings();

    const handleFormSubmit = (data: object) => {
      const typedData = data as Record<
        string,
        string | string[] | boolean | number | null | object
      >;

      const parseBoolean = (value: unknown): boolean => {
        if (value === 'Yes') return true;
        if (value === 'No') return false;
        return Boolean(value);
      };

      const payload = {
        account_rid: accountDetails.account_rid,
        flag: 'account',
        fiscal_start_date: String(typedData.fiscal_start_date),
        fiscal_end_date: String(typedData.fiscal_end_date),
        max_ai_interactions: Number(typedData.max_interaction_follow_up),
        autosend_interaction: parseBoolean(typedData.auto_send_ai_interaction),
        auto_access_rd: parseBoolean(typedData.auto_assessment),
        blended_rate_fte: String(typedData.blended_rate_fte),
        blended_rate_subcon: String(typedData.blended_rate_subcon),
      };

      updateSettings.mutate(payload, {
        onSuccess: (res: any) => {
          successToast(res?.statusMessage);
          setFormValues({});
          setKey((prevKey) => prevKey + 1);
        },
        onError: (err: any) => {
          errorToast(
            err?.response?.data?.statusMessage || 'Failed to update settings'
          );
        },
      });
    };

    useImperativeHandle(ref, () => ({
      submitForm: () => {
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      },
      resetForm: () => {
        setFormValues({});
        setKey((prevKey) => prevKey + 1);
      },
    }));

    return (
      <div key={key}>
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
            />
          </Box>
        </div>
      </div>
    );
  }
);

export default Settings;
