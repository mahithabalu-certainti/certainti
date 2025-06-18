/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { EditIcon, ProjectCreateIcon } from '../../../assets';
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
import {
  enumValue,
  FieldType,
  KeyContactHeader,
  OthersEnum,
  SelectOption,
} from '../../types';
import { transformFormData, transformKeyContactsFromAPI } from './utils';
import { NewProjectData } from '../../types/project';
import {
  useCreateProject,
  useUpdateProject,
} from '../../services/project/project-create-service';
import { useProjectDetail } from '../../services/project';
import { STATUS_OPTIONS } from '../../../common-utils';
import { FormData, newKeyContactFields } from './form-data';
import { formatDateToYYYYMMDDWithTime } from '../account-details-sidebar/sidebar-pages/resources/utils';
import SkeletonForm from '../../../components/form-builder/skeleton-form';
import dayjs from 'dayjs';

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

const ProjectForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const [isKeyContactsReady, setIsKeyContactsReady] = useState<boolean>(false);
  const [showOthersField, setShowOthersField] = useState(false);
  const [showClassifyOthersField, setShowClassifyOthersField] = useState(false);
  const [keyContacts, setKeyContacts] = useState<FieldType[]>([]);
  const { successToast } = useToast();
  const location = useLocation();
  const { accountID, projectID, settings } = location.state || {};
  const breadcrumbs = location.state.breadcrumbs || [];
  const firstLine = breadcrumbs.map((crumb: any) => crumb.label).join(' > ');
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

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
        project_enddate: account?.project_enddate
          ? dayjs(account.project_enddate).format('YYYY-MM-DD')
          : '',
        project_startdate: account?.project_startdate
          ? dayjs(account.project_startdate).format('YYYY-MM-DD')
          : '',
        created_on: formatDateToYYYYMMDDWithTime(account?.created_datetime),
        updated_on: formatDateToYYYYMMDDWithTime(account?.modified_datetime),
        ...transformKeyContactsFromAPI(account?.keyContact || []),
        region: account?.region,
        project_status: account?.project_status.toLowerCase(),
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
  const keyContactRoles = useKeyContactRoles('Project');
  const states = useFetchState(currentCountry);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const defaultActiveValue = STATUS_OPTIONS[0].value;
  const commonSuccess = createProject.isSuccess || updateProject.isSuccess;
  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Project updated successfully'
          : 'Project created successfully'
      );
      goBack();
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
    const existingContacts = account?.keyContact || [];
    const newKeyData = newKeyContactFields(memoizedRole);

    let fields: FieldType[] = [];

    if (isEditView && existingContacts.length) {
      existingContacts.forEach(() => {
        fields = [...fields, ...newKeyData];
      });
    }

    setKeyContacts(fields);
    setIsKeyContactsReady(
      !getProjectData.isPending && !keyContactRoles.isPending
    );
  }, [
    getProjectData.isPending,
    keyContactRoles.isPending,
    memoizedRole,
    account?.keyContact,
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
  const submitData = (formValues: Partial<NewProjectData>) => {
    const projectData = transformFormData(
      {
        ...formValues,
        account_id: accountID,
        project_id: projectID,
      },
      isEditView,
      account?.keyContact
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
    if (data.fieldName === 'industry_rid') {
      const selectedIndustry = memoizedIndustry.find(
        (option) => String(option.value) === String(data.fieldValue)
      );

      setShowOthersField(
        selectedIndustry?.label.toLowerCase() === OthersEnum.Other
      );
    }
    if (data.fieldName === 'project_classification_rid') {
      const selectedClassification = memoizedClassification.find(
        (option) => String(option.value) === String(data.fieldValue)
      );

      setShowClassifyOthersField(
        selectedClassification?.label.toLowerCase() === OthersEnum.Other
      );
    }
  };
  useEffect(() => {
    if (account?.country) {
      setCurrentCountry(account?.country);
    }
  }, [account?.country]);

  useEffect(() => {
    const selectedIndustry = memoizedIndustry.find(
      (option) => String(option.value) === String(account?.industry_rid)
    );

    setShowOthersField(
      selectedIndustry?.label.toLowerCase() === OthersEnum.Other
    );
  }, [account?.industry_rid, memoizedIndustry]);

  useEffect(() => {
    const selectedClassification = memoizedClassification.find(
      (option) =>
        String(option.value) === String(account?.project_classification_rid)
    );

    setShowClassifyOthersField(
      selectedClassification?.label.toLowerCase() === OthersEnum.Other
    );
  }, [account?.project_classification_rid, memoizedClassification]);

  const formConfig = FormData(
    memoizedContry,
    memoizedCurrency,
    memoizedState,
    memoizedIndustry,
    memoizedClassification,
    // memoizedRole,
    keyContacts,
    addKeyContactInfo,
    removeKeyContactInfo,
    isEditView,
    showOthersField,
    showClassifyOthersField,
    states.isLoading
  );

  const formLoading =
    allCountries.isLoading ||
    currency.isLoading ||
    industry.isLoading ||
    Classification.isLoading ||
    keyContactRoles.isLoading;

  return (
    <>
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          {isEditView ? (
            <EditIcon
              alt='projrct-icon'
              className='h-6 w-6 bg-[#7D98B6] p-1.5 border-box rounded'
            />
          ) : (
            <ProjectCreateIcon
              alt='projrct-icon'
              className='h-6 w-6 bg-[#7D98B6] p-1.5 border-box rounded'
            />
          )}

          <div className='w-[90%]'>
            <div className='font-semibold text-[12px] leading-[20px] ml-2 text-[#7D98B6]'>
              {firstLine}
            </div>
            <h4 className='ml-2 font-bold text-[16px] leading-[20px] tracking-[0] text-[#2D3E4F]'>
              {isEditView ? 'Edit Project' : 'Create Project'}
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
        {formLoading ? (
          <SkeletonForm />
        ) : (
          <FormBuilder
            data={formConfig}
            loading={false}
            values={
              isEditView && isKeyContactsReady
                ? { ...projectData }
                : !isEditView
                  ? {
                      project_status: defaultActiveValue,
                      status: defaultActiveValue,
                      auto_send_ai_interaction:
                        settings?.auto_send_interaction || enumValue.No,
                      auto_access_rd: settings?.auto_access_rd || enumValue.Yes,
                      max_ai_interaction: settings?.max_ai_interactions,
                      currency: settings?.currency_rid,
                    }
                  : {}
            }
            outData={submitData}
            formRef={formRef}
            onChange={onChangeField}
            keyStart='project_startdate'
            keyEnd='project_enddate'
            layout={Layout.TYPE_1}
            keyContactHeaders={defaultKeyContactHeaders}
          />
        )}
      </div>
    </>
  );
};

export default ProjectForm;
