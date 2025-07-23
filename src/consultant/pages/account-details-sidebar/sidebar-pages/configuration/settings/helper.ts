import { useMemo } from 'react';
import {
  createFiscalDateField,
  createRadioField,
  createTextField,
  PROJECT_YES_NO_OPTIONS,
  REGEX_PATTERNS,
} from '../../../../../../common-utils';
import { FormType } from '../../../../../types';

export const settingsFormFields = (
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: '',
        fillType: 'half',
        fields: [
          createFiscalDateField('fiscal_start_date', 'Fiscal Start', {
            required: true,
            disabled:
              permissionMap?.['fiscal_start_date']?.read &&
              !permissionMap?.['fiscal_start_date']?.edit,
            hide:
              !permissionMap?.['fiscal_start_date']?.read &&
              !permissionMap?.['fiscal_start_date']?.edit,
          }),
          createFiscalDateField('fiscal_end_date', 'Fiscal End', {
            required: true,
            disabled:
              permissionMap?.['fiscal_end_date']?.read &&
              !permissionMap?.['fiscal_end_date']?.edit,
            hide:
              !permissionMap?.['fiscal_end_date']?.read &&
              !permissionMap?.['fiscal_end_date']?.edit,
            toBeNotSame: {
              key: 'fiscal_start_date',
              errorMessage:
                'Fiscal End Date cannot be the same as the Fiscal Start Date',
            },
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
                !permissionMap?.['max_interaction_follow_up']?.read &&
                !permissionMap?.['max_interaction_follow_up']?.edit,
              regex: REGEX_PATTERNS.MAX_AI_INTERACTIONS,
              regexErrorMessage:
                'Max Interaction Follow Up must be between 1 and 10',
            }
          ),
          createTextField('blended_rate_fte', 'Blended Rate - FTE', {
            required: false,
            placeholder: 'Enter Blended Rate - FTE',
            disabled:
              permissionMap?.['blended_rate_fte']?.read &&
              !permissionMap?.['blended_rate_fte']?.edit,
            hide:
              !permissionMap?.['blended_rate_fte']?.read &&
              !permissionMap?.['blended_rate_fte']?.edit,
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
              !permissionMap?.['blended_rate_subcon']?.read &&
              !permissionMap?.['blended_rate_subcon']?.edit,
            regex: REGEX_PATTERNS.BLENDED_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 3 digits and 2 decimal places',
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
          createRadioField(
            'auto_send_ai_interaction',
            'Auto Send Interaction',
            {
              required: true,
              radioOptions: PROJECT_YES_NO_OPTIONS,
              disabled:
                permissionMap?.['auto_send_interaction']?.read &&
                !permissionMap?.['auto_send_interaction']?.edit,
              hide:
                !permissionMap?.['auto_send_interaction']?.read &&
                !permissionMap?.['auto_send_interaction']?.edit,
            }
          ),
        ],
      },
    ],
    []
  );
};
