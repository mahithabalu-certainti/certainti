import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { accountHomeIcon, editIcon } from '../../../assets';
import { CheckErrorMsg, useGetAllCountries } from '../../../common-service';
import { checkError, checkErrorMsg } from '../../../common-utils';
import { FormBuilder } from '../../../components';
import TextButton from '../../../components/button/text-button';
import { useToast } from '../../../hooks';
import { mockResourceCreatePayload } from '../../mockdata/resource-create';
import { mockResourceUpdateRequest } from '../../mockdata/resource-update';
import { useFetchCurrency, useFetchRegion } from '../../services/account';
import { useCreateResource } from '../../services/resource-create';
import { useResourceDetail } from '../../services/resource-details';
import { useUpdateResource } from '../../services/resource-update';
import { AccountFormData, SelectOption } from '../../types';
import { FormData } from './form-data';

const ResourceForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const { successToast, errorToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const resource = useResourceDetail(location?.state?.data?.accountById?.rid);
  console.log('location', location?.state);
  // const resource = getResource;
  const resourceData = location?.state?.accountData?.data?.accountById;
  console.log('resourceData', resourceData);

  // const resourceData = useMemo(
  //   () => ({
  //      resource,
  //   }),
  //   [resource]
  // );
  // console.log('resourceData', resourceData)
  // console.log('resourceData', Boolean(resourceData));

  const allCountries = useGetAllCountries();
  const currency = useFetchCurrency();
  const regions = useFetchRegion();
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  // Hook Error Handling
  const errorhandlingData = [
    createResource,
    allCountries,
    currency,
    regions,
    updateResource,
  ];
  const commonError = checkError(errorhandlingData);
  const commonErrorMsg = checkErrorMsg(errorhandlingData as CheckErrorMsg[]);
  const commonSuccess = createResource.isSuccess || updateResource.isSuccess;

  useEffect(() => {
    if (commonError) {
      errorToast(commonErrorMsg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonError, commonErrorMsg]);

  useEffect(() => {
    if (commonSuccess) {
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

  const memoizedRegions: SelectOption[] = useMemo(
    () =>
      regions.data?.data.regions.map((account) => ({
        label: account.region_name,
        value: account.rid,
      })) || [],
    [regions.data?.data.regions]
  );

  const memoizedCurrency: SelectOption[] = useMemo(
    () =>
      currency.data?.data.currency.map((account) => ({
        label: account.currency_name,
        value: account.rid,
      })) || [],
    [currency.data?.data.currency]
  );

  const submitData = (formValues: Partial<AccountFormData>) => {
    console.log('formValues', formValues);
    // const resourceData = transformFormData(formValues, isEditView);
    if (isEditView) {
      updateResource.mutate(mockResourceUpdateRequest);
    } else {
      createResource.mutate(mockResourceCreatePayload);
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
              {'Account > ' + location?.state?.resource?.resource_fullname}
            </div>
            <h4 className='font-bold text-lg ml-2 leading-4'>
              {isEditView
                ? location?.state?.resource?.resource_fullname
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
          data={FormData(memoizedContry, memoizedCurrency, memoizedRegions)}
          loading={
            allCountries.isLoading || currency.isLoading || regions.isLoading
          }
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
              : undefined
          }
          // values={
          //   resource.data?.data?.resource as unknown as Record<
          //     string,
          //     string | number | boolean | string[] | null
          //   >
          // }
          outData={submitData}
          formRef={formRef}
        />
      </div>
    </>
  );
};

export default ResourceForm;
