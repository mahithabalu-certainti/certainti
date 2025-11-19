import { useMemo } from 'react';
import { FormType } from '../../consultant/types';
import {
  createCheckboxField,
  createDateField,
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
} from '../../common-utils';

export const TaskFormData = (): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: '',
        fillType: 'half',
        subSection: true,
        fields: [
          createSelectField('task_type', 'Task Type', {
            options: [],
            placeholder: 'Choose Task Type',
            required: false,
          }),
          createSelectField('related_to', 'Related To', {
            options: [],
            placeholder: 'Choose Related To',
            required: false,
          }),
          createSelectField('status', 'Status', {
            required: false,
            options: [],
            placeholder: 'Choose Status',
          }),
          createSelectField('assigned_to', 'Assigned To', {
            options: [],
            placeholder: 'Choose Assigned To',
            required: false,
          }),
          createDateField('task_due_date', 'Task Due Date', {
            required: false,
            disableFutureDates: true,
          }),
        ],
      },
      {
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('task_description', 'Task Description', {
            required: false,
            placeholder: 'Enter Task Description',
            regexErrorMessage:
              'Task Description must be within 2000 characters',
            regex: REGEX_PATTERNS.DESCRIPTION,
          }),
        ],
      },
    ],
    []
  );
};

export const CallLogFormData = (): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: '',
        fillType: 'half',
        subSection: true,
        fields: [
          createTextField('call_id', 'Call Id', {
            required: false,
            placeholder: 'Enter Call ID',
          }),
          createTextField('call_subject', 'Call Subject', {
            required: false,
            placeholder: 'Enter Subject',
          }),
          createSelectField('call_type', 'Call Type', {
            options: [],
            placeholder: 'Choose Call Type',
            required: false,
          }),
          createSelectField('status', 'Status', {
            options: [],
            placeholder: 'Choose Status',
            required: false,
          }),
          createTextField('call_platform', 'Call Platform', {
            required: false,
            placeholder: 'Enter Call Platform',
          }),
          createTextField('call_url', 'Call URL', {
            required: false,
            placeholder: 'Enter Call URL',
          }),
          createTextField('call_code', 'Call Code', {
            required: false,
            placeholder: 'Enter Call Code',
          }),
          createTextField('call_password', 'Call Password', {
            required: false,
            placeholder: 'Enter Call Password',
          }),
          createDateField('call_start_date', 'Call Start Date', {
            required: false,
            disableFutureDates: true,
          }),
          createDateField('call_end_date', 'Call End Date', {
            required: false,
            disableFutureDates: true,
          }),
          createDateField('call_start_time', 'Call Start Time', {
            required: false,
            disableFutureDates: true,
          }),
          createDateField('call_end_time', 'Call End Time', {
            required: false,
            disableFutureDates: true,
          }),
          createCheckboxField('all_day', 'All day', {
            required: false,
            checkboxOptions: [
              {
                label: `All Day`,
                value: 'all_day',
              },
            ],
          }),
          createCheckboxField('days_of_week', 'Days of Week', {
            required: false,
            checkboxOptions: [
              {
                label: `Days of Week`,
                value: 'days_of_week',
              },
            ],
          }),
          createSelectField('caller', 'Caller', {
            options: [],
            placeholder: 'Choose Caller',
            required: false,
          }),
          createSelectField('participants', 'Participants', {
            options: [],
            placeholder: 'Choose Participants',
            required: false,
          }),
          createTextField('attachments', 'Attachments', {
            type: 'file',
            onChange: true,
            required: false,
            placeholder: 'Upload',
          }),
        ],
      },
      {
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('call_description', 'Call Description', {
            required: false,
            placeholder: 'Enter Call Description',
            regexErrorMessage:
              'Call Description must be within 2000 characters',
            regex: REGEX_PATTERNS.DESCRIPTION,
          }),
        ],
      },
    ],
    []
  );
};

export const MeetingFormData = (): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: '',
        fillType: 'half',
        subSection: true,
        fields: [
          createTextField('subject', 'Subject', {
            required: false,
            placeholder: 'Enter Subject',
          }),
          createSelectField('related_to', 'Related to', {
            required: false,
            options: [],
            placeholder: 'Choose Related To',
          }),
          createSelectField('invited_by', 'Invited By', {
            required: false,
            options: [],
            placeholder: 'Choose Invited By',
          }),
          createSelectField('invitees', 'Invitees', {
            required: false,
            options: [],
            placeholder: 'Choose Invitees',
          }),
          createSelectField('status', 'Status', {
            required: false,
            options: [],
            placeholder: 'Choose Status',
          }),
          createSelectField('meeting_type', 'Meeting Type', {
            required: false,
            options: [],
            placeholder: 'Choose Meeting Type',
          }),
          createSelectField('meeting_platform', 'Meeting Platform', {
            required: false,
            options: [],
            placeholder: 'Choose Meeting Platform',
          }),
          createTextField('meeting_url', 'Meeting URL', {
            required: false,
            placeholder: 'Enter Meeting URL',
          }),
          createTextField('meeting_code', 'Meeting Code', {
            required: false,
            placeholder: 'Enter Meeting Code',
          }),
          createTextField('meeting_password', 'Meeting Password', {
            required: false,
            placeholder: 'Enter Meeting Password',
          }),
          createDateField('meeting_start_date', 'Meeting Start Date', {
            required: false,
            disableFutureDates: false,
          }),
          createDateField('meeting_end_date', 'Meeting End Date', {
            required: false,
            disableFutureDates: false,
          }),
          createCheckboxField('all_day', 'All day', {
            required: false,
            checkboxOptions: [{ label: `All day`, value: 'all_day' }],
          }),
          createCheckboxField('days_of_week', 'Days of Week', {
            required: false,
            checkboxOptions: [{ label: `Days of Week`, value: 'days_of_week' }],
          }),
          createTextField('meeting_start_time', 'Meeting Start Time', {
            required: false,
            placeholder: 'Enter Start Time',
          }),
          createTextField('meeting_end_time', 'Meeting End Time', {
            required: false,
            placeholder: 'Enter End Time',
          }),
          createTextField('attachments', 'Attachments', {
            type: 'file',
            onChange: true,
            required: false,
            placeholder: 'Upload',
          }),
        ],
      },
      {
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('meeting_description', 'Meeting Description', {
            required: false,
            placeholder: 'Enter Meeting Description',
            regexErrorMessage: 'Description must be within 2000 characters',
            regex: REGEX_PATTERNS.DESCRIPTION,
          }),
        ],
      },
    ],
    []
  );
};
