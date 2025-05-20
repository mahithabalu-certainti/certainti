import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { editIcon, projectCreateIcon } from '../../../assets';
import { OnChange, useGetAllCountries } from '../../../common-service';
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
import {SelectOption } from '../../types';
import { FormData } from './form-data';
import { transformFormData } from './utils';
import { NewProjectData } from '../../types/project';
import { useCreateProject, useUpdateProject } from '../../services/project/project-create-service';
import { useProjectDetail } from '../../services/project';
import { othersIndustryId } from '../account-create/utils';

const ProjectForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const [primaryKeyContactInfo, setPrimaryKeyContactInfo] = useState({
    key_contact_name: '',
    key_contact_role: '',
    key_contact_email: '',
  });
  const [showOthersField, setShowOthersField] = useState(false);
  const { successToast } = useToast();
  const location = useLocation();
  const { accountID, projectID } = location.state;
  const keyContactInfo = [
    'key_contact_name',
    'key_contact_role',
    'key_contact_email',
  ];

  
  const getProjectData = useProjectDetail(accountID,projectID);
  const account = getProjectData.data?.data?.project;
  console.log(account);
  // need to change this
  const projectData = useMemo(
    () => ({
      ...account
    }),
    [account]
  );

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
console.log(isEditView);
  const commonSuccess = createProject.isSuccess || updateProject.isSuccess;
  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Project update successfully'
          : 'Project created successfully'
      );
      goBack()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  // useEffect(() => {
  //   setPrimaryKeyContactInfo({
  //     key_contact_email: account.key_contact_email || '',
  //     key_contact_name: account.key_contact_name || '',
  //     key_contact_role: account.key_contact_role || '',
  //   });
  // }, [
  //   account.key_contact_email,
  //   account.key_contact_name,
  //   account.key_contact_role,
  // ]);

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
  const submitData = (formValues: Partial<NewProjectData>) => {
    console.log(account?.rid);
    const projectData = transformFormData(
      {
        ...formValues,
        account_id:accountID,
        client_organization: "TechCorp Inc.",// need to remove
      },
      isEditView
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
    if (data.fieldName === 'industry') {
      console.log(data.fieldName);
      setShowOthersField(
        data.fieldValue === othersIndustryId 
      );
    }
  };
  useEffect(() => {
    if (projectData.country_rid) {
      setCurrentCountry(projectData.country_rid);
    }
  }, [projectData.country_rid]);
  useEffect(() => {
    if (account?.industry === othersIndustryId) {
      setShowOthersField(true);
    }
  }, [account?.industry]);
 

  return (
    <>
      <div className='flex justify-between items-center border-b-2 border-gray-200 px-10 py-6'>
        <div className='flex items-center'>
          <img
            src={isEditView ? editIcon : projectCreateIcon}
            alt='projrct-icon'
            className='h-[32px] w-[32px]  rounded'
          />
          <div>
          {isEditView && (
              <h5 className='font-semibold text-[11px] leading-[20px] ml-2 text-[#7D98B6]'>{projectData.project_name}</h5>
            )}
            <div className='font-semibold text-[20px] ml-2 text-[#2D3E4F] leading-[20px]'>
              {isEditView ? "Edit Project": 'New Project'}
            </div>
           
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
            loading={createProject.isPending || updateProject.isPending}
            onClick={handleExternalSubmit}
            sx={{ height: '32px', width: '64px', fontSize:'13px', fontWeight: 400 }}
          />
        </div>
      </div>
      <div className='p-10'>
        <FormBuilder
          data={FormData(
            memoizedContry,
            memoizedCurrency,
            memoizedState,
            memoizedIndustry,
            memoizedClassification,
            memoizedRole,
            isValueUpdateInKeyContact,
            isEditView,
            showOthersField,
            states.isLoading
          )}
          // loading={
          //   allCountries.isLoading || currency.isLoading || state.isLoading
          // }
          loading={false}
          values={isEditView && projectData ? { ...projectData } : undefined}
          outData={submitData}
          formRef={formRef}
          onChange={onChangeField}
          keyStart='project_start_date'
          keyEnd='project_end_date'
        />
      </div>
    </>
  );
};

export default ProjectForm;
