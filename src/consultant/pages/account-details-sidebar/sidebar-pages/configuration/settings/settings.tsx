import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { settingsFormFields } from './helper';
import { FormBuilder } from '../../../../../../components';
import { useToast } from '../../../../../../hooks';
import { useUpdateAccount } from '../../../../../services/account-create';
import { transformFormData } from '../../../../account-create/utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';

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
    const { modules, permission } = useSelector(
      (state: RootState) => state.permission
    );
    console.log('permisssions', permission);
    console.log('modules', modules);

    const formRef = useRef<HTMLFormElement>(null);

    const [formValues, setFormValues] = useState<
      Record<string, string | string[] | boolean | number | null | object>
    >({});
    const [key, setKey] = useState(0);

    const { successToast, errorToast } = useToast();
    const updateAccount = useUpdateAccount();

    const handleFormSubmit = (data: object) => {
      const typedData = data as Record<
        string,
        string | string[] | boolean | number | null | object
      >;

      setFormValues(typedData);
      if (accountDetails?.account_name) {
        typedData.account_name = accountDetails.account_name;
      }
      const transformedData = transformFormData(
        typedData,
        true,
        [],
        'Active',
        accountDetails?.account_rid
      );

      const formData = new FormData();
      formData.append('data', JSON.stringify(transformedData));

      updateAccount.mutate(formData, {
        onSuccess: () => {
          successToast('Account updated successfully!');
        },
        onError: (err: any) => {
          errorToast(err?.message || 'Failed to update account');
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
        console.log('Form reset - all fields cleared');
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
              data={settingsFormFields()}
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
