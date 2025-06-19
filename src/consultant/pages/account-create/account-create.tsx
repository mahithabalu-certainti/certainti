import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { AccountHomeIcon, EditIcon } from '../../../assets';
import {
  AllModules,
  AllPermissions,
  Layout,
  OnChange,
  useGetAllCountries,
} from '../../../common-service';
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
import {
  AccountFormData,
  FieldType,
  KeyContactHeader,
  OthersEnum,
  SelectOption,
  YesNo,
} from '../../types';
import { AccFormData, newKeyContactFields } from './form-data';
import {
  DATA_STORAGE_OPTIONS,
  transformFormData,
  transformKeyContactsFromAPI,
} from './utils';
import {
  checkPermission,
  formatDateToYYYYMMDDWithTime,
  STATUS_OPTIONS,
} from '../../../common-utils';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../../store/store';
import { AccessRestricted } from '../../../components/account-restricted';
import SkeletonForm from '../../../components/form-builder/skeleton-form';
import { setRefetchGlobalAccounts } from '../../../store/slices';

const defaultKeyContactHeaders: KeyContactHeader[] = [
  { name: 'key_contact_name', label: 'Key Contact Name', width: '190px' },
  { name: 'key_contact_role', label: 'Key Contact Role', width: '180px' },
  { name: 'key_contact_email', label: 'Key Contact Email', width: '180px' },
  // { name: 'key_contact_rid', label: 'Key Contact ID', width: '120px' },
  { name: 'is_primary_contact', label: 'Is Primary Contact?', width: '140px' },
  {
    name: 'include_in_communication',
    label: 'Interaction Recipient?',
    width: '200px',
  },
  // {
  //   name: 'interaction_cc_recipient',
  //   label: 'Interaction CC Recipient?',
  //   width: '200px',
  // },
  {
    name: 'key_contact_status',
    label: 'Key Contact Status',
    width: '140px',
  },
  { name: 'button', label: '', width: '35px' },
];

export const AccountForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const [logo, setLogo] = useState<File | null>();
  const [isParentAccountRequired, setIsParentAccountRequired] = useState(false);
  const [showOthersField, setShowOthersField] = useState(false);
  const [isKeyContactsReady, setIsKeyContactsReady] = useState<boolean>(false);
  const [dataResidency, setDataResidency] = useState(DATA_STORAGE_OPTIONS);
  const [keyContacts, setKeyContacts] = useState<FieldType[]>([]);
  const { successToast } = useToast();
  const location = useLocation();
  const { accountid } = useParams();
  const dispatch = useAppDispatch();

  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const accountIsEnable = checkPermission(modules, AllModules.ACCOUNTS);
  const isAccountCreateEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_CREATE
  );
  const isAccountEditEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_EDIT
  );

  const getAccount = useFetchAccountFields(accountid as string);
  const account = getAccount.data?.data;
  const logoUrl = account?.accountById?.logo_url;
  const logoName = logoUrl && logoUrl.substring(logoUrl.lastIndexOf('/') + 1);
  const getMimeTypeFromExtension = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'; // browser treats .jpg as image/jpeg
      case 'png':
        return 'image/png';
      case 'svg':
        return 'image/svg+xml';
      default:
        return '';
    }
  };
  useEffect(() => {
    if (logoUrl && logoName) {
      const fileType = getMimeTypeFromExtension(logoName);
      setLogo({ name: logoName, type: fileType } as File);
    }
  }, [account, logoName]);
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
          ...transformKeyContactsFromAPI(
            account?.accountDetails?.keyContacts || []
          ),
          record_id: account?.accountDetails?.rid,
          account_id: account?.accountById?.r_number,
          created_on: formatDateToYYYYMMDDWithTime(
            account?.accountById?.created_datetime
          ),
          updated_on: formatDateToYYYYMMDDWithTime(
            account?.accountById?.modified_datetime
          ),
          created_by: account?.accountDetails?.created_by,
          updated_by: account?.accountDetails?.modified_by,
          website: account?.accountDetails?.website || '',
        }),
    }),
    [account]
  );
  const defaultActiveValue = STATUS_OPTIONS[0].value;

  const allCountries = useGetAllCountries();
  const industry = useFetchIndustrys();
  const keyContactRoles = useKeyContactRoles('Account');
  const parentAccount = useFetchParentAccounts();
  const currency = useFetchCurrency();
  const states = useFetchState(currentCountry);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  const commonSuccess = createAccount.isSuccess || updateAccount.isSuccess;

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Account updated successfully'
          : 'Account created successfully'
      );
      goBack();
      if (!isEditView) {
        dispatch(setRefetchGlobalAccounts(true));
      }
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

  const memoizedRole: SelectOption[] = useMemo(
    () =>
      keyContactRoles.data?.data.keyContactRoles.map((role) => ({
        label: role.role_name,
        value: role.rid,
      })) || [],
    [keyContactRoles.data?.data.keyContactRoles]
  );

  useEffect(() => {
    const selectedIndustry = memoizedIndustry.find(
      (option) => String(option.value) === String(accountData.industry_rid)
    );

    setShowOthersField(
      selectedIndustry?.label.toLowerCase() === OthersEnum.Other
    );
  }, [accountData.industry_rid, memoizedIndustry]);

  useEffect(() => {
    const existingContacts = account?.accountDetails?.keyContacts || [];
    const newKeyData = newKeyContactFields(memoizedRole);

    let fields: FieldType[] = [];

    if (isEditView && existingContacts.length) {
      existingContacts.forEach(() => {
        fields = [...fields, ...newKeyData];
      });
    }

    setKeyContacts(fields);
    setIsKeyContactsReady(!getAccount.isPending && !keyContactRoles.isPending);
  }, [
    getAccount.isPending,
    keyContactRoles.isPending,
    memoizedRole,
    account?.accountDetails?.keyContacts,
    isEditView,
  ]);

  const removeKeyContactInfo = (fieldIndex: number) => {
    const contactsArr = [...keyContacts];
    const groupSize = 8;
    const groupIndex = Math.floor(fieldIndex / groupSize);
    const startIndex = groupIndex * groupSize;
    if (contactsArr.length <= groupSize) {
      setKeyContacts([]);
    } else {
      contactsArr.splice(startIndex, groupSize);
      setKeyContacts(contactsArr);
    }
  };

  const addKeyContactInfo = () => {
    const newKeyData = newKeyContactFields(memoizedRole);
    setKeyContacts((prev) => [...prev, ...newKeyData]);
  };
  const submitData = (formValues: Partial<AccountFormData>) => {
    let logoAction: 'update' | 'delete' | '' = '';

    if (isEditView) {
      if (!logo && logoUrl) {
        // Logo existed before, but now it's null — user deleted it
        logoAction = 'delete';
      } else if (logo instanceof File) {
        // New image uploaded
        logoAction = 'update';
      } else {
        // No change to logo
        logoAction = '';
      }
    }
    const transformData = transformFormData(
      formValues,
      isEditView,
      accountData?.rid,
      account?.accountDetails?.keyContacts,
      logoAction
    );
    const formData = new FormData();
    formData.append('logo', logo as Blob);
    formData.append('data', JSON.stringify(transformData));
    if (isEditView) {
      updateAccount.mutate(formData);
    } else {
      createAccount.mutate(formData);
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
    // show others field if industry is selected as Others
    if (data.fieldName === 'industry_rid') {
      const selectedIndustry = memoizedIndustry.find(
        (option) => String(option.value) === String(data.fieldValue)
      );

      setShowOthersField(
        selectedIndustry?.label.toLowerCase() === OthersEnum.Other
      );
    }
    if (data.fieldName === 'logo') {
      const selectedFile = data.fieldValue as File | null;
      if (selectedFile) {
        setLogo(selectedFile);
      } else {
        setLogo(null);
      }
    }
  };

  const goBack = () => {
    window.history.back();
  };

  const formConfig = AccFormData(
    memoizedContry,
    memoizedParentAccounts,
    memoizedCurrency,
    memoizedState,
    dataResidency,
    memoizedIndustry,
    isParentAccountRequired,
    keyContacts,
    addKeyContactInfo,
    removeKeyContactInfo,
    isEditView,
    states.isLoading,
    showOthersField
  );

  const formLoading =
    allCountries.isLoading ||
    parentAccount.isLoading ||
    currency.isLoading ||
    industry.isLoading ||
    keyContactRoles.isLoading;

  if (
    !accountIsEnable ||
    (isEditView ? !isAccountEditEnable : !isAccountCreateEnable)
  )
    return <AccessRestricted />;

  return (
    <>
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          {isEditView ? (
            <EditIcon className='h-6 w-6 bg-[#7D98B6] p-1.5 border-box rounded' />
          ) : (
            <AccountHomeIcon className='h-6 w-6 bg-[#7D98B6] p-1.5 border-box rounded' />
          )}
          <div className='w-[90%]'>
            {isEditView && (
              <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
                Edit Account
              </h5>
            )}
            <h4
              className={`${isEditView ? 'text-[14px]' : 'text-[16px]'} font-bold text-[#2D3E4F] -mt-1 ml-2 leading-4 w-[95%] overflow-ellipsis truncate`}
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
      <div className={`${isEditView ? 'pb-10' : 'pb-4'}`}>
        {formLoading ? (
          <SkeletonForm />
        ) : (
          <FormBuilder
            data={formConfig}
            loading={false}
            values={
              isEditView && isKeyContactsReady
                ? { ...accountData }
                : !isEditView
                  ? {
                      // Set default values in Create Account
                      status: defaultActiveValue,
                      autosend_interaction: YesNo.No,
                      auto_access_rd: YesNo.Yes,
                    }
                  : {}
            }
            outData={submitData}
            formRef={formRef}
            onChange={onChangeField}
            layout={Layout.TYPE_1}
            logo={logo}
            keyContactHeaders={defaultKeyContactHeaders}
          />
        )}
      </div>
    </>
  );
};

export default AccountForm;
