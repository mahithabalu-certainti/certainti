/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { jurisdictionConfigFormFields } from './helper';
import { useParams } from 'react-router-dom';
import { useToast } from '../../../../../../../hooks';
import {
  useFetchCasesConfigFields,
  useUpdateJurisdictionConfig,
} from '../../../../../../services/case-team';
import { useFetchState } from '../../../../../../services/account';
import { SelectOption } from '../../../../../../types';
import { OnChange } from '../../../../../../../common-service';
import SkeletonForm from '../../../../../../../components/form-builder/skeleton-form';
import { FormBuilder } from '../../../../../../../components';

interface JurisdictionConfigProps {
  formRef: React.RefObject<HTMLFormElement>;
  setIsFormSaving: React.Dispatch<React.SetStateAction<boolean>>;
  countryId: string | null;
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
  countryId,
  // setIsSaveDisable,
}) => {
  const { successToast } = useToast();
  const [stateRequired, setStateRequired] = useState<boolean>(false);
  // const [fedralRequried, setIdfedralRequried] = useState<boolean>(false);

  const updateconfig = useUpdateJurisdictionConfig();
  const { accountid } = useParams();

  const level = 'account';
  const { data, isLoading, refetch } = useFetchCasesConfigFields(
    accountid as string,
    level
  );
  const states = useFetchState(countryId,'active');

  const configDetails = data?.data;
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
  useEffect(() => {
    if (configDetails) {
      setStateRequired(!!configDetails.is_state_level);
    }
  }, [configDetails]);
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
      account_rid: accountid ?? '',
      is_federal_level: isFederalLevel,
      is_state_level: isStateLevel,
      states,
      level: 'account',
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
      setStateRequired(
        !!(Array.isArray(data.fieldValue) && data.fieldValue.length > 0)
      );
    }
  };

  return (
    <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px] pt-5'>
      <Box
        className='bg-white'
        sx={{
          minHeight: '100px',
          maxHeight: '100px',
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
              stateRequired
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
