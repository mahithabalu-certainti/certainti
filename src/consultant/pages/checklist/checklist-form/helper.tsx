import { REGEX_PATTERNS } from '../../../../common-utils';
import {
  ChecklistDetails,
  ChecklistFormPayload,
  ChecklistItem,
  ChecklistItemDetails,
  ItemActionType,
} from '../../../types/checklist';

export const COMMON_SELECT_STYLES = {
  height: '32px',
  fontSize: '13px',
  padding: '6px 4px',
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    border: '2px solid #60A5FA',
  },
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused': { boxShadow: 'none' },
  },
  '.MuiSelect-select': {
    padding: '6px 6px',
  },
  '&.Mui-disabled': { backgroundColor: '#f3f4f6' },
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: '2px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    border: '1px solid #CBD6E2',
  },
  '& .MuiSvgIcon-root': {
    color: '#7D98B6',
  },
};

export const COMMON_MENU_PROPS = {
  PaperProps: {
    sx: {
      maxWidth: 300,
      maxHeight: 300,
      marginTop: '4px',
      boxShadow:
        'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
      '& .MuiMenuItem-root': {
        fontSize: '13px',
        padding: '6px 12px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    },
  },
};

export interface ChecklistFormData {
  checklist_name: string;
  checklist_description: string;
  fiscalYear: string | number;
  status: string;
  checklist_items: ChecklistFormItem[];
  rid?: string;
  checklist_rid?: string;
  created_on?: string;
  created_by?: string;
  updated_on?: string;
  updated_by?: string;
  checklist_template_rid?: string;
}

export interface ChecklistFormItem {
  checklist_seq_num: string;
  checklist_item_name: string;
  description: string;
  status?: string;
  rid?: string;
}

export interface ChecklistFormErrors {
  checklist_name?: string;
  checklist_description?: string;
  status?: string;
  fiscalYear?: string;
  checklist_items?: ChecklistItemErrors[];
}

export interface ChecklistItemErrors {
  checklist_item_name?: string;
  description?: string;
  status?: string; // Add status error field
}

export interface ChecklistFormTableColumn {
  name: string;
  label: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  required?: boolean;
  disabled?: boolean;
  hide?: boolean;
}

export enum ItemUpdate {
  Add = 'ADD',
  Edit = 'EDIT',
  Delete = 'DELETE',
}

export interface BasePayload {
  account_rid: string;
  attach_to: string;
  attachment_level: string;
  checklist_template_rid?: string;
}

export const getChecklistTableColumns = (
  isEditView: boolean
): ChecklistFormTableColumn[] => [
  {
    name: 'checklist_seq_num',
    label: 'S.No',
    width: '60px',
    align: 'center',
    required: false,
    hide: true,
  },
  {
    name: 'checklist_item_name',
    label: 'Checklist Item Name',
    width: isEditView ? '30%' : '34%',
    required: true,
    hide: false,
  },
  {
    name: 'description',
    label: 'Description',
    width: isEditView ? '50%' : '60%',
    required: false,
    hide: false,
  },
  {
    name: 'status',
    label: 'Status',
    width: '14%',
    required: false,
    hide: !isEditView,
  },
  {
    name: 'action',
    label: 'Action',
    width: '6%',
    align: 'center',
    required: false,
    hide: false,
  },
];

export const shouldHideField = (
  fieldName: string,
  isEditView: boolean,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): boolean => {
  if (!permissionMap || !permissionMap[fieldName]) {
    return false;
  }

  const fieldPermissions = permissionMap[fieldName];
  if (isEditView) {
    return !fieldPermissions.read && !fieldPermissions.edit;
  }
  return false;
};

export const shouldDisableField = (
  fieldName: string,
  isEditView: boolean,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): boolean => {
  if (!permissionMap || !permissionMap[fieldName]) {
    return false;
  }

  const fieldPermissions = permissionMap[fieldName];
  if (isEditView) {
    return fieldPermissions.read && !fieldPermissions.edit;
  }
  return false;
};

export const validateChecklistForm = (
  formData: ChecklistFormData,
  ignoreFiscalYear: boolean
): { isValid: boolean; errors: ChecklistFormErrors } => {
  let isValid = true;
  const newErrors: ChecklistFormErrors = {};
  const itemErrors: ChecklistItemErrors[] = [];

  // Validate required fields
  if (!formData.checklist_name.trim()) {
    newErrors.checklist_name = 'Field is required';
    isValid = false;
  } else {
    if (!REGEX_PATTERNS.MIN_3.test(formData.checklist_name)) {
      newErrors.checklist_name =
        'Checklist Name must be more than 2 characters long';
      isValid = false;
    } else if (!REGEX_PATTERNS.MAX_64.test(formData.checklist_name)) {
      newErrors.checklist_name = 'Checklist Name must not exceed 64 characters';
      isValid = false;
    } else if (
      !REGEX_PATTERNS.TEMPLATE_NAME_REGEX.test(formData.checklist_name)
    ) {
      newErrors.checklist_name =
        "Checklist Name must contain only letters, numbers, spaces, apostrophes('), and hyphens(-).";
      isValid = false;
    }
  }

  if (!REGEX_PATTERNS.MAX_2000.test(formData.checklist_description)) {
    newErrors.checklist_description =
      'Description must be within 2000 characters';
    isValid = false;
  }

  if (!formData.status) {
    newErrors.status = 'Field is required';
    isValid = false;
  }

  if (!ignoreFiscalYear && !formData.fiscalYear) {
    newErrors.fiscalYear = 'Field is required';
    isValid = false;
  }

  // Validate checklist items
  formData.checklist_items.forEach((item) => {
    const currentItemErrors: ChecklistItemErrors = {};

    if (!item.checklist_item_name.trim()) {
      currentItemErrors.checklist_item_name = 'Field is required';
      isValid = false;
    }

    if (!REGEX_PATTERNS.MAX_2000.test(item.checklist_item_name)) {
      currentItemErrors.checklist_item_name =
        'Checklist Item must be within 2000 characters';
      isValid = false;
    }

    if (!REGEX_PATTERNS.MAX_2000.test(item.description)) {
      currentItemErrors.description =
        'Description must be within 2000 characters';
      isValid = false;
    }

    itemErrors.push(currentItemErrors);
  });

  newErrors.checklist_items = itemErrors;

  return { isValid, errors: newErrors };
};

export const checklistItemsTransformPayload = (
  formItems: ChecklistFormItem[],
  isEdit: boolean = false,
  existingItems: ChecklistItemDetails[] = []
): ChecklistItem[] => {
  const transformedItems: ChecklistItem[] = [];
  const retainedRids = new Set<string>();

  formItems.forEach((item) => {
    if (isEdit && item.rid) {
      retainedRids.add(item.rid);
      transformedItems.push({
        rid: item.rid,
        checklist_item_name: item.checklist_item_name,
        description: item.description,
        status_rid: item.status || '',
        action_type: ItemActionType.Edit,
      });
    } else if (!item.rid && item.checklist_item_name.trim()) {
      transformedItems.push({
        checklist_item_name: item.checklist_item_name,
        description: item.description,
        // status_rid: item.status || '',
        action_type: ItemActionType.Add,
      });
    }
  });

  if (isEdit) {
    existingItems.forEach((existingItem) => {
      if (existingItem.rid && !retainedRids.has(existingItem.rid)) {
        transformedItems.push({
          rid: existingItem.rid,
          checklist_item_name: existingItem.checklist_item_name || '',
          description: existingItem.checklist_item_description || '',
          status_rid: existingItem.status_rid || '',
          action_type: ItemActionType.Delete,
        });
      }
    });
  }

  return transformedItems;
};

export const transformChecklistTemplatePayload = (
  formData: ChecklistFormData,
  isEditView: boolean = false,
  basePayload: BasePayload,
  originalData?: ChecklistDetails
): ChecklistFormPayload => {
  const transformedItems = checklistItemsTransformPayload(
    formData.checklist_items,
    isEditView,
    originalData?.checklist_items || []
  );

  const payload: ChecklistFormPayload = {
    checklist_name: formData.checklist_name,
    checklist_description: formData.checklist_description,
    status_rid: formData.status,
    checklist_items: transformedItems,
    ...basePayload,
  };

  if (isEditView && originalData) {
    return {
      ...payload,
      checklist_rid: originalData.checklist_rid || originalData.checklist_rid,
    };
  }

  return payload;
};

export const getSelectStyles = (hasError: boolean, isEmpty: boolean) => ({
  ...COMMON_SELECT_STYLES,
  '.MuiSelect-select': {
    ...COMMON_SELECT_STYLES['.MuiSelect-select'],
    color: isEmpty ? '#7D98B6' : 'black',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: hasError ? '1px solid #ef4444' : '1px solid #CBD6E2',
    borderRadius: '2px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    border: hasError ? '1px solid #ef4444' : '1px solid #CBD6E2',
  },
});
