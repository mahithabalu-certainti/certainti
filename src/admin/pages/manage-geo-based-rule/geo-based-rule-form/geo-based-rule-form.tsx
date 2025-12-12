import React, { useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { FormBuilder } from '../../../../components';
import {
    Layout,
    OnChange,
    useGetAllCountries,
} from '../../../../common-service';
import { useFetchState } from '../../../../consultant/services/account';
import { SelectOption } from '../../../../consultant/types';
import TextButton from '../../../../components/button/text-button';
import { GeoBasedRuleFormData } from '../types';
import { GeoBasedRuleFormFieldsData } from './form-data';
import { transformGeoBasedRulePayload } from './utils';

const GeoBasedRuleForm: React.FC = () => {
    const formRef = useRef<HTMLFormElement>(null);
    const location = useLocation();
    const { id } = useParams();
    const isEditView = location.pathname.includes('edit');
    const [currentCountry, setCurrentCountry] = useState('');

    // Service Hooks
    const allCountries = useGetAllCountries();
    const states = useFetchState(currentCountry);

    // Placeholder hooks/state - replace with actual service hooks
    const isLoading = false;
    const isPending = false;
    const goBack = () => window.history.back();

    const countryOptions: SelectOption[] = useMemo(
        () =>
            allCountries.data?.data.country.map((country) => ({
                label: country.country_name,
                value: country.rid,
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

    // Mock permission map - replace with actual permission logic
    const permissionMap = {};

    const onChangeField = (data: OnChange) => {
        if (data.fieldName === 'country') {
            setCurrentCountry(data.fieldValue as string);
        }
    };

    const formConfig = GeoBasedRuleFormFieldsData(
        isEditView,
        countryOptions,
        regionOptions,
        states.isLoading,
        permissionMap
    );

    const submitData = (formValues: Partial<GeoBasedRuleFormData>) => {
        const payload = transformGeoBasedRulePayload(formValues, isEditView);
        console.log('Submitting payload:', payload);
        // Add mutation call here
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
                            {isEditView && id ? `Geo Based Rule > ${id} ` : 'Geo Based Rule'}
                        </div>
                        <h5 className='text-[16px] font-bold ml-2 mt-0.5 text-[#2D3E4F]'>
                            {isEditView ? 'Edit Rule' : 'Create Rule'}
                        </h5>
                    </div>
                </div>
                <div className='flex gap-3'>
                    <TextButton
                        label='Save'
                        loading={isPending}
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
                    values={{}}
                    outData={submitData}
                    formRef={formRef}
                    layout={Layout.TYPE_1}
                    onChange={onChangeField}
                />
            </div>
        </div>
    );
};

export default GeoBasedRuleForm;
