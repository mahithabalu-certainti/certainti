/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { jurisdictionConfigFormFields } from './helper';
import { FormBuilder } from '../../../../../../components';
import { useToast } from '../../../../../../hooks';
import { OnChange } from '../../../../../../common-service';
import { useParams, useSearchParams } from 'react-router-dom';
import { useFetchState } from '../../../../../services/account';
import SkeletonForm from '../../../../../../components/form-builder/skeleton-form';
import {
  useFetchCasesConfigFields,
  useUpdateJurisdictionConfig,
} from '../../../../../services/case-team';
import { SelectOption } from '../../../../../types';

interface JurisdictionConfigProps {
  formRef: React.RefObject<HTMLFormElement>;
  setIsFormSaving: React.Dispatch<React.SetStateAction<boolean>>;
  // setIsSaveDisable: React.Dispatch<React.SetStateAction<boolean>>;
}

type FormValueType = string | number | boolean | object | string[] | null;

interface FormValues extends Record<string, FormValueType> {
  is_federal_leve: string;
  is_state_level: string;
  states: string[];
}

const JurisdictionConfig: React.FC<JurisdictionConfigProps> = ({
  formRef,
  setIsFormSaving,
  // setIsSaveDisable,
}) => {
  const { successToast } = useToast();
  const [stateRequried, setStateRequried] = useState<boolean>(false);
  const [fedralRequried, setIdfedralRequried] = useState<boolean>(false);
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const updateconfig = useUpdateJurisdictionConfig();
  const accountid = searchParams.get('accountID');
  const cuurrency_rid = searchParams.get('country_rid');

  const { data, isLoading, refetch } = useFetchCasesConfigFields(
    accountid as string,
    caseId as string
  );
  const states = useFetchState(cuurrency_rid);

  const configDetails = data?.data;
  // console.log('states', configDetails);
  const memoizedState: SelectOption[] = useMemo(
    () =>
      states.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [states.data?.data.states]
  );

  // Permission Management
  // const { permission } = useSelector((state: RootState) => state.permission);

  // const settingsViewEditFields = useMemo(
  //   () =>
  //     permission.find(
  //       (item) => item.name === AllPermissions.ACCOUNT_SETTINGS_VIEW_EDIT
  //     )?.fields ?? [],
  //   [permission]
  // );

  // useEffect(() => {
  //   const formConfig = jurisdictionConfigFormFields(permissionMap);

  //   const allFieldsDisabled = formConfig.every((section) =>
  //     section.fields.every((field) => field.disabled === true)
  //   );
  //   setIsSaveDisable(allFieldsDisabled);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // const permissionMap = useMemo(() => {
  //   const map: Record<string, { read: boolean; edit: boolean }> = {};
  //   settingsViewEditFields.forEach((item) => {
  //     map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
  //   });
  //   return map;
  // }, [settingsViewEditFields]);

  const formValues = useMemo(
    () => ({
      ...(configDetails &&
        configDetails && {
          is_federal_level: configDetails.is_federal_level
            ? ['is_federal_level']
            : '',
          is_state_level: configDetails.is_state_level
            ? ['is_state_level']
            : '',
          states:
            Array.isArray(configDetails.states) &&
            configDetails.states.length > 0
              ? configDetails.states
              : [],
        }),
    }),
    [configDetails]
  );

  const handleFormSubmit = (data: object) => {
    const formData = data as FormValues;

    const isFederalLevel = Array.isArray(formData.is_federal_level)
      ? formData.is_federal_level.includes('is_federal_level')
      : !!formData.is_federal_level;

    const isStateLevel = Array.isArray(formData.is_state_level)
      ? formData.is_state_level.includes('is_state_level')
      : !!formData.is_state_level;

    const states = Array.isArray(formData.states)
      ? formData.states
      : formData.states
        ? [formData.states]
        : [];

    const payload = {
      case_rid: caseId ?? '',
      account_rid: accountid ?? '',
      is_federal_level: isFederalLevel,
      is_state_level: isStateLevel,
      states,
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

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'is_state_level') {
      console.log('data', data);
      setStateRequried(
        !!(Array.isArray(data.fieldValue) && data.fieldValue.length > 0)
      );
    }
    if (data.fieldName === 'is_federal_level') {
      console.log('data', data);
      setIdfedralRequried(
        !!(Array.isArray(data.fieldValue) && data.fieldValue.length > 0)
      );
    }
  };

  return (
    <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px] pt-5'>
      <Box
        className='bg-white'
        sx={{
          minHeight: '300px',
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
        {isLoading ? (
          <SkeletonForm />
        ) : (
          <FormBuilder
            key={JSON.stringify(configDetails)}
            data={jurisdictionConfigFormFields(
              // permissionMap,
              memoizedState,
              stateRequried,
              fedralRequried
            )}
            formRef={formRef}
            outData={handleFormSubmit}
            values={formValues}
            onChange={onChangeField}
          />
        )}
      </Box>
    </div>
  );
};

export default JurisdictionConfig;
