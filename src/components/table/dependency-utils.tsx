import {
  ListTableColumn,
  RowData,
  MultipleEditingCells,
  DependencyValue,
  DependencyRowData,
  ModalField,
} from './types';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isBetween from 'dayjs/plugin/isBetween';

// Extend dayjs with required plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);

const validateRegex = (regex: RegExp | string, value: string) => {
  const pattern = regex instanceof RegExp ? regex : new RegExp(regex || '');
  return !pattern.test(value); // Returns true if INVALID
};

export const checkDependencies = <T extends RowData>(
  column: ListTableColumn<T>,
  rowData: T,
  editingCells: MultipleEditingCells
): {
  isRequired: boolean;
  isDisabled: boolean;
  isHidden: boolean;
  shouldShowModal: boolean;
  errorMessage?: string;
} => {
  if (!column.field?.dependencies) {
    return {
      isRequired: column.field?.required || false,
      isDisabled: false,
      isHidden: false,
      shouldShowModal: false,
    };
  }

  let isRequired = column.field?.required || false;
  let isDisabled = false;
  let isHidden = false;
  let shouldShowModal = false;
  let errorMessage: string | undefined;

  for (const dependency of column.field.dependencies) {
    const dependsOnFields = Array.isArray(dependency.dependsOn)
      ? dependency.dependsOn
      : [dependency.dependsOn];

    // For modal conditions, we need to pass the current row data with editing values
    const currentRowData: DependencyRowData = { ...rowData };

    // Update current row data with editing values
    Object.values(editingCells).forEach((cell) => {
      if (cell.rowId === getRowId(rowData)) {
        currentRowData[cell.columnId] = cell.value;
      }
    });

    // Check if all dependent fields meet the condition
    const allConditionsMet = dependsOnFields.every((fieldId) => {
      const dependentValue = getDependentValue(
        fieldId,
        currentRowData,
        editingCells
      );
      return dependency.condition(dependentValue, currentRowData);
    });

    if (allConditionsMet) {
      switch (dependency.action) {
        case 'required':
          isRequired = true;
          break;
        case 'disabled':
          isDisabled = true;
          break;
        case 'hidden':
          isHidden = true;
          break;
        case 'show_modal':
          shouldShowModal = true;
          break;
      }
      if (dependency.message) {
        errorMessage = dependency.message;
      }
    }
  }

  return { isRequired, isDisabled, isHidden, shouldShowModal, errorMessage };
};

// Helper function to get row ID from row data
const getRowId = <T extends RowData>(rowData: T): string => {
  // This assumes there's an 'id' field, adjust based on your actual implementation
  return String(rowData.id || rowData.rid || '');
};

export const getDependentValue = <T extends RowData>(
  fieldId: string,
  rowData: T,
  editingCells: MultipleEditingCells
): DependencyValue => {
  // Check if the field is currently being edited
  const editingKey = Object.keys(editingCells).find(
    (key) => editingCells[key].columnId === fieldId
  );

  if (editingKey) {
    return editingCells[editingKey].value;
  }

  return rowData[fieldId] as DependencyValue;
};

export const validateDependentFields = <T extends RowData>(
  columns: ListTableColumn<T>[],
  rowData: T,
  editingCells: MultipleEditingCells
): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Get current values for start and end dates
  const startDateValue = getDependentValue(
    'effective_from',
    rowData,
    editingCells
  );
  const endDateValue = getDependentValue('end_date', rowData, editingCells);

  for (const column of columns) {
    const cellKey = Object.keys(editingCells).find(
      (key) => editingCells[key].columnId === column.id
    );

    if (!cellKey) continue;

    const cellValue = editingCells[cellKey].value;
    const dependencies = checkDependencies(column, rowData, editingCells);

    // Check if required field is empty
    if (dependencies.isRequired && (!cellValue || cellValue === '')) {
      errors[cellKey] = 'This field is required';
      continue;
    }

    // Special validation for start/end date mutual requirement
    if (column.id === 'effective_from' || column.id === 'end_date') {
      // If either start or end date has a value, both must have values
      if (
        (startDateValue && !endDateValue) ||
        (!startDateValue && endDateValue)
      ) {
        if (column.id === 'effective_from' && endDateValue && !cellValue) {
          errors[cellKey] = 'Start Date is required when End Date is provided';
          continue;
        }
        if (column.id === 'end_date' && startDateValue && !cellValue) {
          errors[cellKey] = 'End Date is required when Start Date is provided';
          continue;
        }
      }
    }

    // Validate date fields with fiscal year and date range validation
    if (column.field?.type === 'date' && column.field?.dateConfig) {
      const dateConfig = column.field.dateConfig;

      if (cellValue) {
        const selectedDate = dayjs(String(cellValue));

        // Future date validation - check against current date
        if (
          dateConfig.disableFutureDates &&
          selectedDate.isAfter(dayjs(), 'day')
        ) {
          errors[cellKey] = 'Future dates are not allowed';
          continue;
        }

        // Fiscal year validation
        if (dateConfig.fiscalYearValidation) {
          const fiscalYearValue = getDependentValue(
            'fiscal_year',
            rowData,
            editingCells
          );
          if (fiscalYearValue) {
            const fiscalYearStart = dayjs(`${fiscalYearValue}-04-01`);
            const fiscalYearEnd = dayjs(`${Number(fiscalYearValue) + 1}-03-31`);

            if (
              !selectedDate.isBetween(
                fiscalYearStart,
                fiscalYearEnd,
                'day',
                '[]'
              )
            ) {
              errors[cellKey] =
                `Date must be within fiscal year ${fiscalYearValue}`;
              continue;
            }
          }
        }

        // Min/Max date validation
        if (
          dateConfig.minDate &&
          selectedDate.isBefore(dayjs(dateConfig.minDate), 'day')
        ) {
          errors[cellKey] =
            `Date must be after ${dayjs(dateConfig.minDate).format('YYYY-MM-DD')}`;
          continue;
        }

        if (
          dateConfig.maxDate &&
          selectedDate.isAfter(dayjs(dateConfig.maxDate), 'day')
        ) {
          errors[cellKey] =
            `Date must be before ${dayjs(dateConfig.maxDate).format('YYYY-MM-DD')}`;
          continue;
        }
      }

      // Special validation for start/end date relationships
      if (column.id === 'end_date') {
        const startDateValue = getDependentValue(
          'effective_from',
          rowData,
          editingCells
        );

        if (
          cellValue &&
          startDateValue &&
          dayjs(String(cellValue)).isSameOrBefore(
            dayjs(String(startDateValue)),
            'day'
          )
        ) {
          errors[cellKey] = 'End Date must be after Start Date';
          continue;
        }
      }
    }

    // Custom validation rules
    if (column.field?.validation) {
      const stringValue = String(cellValue);
      if (stringValue.trim() === '' && column.field.required !== true) {
        // Skip validation when not required and empty
      } else {
        for (const validation of column.field.validation) {
          if (validateRegex(validation.regex, stringValue)) {
            errors[cellKey] = validation.errorMessage;
            break;
          }
        }
      }
    }
  }

  return errors;
};

export const getRelatedFields = <T extends RowData>(
  columns: ListTableColumn<T>[],
  triggeredColumnId: string
): string[] => {
  const relatedFields: string[] = [];

  for (const column of columns) {
    if (!column.field?.dependencies) continue;

    for (const dependency of column.field.dependencies) {
      const dependsOnFields = Array.isArray(dependency.dependsOn)
        ? dependency.dependsOn
        : [dependency.dependsOn];

      if (dependsOnFields.includes(triggeredColumnId)) {
        relatedFields.push(column.id);
      }
    }
  }

  return relatedFields;
};

export const shouldEnableMultipleEdit = <T extends RowData>(
  columns: ListTableColumn<T>[],
  triggeredColumnId: string
): string[] => {
  const fieldsToEnable: string[] = [triggeredColumnId];
  const relatedFields = getRelatedFields(columns, triggeredColumnId);

  fieldsToEnable.push(...relatedFields);

  // Recursively find all dependent fields
  for (const relatedField of relatedFields) {
    const nestedRelated = getRelatedFields(columns, relatedField);
    fieldsToEnable.push(...nestedRelated);
  }

  return [...new Set(fieldsToEnable)]; // Remove duplicates
};

// Dynamic field reset based on column configuration
export const getFieldsToReset = <T extends RowData>(
  columns: ListTableColumn<T>[],
  changedFieldId: string,
  newValue: DependencyValue,
  oldValue: DependencyValue
): string[] => {
  const column = columns.find((col) => col.id === changedFieldId);

  if (!column?.field?.resetDependentFields) {
    return [];
  }

  // Only reset if value actually changed
  if (newValue === oldValue) {
    return [];
  }

  return column.field.resetDependentFields;
};

// Helper function to check if a field value should trigger a modal
export const shouldShowModalForValue = <T extends RowData>(
  column: ListTableColumn<T>,
  value: DependencyValue,
  rowData?: T,
  editingCells?: MultipleEditingCells
): { shouldShow: boolean; modalFields?: ModalField[] } => {
  if (!column.field?.dependencies) {
    return { shouldShow: false };
  }

  // Create a temporary row data with the new value
  const tempRowData: DependencyRowData = rowData ? { ...rowData } : {};
  tempRowData[column.id] = value;

  // Update with any current editing values
  if (editingCells) {
    Object.values(editingCells).forEach((cell) => {
      tempRowData[cell.columnId] = cell.value;
    });
  }

  for (const dependency of column.field.dependencies) {
    if (dependency.action === 'show_modal') {
      const dependsOnFields = Array.isArray(dependency.dependsOn)
        ? dependency.dependsOn
        : [dependency.dependsOn];

      // Check if all dependent fields meet the condition
      const allConditionsMet = dependsOnFields.every((fieldId) => {
        const dependentValue = tempRowData[fieldId];
        return dependency.condition(dependentValue, tempRowData);
      });

      if (allConditionsMet) {
        return {
          shouldShow: true,
          modalFields: dependency.modalFields || [],
        };
      }
    }
  }

  return { shouldShow: false };
};

// Helper function to get the maximum of two dayjs dates
const getMaxDate = (
  date1: dayjs.Dayjs | null,
  date2: dayjs.Dayjs | null
): dayjs.Dayjs | null => {
  if (!date1) return date2;
  if (!date2) return date1;
  return date1.isAfter(date2) ? date1 : date2;
};

// Helper function to get the minimum of two dayjs dates
const getMinDate = (
  date1: dayjs.Dayjs | null,
  date2: dayjs.Dayjs | null
): dayjs.Dayjs | null => {
  if (!date1) return date2;
  if (!date2) return date1;
  return date1.isBefore(date2) ? date1 : date2;
};

// Get date constraints for date fields
export const getDateConstraints = <T extends RowData>(
  column: ListTableColumn<T>,
  rowData: T,
  editingCells: MultipleEditingCells
): {
  minDate: dayjs.Dayjs | null;
  maxDate: dayjs.Dayjs | null;
  disableFuture: boolean;
} => {
  const dateConfig = column.field?.dateConfig;
  let minDate: dayjs.Dayjs | null = null;
  let maxDate: dayjs.Dayjs | null = null;
  let disableFuture = false;

  if (!dateConfig) {
    return { minDate, maxDate, disableFuture };
  }

  // Set basic constraints from config
  if (dateConfig.minDate) {
    minDate = dayjs(dateConfig.minDate);
  }

  if (dateConfig.maxDate) {
    maxDate = dayjs(dateConfig.maxDate);
  }

  disableFuture = dateConfig.disableFutureDates || false;

  // Fiscal year constraints
  if (dateConfig.fiscalYearValidation) {
    const fiscalYear = getDependentValue('fiscal_year', rowData, editingCells);
    if (fiscalYear) {
      const fyStart = dayjs(`${fiscalYear}-01-01`);
      const fyEnd = dayjs(`${fiscalYear}-12-31`);
      minDate = getMaxDate(minDate, fyStart);
      maxDate = getMinDate(maxDate, fyEnd);
    }
  }

  // Special handling for end date based on start date
  if (column.id === 'end_date') {
    const startDate = getDependentValue(
      'effective_from',
      rowData,
      editingCells
    );
    if (startDate) {
      const startDayjs = dayjs(String(startDate)).add(1, 'day'); // End date must be after start date
      minDate = getMaxDate(minDate, startDayjs);
    }
  }

  // If disableFutureDates is true, set maxDate to today (but respect fiscal year limits)
  if (disableFuture) {
    const today = dayjs();
    maxDate = getMinDate(maxDate, today);
  }

  return { minDate, maxDate, disableFuture };
};
