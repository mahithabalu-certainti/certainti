/* eslint-disable @typescript-eslint/no-explicit-any */
import { PDFDocument } from 'pdf-lib';
import { PDFField } from '../../../types';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const COMMON_MENU_PROPS = {
  PaperProps: {
    style: {
      maxHeight: 200,
      marginTop: '4px',
    },
  },
  anchorOrigin: {
    vertical: 'bottom' as const,
    horizontal: 'left' as const,
  },
  transformOrigin: {
    vertical: 'top' as const,
    horizontal: 'left' as const,
  },
};

export const getSelectStyles = (hasError: boolean, isEmpty: boolean) => ({
  height: '26px',
  fontSize: '13px',
  fontWeight: 500,
  color: isEmpty ? '#7D98B6' : '#425A76',
  borderRadius: '2px',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: hasError ? '#EF4444' : '#CBD6E2',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: hasError ? '#EF4444' : '#CBD6E2',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: hasError ? '#EF4444' : '#3B82F6',
    borderWidth: hasError ? '1px' : '2px',
  },
  '&.Mui-disabled': {
    backgroundColor: '#F3F4F6',
  },
  backgroundColor: hasError ? '#FEF2F2' : 'white',
});

export async function extractPDFFields(file: File): Promise<PDFField[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  const pages = pdfDoc.getPages();

  const extractedFields: PDFField[] = [];

  for (const field of fields) {
    try {
      const name = field.getName();
      const widgets = (field as any).acroField.getWidgets();

      widgets.forEach((widget: any) => {
        const rect = widget.getRectangle();
        let pageNumber = 0;

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const pageRef = (page as any).ref;
          const widgetPage = widget.P();

          if (
            widgetPage &&
            pageRef &&
            widgetPage.toString() === pageRef.toString()
          ) {
            pageNumber = i;
            break;
          }
        }

        const page = pages[pageNumber];
        const pageHeight = page.getHeight();

        let fieldType = 'Unknown';
        try {
          const fieldObj = field as any;
          if (fieldObj.constructor.name.includes('TextField')) {
            fieldType = 'Text Field';
          } else if (fieldObj.constructor.name.includes('CheckBox')) {
            fieldType = 'Checkbox';
          } else if (fieldObj.constructor.name.includes('RadioGroup')) {
            fieldType = 'Radio Button';
          } else if (fieldObj.constructor.name.includes('Dropdown')) {
            fieldType = 'Dropdown';
          } else if (fieldObj.constructor.name.includes('OptionList')) {
            fieldType = 'List Box';
          } else if (fieldObj.constructor.name.includes('Button')) {
            fieldType = 'Button';
          }
        } catch {
          fieldType = 'Unknown';
        }

        let defaultValue: string | undefined;
        let possibleValues: string[] | undefined;

        try {
          if (
            'getText' in field &&
            typeof (field as any).getText === 'function'
          ) {
            defaultValue = (field as any).getText();
          } else if (
            'isChecked' in field &&
            typeof (field as any).isChecked === 'function'
          ) {
            defaultValue = (field as any).isChecked() ? 'Checked' : 'Unchecked';
          } else if (
            'getSelected' in field &&
            typeof (field as any).getSelected === 'function'
          ) {
            defaultValue = (field as any).getSelected().join(', ');
          }
        } catch {
          defaultValue = undefined;
        }

        try {
          if (
            'getOptions' in field &&
            typeof (field as any).getOptions === 'function'
          ) {
            possibleValues = (field as any).getOptions();
          }
        } catch {
          possibleValues = undefined;
        }

        extractedFields.push({
          id: name,
          name,
          type: fieldType,
          page: pageNumber,
          rect: [rect.x, rect.y, rect.width, rect.height],
          defaultValue,
          possibleValues,
          x: rect.x,
          y: pageHeight - rect.y - rect.height,
          width: rect.width,
          height: rect.height,
        });
      });
    } catch (error) {
      console.error('Error processing field:', error);
    }
  }

  return extractedFields;
}

export async function loadPDFDocument(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  return pdf;
}

// Validation function for mapping items
interface ObjectRidMap {
  [key: number]: string;
}

interface FieldExpression {
  type: 'chip' | 'operator';
  value: string;
}

interface MappingItemForValidation {
  field_id: string | null;
  calculation_config: ObjectRidMap | null;
  fieldExpressions?: FieldExpression[];
  inputValue?: string;
}

interface ValidationErrors {
  fieldIdError?: string;
  targetError?: string;
}

export function validateMappingItem(
  mapping: MappingItemForValidation
): ValidationErrors {
  const errors: ValidationErrors = {};

  // Check if there's any target content (either in calculation_config or fieldExpressions)
  const hasCalculationConfig =
    mapping.calculation_config &&
    Object.keys(mapping.calculation_config).length > 0;
  const hasFieldExpressions =
    mapping.fieldExpressions && mapping.fieldExpressions.length > 0;
  const hasInputValue = mapping.inputValue && mapping.inputValue.trim() !== '';
  const hasTarget =
    hasCalculationConfig || hasFieldExpressions || hasInputValue;
  const hasFieldId = mapping.field_id && mapping.field_id.trim() !== '';

  // Validate Field ID requirement
  if (hasTarget && !hasFieldId) {
    errors.fieldIdError = 'Field ID is required when Target is specified';
  }

  // Check for pending input value (unconverted text)
  if (hasInputValue) {
    errors.targetError =
      'Invalid text in Target. Please select from dropdown or use operators.';
    return errors;
  }

  // Validate fieldExpressions structure (this catches invalid structures that aren't in calculation_config)
  if (hasFieldExpressions && mapping.fieldExpressions) {
    const expressions = mapping.fieldExpressions;

    // Check if first item is an operator
    if (expressions.length > 0 && expressions[0].type === 'operator') {
      errors.targetError = 'Target cannot start with an operator';
      return errors;
    }

    // Check if last item is an operator
    if (
      expressions.length > 0 &&
      expressions[expressions.length - 1].type === 'operator'
    ) {
      errors.targetError = 'Target must end with an Object ID, not an operator';
      return errors;
    }

    // Check for consecutive operators or consecutive chips
    for (let i = 0; i < expressions.length - 1; i++) {
      const current = expressions[i];
      const next = expressions[i + 1];

      if (current.type === 'operator' && next.type === 'operator') {
        errors.targetError = 'Cannot have consecutive operators';
        return errors;
      }

      if (current.type === 'chip' && next.type === 'chip') {
        errors.targetError = 'Missing operator between Object IDs';
        return errors;
      }
    }
  }

  // Validate Target structure in calculation_config (for saved data)
  if (hasCalculationConfig && mapping.calculation_config) {
    const keys = Object.keys(mapping.calculation_config)
      .map(Number)
      .sort((a, b) => a - b);
    const operators = ['add', 'subtract', 'multiply', 'divide'];

    // Check if structure follows the pattern
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = mapping.calculation_config[key];
      const isOdd = key % 2 === 1;
      const isEven = key % 2 === 0;

      // Odd indices should be object IDs (UUIDs)
      if (isOdd && operators.includes(value)) {
        errors.targetError =
          'Invalid target structure: Object ID expected at this position';
        return errors;
      }

      // Even indices should be operators
      if (isEven && !operators.includes(value)) {
        errors.targetError =
          'Invalid target structure: Operator expected at this position';
        return errors;
      }
    }

    // Check if there's a complete pair (if there are 2+ items, they should alternate properly)
    if (keys.length > 1) {
      // Last key should be odd (object ID) - can't end with an operator
      const lastKey = keys[keys.length - 1];
      if (lastKey % 2 === 0) {
        errors.targetError =
          'Target must end with an Object ID, not an operator';
        return errors;
      }

      // Check for gaps in the sequence
      for (let i = 0; i < keys.length - 1; i++) {
        if (keys[i + 1] - keys[i] !== 1) {
          errors.targetError =
            'Invalid target structure: Missing operator or object ID';
          return errors;
        }
      }
    }
  }

  return errors;
}
