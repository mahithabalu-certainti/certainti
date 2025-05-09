import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { accountHomeIcon, editIcon } from '../../../assets';
import { Layout, OnChange, useGetAllCountries } from '../../../common-service';
import { FormBuilder } from '../../../components';
import TextButton from '../../../components/button/text-button';
import { useToast } from '../../../hooks';
import {
  useFetchAccountFields,
  useFetchCurrency,
  useFetchIndustrys,
  useFetchParentAccounts,
  useFetchState,
} from '../../services/account';
import {
  useCreateAccount,
  useUpdateAccount,
} from '../../services/account-create';
import { AccountFormData, SelectOption, YesNo } from '../../types';
import { FormData } from './form-data';
import { DATA_STORAGE_OPTIONS, transformFormData } from './utils';
import { ACCOUNT } from '../../../routes';

export const AccountForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const [dataResidency, setDataResidency] = useState(DATA_STORAGE_OPTIONS);
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
  const industry = useFetchIndustrys();
  const parentAccount = useFetchParentAccounts();
  const currency = useFetchCurrency();
  const states = useFetchState(currentCountry);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const navigate = useNavigate();

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  const commonSuccess = createAccount.isSuccess || updateAccount.isSuccess;
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

  const memoizedIndustry: SelectOption[] = useMemo(
    () =>
      industry.data?.data.industries.map((industry) => ({
        label: industry.industry_name,
        value: industry.rid,
      })) || [],
    [industry.data?.data.industries]
  );

  const submitData = (formValues: Partial<AccountFormData>) => {
    const industry_name =
      formValues.industry_rid &&
      memoizedIndustry.find((item) => item.value === formValues.industry_rid)
        ?.label;
    const transformData = transformFormData(
      formValues,
      isEditView,
      industry_name,
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
    if (data.fieldName === 'is_parent') {
      if (data.fieldValue === YesNo.Yes) {
        setDataResidency(
          DATA_STORAGE_OPTIONS.filter(
            (item) => item.value !== 'store_in_parent'
          )
        );
      } else {
        setDataResidency(DATA_STORAGE_OPTIONS);
      }
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
            className='h-8 w-8 bg-[#7D98B6] p-2.5 rounded'
          />
          <div>
            {isEditView && (
              <h5 className='text-[20px] font-semibold ml-2 text-[#2D3E4F] mb-1'>
                Edit Account
              </h5>
            )}
            <h4 className='text-[20px] font-semibold text-[#2D3E4F]  ml-2 leading-4'>
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
            sx={{ height: '32px', width: '56px', fontSize:'12px', fontWeight: 400 }}
          />
          <TextButton
            label='Save'
            variant='filled'
            loading={createAccount.isPending || updateAccount.isPending}
            onClick={handleExternalSubmit}
            sx={{ height: '32px', width: '64px', fontSize:'13px', fontWeight: 400 }}
          />
        </div>
      </div>
      <FormBuilder
        data={FormData(
          memoizedContry,
          memoizedParentAccounts,
          memoizedCurrency,
          memoizedState,
          dataResidency,
          memoizedIndustry,
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
        layout={Layout.TYPE_1}
      />
    </>
  );
};
