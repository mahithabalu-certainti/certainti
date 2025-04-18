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
import { createPayload, transformResourceDataForUpdate } from './utils';

const ResourceForm: React.FC = () => {
  // Refs
  const formRef = React.useRef<HTMLFormElement>(null);

  // State
  const [currentCountry, setCurrentCountry] = useState('');

  // Hooks
  const { successToast, errorToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Data fetching
  const { data: resource } = useResourceDetail(
    location?.state?.resource?.rid,
    location?.state?.accountDetails?.data?.accountById?.r_number
  );

  const userDetails = JSON.parse(localStorage.getItem('auth') || '{}');
  const allCountries = useGetAllCountries();
  const currency = useFetchCurrency();
  const states = useFetchState(currentCountry);

  // Mutations
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();

  // Derived values
  const isEditView = location.pathname.includes('/edit');
  const accountData = isEditView
    ? location?.state?.accountDetails?.data?.accountById
    : location?.state?.data?.accountById;
  const resourceName = isEditView
    ? location?.state?.resource?.resource_fullname
    : 'New Resource';

  // Error handling
  const errorHandlers = [
    createResource,
    allCountries,
    currency,
    states,
    updateResource,
  ];
  const commonError = checkError(errorHandlers);
  const commonErrorMsg = checkErrorMsg(errorHandlers as CheckErrorMsg[]);
  const commonSuccess = createResource.isSuccess || updateResource.isSuccess;

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
      successToast(
        isEditView
          ? 'Resource updated successfully'
          : 'Resource created successfully'
      );
      navigate(-1);
    }
  }, [commonSuccess, isEditView, successToast]);

  // Handlers
  const handleSubmit = (formValues: any) => {
    if (isEditView) {
      const updatedData = transformResourceDataForUpdate(
        formValues,
        resource?.data.resourceDetails,
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
            isEditView ? resource?.data?.resourceDetails : (undefined as any)
          }
          outData={handleSubmit}
          formRef={formRef}
          onChange={handleFieldChange}
        />
      </div>
    </div>
  );
};

export default ResourceForm;
