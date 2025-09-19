import {
  createRadioField,
  createTextField,
  PROJECT_YES_NO_OPTIONS,
  REGEX_PATTERNS,
} from '../../../../../../common-utils';
import { FormType } from '../../../../../types';

export const settingsFormFields = (
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  emailRequried?: boolean,
  idRequired?: boolean,
  isParentAccount?: boolean
): FormType[] => {
  return [
    {
      sectionName: '',
      fillType: 'half',
      fields: [
        createTextField('blended_rate_fte', 'Blended Rate - FTE', {
          required: false,
          placeholder: 'Enter Blended Rate - FTE',
          disabled:
            permissionMap?.['blended_rate_fte']?.read &&
            !permissionMap?.['blended_rate_fte']?.edit,
          hide:
            isParentAccount ||
            (!permissionMap?.['blended_rate_fte']?.read &&
              !permissionMap?.['blended_rate_fte']?.edit),
          regex: REGEX_PATTERNS.BLENDED_NUMBER,
          regexErrorMessage:
            'Only positive numbers allowed, up to 3 digits and 2 decimal places',
        }),
        createTextField('blended_rate_subcon', 'Blended Rate - SubCon', {
          required: false,
          placeholder: 'Enter Blended Rate - SubCon',
          disabled:
            permissionMap?.['blended_rate_subcon']?.read &&
            !permissionMap?.['blended_rate_subcon']?.edit,
          hide:
            isParentAccount ||
            (!permissionMap?.['blended_rate_subcon']?.read &&
              !permissionMap?.['blended_rate_subcon']?.edit),
          regex: REGEX_PATTERNS.BLENDED_NUMBER,
          regexErrorMessage:
            'Only positive numbers allowed, up to 3 digits and 2 decimal places',
        }),
        createTextField(
          'max_interaction_follow_up',
          'Max Interaction Follow Up',
          {
            required: true,
            placeholder: 'Enter Max Interaction Follow Up',
            disabled:
              permissionMap?.['max_interaction_follow_up']?.read &&
              !permissionMap?.['max_interaction_follow_up']?.edit,
            hide:
              isParentAccount ||
              (!permissionMap?.['max_interaction_follow_up']?.read &&
                !permissionMap?.['max_interaction_follow_up']?.edit),
            regex: REGEX_PATTERNS.MAX_AI_INTERACTIONS,
            regexErrorMessage:
              'Max Interaction Follow Up must be between 1 and 10',
          }
        ),

        createTextField('support_email', 'Email', {
          required: idRequired,
          placeholder: 'Enter Email',
          onChange: true,
          hide: !isParentAccount,
          // disabled:
          //   permissionMap?.['support_email']?.read &&
          //   !permissionMap?.['support_email']?.edit,
          // hide:
          //   !permissionMap?.['support_email']?.read &&
          //   !permissionMap?.['support_email']?.edit,
          regex: REGEX_PATTERNS.EMAIL,
          regexErrorMessage: 'Invalid email address',
        }),
        createTextField('tenant_id', 'Tenant ID', {
          required: emailRequried,
          placeholder: 'Enter Tenant ID',
          hide: !isParentAccount,
          onChange: true,
          // disabled:
          //   permissionMap?.['tenant_id']?.read &&
          //   !permissionMap?.['tenant_id']?.edit,
          // hide:
          //   !permissionMap?.['tenant_id']?.read &&
          //   !permissionMap?.['tenant_id']?.edit,
          regex: REGEX_PATTERNS.ALLOW_36,
          regexErrorMessage: 'Tenant ID must be exactly 36 characters long',
        }),
        createTextField('client_id', 'Client ID', {
          required: emailRequried,
          placeholder: 'Enter Client ID',
          onChange: true,
          hide: !isParentAccount,
          // disabled:
          //   permissionMap?.['client_id']?.read &&
          //   !permissionMap?.['client_id']?.edit,
          // hide:
          //   !permissionMap?.['client_id']?.read &&
          //   !permissionMap?.['client_id']?.edit,
          // regex: REGEX_PATTERNS.BLENDED_NUMBER,
          regex: REGEX_PATTERNS.ALLOW_36,
          regexErrorMessage: 'Client ID must be exactly 36 characters long',
        }),
        createTextField('client_secret', 'Client Secret', {
          required: emailRequried,
          placeholder: 'Enter Client Secret',
          onChange: true,
          hide: !isParentAccount,
          // disabled:
          //   permissionMap?.['client_secret']?.read &&
          //   !permissionMap?.['client_secret']?.edit,
          // hide:
          //   !permissionMap?.['client_secret']?.read &&
          //   !permissionMap?.['client_secret']?.edit,
          regex: REGEX_PATTERNS.ALLOW_36,
          regexErrorMessage: 'Client Secret must be exactly 36 characters long',
        }),
        createRadioField('auto_assessment', 'Auto Assessment', {
          required: false,
          radioOptions: PROJECT_YES_NO_OPTIONS,
          disabled:
            permissionMap?.['auto_assessment']?.read &&
            !permissionMap?.['auto_assessment']?.edit,
          hide:
            isParentAccount ||
            (!permissionMap?.['auto_assessment']?.read &&
              !permissionMap?.['auto_assessment']?.edit),
        }),
        createRadioField('auto_send_ai_interaction', 'Auto Send Interaction', {
          required: true,
          radioOptions: PROJECT_YES_NO_OPTIONS,
          disabled:
            permissionMap?.['auto_send_interaction']?.read &&
            !permissionMap?.['auto_send_interaction']?.edit,
          hide:
            isParentAccount ||
            (!permissionMap?.['auto_send_interaction']?.read &&
              !permissionMap?.['auto_send_interaction']?.edit),
        }),
      ],
    },
  ];
};
