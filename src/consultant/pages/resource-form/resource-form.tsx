/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { createresourceIcon, editIcon } from '../../../assets';
import { Layout, OnChange, useGetAllCountries } from '../../../common-service';
import { FormBuilder } from '../../../components';
import TextButton from '../../../components/button/text-button';
import { useToast } from '../../../hooks';
import {
  useFetchCity,
  useFetchCurrency,
  useFetchState,
} from '../../services/account';
import {
  useCreateResourceCost,
  useFetchResourceCostById,
  useUpdateResourceCost,
} from '../../services/resource-cost/resource-cost-service';
import { useCreateResource } from '../../services/resource-create';
import { useResourceDetail } from '../../services/resource-details';
import {
  useCreateResourceSkill,
  useFetchResourceSkillSubType,
  useFetchResourceSkillType,
  // useFetchResourceSkillById,
  useUpdateResourceSkill,
} from '../../services/resource-skill/resource-skill-service';
import { useUpdateResource } from '../../services/resource-update';
import { SelectOption } from '../../types';
import { ResourceFormData } from './form-data';
import {
  transformCostData,
  transformPayloadforCreateResource,
  transformPayloadforUpdateResource,
  transformSkillData,
} from './utils.tsx';
import { SkillSubtype, SkillType } from '../../types/resource.ts';
import { formatDateToMMDDYYYYWithTime } from '../account-details-sidebar/sidebar-pages/resources/utils.tsx';

const ResourceForm: React.FC = () => {
  // Refs
  const formRef = React.useRef<HTMLFormElement>(null);
  // State
  const [currentCountry, setCurrentCountry] = useState({
    country: '',
    state: '',
  });
  const [currentSkillType, setCurrentSkillType] = useState({
    skillSubType: '',
    skill_type: '',
    skill_sub_type: '',
  });
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // Hooks
  const { successToast } = useToast();
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resourceId = searchParams.get('res_id');
  const [resourceDetails, setResourceDetails] = useState<any>(null);
  const accountId = searchParams.get('account_id');
  const [skillSubTypeData, setSkillSubTypeData] = useState<SelectOption[]>([]);
  // Derived values
  const isEditView = location.pathname.includes('/edit');
  const accountData = isEditView
    ? location?.state?.accountDetails?.data?.accountById
    : location?.state?.accountDetails?.data?.accountById;
  const resourceName = isEditView
    ? location?.state?.resource?.resource_fullname
    : 'New Resource';

  const costAndSKillAccountInfo = state?.data?.accountById;
  const skillCostResourceId =
    state?.costInfo?.resourceRID || state?.skillInfo?.resourceRID;

  const resourceRId =
    !isEditView && (state?.cost || state?.skill)
      ? state?.resourceData?.rid
      : isEditView && (state?.cost || state?.skill)
        ? skillCostResourceId
        : null;
  const accountNumber =
    state?.cost || state?.skill ? state?.data?.accountById?.r_number : null;
  //data fetching by cost id
  const { data: costDetails, isSuccess: costSuccess } =
    useFetchResourceCostById({
      accountNumber: accountNumber,
      id: state?.costInfo?.costRid,
    });

  const costInfo =
    (costDetails as { resourceCostById?: Record<string, any> })
      ?.resourceCostById || {};
  const skillInfo = state?.skillInfo || {};

  // Data fetching
  const { data: resource, isSuccess } = useResourceDetail(
    resourceId || location?.state?.resource?.rid || resourceRId,
    location?.state?.accountDetails?.data?.accountById?.r_number ||
    accountNumber
  );

  useEffect(() => {
    const resourceDetailsData = resource?.data?.resourceDetails;
    const finalResourceDetails = {
      ...resourceDetailsData,
      country: resourceDetailsData?.resource_country,
      state: resourceDetailsData?.resource_region,
      city: resourceDetailsData?.resource_city,
      designation: resourceDetailsData?.resource_designation,
      total_years_experience: resourceDetailsData?.resource_total_experience,
      total_years_in_org:
        resourceDetailsData?.resource_total_experience_organization,
      Record_id: resourceDetailsData?.rid,
      Resource_id: resourceDetailsData?.r_number,
      Created_On: formatDateToMMDDYYYYWithTime(resourceDetailsData?.created_datetime),
      Created_By: resourceDetailsData?.created_by,
      Updated_On: formatDateToMMDDYYYYWithTime(resourceDetailsData?.modified_datetime),
      Updated_By: resourceDetailsData?.modified_by,
    };
    setResourceDetails(finalResourceDetails || null);
  }, [resource]);

  useEffect(() => {
    const formValues = resource?.data?.resourceDetails;
    if (state?.cost && isSuccess && costSuccess && isEditView) {
      const costValues = {
        ...formValues,
        financial_start_date: costInfo?.effective_date || '',
        financial_end_date: costInfo?.end_date || '',
        cost: costInfo?.cost || '',
        currency: costInfo?.currency_rid || null,
        cost_frequency: costInfo?.cost_frequency || '',
        fiscal_year: costInfo?.fiscal_year || '',
        comments: costInfo?.comments || '',
      };
      setFormValues(costValues);
    } else if (state?.skill && isSuccess && skillInfo && isEditView) {
      const skillValues = {
        ...formValues,
        skill_level: skillInfo?.skillLevel || '',
        skill_details: skillInfo?.skillDetails || '',
        skill_type: skillInfo?.skillTypeId || '',
        skill_sub_type: skillInfo?.skillSubTypeId || '',
        skill_start_date: skillInfo?.startDate || '',
        skill_type_others: skillInfo?.skillTypeOthers || '',
        skill_subtype_others: skillInfo?.skillSubTypeOthers || '',
        years_of_experience: skillInfo?.yearsOfExperience || '',
      };
      setFormValues(skillValues);
    }
    else if (formValues && !isEditView) {
      // Set form values with resource details when creataing cost and skill
      setFormValues(formValues);
    }
  }, [state, costDetails, resource]);


  const countryId = resource?.data?.resourceDetails.resource_country;
  const stateId = resource?.data?.resourceDetails.resource_region;
  useEffect(() => {
    if (countryId) {
      setCurrentCountry((prev) => ({ ...prev, country: countryId }));
    }
    if (stateId) {
      setCurrentCountry((prev) => ({ ...prev, state: stateId }));
    }
  }, [countryId, stateId]);

  const skillTypeId = skillInfo.skillTypeId;
  const skillSubTypeId = skillInfo.skillSubTypeId;
  useEffect(() => {
    if (skillTypeId) {
      setCurrentSkillType((prev) => ({ ...prev, skill_type: skillInfo.skillTypeId }));
    }
    if (skillSubTypeId) {
      setCurrentSkillType((prev) => ({ ...prev, skillSubType: skillInfo.skillSubTypeId }));
    }
  }, [skillTypeId, skillSubTypeId]);

  // const resourceValues = resource?.data?.resourceDetails;
  const userDetails = JSON.parse(localStorage.getItem('auth') || '{}');
  const allCountries = useGetAllCountries();
  const states = useFetchState(currentCountry.country);
  const city = useFetchCity(currentCountry.state);
  const { data: skillType } = useFetchResourceSkillType();
  const { data: skillSubType, isLoading: skillSubTypeLoading } = useFetchResourceSkillSubType(currentSkillType.skill_type);

  const currency = useFetchCurrency();
  // Mutations
  const createResource = useCreateResource(accountId as string);
  const updateResource = useUpdateResource(accountId as string);
  const createResourceCost = useCreateResourceCost();
  const updateResourceCost = useUpdateResourceCost();
  const createResourceSkill = useCreateResourceSkill();
  const updateResourceSkill = useUpdateResourceSkill();

  const costSkillSuccess =
    createResourceCost.isSuccess ||
    updateResourceCost.isSuccess ||
    createResourceSkill.isSuccess ||
    updateResourceSkill.isSuccess;
  const commonSuccess =
    createResource.isSuccess || updateResource.isSuccess || costSkillSuccess;

  // Memoized data transformations
  const memoizedCountry: SelectOption[] = useMemo(() => {
    const countries = allCountries.data?.data.country || [];
    return countries
      .slice()
      .sort((a, b) => a.country_name.localeCompare(b.country_name))
      .map((country) => ({
        label: country.country_name,
        value: country.rid,
      }));
  }, [allCountries.data?.data.country]);

  const memoizedState: SelectOption[] = useMemo(
    () =>
      states.data?.data.states.map((role) => ({
        label: role.state_name,
        value: role.rid,
      })) || [],
    [states.data?.data.states]
  );

  const memoizeCity: SelectOption[] = useMemo(
    () =>
      city.data?.data.cities.map((role) => ({
        label: role.city_name,
        value: role.rid,
      })) || [],
    [city.data?.data.cities]
  );

  const memoizedCurrency: SelectOption[] = useMemo(
    () =>
      currency.data?.data.currency.map((account) => ({
        label: account.currency_name,
        value: account.rid,
      })) || [],
    [currency.data?.data.currency]
  );

  const memoizedSkillType: SelectOption[] = useMemo(() => {
    const data = skillType as SkillType[];
    const convertData = data?.map((skill: SkillType) => ({
      label: skill.skill_type_name,
      value: skill.rid,
    })) || []
    return convertData
  }, [skillType]);

  useEffect(() => {
    const data = skillSubType as SkillSubtype[];
    const finalData = data?.map((skill: SkillSubtype) => ({
      label: skill.skill_subtype_name,
      value: skill.rid,
    })) || []
    setSkillSubTypeData(finalData)
  }, [skillSubType])


  useEffect(() => {
    if (commonSuccess) {
      if (state?.cost) {
        successToast(
          isEditView
            ? 'Resource cost details updated successfully'
            : 'Resource cost details added successfully'
        );
      }

      if (state?.skill) {
        successToast(
          isEditView
            ? 'Resource skill details updated successfully'
            : 'Resource skill details added successfully'
        );
      }
      if (!state.skill && !state.cost) {
        successToast(
          isEditView
            ? 'Resource updated successfully'
            : 'Resource created successfully'
        );
      }
      navigate(-1);
    }
  }, [commonSuccess, isEditView, state.cost, state.skill]);

  // Handlers
  const handleSubmit = (formValues: any) => {
    if (state?.cost) {
      const updateFormValues = {
        ...formValues,
        accountNumber: state?.data?.accountById?.r_number,
        account_rid: state?.data?.accountById?.rid,
        resource_rid: resourceId,
        resource_number: resource?.data.resourceDetails.r_number,
        cost_rid: state?.costInfo?.costRid,
      };
      const costData = transformCostData(updateFormValues, isEditView);
      if (isEditView) {
        updateResourceCost.mutate(costData);
      } else {
        createResourceCost.mutate(costData);
      }
    }
    if (state?.skill) {
      const updateFormValues = {
        ...formValues,
        accountNumber: state?.data?.accountById?.r_number,
        account_rid: state?.data?.accountById?.rid,
        resource_rid: resourceId,
        resource_number: resource?.data.resourceDetails.r_number,
        skill_rid: state?.skillInfo?.skillRId,
        resource_desc: resource?.data.resourceDetails.resource_role,
      };
      const skillData = transformSkillData(updateFormValues, isEditView);

      if (isEditView) {
        updateResourceSkill.mutate(skillData);
      } else {
        createResourceSkill.mutate(skillData);
      }
    }
    if (!state?.skill && !state?.cost) {
      if (isEditView) {
        const updatedData = transformPayloadforUpdateResource(
          formValues,
          resource?.data?.resourceDetails, // Adjusted to access the correct property
          {
            resource_id: location?.state?.resource?.rid,
            account_number: accountData?.r_number,
            text: "sample"
          }
        );
        updateResource.mutate(updatedData as any);
      } else {
        const finaldata = transformPayloadforCreateResource({
          account_number: accountData?.r_number,
          account_id: accountData?.rid,
          created_by: userDetails.userId,
          ...formValues,
        });
        createResource.mutate(finaldata as any);
      }
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
    formRef.current?.reset();
  };

  const handleGoBack = () => {
    formRef.current?.reset();
    navigate(-1 as any, {
      state: { ...location.state, activeKey: 'resources' },
      replace: true,
    });
  };

  const onChangeField = ({ fieldName, fieldValue }: OnChange) => {
    if (fieldName === 'country' || fieldName === 'state') {
      setCurrentCountry((prev) => ({
        ...prev,
        [fieldName]: fieldValue as string,
      }));
    }
    if (fieldName === 'skill_type') {
      setCurrentSkillType((prev) => ({
        ...prev,
        [fieldName]: fieldValue as string,
      }));
    }
    if (fieldName === 'skill_sub_type') {
      setCurrentSkillType((prev) => ({
        ...prev,
        [fieldName]: fieldValue as string,
      }));
    }
  };

  //disable orgname in the formdata if the user select resource type as full-time
  const disableOrgname = resourceDetails?.resource_type === 'full-time';


  // Form configuration
  const formConfig = ResourceFormData(
    memoizedCountry,
    memoizedState,
    memoizeCity,
    memoizedCurrency,
    memoizedSkillType,
    skillSubTypeData,
    states.isLoading,
    city.isLoading,
    currency.isLoading,
    skillSubTypeLoading,
    isEditView,
    state?.cost || state?.skill,
    disableOrgname,
    currentSkillType.skill_type,
    currentSkillType.skill_sub_type || currentSkillType.skillSubType,
    state?.skill,
    state?.cost,
    state?.resourceCreate
  );

  return (
    <div className='resource-form-container'>
      <div className='flex justify-between items-center border-b-2 border-gray-200 px-10 py-6'>
        <div className='flex items-center'>
          <img
            src={isEditView ? editIcon : createresourceIcon}
            alt='menu-icon'
            className={`${isEditView ? 'bg-[#7D98B6] p-2.5' : ''} h-8 w-8 rounded`}
          />
          <div>
            {/* {isEditView && !state?.skill && !state?.cost && (
              <h5 className='mb-1 ml-2 text-xs text-gray-500'>Edit Resource</h5>
            )} */}
            <div className='font-semibold text-[11px] leading-[20px] ml-2 text-[#7D98B6]'>
              {!state?.skill && !state?.cost
                ? `Account > ${accountData?.account_name}`
                : `Account > ${costAndSKillAccountInfo?.account_name}`}
            </div>
            {!isEditView && (
              <h4 className='ml-2 font-semibold text-[20px] leading-[20px] tracking-[0] text-[#2D3E4F]'>
                {state?.cost
                  ? `${resourceName} Cost`
                  : state?.skill
                    ? `${resourceName} Skill`
                    : resourceName}
              </h4>
            )}
            {isEditView && (
              <h4 className='ml-2 font-semibold text-[20px] leading-[20px] tracking-[0] text-[#2D3E4F]'>
                {state?.cost
                  ? 'Edit Resource Cost'
                  : state?.skill
                    ? `Edit Resource Skill`
                    : (resourceName ?? 'Edit Resource')}
              </h4>
            )}
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Cancel'
            // variant='outlined'
            // color='inherit'
            onClick={handleGoBack}
            sx={{
              width: '56px',
              minWidth: '56px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Save'
            // variant='filled'
            loading={
              createResource.isPending ||
              updateResource.isPending ||
              createResourceSkill.isPending ||
              updateResourceSkill.isPending ||
              createResourceCost.isPending ||
              updateResourceCost.isPending
            }
            onClick={handleExternalSubmit}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
      <FormBuilder
        data={formConfig}
        loading={allCountries.isLoading}
        values={
          isEditView &&
            !state?.cost &&
            !state?.skill &&
            (resourceDetails as unknown as Record<
              string,
              string | number | boolean | string[] | null
            >)
            ? (resourceDetails as unknown as Record<
              string,
              string | number | boolean | string[] | null
            >)
            : state?.cost || state?.skill
              ? (formValues as unknown as Record<
                string,
                string | number | boolean | string[] | null
              >)
              : undefined
        }
        // values={
        //   resource.data?.data?.resource as unknown as Record<
        //     string,
        //     string | number | boolean | string[] | null
        //   >
        // }
        outData={handleSubmit}
        formRef={formRef}
        onChange={onChangeField}
        layout={Layout.TYPE_1}
      />
    </div>
  );
};

export default ResourceForm;
