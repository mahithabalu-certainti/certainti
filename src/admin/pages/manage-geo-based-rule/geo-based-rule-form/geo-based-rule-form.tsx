/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { FormBuilder } from '../../../../components';
import {
  AllPermissions,
  Layout,
  OnChange,
  useGetAllCountries,
  useGetStatus,
} from '../../../../common-service';
import { useFetchState } from '../../../../consultant/services/account';
import { SelectOption, YesNo } from '../../../../consultant/types';
import TextButton from '../../../../components/button/text-button';
import { GeoBasedRuleFormData } from '../types';
import { GeoBasedRuleFormFieldsData } from './form-data';
import { transformGeoBasedRulePayload } from './utils';
import {
  useCreateGeoBasedRule,
  useFormConfigList,
  useJurisdictionsDetails,
  useUpdateGeoBasedRule,
} from '../../../service/manage-geo-based-access/geo-based-group-service';
import {
  formatDateToYYYYMMDDWithTime,
  getDateFormatYYYYMMDD,
} from '../../../../common-utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import {
  ConfigDetails,
  CreateConfigPayload,
} from '../../../types/geo-based-rule';
import { useGetProjectType } from '../../../../consultant/services/project';

const GeoBasedRuleForm: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const location = useLocation();
  const { ruleId, config_rid } = useParams();
  const isEditView = location.pathname.includes('edit');
  const [currentCountry, setCurrentCountry] = useState('');
  const [currentRegion, setCurrentRegion] = useState('');
  const [caseNamePrefix, setCaseNamePrefix] = useState<string>('');
  const [isFederal, setIsFederal] = useState<boolean | null>(null);
  // Service Hooks
  const projectTypeOptions = useGetProjectType();
  const statusOptions = useGetStatus();
  const allCountries = useGetAllCountries('Active');
  const states = useFetchState(currentCountry);
  const { data: formConfigList } = useFormConfigList(
    currentCountry,
    isFederal,
    currentRegion
  );
  const { data: ruleDetailsData } = useJurisdictionsDetails(
    ruleId ?? '',
    config_rid ?? ''
  );
  const isLoading = false;
  const isPending = false;
  const goBack = () => window.history.back();

  const countryOptions: SelectOption[] = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
        code: country.country_code,
      })) || [],
    [allCountries.data?.data.country]
  );

  const regionOptions: SelectOption[] = useMemo(
    () =>
      states.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [states.data?.data.states]
  );
  const memoizedStatus: SelectOption[] = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        label: status?.status_name,
        value: status?.rid,
        desc: status?.status_description,
      })) || [],
    [statusOptions?.data?.data?.status]
  );
  const memoizedProjectTypes: SelectOption[] = useMemo(
    () =>
      projectTypeOptions?.data?.data?.projectType.map((item) => ({
        label: item.project_type_name,
        value: item.rid,
      })) || [],
    [projectTypeOptions?.data?.data?.projectType]
  );
  const { permission } = useSelector((state: RootState) => state.permission);
  // Mock permission map - replace with actual permission logic
  const configEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.CONFIGURE_SETTINGS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    configEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [configEditFields]);

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'country') {
      setCurrentCountry(data.fieldValue as string);
      setCurrentRegion('');
    }
    if (data.fieldName === 'region') {
      setCurrentRegion(data.fieldValue as string);
    }
    if (data.fieldName === 'is_federal') {
      if (data.fieldValue === YesNo.Yes) {
        setIsFederal(true);
        setCurrentRegion('');
      } else {
        setIsFederal(false);
      }
    }
  };

  useEffect(() => {
    const countryLabel = countryOptions.find((c) => c.value === currentCountry);
    const countryCode = countryLabel?.code;
    const regionLabel =
      regionOptions.find((r) => r.value === currentRegion)?.label || '';

    let prefix = 'C-'; // Default prefix starts with "C-"

    if (countryCode) {
      prefix += `${countryCode}`;
      if (regionLabel) {
        prefix += `-${regionLabel}`;
      }
      prefix += '-';
    } else {
      // If no country selected yet, keep as "C-"
      prefix = 'C-';
    }

    setCaseNamePrefix(prefix);
  }, [currentCountry, currentRegion, countryOptions, regionOptions]);

  const configDetails = useMemo(() => {
    if (isEditView && ruleDetailsData?.data?.configDetails) {
      const details = ruleDetailsData.data.configDetails as ConfigDetails;

      const savedCountry = details.country_rid || '';
      const savedRegion = details.state_rid || '';
      const savedIsFederal = !!details.is_federal;

      const currentCountryVal = currentCountry || '';
      const currentRegionVal = currentRegion || '';
      const currentIsFederalVal = !!isFederal;

      // Check if current form selections match the saved data
      if (
        savedCountry === currentCountryVal &&
        savedRegion === currentRegionVal &&
        savedIsFederal === currentIsFederalVal
      ) {
        return ruleDetailsData.data.configDetails;
      }
    }
    return formConfigList?.data?.configDetails || {};
  }, [
    isEditView,
    ruleDetailsData?.data?.configDetails,
    formConfigList?.data?.configDetails,
    currentCountry,
    currentRegion,
    isFederal,
  ]);

  const initialValues = useMemo(() => {
    const details = configDetails as ConfigDetails;
    if (!details || Object.keys(details).length === 0) return {};

    const dynamicValues: Record<string, any> = {};

    // Extract values from nested configs
    Object.keys(details).forEach((key) => {
      const config = (details as Record<string, any>)[key];
      if (config && Array.isArray(config?.configItems)) {
        config?.configItems.forEach((item: any) => {
          if (item.label) {
            dynamicValues[item.label] = item.value;
          }
        });
      }
    });

    // Use current state for controlled fields to prevent them from clearing when config switches
    return {
      ...dynamicValues,
      country: currentCountry,
      region: currentRegion,
      status_rid: details.status_rid,
      effective_start_date: details.effective_start_date
        ? getDateFormatYYYYMMDD(details.effective_start_date)
        : '',
      effective_end_date: details.effective_end_date
        ? getDateFormatYYYYMMDD(details.effective_end_date)
        : '',
      config_name: details.config_name,
      rid: details.rid,
      created_datetime: details.created_datetime
        ? formatDateToYYYYMMDDWithTime(details.created_datetime)
        : '-',
      updated_on: details.modified_datetime
        ? formatDateToYYYYMMDDWithTime(details.modified_datetime)
        : '-',
      is_federal: isFederal ? YesNo.Yes : YesNo.No,
      state_rid: details.state_rid,
      updated_by: details.modified_user_name ? details.modified_user_name : '-',
      created_by: details.created_user_name ? details.created_user_name : '-',
      config_id: details.rid,
      // Ensure case_name_prefix field has the default value
      case_name_prefix: details.case_name_prefix || 'C-',
    };
  }, [configDetails, currentCountry, currentRegion, isFederal]);

  useEffect(() => {
    if (isEditView && ruleDetailsData?.data?.configDetails) {
      const details = ruleDetailsData.data.configDetails as ConfigDetails;
      if (details.country_rid) setCurrentCountry(details.country_rid);
      if (details.state_rid) setCurrentRegion(details.state_rid);
      if (details.is_federal !== undefined) setIsFederal(details.is_federal);
    }
  }, [isEditView, ruleDetailsData?.data?.configDetails]);

  const formConfig = GeoBasedRuleFormFieldsData(
    isEditView,
    countryOptions,
    regionOptions,
    memoizedStatus,
    memoizedProjectTypes,
    states.isLoading,
    permissionMap,
    isFederal,
    configDetails,
    caseNamePrefix
  );

  const { mutate: createRule, isPending: isCreatePending } =
    useCreateGeoBasedRule();
  const { mutate: updateRule, isPending: isUpdatePending } =
    useUpdateGeoBasedRule();

  const submitData = (formValues: Partial<GeoBasedRuleFormData>) => {
    const payload = transformGeoBasedRulePayload(
      formValues,
      isEditView,
      configDetails,
      ruleId ?? ''
    );

    if (isEditView) {
      updateRule(payload as CreateConfigPayload, {
        onSuccess: () => {
          goBack();
        },
        onError: (error) => {
          console.error('Error updating rule:', error);
        },
      });
    } else {
      createRule(payload as CreateConfigPayload, {
        onSuccess: () => {
          goBack();
        },
        onError: (error) => {
          console.error('Error creating rule:', error);
        },
      });
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          {/* Add Icon if needed */}
          <div className='w-[90%]'>
            <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
              {isEditView && ruleId
                ? `Jurisdiction Rules > ${(configDetails as ConfigDetails)?.config_name} `
                : 'Jurisdiction Rules'}
            </div>
            <h5 className='text-[16px] font-bold ml-2 mt-0.5 text-[#2D3E4F]'>
              {isEditView ? 'Edit Configuration' : 'Create Configuration'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={isPending || isCreatePending || isUpdatePending}
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
            disabled={isPending}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>

      <div className={`${isEditView ? 'pb-10' : 'pb-4'} `}>
        <FormBuilder
          loading={isLoading}
          data={formConfig}
          values={initialValues}
          outData={submitData}
          formRef={formRef}
          layout={Layout.TYPE_1}
          onChange={onChangeField}
          keyStart='effective_start_date'
          keyEnd='effective_end_date'
        />
      </div>
    </div>
  );
};

export default GeoBasedRuleForm;
