/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createresourceIcon, editIcon } from '../../../assets';
import { OnChange, useGetAllCountries } from '../../../common-service';
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

  // Hooks
  const { successToast } = useToast();
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();

  // Derived values
  const isEditView = location.pathname.includes('/edit');
  const accountData = isEditView
    ? location?.state?.accountDetails?.data?.accountById
    : location?.state?.data?.accountById;
  const resourceName = isEditView
    ? location?.state?.resource?.resource_fullname
    : 'New Resource';

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

  const { data: costDetails } = useFetchResourceCostById({
    accountNumber: accountNumber,
    id: state?.costInfo?.costRid,
  });
  const costInfo =
    (costDetails as { resourceCostById?: Record<string, any> })
      ?.resourceCostById || {};
  const skillInfo = state?.skillInfo || {};

  // Data fetching
  const { data: resource } = useResourceDetail(
    location?.state?.resource?.rid || resourceRId,
    location?.state?.accountDetails?.data?.accountById?.r_number ||
      accountNumber
  );

  const formValues = state?.cost
    ? {
        ...resource?.data?.resourceDetails,
        financial_start_date: costInfo?.effective_date || '',
        financial_end_date: costInfo?.end_date || '',
        cost: costInfo?.cost || '',
        currency: costInfo?.currency_rid || null,
        cost_frequency: costInfo?.cost_frequency || '',
      }
    : state?.skill
      ? {
          ...resource?.data?.resourceDetails,
          skill_level: skillInfo?.skillLevel || '',
          skill_name: skillInfo?.skillName || '',
          skill_start_date: skillInfo?.startDate || '',
          years_of_experience: skillInfo?.yearsOfExperience || '',
        }
      : null;
  // const resourceValues = resource?.data?.resourceDetails;
  const userDetails = JSON.parse(localStorage.getItem('auth') || '{}');
  const allCountries = useGetAllCountries();
  const states = useFetchState(currentCountry.country);
  const city = useFetchCity(currentCountry.state);
  const currency = useFetchCurrency();
  // Mutations
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
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
            ? 'Resource cost updated successfully'
            : 'Resource cost created successfully'
        );
      }

      if (state?.skill) {
        successToast(
          isEditView
            ? 'Resource skill updated successfully'
            : 'Resource skill created successfully'
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
        resource_rid: state?.resourceData?.rid,
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
        resource_rid: state?.resourceData?.rid,
        skill_rid: state?.skillInfo?.skillRId,
        resource_desc: state?.skillInfo?.resourceRole,
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
            className='h-8 w-8 rounded'
          />
          <div>
            {isEditView && (
              <h5 className='text-xs ml-2 text-gray-500 mb-1'>Edit Resource</h5>
            )}
            <div className='text-xs ml-2 leading-4 text-gray-500'>
              {`Account > ${accountData?.account_name}`}
            </div>
            <h4 className='font-bold text-lg ml-2 leading-4'>{resourceName}</h4>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Cancel'
            variant='outlined'
            color='inherit'
            onClick={handleGoBack}
          />
          <TextButton
            label='Save'
            variant='filled'
            loading={createResource.isPending || updateResource.isPending}
            onClick={handleExternalSubmit}
          />
        </div>
      </div>
      <div className='p-10'>
        <FormBuilder
          data={formConfig}
          // loading={allCountries.isLoading}
          loading={false}
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
        />
      </div>
    </div>
  );
};

export default ResourceForm;
