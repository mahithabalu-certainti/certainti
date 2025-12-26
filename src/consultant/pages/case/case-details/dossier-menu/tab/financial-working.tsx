import React, { useState, useMemo } from "react";
import {
    Select,
    MenuItem,
    FormControl,
} from '@mui/material';
import { useGetAllCountries } from "../../../../../../common-service";
import { useFetchState } from "../../../../../services/account";

const COMMON_SELECT_STYLES = {
    height: '32px',
    fontSize: '13px',
    padding: '6px 4px',
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        border: '2px solid #60A5FA',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderRadius: '2px',
    },
    '.MuiSelect-select': {
        padding: '6px 6px',
    },
    '&.Mui-disabled': { backgroundColor: '#f3f4f6' },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        border: '1px solid #CBD6E2',
    },
    '& .MuiSvgIcon-root': {
        color: '#7D98B6',
    },
    '& .MuiOutlinedInput-root': {
        '&.Mui-focused': { boxShadow: 'none' },
    },
};

const COMMON_MENU_PROPS = {
    PaperProps: {
        sx: {
            maxWidth: 300,
            maxHeight: 200,
            marginTop: '4px',
            boxShadow:
                'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
            '& .MuiMenuItem-root': {
                fontSize: '13px',
                padding: '6px 12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
        },
    },
};

const getSelectStyles = (hasError: boolean, isEmpty: boolean) => ({
    ...COMMON_SELECT_STYLES,
    '.MuiSelect-select': {
        ...COMMON_SELECT_STYLES['.MuiSelect-select'],
        color: isEmpty ? '#7D98B6' : 'black',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        border: hasError ? '1px solid #ef4444' : '1px solid #CBD6E2',
        borderRadius: '2px',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        border: hasError ? '1px solid #ef4444' : '1px solid #CBD6E2',
    },
});


const FinancialWorking = () => {
    // Start with dropdowns hidden
    const [showDropdowns, setShowDropdowns] = useState(false);

    // Country & Region state
    const [currentCountry, setCurrentCountry] = useState('');
    const [currentRegion, setCurrentRegion] = useState('');

    // API Hooks
    // Using 'Active' filter as per requirement reference
    const allCountries = useGetAllCountries();
    const states = useFetchState(currentCountry);

    // Transform API data into options
    const countryOptions = useMemo(
        () =>
            allCountries.data?.data.country.map((country: any) => ({
                label: country.country_name,
                value: country.rid,
                code: country.country_code,
            })) || [],
        [allCountries.data?.data.country]
    );

    const regionOptions = useMemo(
        () =>
            states.data?.data.states.map((state: any) => ({
                label: state.state_name,
                value: state.rid,
            })) || [],
        [states.data?.data.states]
    );

    const handleCountryChange = (event: any) => {
        const newValue = event.target.value;
        setCurrentCountry(newValue);
        // Reset region when country changes
        setCurrentRegion('');
    };

    const handleRegionChange = (event: any) => {
        setCurrentRegion(event.target.value);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header Tab */}
            <div className="bg-white rounded-lg shadow mb-3">
                <div className="border-b border-gray-200">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="text-xl font-semibold text-gray-800">
                            Federal R&D Credit
                        </div>

                        {/* Right side button - Styled like "Add condition" button */}
                        <button
                            onClick={() => setShowDropdowns(!showDropdowns)}
                            className="w-auto h-[28px] px-2.5 text-[13px] font-semibold flex items-center rounded-[2px] border border-[#CBD6E2] text-[#425A76] hover:bg-gray-100 transition-all cursor-pointer"
                        >
                            <React.Suspense fallback={null}>
                                <div className='flex items-center justify-center gap-2'>
                                    {/* Using standard + text if icon import fails, but aiming for reuse */}
                                    {/* <AddIcon className='w-4 h-3' /> - Assuming AddIcon might not be directly available or named differently, using fallback */}
                                    Compute Financial
                                </div>
                            </React.Suspense>
                        </button>
                    </div>
                </div>
            </div>

            {/* Dropdown Section - Styled like ConditionForm inputs */}
            {showDropdowns && (
                <>
                    <div className="bg-white rounded-lg shadow p-3 mb-3 animate-fadeIn border border-[#CBD6E2]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Country Dropdown */}
                            <div>
                                <label className='block text-xs font-medium text-[#2D3E4F] mb-1'>
                                    Country
                                </label>
                                <FormControl fullWidth size='small'>
                                    <Select
                                        value={currentCountry}
                                        onChange={handleCountryChange}
                                        displayEmpty
                                        MenuProps={COMMON_MENU_PROPS}
                                        sx={getSelectStyles(false, currentCountry === '')}
                                    >
                                        <MenuItem
                                            value=''
                                            sx={{
                                                color: '#425A76',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                            }}
                                        >
                                            Select a country
                                        </MenuItem>
                                        {countryOptions.map((country: any) => (
                                            <MenuItem
                                                key={country.value}
                                                value={country.value}
                                                sx={{
                                                    color: '#425A76',
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {country.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </div>

                            {/* Region Dropdown */}
                            <div>
                                <label className='block text-xs font-medium text-[#2D3E4F] mb-1'>
                                    Region
                                </label>
                                <FormControl fullWidth size='small'>
                                    <Select
                                        value={currentRegion}
                                        onChange={handleRegionChange}
                                        displayEmpty
                                        MenuProps={COMMON_MENU_PROPS}
                                        sx={getSelectStyles(false, currentRegion === '')}
                                        disabled={!currentCountry}
                                    >
                                        <MenuItem
                                            value=''
                                            sx={{
                                                color: '#425A76',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                            }}
                                        >
                                            Select a region
                                        </MenuItem>
                                        {regionOptions.map((region: any) => (
                                            <MenuItem
                                                key={region.value}
                                                value={region.value}
                                                sx={{
                                                    color: '#425A76',
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {region.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </div>
                        </div>
                    </div>

                    {/* Financial Data Tables - Styled like ConditionManager panels (SelectorSkeleton/CategorySelector) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3  animate-fadeIn">
                        {/* Regular Credit Table */}
                        <div className='bg-gray-50 rounded-lg border border-[#CBD6E2] overflow-hidden shadow-none'>
                            <div className='bg-gray-50 px-4 py-3 border-b border-[#CBD6E2]'>
                                <h3 className='text-sm font-semibold text-[#425A76]'>Regular Credit</h3>
                            </div>
                            <div className="p-6 bg-white">
                                <div className="space-y-4 text-[13px] text-[#425A76]">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">9 Total Qualified Research Expenses</span>
                                        <span className="font-medium">---</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">10 Fixed-base percentage</span>
                                        <span className="font-medium">3%</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">11 Average Annual Gross Receipts</span>
                                        <span className="font-medium">---</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">12 Multiply line 11 by percentage on line 10</span>
                                        <span className="font-medium">---</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">13 Subtract line 12 from line 9</span>
                                        <span className="font-medium">---</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">14 Multiply line 9 by 50%</span>
                                        <span className="font-medium">---</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">15 Enter smaller of line 13 or line 14</span>
                                        <span className="font-medium">---</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">17 Electing reduced credit under 280C</span>
                                        <span className="font-medium">No</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded text-xs">
                                        <span className="text-gray-800 font-medium">Multiply line 16 by 15.8% (by 20% if line 17 is "No")</span>
                                        <span className="font-bold text-blue-700">---</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ASC Credit Table */}
                        <div className='bg-gray-50 rounded-lg border border-[#CBD6E2] overflow-hidden shadow-none'>
                            <div className='bg-gray-50 px-4 py-3 border-b border-[#CBD6E2]'>
                                <h3 className='text-sm font-semibold text-[#425A76]'>ASC Credit</h3>
                            </div>
                            <div className="p-6 bg-white">
                                <div className="space-y-4 text-[13px] text-[#425A76]">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">28 Total Qualified Research Expenses</span>
                                        <span className="font-medium">63,181,458</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">29 Total QREs for prior 3 tax years</span>
                                        <span className="font-medium">165,370,013</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">30 Divide line 29 by 6.0</span>
                                        <span className="font-medium">27,561,669</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">31 Subtract line 30 from line 28</span>
                                        <span className="font-medium">35,619,790</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Enter 14%. If QREs in any of the 3 years is zero, enter 6%</span>
                                        <span className="font-medium">14%</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">32 Multiply line 31 by the percentage above</span>
                                        <span className="font-medium">4,986,771</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">33 Add lines 23 and 32</span>
                                        <span className="font-medium">4,986,771</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">34 Electing reduced credit under 280C</span>
                                        <span className="font-medium">No</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded text-xs">
                                        <span className="text-gray-800 font-medium">Multiply line 23 by 70% (Article line 23 if line 24 is "No")</span>
                                        <span className="font-bold text-green-700">4,984,771</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Custom CSS for animation */}
            <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
        `}</style>
        </div>
    );
};

export default FinancialWorking;
