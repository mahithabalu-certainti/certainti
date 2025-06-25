/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { CreateResourceIcon, EditIcon } from '../../../assets';
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
import { formatDateToYYYYMMDDWithTime } from '../account-details-sidebar/sidebar-pages/resources/utils.tsx';
import ConfirmationPopup from '../../../common-utils/confirmation-popup.tsx';

const ResourceForm: React.FC = () => {
  // Refs
  const formRef = React.useRef<HTMLFormElement>(null);
  // State
  const [currentCountry, setCurrentCountry] = useState({
    country: '',
    state: '',
  });
  const [currentSkillType, setCurrentSkillType] = useState({
    skillSubType: [] as string[],
    skill_type: [] as string[],
    skill_sub_type: [] as string[],
  });
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // Hooks
  const { successToast } = useToast();
  const location = useLocation();
  const { resourcesid } = useParams();
  const { state } = location;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resourceId = searchParams.get('res_id');
  const [resourceDetails, setResourceDetails] = useState<any>(null);
  const accountId = searchParams.get('account_id');
  const accNumber = searchParams.get('acc_number');
  const [skillSubTypeData, setSkillSubTypeData] = useState<SelectOption[]>([]);
  const [isResourceFullNameEmpty, setIsResourceFullNameEmpty] =
    useState<boolean>(false);
  const [isAnyResourceNameFilled, setIsAnyResourceNameFilled] =
    useState<boolean>(false);
  const [currentResource, setCurrentResource] = useState<{
    resource_firstname: string;
    resource_lastname: string;
  }>({
    resource_firstname: '',
    resource_lastname: '',
  });
  const [disableOrgname, setDisableOrgname] = useState<string>('');
  const [, setResourceFinancials] = useState({
    salary: '',
    bonus: '',
    insurance: '',
    resource_cost: '',
    deductions: '',
  });
  const [autoCalculatedValue, setAutoCalculatedValue] = useState<number>(0);
  const [confirmationState, setConfirmationState] = React.useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });
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
  const [isSalaryRequired, setIsSalaryRequired] = useState(true);
  const calculateAutoValue = ({
    salary = '0',
    bonus = '0',
    insurance = '0',
    resource_cost = '0',
    deductions = '0',
  }: {
    salary?: string;
    bonus?: string;
    insurance?: string;
    resource_cost?: string;
    deductions?: string;
  }) => {
    const s = parseFloat(salary) || 0;
    const b = parseFloat(bonus) || 0;
    const i = parseFloat(insurance) || 0;
    const r = parseFloat(resource_cost) || 0;
    const d = parseFloat(deductions) || 0;
    return s + b + i + r - d;
  };

  const isresourceType = resourceDetails?.resource_type === 'Full-Time';
  const costInfo =
    (costDetails as { resourceCostById?: Record<string, any> })
      ?.resourceCostById || {};
  const skillInfo = state?.skillInfo || {};

  // Data fetching
  const { data: resource, isSuccess } = useResourceDetail(
    resourcesid || resourceId || location?.state?.resource?.rid || resourceRId,
    location?.state?.accountDetails?.data?.accountById?.r_number ||
      accountNumber ||
      accNumber
  );
  const accountName = location?.state?.data?.accountById?.account_name;
  useEffect(() => {
    const resourceDetailsData =
      resource?.data?.resourceDetails || state?.resource;
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
      resource_startdate: resourceDetailsData?.resource_startdate,
      resource_enddate: resourceDetailsData?.resource_enddate,
      Created_On: formatDateToYYYYMMDDWithTime(
        resourceDetailsData?.created_datetime
      ),
      Created_By: resourceDetailsData?.created_by,
      Updated_On: resourceDetailsData?.modified_datetime
        ? formatDateToYYYYMMDDWithTime(
            resourceDetailsData?.modified_datetime || '-'
          )
        : '-',
      Updated_By: resourceDetailsData?.modified_by || '-',
      resource_name:
        resourceDetailsData?.resource_firstname &&
        resourceDetailsData?.resource_lastname
          ? ''
          : !resourceDetailsData?.resource_firstname &&
              !resourceDetailsData?.resource_lastname
            ? resourceDetailsData?.resource_name
            : resourceDetailsData?.resource_firstname ||
              resourceDetailsData?.resource_lastname ||
              '',
    };
    setResourceDetails(finalResourceDetails || null);
  }, [resource]);

  useEffect(() => {
    const resourceDetailsData = resource?.data?.resourceDetails;
    setDisableOrgname(resourceDetailsData?.resource_type || '');
    setCurrentResource({
      resource_firstname: resourceDetailsData?.resource_firstname || '',
      resource_lastname: resourceDetailsData?.resource_lastname || '',
    });

    if (
      isEditView &&
      (resourceDetailsData?.resource_firstname ||
        resourceDetailsData?.resource_lastname)
    ) {
      setIsAnyResourceNameFilled(true);
    } else if (isEditView && resourceDetailsData?.resource_name) {
      setIsResourceFullNameEmpty(true);
      setIsAnyResourceNameFilled(false);
    } else {
      setIsAnyResourceNameFilled(false);
      setIsResourceFullNameEmpty(false);
    }
  }, [resource, isEditView]);

  useEffect(() => {
    const formValues = resource?.data?.resourceDetails;

    if (state?.cost && isSuccess && costInfo && costSuccess && isEditView) {
      const costValues = {
        ...formValues,
        financial_start_date: costInfo?.effective_from || '',
        financial_end_date: costInfo?.end_date || '',
        effort_in_hrs: costInfo?.effort_in_hrs || '',
        currency: costInfo?.currency_rid || null,
        salary: costInfo?.salary || '',
        bonus: costInfo?.bonus || '',
        insurance: costInfo?.insurance || '',
        deductions: costInfo?.deductions || '',
        resource_cost: costInfo?.resource_cost || '',
        resource_status: costInfo?.status || '',
        fiscal_year: costInfo?.fiscal_year || '',
        comments: costInfo?.comments || '',
        Record_id: costInfo?.rid,
        Resource_id: costInfo?.resource_number,
        Created_On: formatDateToYYYYMMDDWithTime(costInfo?.created_datetime),
        Created_By: costInfo?.created_by,
        Updated_On: costInfo?.modified_datetime
          ? formatDateToYYYYMMDDWithTime(costInfo.modified_datetime)
          : '-',
        Updated_By:
          costInfo?.modified_by !== null &&
          costInfo.modified_by !== undefined &&
          costInfo.modified_by !== ''
            ? costInfo.modified_by
            : '-',
      };
      setFormValues(costValues);
      setIsSalaryRequired(
        costInfo?.salary === null ||
          costInfo?.salary === undefined ||
          costInfo?.salary === ''
      );
      // Calculate and set auto value
      // Update resource financials state
      const financials = {
        salary: costInfo?.salary || '',
        bonus: costInfo?.bonus || '',
        insurance: costInfo?.insurance || '',
        resource_cost: costInfo?.resource_cost || '',
        deductions: costInfo?.deductions || '',
      };
      setResourceFinancials(financials);

      // Calculate and set auto value
      const total = calculateAutoValue(financials);
      setAutoCalculatedValue(total);
    } else if (state?.skill && isSuccess && skillInfo && isEditView) {
      const skillValues = {
        ...formValues,
        skill_level: skillInfo?.skillLevel || '',
        skill_details: skillInfo?.skillDetails || '',
        skill_type: skillInfo?.skillTypeId || '',
        skill_sub_type: skillInfo?.skillSubTypeId || '',
        skill_start_date: (skillInfo?.startDate as string) || '',
        skill_type_others: skillInfo?.skillTypeOthers || '',
        skill_subtype_others: skillInfo?.skillSubTypeOthers || '',
        years_of_experience: skillInfo?.yearsOfExperience || '',
        comments: skillInfo?.comments || '',
        Record_id: skillInfo?.skillRId,
        Resource_id: skillInfo?.resourceNumber,
        Created_On: formatDateToYYYYMMDDWithTime(skillInfo?.Created_On),
        Created_By: skillInfo?.Created_By,
        Updated_On: skillInfo?.Updated_On
          ? formatDateToYYYYMMDDWithTime(skillInfo.Updated_On)
          : '-',
        Updated_By:
          skillInfo?.Updated_By !== null &&
          skillInfo.Updated_By !== undefined &&
          skillInfo.Updated_By !== ''
            ? skillInfo.Updated_By
            : '-',
      };
      setFormValues(skillValues);
    } else if (formValues && !isEditView && state?.cost) {
      const values = {
        ...formValues,
        currency: costAndSKillAccountInfo?.currency_rid || null,
      };
      setFormValues(values);
    } else if (formValues && !isEditView) {
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
      setCurrentSkillType((prev) => ({
        ...prev,
        skill_type: [skillInfo.skillTypeId],
      }));
    }
    if (skillSubTypeId) {
      setCurrentSkillType((prev) => ({
        ...prev,
        skillSubType: [skillInfo.skillSubTypeId],
      }));
    }
  }, [skillTypeId, skillSubTypeId]);

  const userDetails = JSON.parse(localStorage.getItem('auth') || '{}');
  const allCountries = useGetAllCountries();
  const states = useFetchState(currentCountry.country);
  const city = useFetchCity(currentCountry.state);
  const { data: skillType } = useFetchResourceSkillType(true);
  const { data: skillSubType, isLoading: skillSubTypeLoading } =
    useFetchResourceSkillSubType(currentSkillType.skill_type);

  const currency = useFetchCurrency();
  // Mutations
  const createResource = useCreateResource(accountId as string);
  const updateResource = useUpdateResource(accountId as string);
  const createResourceCost = useCreateResourceCost();
  const updateResourceCost = useUpdateResourceCost();
  const createResourceSkill = useCreateResourceSkill();
  const updateResourceSkill = useUpdateResourceSkill();
  const [costResourceForceSuccess, setCostResourceForceSuccess] =
    useState(false);
  const costSkillSuccess =
    costResourceForceSuccess ||
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
    const convertData =
      data?.map((skill: SkillType) => ({
        label: skill.skill_type_name,
        value: skill.rid,
      })) || [];
    return convertData;
  }, [skillType]);

  useEffect(() => {
    const data = skillSubType as SkillSubtype[];
    const finalData =
      data?.map((skill: SkillSubtype) => ({
        label: skill.skill_subtype_name,
        value: skill.rid,
      })) || [];
    setSkillSubTypeData(finalData);
  }, [skillSubType]);

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
      if (!state?.skill && !state?.cost) {
        successToast(
          isEditView
            ? 'Resource updated successfully'
            : 'Resource created successfully'
        );
      }
      navigate(-1);
    }
  }, [commonSuccess, isEditView, state?.cost, state?.skill]);

  // Handlers
  const handleSubmit = (formValues: any) => {
    if (state?.cost) {
      const updateFormValues = {
        ...formValues,
        accountNumber: state?.data?.accountById?.r_number,
        account_rid: state?.data?.accountById?.rid,
        resource_rid: resource?.data.resourceDetails.rid,
        resource_number: resource?.data.resourceDetails.r_number,
        cost_rid: state?.costInfo?.costRid,
        resource_code: resource?.data.resourceDetails.resource_code,
        user_preference: confirmationState.message ? 'accept' : '',
      };
      const costData = transformCostData(updateFormValues, isEditView);
      if (isEditView) {
        updateResourceCost.mutate(costData, {
          onSuccess: (response) => {
            if (response?.statusCode === 210) {
              setConfirmationState({
                isOpen: true,
                message:
                  response.statusMessage ||
                  'Compensation details already exists for the resource',
                onConfirm: () => {
                  const updatedFormValues = {
                    ...costData,
                    user_preference: 'accept',
                  };
                  updateResourceCost.mutate(updatedFormValues, {
                    onSuccess: () => {
                      setCostResourceForceSuccess(true);
                    },
                  });
                  setConfirmationState((prev) => ({
                    ...prev,
                    isOpen: false,
                    message: '',
                  }));
                },
              });
            } else if (response?.statusCode === 200) {
              setCostResourceForceSuccess(true);
            }
          },
          onError: (error) => {
            console.error('Update failed:', error);
          },
        });
      } else {
        createResourceCost.mutate(costData, {
          onSuccess: (response) => {
            if (response?.statusCode === 210) {
              setConfirmationState({
                isOpen: true,
                message:
                  response.statusMessage ||
                  'Compensation details already exists for the resource',
                onConfirm: () => {
                  const updatedFormValues = {
                    ...costData,
                    user_preference: 'accept',
                  };
                  createResourceCost.mutate(updatedFormValues, {
                    onSuccess: () => {
                      setCostResourceForceSuccess(true);
                    },
                  });
                  setConfirmationState((prev) => ({
                    ...prev,
                    isOpen: false,
                    message: '',
                  }));
                },
              });
            } else if (response?.statusCode === 200) {
              setCostResourceForceSuccess(true);
            }
          },
          onError: (error) => {
            console.error('Update failed:', error);
          },
        });
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
        resource_code: resource?.data.resourceDetails.resource_code,
      };
      const skillData = transformSkillData(updateFormValues, isEditView);
      // Update or create skill based on isEditView valu
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
            resource_id: location?.state?.resource?.rid || resourcesid,
            account_number: accountData?.r_number || accNumber,
            text: 'sample',
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
    if (fieldName === 'country') {
      setCurrentCountry({
        country: fieldValue as string,
        state: '',
      });
    }
    if (fieldName === 'state') {
      setCurrentCountry((prev) => ({
        ...prev,
        state: fieldValue as string,
      }));
    }

    if (fieldName === 'skill_type') {
      setCurrentSkillType((prev) => ({
        ...prev,
        skill_sub_type: [],
        [fieldName]: [fieldValue] as string[],
      }));
    }
    if (fieldName === 'skill_sub_type') {
      setCurrentSkillType((prev) => ({
        ...prev,
        [fieldName]: [fieldValue] as string[],
      }));
    }

    if (fieldName === 'resource_name') {
      setIsResourceFullNameEmpty((fieldValue as string).trim() !== '');
    }

    if (
      fieldName === 'resource_firstname' ||
      fieldName === 'resource_lastname'
    ) {
      setCurrentResource((prev) => ({
        ...prev,
        [fieldName]: fieldValue as string,
      }));
      const updatedValues = {
        ...currentResource,
        [fieldName]: fieldValue as string,
      };

      const hasName =
        !!updatedValues.resource_firstname?.trim() ||
        !!updatedValues.resource_lastname?.trim();
      setIsAnyResourceNameFilled(hasName);
    }
    if (fieldName === 'resource_type') {
      setDisableOrgname(String(fieldValue));
    }
    if (
      ['salary', 'bonus', 'insurance', 'resource_cost', 'deductions'].includes(
        fieldName
      )
    ) {
      setResourceFinancials((prev) => {
        const updated = {
          ...prev,
          [fieldName]: fieldValue as string,
        };

        const salary = parseFloat(updated.salary) || 0;
        const bonus = parseFloat(updated.bonus) || 0;
        const insurance = parseFloat(updated.insurance) || 0;
        const resourceCost = parseFloat(updated.resource_cost) || 0;
        const deductions = parseFloat(updated.deductions) || 0;

        const total = salary + bonus + insurance + resourceCost - deductions;
        setAutoCalculatedValue(total);

        return updated;
      });

      // Salary-specific validation
      if (
        fieldName === 'salary' &&
        resourceDetails?.resource_type === 'Full-Time'
      ) {
        const salaryValue = (fieldValue as string).trim();
        setIsSalaryRequired(salaryValue === '');
      }
    }
  };

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
    state?.cost || state?.skill,
    disableOrgname,
    currentSkillType.skill_type,
    currentSkillType.skill_sub_type || currentSkillType.skillSubType,
    state?.skill,
    state?.cost,
    state?.resourceCreate,
    isResourceFullNameEmpty,
    isAnyResourceNameFilled,
    isresourceType,
    isSalaryRequired,
    isEditView,
    currentResource,
    autoCalculatedValue,
    accountName
  );

  return (
    <div className='resource-form-container'>
      <div className='h-[50px] border-box flex justify-between items-center border-b-2 border-gray-200 px-10 sticky top-0 z-10 bg-white'>
        <div className='flex items-center'>
          {isEditView ? (
            <EditIcon
              alt='menu-icon'
              className='bg-[#7D98B6] p-1.5 h-6 w-6 rounded'
            />
          ) : (
            <CreateResourceIcon alt='menu-icon' className='h-6 w-6 rounded' />
          )}
          <div>
            <div className='font-semibold text-[12px] leading-[20px] ml-2 text-[#7D98B6]'>
              {!state?.skill && !state?.cost
                ? `Account > ${accountData?.account_name}`
                : `Account > ${costAndSKillAccountInfo?.account_name} > ${resource?.data?.resourceDetails?.r_number || ''}`}
            </div>
            {!isEditView && (
              <h4 className='ml-2 font-bold text-[16px] leading-[20px] tracking-[0] text-[#2D3E4F]'>
                {state?.cost
                  ? `${resourceName} Cost`
                  : state?.skill
                    ? `${resourceName} Skills`
                    : resourceName}
              </h4>
            )}
            {isEditView && (
              <h4 className='ml-2 font-bold text-[16px] leading-[20px] tracking-[0] text-[#2D3E4F]'>
                {state?.cost
                  ? 'Edit Resource Cost'
                  : state?.skill
                    ? `Edit Resource Skills`
                    : (resourceName ?? 'Edit Resource')}
              </h4>
            )}
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
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
          <TextButton
            label='Cancel'
            onClick={handleGoBack}
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
          outData={handleSubmit}
          formRef={formRef}
          onChange={onChangeField}
          layout={Layout.TYPE_1}
          keyStart={state?.cost ? 'financial_start_date' : 'resource_startdate'}
          keyEnd={state?.cost ? 'financial_end_date' : 'resource_enddate'}
        />
      </div>
      <ConfirmationPopup
        isOpen={confirmationState.isOpen}
        message={confirmationState.message}
        onConfirm={() => {
          confirmationState.onConfirm();
          setConfirmationState((prev) => ({
            ...prev,
            isOpen: false,
            message: '',
          }));
        }}
        onCancel={() => {
          setConfirmationState((prev) => ({
            ...prev,
            isOpen: false,
            message: '',
          }));
        }}
      />
    </div>
  );
};

export default ResourceForm;
