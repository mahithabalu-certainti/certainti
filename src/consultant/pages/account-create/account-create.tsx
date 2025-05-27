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
  useKeyContactRoles,
} from '../../services/account';
import {
  useCreateAccount,
  useUpdateAccount,
} from '../../services/account-create';
import { AccountFormData, FieldType, SelectOption, YesNo } from '../../types';
import { FormData, newKeyContactFields } from './form-data';
import {
  DATA_STORAGE_OPTIONS,
  othersIndustryId,
  transformFormData,
} from './utils';
import { ACCOUNT } from '../../../routes';
import { getDateTimeFormat, STATUS_OPTIONS } from '../../../common-utils';

export const AccountForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const [primaryKeyContactInfo, setPrimaryKeyContactInfo] = useState({
    key_contact_name: '',
    key_contact_role: '',
    key_contact_email: '',
  });
  const [isParentAccountRequired, setIsParentAccountRequired] = useState(false);
  const [showOthersField, setShowOthersField] = useState(false);
  const [dataResidency, setDataResidency] = useState(DATA_STORAGE_OPTIONS);
  const [keyContacts, setKeyContacts] = useState<FieldType[]>([]);
  const [newContactLength, setNewContactLength] = useState<number>(0);
  const { successToast } = useToast();
  const location = useLocation();
  const { accountid } = useParams();
  const keyContactInfo = [
    'key_contact_name',
    'key_contact_role',
    'key_contact_email',
  ];

  const getAccount = useFetchAccountFields(accountid as string);
  const account = getAccount.data?.data;
  // Remaping all fields to match with form controls
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
          key_contact_name:
            account?.accountDetails?.keyContacts?.[0]?.key_contact_name,
          key_contact_role:
            account?.accountDetails?.keyContacts?.[0]?.key_contact_role,
          key_contact_email:
            account?.accountDetails?.keyContacts?.[0]?.key_contact_email,
          key_contact_status:
            account?.accountDetails?.keyContacts?.[0]?.status.toLowerCase(),
          is_primary_contact: account?.accountDetails?.keyContacts?.[0]
            ?.is_primary_contact
            ? 'yes'
            : 'no',
          include_in_communication: account?.accountDetails?.keyContacts?.[0]
            ?.include_in_communication
            ? 'yes'
            : 'no',
          record_id: account?.accountDetails?.rid,
          account_id: account?.accountById?.r_number,
          created_on: getDateTimeFormat(account?.accountById?.created_datetime),
          updated_on: getDateTimeFormat(
            account?.accountById?.modified_datetime
          ),
          created_by: account?.accountDetails?.created_by,
          updated_by: account?.accountDetails?.modified_by,
        }),
    }),
    [account]
  );
  const defaultActiveValue = STATUS_OPTIONS[0].value;
  const isValueUpdateInKeyContact = Object.values(primaryKeyContactInfo).some(
    (val) => val.trim() !== ''
  );

  const allCountries = useGetAllCountries();
  const industry = useFetchIndustrys();
  const keyContactRoles = useKeyContactRoles();
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

  useEffect(() => {
    setPrimaryKeyContactInfo({
      key_contact_email: accountData.key_contact_email || '',
      key_contact_name: accountData.key_contact_name || '',
      key_contact_role: accountData.key_contact_role || '',
    });
  }, [
    accountData.key_contact_email,
    accountData.key_contact_name,
    accountData.key_contact_role,
  ]);

  useEffect(() => {
    if (accountData.industry_rid === othersIndustryId) {
      setShowOthersField(true);
    }
  }, [accountData.industry_rid]);

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

  const memoizedRole: SelectOption[] = useMemo(
    () =>
      keyContactRoles.data?.data.keyContactRoles.map((role) => ({
        label: role.role_name,
        value: role.rid,
      })) || [],
    [keyContactRoles.data?.data.keyContactRoles]
  );

  useEffect(() => {
    setNewContactLength(
      newKeyContactFields(memoizedRole, isValueUpdateInKeyContact).length
    );
    setKeyContacts(
      newKeyContactFields(memoizedRole, isValueUpdateInKeyContact) as []
    );
  }, [memoizedRole, isValueUpdateInKeyContact]);

  const removeKeyContactInfo = (index: number) => {
    // shallow copy keyContacts array
    const contactsArr = [...keyContacts];
    //Every time new contact is added it add newKeyContacts length fields
    // and we need to remove same number of fields from the array for that
    // we calculated the length
    const lengthOfKeyContacts = newKeyContactFields(
      memoizedRole,
      isValueUpdateInKeyContact
    ).length;
    // Finds how many contacts is added like 1, 2, 3 etc
    const totalContactGrp = Math.floor(
      keyContacts.length / lengthOfKeyContacts
    );
    // Finds which contact is clicked
    const clickedGroup =
      totalContactGrp - 1 - Math.floor(index / lengthOfKeyContacts);
    // Finds the index of the first contact in the clicked contact group
    const groupStartIndex =
      keyContacts.length - (clickedGroup + 1) * lengthOfKeyContacts;

    // Remove the clicked contact group from the array with the added newKeyContacts length
    contactsArr.splice(groupStartIndex, lengthOfKeyContacts);
    setKeyContacts(contactsArr);
  };

  const addKeyContactInfo = () => {
    const newKeyData = newKeyContactFields(
      memoizedRole,
      isValueUpdateInKeyContact
    );
    setKeyContacts([...keyContacts, ...newKeyData]);
  };

  const submitData = (formValues: Partial<AccountFormData>) => {
    const transformData = transformFormData(
      formValues,
      isEditView,
      accountData?.rid,
      isValueUpdateInKeyContact,
      account?.accountDetails?.keyContacts?.[0]?.rid
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
        setIsParentAccountRequired(false);
      } else {
        setIsParentAccountRequired(true);
        setDataResidency(DATA_STORAGE_OPTIONS);
      }
    }
    if (keyContactInfo.includes(data.fieldName)) {
      setPrimaryKeyContactInfo((prev) => ({
        ...prev,
        [data.fieldName]: data.fieldValue,
      }));
    }
    // show others field if industry is selected as Others
    if (data.fieldName === 'industry_rid') {
      // others id
      setShowOthersField(
        data.fieldValue === othersIndustryId // others id
      );
    }
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <>
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <img
            src={isEditView ? editIcon : accountHomeIcon}
            alt='menu-icon'
            className='h-6 w-6 bg-[#7D98B6] p-1.5 border-box rounded'
          />
          <div className='w-[90%]'>
            {isEditView && (
              <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
                Edit Account
              </h5>
            )}
            <h4
              className={`${isEditView ? 'text-[14px]' : 'text-[16px]'} font-bold text-[#2D3E4F] ml-2 leading-4 w-[95%] overflow-ellipsis truncate`}
            >
              {isEditView ? accountData.account_name : 'Create Account'}
            </h4>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={createAccount.isPending || updateAccount.isPending}
            onClick={handleExternalSubmit}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Cancel'
            onClick={goBack}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
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
          memoizedRole,
          isValueUpdateInKeyContact,
          isParentAccountRequired,
          keyContacts,
          addKeyContactInfo,
          removeKeyContactInfo,
          isEditView,
          states.isLoading,
          showOthersField
        )}
        loading={
          allCountries.isLoading ||
          parentAccount.isLoading ||
          currency.isLoading ||
          industry.isLoading ||
          keyContactRoles.isLoading
        }
        values={
          isEditView && accountData
            ? { ...accountData }
            : {
                status: defaultActiveValue,
                key_contact_status: defaultActiveValue,
                autosend_interaction: YesNo.Yes,
                auto_access_rd: YesNo.Yes,
              } // Set default values in Create Account
        }
        outData={submitData}
        formRef={formRef}
        onChange={onChangeField}
        layout={Layout.TYPE_1}
        newContactLength={newContactLength}
      />
    </>
  );
};
