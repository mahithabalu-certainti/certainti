import {
  createRadioField,
  createTextField,
  PROJECT_YES_NO_OPTIONS,
} from '../../../common-utils';
import { FormType } from '../../../consultant/types';

export const ConfigureSettingsFormFields = (
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  emailRequried?: boolean,
  idRequired?: boolean
): FormType[] => {
  return [
    {
      sectionName: '',
      fillType: 'half',
      fields: [
        createTextField('email', 'Email', {
          required: idRequired,
          placeholder: 'Enter email',
          disabled:
            permissionMap?.['blended_rate_fte']?.read &&
            !permissionMap?.['blended_rate_fte']?.edit,
          hide:
            !permissionMap?.['blended_rate_fte']?.read &&
            !permissionMap?.['blended_rate_fte']?.edit,
          //   regex: REGEX_PATTERNS.BLENDED_NUMBER,
          //   regexErrorMessage:
          //     'Only positive numbers allowed, up to 3 digits and 2 decimal places',
        }),
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
        createTextField('tenant_id', 'Tenant ID', {
          required: emailRequried,
          placeholder: 'Enter Tenant ID',
          // disabled:
          //   permissionMap?.['tenant_id']?.read &&
          //   !permissionMap?.['tenant_id']?.edit,
          // hide:
          //   !permissionMap?.['tenant_id']?.read &&
          //   !permissionMap?.['tenant_id']?.edit,
          // regex: REGEX_PATTERNS.BLENDED_NUMBER,
          // regexErrorMessage:
          //   'Only positive numbers allowed, up to 3 digits and 2 decimal places',
        }),
        createTextField('client_id', 'Client ID', {
          required: emailRequried,
          placeholder: 'Enter Client ID',
          // disabled:
          //   permissionMap?.['client_id']?.read &&
          //   !permissionMap?.['client_id']?.edit,
          // hide:
          //   !permissionMap?.['client_id']?.read &&
          //   !permissionMap?.['client_id']?.edit,
          // regex: REGEX_PATTERNS.BLENDED_NUMBER,
          // regexErrorMessage:
          //   'Only positive numbers allowed, up to 3 digits and 2 decimal places',
        }),
        createTextField('client_secret', 'Client Secret', {
          required: emailRequried,
          placeholder: 'Enter Client Secret',
          // disabled:
          //   permissionMap?.['client_secret']?.read &&
          //   !permissionMap?.['client_secret']?.edit,
          // hide:
          //   !permissionMap?.['client_secret']?.read &&
          //   !permissionMap?.['client_secret']?.edit,
          // regex: REGEX_PATTERNS.BLENDED_NUMBER,
          // regexErrorMessage:
          //   'Only positive numbers allowed, up to 3 digits and 2 decimal places',
        }),
      ],
    },
  ];
};
