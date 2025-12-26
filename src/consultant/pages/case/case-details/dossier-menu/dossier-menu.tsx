import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DetailsIcon } from '../../../../../assets';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { AllPermissions } from '../../../../../common-service';
import FinancialWorking from './tab/financial-working';
import ProjectDocumentation from './tab/project-documentation';


const DossierTabs = [
    {
        id: AllPermissions.ACCOUNT_FINANCIAL_OVERVIEW,
        name: 'Overview',
        hide: false,
    },
    // {
    //   id: AllPermissions.ACCOUNT_FINANCIAL_TIMELINE,
    //   name: 'Timeline',
    //   hide: false,
    //   disable: true,
    // },
];
const DossierMenu = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(
        searchParams.get('tab') || 'project_summary'
    );

    const tabs = [
        {
            label: 'Financial Workings',
            value: 'financial_workings',
            hide: false,
        },
        {
            label: 'Project Documents',
            value: 'project_documents',
            hide: false,
        },
        {
            label: 'Project Summary',
            value: 'project_summary',
            hide: false,
        },
        {
            label: 'Resource Summary',
            value: 'resource_summary',
            hide: false,
        },
    ];


    const handleTabChange = (value: string) => {
        setActiveTab(value);
        searchParams.set('tab', value);
        navigate({ search: searchParams.toString() }, { replace: true });
    };

    return (
        <div className='w-full pt-2 pl-2 pr-4 mb-1'>
            <SectionTabPanel
                tabs={DossierTabs}
                filterMenu={[]}
                contextKey={`case-dossier-${activeTab}`}
                appliedFilters={{}}
                setAppliedFilters={() => { }}
                setCurrentPage={() => { }}
                handleFilter={() => { }}
                sortFilterCount={0}
                setSortFilterCount={() => { }}
                allYears={[]}
                fiscalYearValue={''}
                showRefresh={false}
                onRefreshClick={() => { }}
                filterVisibility={false}
                showFilter={false}
                showSearch={false}
                searchDisabled={false}
                searchPlaceholder='Search'
                onSearch={() => { }}
                searchReset={false}
                onSearchReset={() => { }}
            />
            <SectionHeader
                title='Dossier'
                titleIcon={
                    <DetailsIcon
                        alt='dossier-header-icon'
                        className='[&>path]:stroke-[#f16840]'
                    />
                }
                buttons={[]}
                count={0}
                showItemCount={false}
                iconBg='#ffeae5'
                bgType='circle'
            />
            <SectionHeaderTab
                tabs={tabs}
                onTabChange={handleTabChange}
                defaultValue={activeTab}
            />
            <div className='border border-t-0 border-[#CBD6E2] p-3'>
                {activeTab === 'project_documentation' && <ProjectDocumentation />}
                {activeTab === 'financial_workings' && <FinancialWorking />}
            </div>
        </div>
    );
};

export default DossierMenu;
