import {
  createCheckboxField,
  createMultiSelectField,
} from '../../../../../../common-utils';
import { FormType, SelectOption } from '../../../../../types';

export const jurisdictionConfigFormFields = (
  // permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  memoizedState?: SelectOption[],
  isEnable?: boolean,
  disabled?: boolean
): FormType[] => {
  return [
    {
      sectionName: 'emptyName',
      fillType: 'half',
      fields: [
        createCheckboxField('is_federal_level', 'Federal Level Submission', {
          required: false,
          disabled: disabled,
          checkboxOptions: [
            {
              label: `Enable Federal Level Submission`,
              value: 'is_federal_level',
            },
          ],
        }),
        createCheckboxField('is_state_level', 'State Level Submission', {
          required: false,
          onChange: true,
          disabled: disabled,
          resetDependsFields: isEnable ? ['states'] : [],
          checkboxOptions: [
            {
              label: `Enable State Level Submission`,
              value: 'is_state_level',
            },
          ],
        }),
        createMultiSelectField('states', isEnable ? 'State' : 'State', {
          options: memoizedState || [],
          placeholder: 'Choose Region',
          required: !!isEnable,
          disabled: disabled || !isEnable,
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
