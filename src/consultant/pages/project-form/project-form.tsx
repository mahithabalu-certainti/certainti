/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { editIcon, projectCreateIcon } from '../../../assets';
import { Layout, OnChange, useGetAllCountries } from '../../../common-service';
import { FormBuilder } from '../../../components';
import TextButton from '../../../components/button/text-button';
import { useToast } from '../../../hooks';
import {
  useFetchClassification,
  useFetchCurrency,
  useFetchIndustrys,
  useFetchState,
  useKeyContactRoles,
} from '../../services/account';
import { FieldType, SelectOption } from '../../types';
import { transformFormData } from './utils';
import { NewProjectData } from '../../types/project';
import {
  useCreateProject,
  useUpdateProject,
} from '../../services/project/project-create-service';
import { useProjectDetail } from '../../services/project';
import {
  othersClassificationId,
  othersIndustryId,
} from '../account-create/utils';
import { STATUS_OPTIONS } from '../../../common-utils';
import { FormData, newKeyContactFields } from './form-data';
import { formatDateToYYYYMMDDWithTime } from '../account-details-sidebar/sidebar-pages/resources/utils';

const ProjectForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const [primaryKeyContactInfo, setPrimaryKeyContactInfo] = useState({
    key_contact_name: '',
    key_contact_role: '',
    key_contact_email: '',
  });
  const [showOthersField, setShowOthersField] = useState(false);
  const [showClassifyOthersField, setShowClassifyOthersField] = useState(false);
  const [keyContacts, setKeyContacts] = useState<FieldType[]>([]);
  const [newContactLength, setNewContactLength] = useState<number>(0);
  const { successToast } = useToast();
  const location = useLocation();
  const { accountID, projectID } = location.state || {};
  const keyContactInfo = [
    'key_contact_name',
    'key_contact_role',
    'key_contact_email',
  ];

  const formatDateToYYYYMMDD = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const getProjectData = useProjectDetail(accountID, projectID);
  const account = getProjectData.data?.data?.project;
  // need to change this
  const projectData = useMemo(
    () => ({
      ...account,
      ...(account && {
        auto_send_ai_interaction: account?.auto_send_ai_interaction
          ? 'Yes'
          : 'No',
        auto_access_rd: account?.auto_access_rd ? 'Yes' : 'No',
        project_enddate: formatDateToYYYYMMDD(account?.project_enddate),
        project_startdate: formatDateToYYYYMMDD(account?.project_startdate),
        created_on: formatDateToYYYYMMDDWithTime(account?.created_datetime),
        updated_on: formatDateToYYYYMMDDWithTime(account?.modified_datetime),
        region: account?.region,
        key_contact_name: account?.keyContact[0]?.key_contact_name,
        key_contact_role: account?.keyContact[0]?.key_contact_role,
        key_contact_email: account?.keyContact[0]?.key_contact_email,
        key_contact_status: account?.keyContact[0]?.status,
        project_status: account?.project_status.toLowerCase(),
        is_primary_contact: account?.keyContact[0]?.is_primary_contact
          ? 'yes'
          : 'no',
        include_in_communication: account?.keyContact[0]
          ?.include_in_communication
          ? 'yes'
          : 'no',
      }),
    }),
    [account]
  );
  // const account = useMemo(() => getProjectData.data?.data?.project, [
  //   getProjectData.data?.data?.project,
  // ]);
  const allCountries = useGetAllCountries();
  const currency = useFetchCurrency();
  const industry = useFetchIndustrys();
  const Classification = useFetchClassification();
  const keyContactRoles = useKeyContactRoles();
  const states = useFetchState(currentCountry);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const isValueUpdateInKeyContact = Object.values(primaryKeyContactInfo).some(
    (val) => val.trim() !== ''
  );

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const defaultActiveValue = STATUS_OPTIONS[0].value;
  const commonSuccess = createProject.isSuccess || updateProject.isSuccess;
  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Project update successfully'
          : 'Project created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  useEffect(() => {
    setPrimaryKeyContactInfo({
      key_contact_email: account?.key_contact_email || '',
      key_contact_name: account?.key_contact_name || '',
      key_contact_role: account?.key_contact_role || '',
    });
  }, [
    account?.key_contact_email,
    account?.key_contact_name,
    account?.key_contact_role,
  ]);

  const memoizedContry: SelectOption[] = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );
  const memoizedClassification: SelectOption[] = useMemo(
    () =>
      Classification.data?.data.projectClassifications.map((data) => ({
        label: data.classification_name,
        value: data.rid,
      })) || [],
    [Classification.data?.data.projectClassifications]
  );

  const memoizedCurrency: SelectOption[] = useMemo(
    () =>
      currency.data?.data.currency.map((account) => ({
        label: account.currency_name,
        value: account.rid,
      })) || [],
    [currency.data?.data.currency]
  );
  const memoizedIndustry: SelectOption[] = useMemo(
    () =>
      industry.data?.data.industries.map((industries) => ({
        label: industries.industry_name,
        value: industries.rid,
      })) || [],
    [industry.data?.data.industries]
  );

  const memoizedState: SelectOption[] = useMemo(
    () =>
      states.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [states.data?.data.states]
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

  const submitData = (formValues: Partial<NewProjectData>) => {
    const projectData = transformFormData(
      {
        ...formValues,
        account_id: accountID,
        project_id: projectID,
      },
      isEditView,
      isValueUpdateInKeyContact,
      account?.keyContact?.[0]?.rid
    );

    if (isEditView) {
      updateProject.mutate(projectData);
    } else {
      createProject.mutate(projectData);
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const goBack = () => {
    window.history.back();
  };

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'country') {
      setCurrentCountry(data.fieldValue as string);
    }
    if (keyContactInfo.includes(data.fieldName)) {
      setPrimaryKeyContactInfo((prev) => ({
        ...prev,
        [data.fieldName]: data.fieldValue,
      }));
    }
    if (data.fieldName === 'industry_rid') {
      setShowOthersField(data.fieldValue === othersIndustryId);
    }
    if (data.fieldName === 'project_classification_rid') {
      setShowClassifyOthersField(data.fieldValue === othersClassificationId);
    }
  };
  useEffect(() => {
    if (account?.country) {
      setCurrentCountry(account?.country);
    }
  }, [account?.country]);

  useEffect(() => {
    if (account?.industry_rid === othersIndustryId) {
      setShowOthersField(true);
    }
  }, [account?.industry_rid]);
  useEffect(() => {
    if (account?.project_classification_rid === othersClassificationId) {
      setShowClassifyOthersField(true);
    }
  }, [account?.project_classification_rid]);

  return (
    <>
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <img
            src={isEditView ? editIcon : projectCreateIcon}
            alt='projrct-icon'
            className='h-6 w-6 bg-[#7D98B6] p-1.5 border-box rounded'
          />
          <div className='w-[90%]'>
            {isEditView && (
              <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
                Edit Project
              </h5>
            )}
            <h4
              className={`${isEditView ? 'text-[14px]' : 'text-[16px]'} font-bold text-[#2D3E4F] ml-2 leading-4 w-[95%] overflow-ellipsis truncate`}
            >
              {isEditView ? projectData.project_name : 'Create Project'}
            </h4>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={createProject.isPending || updateProject.isPending}
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
        <FormBuilder
          data={FormData(
            memoizedContry,
            memoizedCurrency,
            memoizedState,
            memoizedIndustry,
            memoizedClassification,
            // memoizedRole,
            isValueUpdateInKeyContact,
            keyContacts,
            addKeyContactInfo,
            removeKeyContactInfo,
            isEditView,
            showOthersField,
            showClassifyOthersField,
            states.isLoading
          )}
          // loading={
          //   allCountries.isLoading || currency.isLoading || state.isLoading
          // }
          loading={false}
          values={
            isEditView && projectData
              ? { ...projectData }
              : {
                  project_status: defaultActiveValue,
                  status: defaultActiveValue,
                }
          }
          outData={submitData}
          formRef={formRef}
          onChange={onChangeField}
          keyStart='project_startdate'
          keyEnd='project_enddate'
          layout={Layout.TYPE_1}
          newContactLength={newContactLength}
        />
      </div>
    </>
  );
};

export default ProjectForm;
