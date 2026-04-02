import { createTextField } from '../../../../../../common-utils';
import { FormType } from '../../../../../types';

export const jurisdictionSettingFormFields = (): FormType[] => {
  return [
    {
      sectionName: 'emptyName',
      fillType: 'half',
      fields: [
        createTextField('assessment_methodology', 'Assessment Methodology', {
          required: false,
          placeholder: 'Enter Assessment Methodology',
        }),
      ],
    },
  ];
};
