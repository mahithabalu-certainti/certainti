import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { accountHomeIcon, editIcon } from '../../../assets';
import {
  CheckErrorMsg,
  OnChange,
  useGetAllCountries,
} from '../../../common-service';
import { FormBuilder } from '../../../components';
import TextButton from '../../../components/button/text-button';
import { useToast } from '../../../hooks';
import {
  useFetchAccountFields,
  useFetchCurrency,
  useFetchParentAccounts,
  useFetchState,
} from '../../services/account';
import {
  useCreateAccount,
  useUpdateAccount,
} from '../../services/account-create';
import { AccountFormData, SelectOption } from '../../types';
import { FormData } from './form-data';
import { transformFormData } from './utils';
import { ACCOUNT } from '../../../routes';
import { checkError, checkErrorMsg } from '../../../common-utils';

export const AccountForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const { successToast, errorToast } = useToast();
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
  const parentAccount = useFetchParentAccounts();
  const currency = useFetchCurrency();
  const states = useFetchState(currentCountry);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const navigate = useNavigate();

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  // Hook Error Handling
  const errorhandlingData = [
    getAccount,
    allCountries,
    parentAccount,
    currency,
    states,
    updateAccount,
    createAccount,
  ];
  const commonError = checkError(errorhandlingData);
  const commonErrorMsg = checkErrorMsg(errorhandlingData as CheckErrorMsg[]);
  const commonSuccess = createAccount.isSuccess || updateAccount.isSuccess;

  useEffect(() => {
    if (commonError) {
      errorToast(commonErrorMsg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonError, commonErrorMsg]);

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Account update successfully'
          : 'Account created successfully'
      );
      navigate(ACCOUNT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  useEffect(() => {
    if (accountData.country_rid) {
      setCurrentCountry(accountData.country_rid);
    }
  }, [accountData.country_rid]);

  const memoizedContry: SelectOption[] = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  const memoizedParentAccounts: SelectOption[] = useMemo(
    () =>
      parentAccount.data?.data.gloablAcconunt.map((account) => ({
        label: account.account_name,
        value: account.rid,
      })) || [],
    [parentAccount.data?.data.gloablAcconunt]
  );

  const memoizedCurrency: SelectOption[] = useMemo(
    () =>
      currency.data?.data.currency.map((account) => ({
        label: account.currency_name,
        value: account.rid,
      })) || [],
    [currency.data?.data.currency]
  );

  const memoizedState: SelectOption[] = useMemo(
    () =>
      states.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [states.data?.data.states]
  );

  const submitData = (formValues: Partial<AccountFormData>) => {
    const transformData = transformFormData(
      formValues,
      isEditView,
      accountData?.rid
    );
    if (isEditView) {
      updateAccount.mutate(transformData);
    } else {
      createAccount.mutate(transformData);
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'country_rid') {
      setCurrentCountry(data.fieldValue as string);
    }
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <>
      <div className='flex justify-between items-center border-b-2 border-gray-200 px-10 py-6'>
        <div className='flex items-center'>
          <img
            src={isEditView ? editIcon : accountHomeIcon}
            alt='menu-icon'
            className='h-10 w-10 bg-[#7D98B6] p-2.5 rounded'
          />
          <div>
            {isEditView && (
              <h5 className='text-xs ml-2 text-gray-500 mb-1'>Edit Account</h5>
            )}
            <h4 className='font-bold text-lg ml-2 leading-4'>
              {isEditView ? accountData.account_name : 'Create Account'}
            </h4>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Cancel'
            variant='outlined'
            color='inherit'
            onClick={goBack}
          />
          <TextButton
            label='Save'
            variant='filled'
            loading={createAccount.isPending || updateAccount.isPending}
            onClick={handleExternalSubmit}
          />
        </div>
      </div>
      <div className='p-10'>
        <FormBuilder
          data={FormData(
            memoizedContry,
            memoizedParentAccounts,
            memoizedCurrency,
            memoizedState,
            isEditView,
            states.isLoading
          )}
          loading={
            allCountries.isLoading ||
            parentAccount.isLoading ||
            currency.isLoading
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
