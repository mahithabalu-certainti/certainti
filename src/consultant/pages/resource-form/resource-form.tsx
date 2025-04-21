/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { accountHomeIcon, editIcon } from '../../../assets';
import {
  CheckErrorMsg,
  OnChange,
  useGetAllCountries,
} from '../../../common-service';
import { checkError, checkErrorMsg } from '../../../common-utils';
import { FormBuilder } from '../../../components';
import TextButton from '../../../components/button/text-button';
import { useToast } from '../../../hooks';
import { useFetchCurrency, useFetchState } from '../../services/account';
import { useResourceDetail } from '../../services/resource-details';

import { useCreateResource } from '../../services/resource-create';
import { useUpdateResource } from '../../services/resource-update';
import { SelectOption } from '../../types';
import { FormData } from './form-data';
import { createPayload, transformResourceDataForUpdate, transformSkillData, transformCostData } from './utils.tsx';
import { useCreateResourceCost, useUpdateResourceCost } from '../../services/resource-cost/resource-cost-service';
import { useCreateResourceSkill, useUpdateResourceSkill } from '../../services/resource-skill/resource-skill-service';

const ResourceForm: React.FC = () => {
  // Refs
  const formRef = React.useRef<HTMLFormElement>(null);

  // State
  const [currentCountry, setCurrentCountry] = useState('');

  // Hooks
  const { successToast, errorToast } = useToast();
  const location = useLocation();
  const { state } = location;
  console.log('location', location);
  const navigate = useNavigate();

  // Derived values
  const isEditView = location.pathname.includes('/edit');
  const accountData = isEditView
    ? location?.state?.accountDetails?.data?.accountById
    : location?.state?.data?.accountById;
  const resourceName = isEditView
    ? location?.state?.resource?.resource_fullname
    : 'New Resource';

  const skillCostResourceId = state?.costInfo?.resourceRID || state?.skillInfo?.resourceRID

  const resourceRId = !isEditView && (state?.cost || state?.skill) ? state?.resourceData?.rid : isEditView && (state?.cost || state?.skill) ? skillCostResourceId : null;
  const accountNumber = state?.cost || state?.skill ? state?.data?.accountById?.r_number : null;


  // Data fetching
  const { data: resource } = useResourceDetail(
    location?.state?.resource?.rid || resourceRId,
    location?.state?.accountDetails?.data?.accountById?.r_number || accountNumber
  );

  // const resourceValues = resource?.data?.resourceDetails;
  const userDetails = JSON.parse(localStorage.getItem('auth') || '{}');
  const allCountries = useGetAllCountries();
  const currency = useFetchCurrency();
  const states = useFetchState(currentCountry);

  // Mutations
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const createResourceCost = useCreateResourceCost();
  const updateResourceCost = useUpdateResourceCost();
  const createResourceSkill = useCreateResourceSkill()
  const updateResourceSkill = useUpdateResourceSkill()
  // Error handling
  const errorHandlers = [
    createResource,
    allCountries,
    currency,
    states,
    updateResource,
    createResourceCost,
    updateResourceCost,
    createResourceSkill,
    updateResourceSkill
  ];
  const commonError = checkError(errorHandlers);
  const commonErrorMsg = checkErrorMsg(errorHandlers as CheckErrorMsg[]);
  const costSkillSuccess = createResourceCost.isSuccess || updateResourceCost.isSuccess || createResourceSkill.isSuccess || updateResourceSkill.isSuccess
  const commonSuccess = createResource.isSuccess || updateResource.isSuccess || costSkillSuccess;

  // Memoized data transformations
  const countryOptions: SelectOption[] = useMemo(
    () =>
      allCountries.data?.data.country.map((c) => ({
        label: c.country_name,
        value: c.rid,
      })) || [],
    [allCountries.data]
  );

  const stateOptions: SelectOption[] = useMemo(
    () =>
      states.data?.data.states.map((s) => ({
        label: s.state_name,
        value: s.rid,
      })) || [],
    [states.data]
  );

  const currencyOptions: SelectOption[] = useMemo(
    () =>
      currency.data?.data.currency.map((c) => ({
        label: c.currency_name,
        value: c.rid,
      })) || [],
    [currency.data]
  );

  // Effects
  useEffect(() => {
    if (commonError) {
      errorToast(commonErrorMsg);
    }
  }, [commonError, commonErrorMsg, errorToast]);

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
  }, [commonSuccess, isEditView, successToast]);

  // Handlers
  const handleSubmit = (formValues: any) => {

    if (state?.cost) {
      const updateFormValues = {
        ...formValues,
        accountNumber: state?.data?.accountById?.r_number,
        account_rid: state?.data?.accountById?.rid,
        "resource_rid": state?.resourceData?.rid,
        "cost_rid": state?.costInfo?.costRid
      }
      const costData = transformCostData(updateFormValues, isEditView);

      if (isEditView) {
        updateResourceCost.mutate(costData)
      } else {
        createResourceCost.mutate(costData);
      }
    }
    if (state?.skill) {
      const updateFormValues = {
        ...formValues,
        accountNumber: state?.data?.accountById?.r_number,
        account_rid: state?.data?.accountById?.rid,
        "resource_rid": state?.resourceData?.rid,
        "skill_rid": state?.skillInfo?.skillRId,
        "resource_desc": state?.skillInfo?.resourceRole
      }
      const skillData = transformSkillData(updateFormValues, isEditView);

      if (isEditView) {
        updateResourceSkill.mutate(skillData);
      } else {
        createResourceSkill.mutate(skillData);
      }
    }

    if (!state?.skill && !state?.cost) {
      if (isEditView) {
        const updatedData = transformResourceDataForUpdate(
          formValues,
          resource?.data?.resourceDetails, // Adjusted to access the correct property
          {
            resource_id: location?.state?.resource?.rid,
            account_number: accountData?.r_number,
          }
        );
        updateResource.mutate(updatedData as any);
      } else {
        const finaldata = createPayload({
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
    navigate(-1);
  };

  const handleFieldChange = (data: OnChange) => {
    if (data.fieldName === 'country') {
      setCurrentCountry(data.fieldValue as string);
    }
  };

  // Form configuration
  const formConfig = FormData(
    countryOptions,
    currencyOptions,
    stateOptions,
    states.isLoading,
    isEditView
  );

  return (
    <div className='resource-form-container'>
      <div className='flex justify-between items-center border-b-2 border-gray-200 px-10 py-6'>
        <div className='flex items-center'>
          <img
            src={isEditView ? editIcon : accountHomeIcon}
            alt='menu-icon'
            className='h-10 w-10 bg-[#7D98B6] p-2.5 rounded'
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
          loading={allCountries.isLoading || currency.isLoading}
          values={
            (isEditView && (!state?.cost || !state?.skill)) &&
              (resource?.data?.resourceDetails as unknown as Record<
                string,
                string | number | boolean | string[] | null
              >)
              ? (resource?.data?.resourceDetails as unknown as Record<
                string,
                string | number | boolean | string[] | null
              >)
              : (state?.cost || state?.skill) ? (resource?.data?.resourceDetails as unknown as Record<
                string,
                string | number | boolean | string[] | null
              >) : undefined
          }
          // values={
          //   resource.data?.data?.resource as unknown as Record<
          //     string,
          //     string | number | boolean | string[] | null
          //   >
          // }
          outData={handleSubmit}
          formRef={formRef}
          onChange={handleFieldChange}
        />
      </div>
    </div>
  );
};

export default ResourceForm;
