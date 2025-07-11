/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { EditIcon, CreateResourceIcon } from '../../../../../../assets';
import { useToast } from '../../../../../../hooks';
import { OnChange, useGetAllCountries } from '../../../../../../common-service';
import {
  useFetchCurrency,
  useFetchState,
} from '../../../../../services/account';
import { SelectOption } from '../../../../../types';
import TextButton from '../../../../../../components/button/text-button';
import { FormBuilder } from '../../../../../../components';
import { ProjectTaskFormData } from './form-data';
import {
  useCreateProjectTask,
  useProjectTaskDetail,
  useUpdateProjectTask,
} from '../../../../../services/project/project-task-service';

const ProjectTaskForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const { successToast } = useToast();
  const location = useLocation();
  const { resourceId } = useParams();

  const getProjectTask = useProjectTaskDetail(resourceId as string);
  const projectResource = getProjectTask.data?.data;
  const projectTaskData = useMemo(
    () => ({
      ...projectResource?.projectResourceDetails,
    }),
    [projectResource]
  );

  const allCountries = useGetAllCountries();
  const currency = useFetchCurrency();
  const state = useFetchState(currentCountry);
  // const city = useFetchCity(currentCountry.state);
  const createProjectTask = useCreateProjectTask();
  const updateProjectTask = useUpdateProjectTask();

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  const commonSuccess =
    createProjectTask.isSuccess || updateProjectTask.isSuccess;
  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Project Task updated successfully'
          : 'Project Task created successfully'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  const memoizedCountry: SelectOption[] = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  const memoizedCurrency: SelectOption[] = useMemo(
    () =>
      currency.data?.data.currency.map((account) => ({
        label: account.currency_name,
        value: account.rid,
      })) || [],
    [currency.data?.data.currency]
  );

  const memoizedState: SelectOption[] = useMemo(
    () =>
      state.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [state.data?.data.states]
  );

  //   const memoizeCity: SelectOption[] = useMemo(
  //     () =>
  //       city.data?.data.cities.map((role) => ({
  //         label: role.city_name,
  //         value: role.rid,
  //       })) || [],
  //     [city.data?.data.cities]
  //   );

  const submitData = (formValues: any) => {
    const projectTaskData = {
      ...formValues,
      rid: resourceId,
    };
    // const projectTaskData = transformFormData(formValues, isEditView);
    if (isEditView) {
      updateProjectTask.mutate(projectTaskData);
    } else {
      createProjectTask.mutate(projectTaskData);
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const goBack = () => {
    window.history.back();
  };

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'country_rid') {
      setCurrentCountry(data.fieldValue as string);
    }
  };

  return (
    <>
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          {isEditView ? (
            <EditIcon
              alt='projrct-resource-icon'
              className='h-6 w-6 bg-[#7D98B6] p-1.5 border-box rounded'
            />
          ) : (
            <CreateResourceIcon
              alt='projrct-resource-icon'
              className='h-6 w-6 bg-[#7D98B6] p-1.5 border-box rounded'
            />
          )}

          <div>
            <div className='font-semibold text-[11px] leading-[20px] ml-2 text-[#7D98B6]'>
              Project {'>'} {projectTaskData?.project_name}
            </div>
            {isEditView && (
              <h4 className='font-bold text-lg ml-2 leading-4'>
                Edit Project Task
              </h4>
            )}
            {!isEditView && (
              <h4 className='font-bold text-lg ml-2 leading-4'>
                New Project Task
              </h4>
            )}
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton label='Cancel' color='inherit' onClick={goBack} />
          <TextButton
            label='Save'
            loading={createProjectTask.isPending || createProjectTask.isPending}
            onClick={handleExternalSubmit}
          />
        </div>
      </div>
      <div className='pb-4'>
        <FormBuilder
          data={ProjectTaskFormData(
            memoizedCountry,
            memoizedState,
            // memoizeCity,
            memoizedCurrency,
            state.isLoading
            // city.isLoading,
            // currency.isLoading,
            // disableFields,
            // isEditView
          )}
          loading={allCountries.isLoading || currency.isLoading}
          values={
            isEditView && projectTaskData ? { ...projectTaskData } : undefined
          }
          outData={submitData}
          formRef={formRef}
          onChange={onChangeField}
        />
      </div>
    </>
  );
};

export default ProjectTaskForm;
