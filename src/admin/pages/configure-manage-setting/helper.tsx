import {
  createRadioField,
  PROJECT_YES_NO_OPTIONS,
} from '../../../common-utils';
import { FormType } from '../../../consultant/types';

export const ConfigureSettingsFormFields = (
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FormType[] => {
  return [
    {
      sectionName: 'RD Configuration',
      fillType: 'half',
      fields: [
        createRadioField('auto_assessment', 'Auto Assessment', {
          required: false,
          radioOptions: PROJECT_YES_NO_OPTIONS,
          disabled:
            permissionMap?.['auto_assessment']?.read &&
            !permissionMap?.['auto_assessment']?.edit,
          hide:
            !permissionMap?.['auto_assessment']?.read &&
            !permissionMap?.['auto_assessment']?.edit,
        }),
        createRadioField('auto_send_ai_interaction', 'Auto Send Interaction', {
          required: true,
          radioOptions: PROJECT_YES_NO_OPTIONS,
          disabled:
            permissionMap?.['auto_send_interaction']?.read &&
            !permissionMap?.['auto_send_interaction']?.edit,
          hide:
            !permissionMap?.['auto_send_interaction']?.read &&
            !permissionMap?.['auto_send_interaction']?.edit,
        }),
        createRadioField('four_part_assessment', 'Four Part Assessment', {
          required: true,
          radioOptions: PROJECT_YES_NO_OPTIONS,
          // disabled:
          //   permissionMap?.['four_part_assessment']?.read &&
          //   !permissionMap?.['four_part_assessment']?.edit,
          // hide:
          //   !permissionMap?.['four_part_assessment']?.read &&
          //   !permissionMap?.['four_part_assessment']?.edit,
        }),
      ],
    },
  ];
};
