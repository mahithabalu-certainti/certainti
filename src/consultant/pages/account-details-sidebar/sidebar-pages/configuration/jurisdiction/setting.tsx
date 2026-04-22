import { useRef, useState } from 'react';

import JurisdictionConfig from './Jurisdiction-Config/Jurisdiction-Config';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { ConfigRuleIcon } from '../../../../../../assets';
import { ActivityDropdownItem, ColorCode } from '../../../../../types';
import Timeline from '../../../../../../pages/timeline/timeline';
import { useSearchParams } from 'react-router';
interface JurisdictionSettingProps {
  countryId: string | null;
  activityMenuItems: ActivityDropdownItem[];
}

const JurisdictionSetting: React.FC<JurisdictionSettingProps> = ({
  countryId,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [isFormSaving, setIsFormSaving] = useState<boolean>(false);
  // const [isSaveDisable, setIsSaveDisable] = useState<boolean>(false);
  const handleSubmit = () => {
    formRef.current?.requestSubmit();
  };
  const [searchParams] = useSearchParams();
  const isTimeLineView = searchParams.get('timelineview') === 'true';
  const headerButtons = [
    {
      label: 'Save',
      variant: 'contained' as const,
      onClick: () => handleSubmit(),
      hide: false,
      disabled: false,
      loading: isFormSaving,
    },
  ];
  return (
    <div className='flex flex-col w-full'>
      {isTimeLineView ? (
        <div className='border border-[#CBD6E2] rounded-[2px] overflow-auto'>
          <Timeline entitytype='account' />
        </div>
      ) : (
        <div>
          <SectionHeader
            title={'Jurisdiction Configuration'}
            titleIcon={
              <ConfigRuleIcon
                alt='settings-header-icon'
                className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
              />
            }
            buttons={headerButtons}
            iconBg={ColorCode.accountBgColor}
            bgType='circle'
          />
          <JurisdictionConfig
            formRef={formRef}
            setIsFormSaving={setIsFormSaving}
            countryId={countryId}
          />
        </div>
      )}
    </div>
  );
};
export default JurisdictionSetting;
