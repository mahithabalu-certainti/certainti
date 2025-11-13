import {
  createCheckboxField,
  createMultiSelectField,
} from '../../../../../../common-utils';
import { FormType, SelectOption } from '../../../../../types';

export const jurisdictionConfigFormFields = (
  // permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  memoizedState?: SelectOption[],
  isEnable?: boolean,
  isFedral?: boolean
): FormType[] => {
  return [
    {
      sectionName: '',
      fillType: 'half',
      fields: [
        createCheckboxField('is_federal_level', 'Federal Level', {
          required: false,
          checkboxOptions: [
            {
              label: ` ${isFedral ? 'Disable' : 'Enable'} Federal Level`,
              value: 'is_federal_level',
            },
          ],
        }),
        createCheckboxField('is_state_level', 'State Level', {
          required: false,
          onChange: true,
          resetDependsFields: isEnable ? ['states'] : [],
          checkboxOptions: [
            {
              label: ` ${isEnable ? 'Disable' : 'Enable'}  State Level`,
              value: 'is_state_level',
            },
          ],
        }),
        createMultiSelectField('states', 'State', {
          options: memoizedState || [],
          placeholder: 'Choose Region',
          required: false,

          // isLoading: stateLoading,
          // hide:
          //   isEditView &&
          //   !permissionMap?.['region_rid']?.read &&
          //   !permissionMap?.['region_rid']?.edit,
          // disabled:
          //   isEditView &&
          //   permissionMap?.['region_rid']?.read &&
          //   !permissionMap?.['region_rid']?.edit,
        }),
      ],
    },
  ];
};
