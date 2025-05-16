import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { accountHomeIcon, editIcon } from '../../../assets';
import { OnChange, useGetAllCountries } from '../../../common-service';
import { FormBuilder } from '../../../components';
import TextButton from '../../../components/button/text-button';
import { useToast } from '../../../hooks';
import {
  useFetchAccountFields,
  useFetchCurrency,
  useFetchState,
} from '../../services/account';
import {
  useCreateAccount,
  useUpdateAccount,
} from '../../services/account-create';
import { AccountFormData, SelectOption } from '../../types';
import { FormData } from './form-data';
import { transformFormData } from './utils';

const ProjectForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const { successToast } = useToast();
  const location = useLocation();
  const { accountid } = useParams();

  const getAccount = useFetchAccountFields(accountid as string);
  const account = getAccount.data?.data;
  const accountData = useMemo(
    () => ({
      ...account?.accountDetails,
      ...account?.accountById,
      ...(account?.accountById &&
        account?.accountDetails && {
        is_parent: account?.accountById.is_parent ? 'yes' : 'no',
        autosend_interaction: account?.accountDetails.autosend_interaction
          ? 'yes'
          : 'no',
        auto_access_rd: account?.accountDetails.auto_access_rd ? 'yes' : 'no',
      }),
    }),
    [account]
  );

  const allCountries = useGetAllCountries();
  const currency = useFetchCurrency();
  const state = useFetchState(currentCountry);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  const commonSuccess = createAccount.isSuccess || updateAccount.isSuccess;
  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Account update successfully'
          : 'Account created successfully'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  const memoizedContry: SelectOption[] = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  const memoizedCurrency: SelectOption[] = useMemo(
    () =>
      currency.data?.data.currency.map((account) => ({
        label: account.currency_name,
        value: account.rid,
      })) || [],
    [currency.data?.data.currency]
  );

  const memoizedRegions: SelectOption[] = useMemo(
    () =>
      state.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [state.data?.data.states]
  );

  const submitData = (formValues: Partial<AccountFormData>) => {
    const accountData = transformFormData(formValues, isEditView);
    if (isEditView) {
      updateAccount.mutate(accountData);
    } else {
      createAccount.mutate(accountData);
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const goBack = () => {
    window.history.back();
  };

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'country_rid') {
      setCurrentCountry(data.fieldValue as string);
    }
  };

  return (
    <>
      <div className='h-[60px] border-box flex justify-between items-center border-b-2 border-gray-200 px-10'>
        <div className='flex items-center'>
          <img
            src={isEditView ? editIcon : accountHomeIcon}
            alt='menu-icon'
            className='h-10 w-10 bg-[#7D98B6] p-2.5 rounded'
          />
          <div>
            {isEditView && (
              <h5 className='text-xs ml-2 text-gray-500 mb-1'>Edit Project</h5>
            )}
            <h4 className='font-bold text-lg ml-2 leading-4'>
              {isEditView ? accountData.account_name : 'Create Project'}
            </h4>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            // variant='filled'
            loading={createAccount.isPending || updateAccount.isPending}
            onClick={handleExternalSubmit}
          />
          <TextButton
            label='Cancel'
            // variant='outlined'
            // color='inherit'
            onClick={goBack}
          />
        </div>
      </div>
      <div className='p-10'>
        <FormBuilder
          data={FormData(
            memoizedContry,
            memoizedCurrency,
            memoizedRegions,
            isEditView,
            state.isLoading
          )}
          loading={
            allCountries.isLoading || currency.isLoading || state.isLoading
          }
          values={isEditView && accountData ? { ...accountData } : undefined}
          outData={submitData}
          formRef={formRef}
          onChange={onChangeField}
        />
      </div>
    </>
  );
};

export default ProjectForm;
