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

enum FormSection {
  COST = 'cost',
  SKILL = 'skill',
  NONE = '',
}

const ResourceForm: React.FC = () => {
  // Refs
  const formRef = React.useRef<HTMLFormElement>(null);
  // State
  const [currentCountry, setCurrentCountry] = useState({
    country: '',
    state: '',
  });
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // Hooks
  const { successToast } = useToast();
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resourceId = searchParams.get('res_id');
  const accountId = searchParams.get('account_id');

  // Derived values
  const isEditView = location.pathname.includes('/edit');
  const accountData = isEditView
    ? location?.state?.accountDetails?.data?.accountById
    : location?.state?.data?.accountById;
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
  // const { data: skillDetails, isSuccess: skillSuccess } = useFetchResourceSkillById({
  //   accountNumber: accountNumber,
  //   rid: state?.skillInfo?.skillRId,
  // });
  // console.log("skillDetails", skillDetails);

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
    const formValues = resource?.data?.resourceDetails;
    if (state?.cost && isSuccess && costSuccess && isEditView) {
      const costValues = {
        ...formValues,
        financial_start_date: costInfo?.effective_date || '',
        financial_end_date: costInfo?.end_date || '',
        cost: costInfo?.cost || '',
        currency: costInfo?.currency_rid || null,
        cost_frequency: costInfo?.cost_frequency || '',
      };
      setFormValues(costValues);
    } else if (state?.skill && isSuccess && skillInfo && isEditView) {
      const skillValues = {
        ...formValues,
        skill_level: skillInfo?.skillLevel || '',
        skill_name: skillInfo?.skillName || '',
        skill_start_date: skillInfo?.startDate || '',
        years_of_experience: skillInfo?.yearsOfExperience || '',
      };
      setFormValues(skillValues);
    } else if (formValues && !isEditView) {
      // Set form values with resource details when creataing cost and skill
      setFormValues(formValues);
    }
  }, [state, costDetails, resource]);

  const countryId = resource?.data?.resourceDetails.country;
  const stateId = resource?.data?.resourceDetails.state;
  useEffect(() => {
    if (countryId) {
      setCurrentCountry((prev) => ({ ...prev, country: countryId }));
    }
    if (stateId) {
      setCurrentCountry((prev) => ({ ...prev, state: stateId }));
    }
  }, [countryId, stateId]);

  // const resourceValues = resource?.data?.resourceDetails;
  const userDetails = JSON.parse(localStorage.getItem('auth') || '{}');
  const allCountries = useGetAllCountries();
  const states = useFetchState(currentCountry.country);
  const city = useFetchCity(currentCountry.state);
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
      .slice() // create a shallow copy to avoid mutating original data
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
  };
  const activeFormSection = state?.cost
    ? FormSection.COST
    : state?.skill
      ? FormSection.SKILL
      : FormSection.NONE;
  // Form configuration
  const formConfig = ResourceFormData(
    memoizedCountry,
    memoizedState,
    memoizeCity,
    memoizedCurrency,
    states.isLoading,
    city.isLoading,
    currency.isLoading,
    isEditView,
    activeFormSection,
    state?.cost || state?.skill
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
            variant='outlined'
            color='inherit'
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
            variant='filled'
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
          (resource?.data?.resourceDetails as unknown as Record<
            string,
            string | number | boolean | string[] | null
          >)
            ? (resource?.data?.resourceDetails as unknown as Record<
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
