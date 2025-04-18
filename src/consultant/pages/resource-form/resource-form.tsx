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
import { useCreateResource } from '../../services/resource-create';
import { useResourceDetail } from '../../services/resource-details';
import { useUpdateResource } from '../../services/resource-update';
import { AccountFormData, SelectOption } from '../../types';
import { FormData } from './form-data';
import { transformCostData, transformSkillData } from './utils';
import { useCreateResourceCost, useUpdateResourceCost } from '../../services/resource-cost/resource-cost-service';
import { useCreateResourceSkill, useUpdateResourceSkill } from '../../services/resource-skill/resource-skill-service';

const ResourceForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const { successToast, errorToast } = useToast();
  const location = useLocation();
  const { state } = location;
  console.log('location', location);
  const navigate = useNavigate();
  const resource = useResourceDetail(location?.state?.data?.accountById?.rid);
  const resourceValues = resource?.data?.data?.resource;

  //fetch resource cost by id

  // const getCostData = useFetchResourceCostById({ id: "", accountNumber: state?.accountDetails?.data?.accountById?.r_number });
  // const costInfo = getCostData.data;
  // const costData = useMemo(
  //   () => ({
  //     ...account?.accountDetails,
  //     ...account?.accountById,
  //     ...(account?.accountById &&
  //       account?.accountDetails && {
  //       is_parent: account?.accountById.is_parent ? 'yes' : 'no',
  //       autosend_interaction: account?.accountDetails.autosend_interaction
  //         ? 'yes'
  //         : 'no',
  //       auto_access_rd: account?.accountDetails.auto_access_rd ? 'yes' : 'no',
  //     }),
  //   }),
  //   [cost]
  // );

  //fetch resource skill by id

  // const getSkillData = useFetchResourceSkillById({ rid: "", accountNumber: "" });
  // const skillInfo = getSkillData.data;

  const allCountries = useGetAllCountries();
  const currency = useFetchCurrency();
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const states = useFetchState(currentCountry);

  const createResourceCost = useCreateResourceCost();
  const updateResourceCost = useUpdateResourceCost();
  const createResourceSkill = useCreateResourceSkill()
  const updateResourceSkill = useUpdateResourceSkill()

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  // Hook Error Handling
  const errorhandlingData = [
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
  const commonError = checkError(errorhandlingData);
  const commonErrorMsg = checkErrorMsg(errorhandlingData as CheckErrorMsg[]);
  const costSkillSuccess = createResourceCost.isSuccess || updateResourceCost.isSuccess || createResourceSkill.isSuccess || updateResourceSkill.isSuccess
  const commonSuccess = createResource.isSuccess || updateResource.isSuccess || costSkillSuccess;

  useEffect(() => {
    if (commonError) {
      errorToast(commonErrorMsg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonError, commonErrorMsg]);

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

      successToast(
        isEditView
          ? 'Account update successfully'
          : 'Account created successfully'
      );
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

  const memoizedStates: SelectOption[] = useMemo(
    () =>
      states.data?.data.states.map((account) => ({
        label: account.state_name,
        value: account.rid,
      })) || [],
    [states.data?.data.states]
  );

  const memoizedCurrency: SelectOption[] = useMemo(
    () =>
      currency.data?.data.currency.map((account) => ({
        label: account.currency_name,
        value: account.rid,
      })) || [],
    [currency.data?.data.currency]
  );
  console.log("resourceValues", resourceValues);
  const submitData = (formValues: Partial<AccountFormData>) => {
    console.log('formValues', formValues);
    const { state } = location;
    // const resourceData = transformFormData(formValues, isEditView);
    // if (isEditView && !!state?.skill && !!state?.cost) {
    //   updateResource.mutate(mockResourceUpdateRequest);
    // } else {
    //   createResource.mutate(mockResourceCreatePayload);
    // }

    if (state?.cost) {
      const updateFormValues = {
        ...formValues,
        accountNumber: state?.data?.accountById?.r_number,
        account_rid: state?.data?.accountById?.rid,
        "resource_rid": state?.resourceData.rid,
        "cost_rid": state?.costInfo?.rid
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
        "resource_rid": state?.resourceData.rid,
        "skill_rid": state?.skillInfo?.rid
      }
      const skillData = transformSkillData(updateFormValues, isEditView);

      if (isEditView) {
        updateResourceSkill.mutate(skillData);
      } else {
        createResourceSkill.mutate(skillData);
      }
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
    formRef.current?.reset();
  };

  const goBack = () => {
    formRef.current?.reset();
    navigate(-1);
  };

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'country') {
      setCurrentCountry(data.fieldValue as string);
    }
  };

  return (
    <>
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
            <div className=' text-xs ml-2 leading-4 text-gray-500'>
              {'Account > ' +
                `${isEditView ? location?.state?.accountDetails?.data?.accountById?.account_name : location?.state?.data?.accountById?.account_name}`}
            </div>
            <h4 className='font-bold text-lg ml-2 leading-4'>
              {(isEditView && (state?.skill && state?.cost))
                ? location?.state?.resource?.resource_fullname :
                (isEditView && (state?.skill || state?.cost)) ? state?.costInfo?.resource_fullname
                  : 'New Resource'}
            </h4>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Cancel'
            variant='outlined'
            color='inherit'
            onClick={goBack}
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
          data={FormData(
            memoizedContry,
            memoizedCurrency,
            memoizedStates,
            states.isLoading
          )}
          loading={allCountries.isLoading || currency.isLoading}
          values={
            isEditView &&
              (resource.data?.data?.resource as unknown as Record<
                string,
                string | number | boolean | string[] | null
              >)
              ? (resource.data?.data?.resource as unknown as Record<
                string,
                string | number | boolean | string[] | null
              >)
              : (state.cost || state.skill) ? (resource.data?.data?.resource as unknown as Record<
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
          outData={submitData}
          formRef={formRef}
          onChange={onChangeField}
        />
      </div>
    </>
  );
};

export default ResourceForm;
