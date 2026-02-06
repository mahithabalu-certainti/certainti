/* eslint-disable @typescript-eslint/no-unused-vars */
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

  const extractedFields: PDFField[] = [];
  const fieldIds = new Set<string>();

  try {
    const pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // ==========================================
    // STEP 1: Extract Widget Annotations (AcroForm & Fillable PDFs)
    // This is what Chrome uses - most reliable method
    // ==========================================
    let annotationFieldCount = 0;

    for (let pageNum = 1; pageNum <= pdfjsDoc.numPages; pageNum++) {
      const page = await pdfjsDoc.getPage(pageNum);
      const annotations = await page.getAnnotations();
      const viewport = page.getViewport({ scale: 1.0 });

      if (annotations && annotations.length > 0) {
        annotations.forEach((annotation: any, index: number) => {
          try {
            // Check if this is a widget annotation (form field)
            if (annotation.subtype === 'Widget') {
              const fieldName =
                annotation.fieldName ||
                annotation.id ||
                `field_${pageNum}_${index}`;

              // Skip duplicates
              if (fieldIds.has(fieldName)) {
                return;
              }

              // Get rectangle coordinates
              const rect = annotation.rect;
              if (!rect || rect.length !== 4) {
                // Skip field with invalid rect
                return;
              }

              const [x1, y1, x2, y2] = rect;
              const width = Math.abs(x2 - x1);
              const height = Math.abs(y2 - y1);

              // Include zero-sized fields (Chrome does this)
              // Don't skip even if width/height is 0

              fieldIds.add(fieldName);
              annotationFieldCount++;

              // Determine field type from annotation properties
              let fieldType = 'Text Field';
              if (annotation.checkBox) {
                fieldType = 'Checkbox';
              } else if (annotation.radioButton) {
                fieldType = 'Radio Button';
              } else if (annotation.combo) {
                fieldType = 'Dropdown';
              } else if (annotation.listBox) {
                fieldType = 'List Box';
              } else if (annotation.pushButton) {
                fieldType = 'Button';
              } else if (annotation.fieldType) {
                // Use the fieldType if available
                switch (annotation.fieldType) {
                  case 'Tx':
                    fieldType = 'Text Field';
                    break;
                  case 'Btn':
                    fieldType = annotation.checkBox
                      ? 'Checkbox'
                      : annotation.radioButton
                        ? 'Radio Button'
                        : 'Button';
                    break;
                  case 'Ch':
                    fieldType = annotation.combo ? 'Dropdown' : 'List Box';
                    break;
                  case 'Sig':
                    fieldType = 'Signature';
                    break;
                }
              }

              // Get field value
              let defaultValue: string | undefined;
              if (
                annotation.fieldValue !== undefined &&
                annotation.fieldValue !== null
              ) {
                defaultValue = String(annotation.fieldValue);
              } else if (annotation.buttonValue !== undefined) {
                defaultValue = String(annotation.buttonValue);
              } else if (annotation.checkBox) {
                defaultValue = annotation.checkBox ? 'Checked' : 'Unchecked';
              }

              // Get possible values for dropdowns/lists
              let possibleValues: string[] | undefined;
              if (annotation.options && Array.isArray(annotation.options)) {
                possibleValues = annotation.options.map(
                  (opt: any) =>
                    opt.displayValue || opt.exportValue || String(opt)
                );
              }

              const field: PDFField = {
                id: fieldName,
                name: fieldName,
                type: fieldType,
                page: pageNum - 1, // Convert to 0-based index
                rect: [x1, y1, width, height],
                defaultValue,
                possibleValues,
                x: Math.min(x1, x2),
                y: viewport.height - Math.max(y1, y2),
                width: Math.max(width, 1), // Ensure minimum width
                height: Math.max(height, 1), // Ensure minimum height
              };

              extractedFields.push(field);
            }
          } catch (annotError) {
            console.error(
              `❌ Error processing annotation on page ${pageNum}:`,
              annotError
            );
          }
        });
      }
    }

    // ==========================================
    // STEP 2: Check for XFA Forms
    // XFA forms store data in XML format
    // ==========================================
    let xfaFieldCount = 0;

    try {
      // Note: getXfa() is not in TypeScript definitions but exists in runtime
      const xfaData = await (pdfjsDoc as any).getXfa?.();

      if (xfaData) {
        // XFA forms store data in XML format
        const xfaHtml = xfaData.html;
        if (xfaHtml) {
          // Parse XFA HTML to extract fields
          const parser = new DOMParser();
          const xfaDoc = parser.parseFromString(xfaHtml, 'text/html');
          const inputElements = xfaDoc.querySelectorAll(
            'input, textarea, select'
          );

          inputElements.forEach((element, index) => {
            const fieldName =
              element.getAttribute('name') ||
              element.getAttribute('id') ||
              `xfa_field_${index}`;

            // Skip if we already have this field
            if (fieldIds.has(fieldName)) {
              return;
            }

            fieldIds.add(fieldName);
            xfaFieldCount++;

            let fieldType = 'Text Field';
            const tagName = element.tagName.toLowerCase();
            const inputType = element.getAttribute('type')?.toLowerCase();

            if (tagName === 'textarea') {
              fieldType = 'Text Field';
            } else if (tagName === 'select') {
              fieldType = 'Dropdown';
            } else if (inputType === 'checkbox') {
              fieldType = 'Checkbox';
            } else if (inputType === 'radio') {
              fieldType = 'Radio Button';
            }

            // XFA fields don't have explicit coordinates in the same way
            // We'll use placeholder coordinates - they'll be positioned by XFA rendering
            extractedFields.push({
              id: fieldName,
              name: fieldName,
              type: fieldType,
              page: 0, // XFA forms are typically single-page or dynamically rendered
              rect: [0, 0, 100, 20],
              defaultValue: element.getAttribute('value') || undefined,
              possibleValues:
                tagName === 'select'
                  ? Array.from(element.querySelectorAll('option')).map(
                      (opt) => opt.textContent || ''
                    )
                  : undefined,
              x: 0,
              y: 0,
              width: 100,
              height: 20,
            });
          });
        }
      }
    } catch (xfaError) {
      console.error('Error extracting XFA fields:', xfaError);
    }

    // ==========================================
    // STEP 3: Use pdf-lib as fallback for AcroForm fields
    // This catches fields that pdfjs might miss
    // ==========================================
    let pdfLibFieldCount = 0;

    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      const pages = pdfDoc.getPages();

      for (const field of fields) {
        try {
          const name = field.getName();

          // Skip if we already have this field
          if (fieldIds.has(name)) {
            continue;
          }

          const widgets = (field as any).acroField.getWidgets();

          if (!widgets || widgets.length === 0) {
            // Skip field without widgets
            continue;
          }

          widgets.forEach((widget: any) => {
            try {
              const rect = widget.getRectangle();

              if (!rect) {
                // Skip widget without rectangle
                return;
              }

              // Don't skip zero-sized fields

              // Find the page this widget belongs to
              let pageNumber = 0;
              const widgetPage = widget.P();

              if (widgetPage) {
                for (let i = 0; i < pages.length; i++) {
                  const page = pages[i];
                  const pageRef = (page as any).ref;

                  if (pageRef && widgetPage.toString() === pageRef.toString()) {
                    pageNumber = i;
                    break;
                  }
                }
              }

              const page = pages[pageNumber];
              const pageHeight = page.getHeight();

              // Determine field type
              let fieldType = 'Text Field';
              const fieldObj = field as any;
              const constructorName = fieldObj.constructor.name;

              if (constructorName.includes('TextField')) {
                fieldType = 'Text Field';
              } else if (constructorName.includes('CheckBox')) {
                fieldType = 'Checkbox';
              } else if (constructorName.includes('RadioGroup')) {
                fieldType = 'Radio Button';
              } else if (constructorName.includes('Dropdown')) {
                fieldType = 'Dropdown';
              } else if (constructorName.includes('OptionList')) {
                fieldType = 'List Box';
              } else if (constructorName.includes('Button')) {
                fieldType = 'Button';
              }

              // Get default value
              let defaultValue: string | undefined;
              try {
                if (
                  'getText' in field &&
                  typeof fieldObj.getText === 'function'
                ) {
                  defaultValue = fieldObj.getText();
                } else if (
                  'isChecked' in field &&
                  typeof fieldObj.isChecked === 'function'
                ) {
                  defaultValue = fieldObj.isChecked() ? 'Checked' : 'Unchecked';
                } else if (
                  'getSelected' in field &&
                  typeof fieldObj.getSelected === 'function'
                ) {
                  defaultValue = fieldObj.getSelected().join(', ');
                }
              } catch {
                // Ignore
              }

              // Get possible values
              let possibleValues: string[] | undefined;
              try {
                if (
                  'getOptions' in field &&
                  typeof fieldObj.getOptions === 'function'
                ) {
                  possibleValues = fieldObj.getOptions();
                }
              } catch {
                // Ignore
              }

              const pdfLibField: PDFField = {
                id: name,
                name,
                type: fieldType,
                page: pageNumber,
                rect: [rect.x, rect.y, rect.width, rect.height],
                defaultValue,
                possibleValues,
                x: rect.x,
                y: pageHeight - rect.y - rect.height,
                width: Math.max(rect.width, 1),
                height: Math.max(rect.height, 1),
              };

              extractedFields.push(pdfLibField);
              fieldIds.add(name);
              pdfLibFieldCount++;
            } catch (widgetError) {
              console.error(
                `❌ Error processing widget for field "${name}":`,
                widgetError
              );
            }
          });
        } catch (fieldError) {
          console.error('❌ Error processing field:', fieldError);
        }
      }
    } catch (pdfLibError) {
      console.error('Error in pdf-lib extraction:', pdfLibError);
    }
  } catch (error) {
    console.error('Fatal error during PDF field extraction:', error);
    throw error;
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
  [key: number]: string | number;
}

interface FieldExpression {
  type: 'chip' | 'operator' | 'manual' | 'function' | 'number';
  value: string;
  functionType?: 'MIN' | 'MAX';
  functionArgs?: string[];
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
  mapping: MappingItemForValidation,
  isNonFillable = false
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

  // Validate Field ID requirement (skip for non-fillable forms)
  if (hasTarget && !hasFieldId && !isNonFillable && !hasInputValue) {
    errors.fieldIdError = 'Field ID is required when Target is specified';
  }

  // Check for pending input value (unconverted text)
  if (hasInputValue) {
    errors.targetError =
      'Invalid input in the Target field. Select an option from the dropdown, or use # for manual entry / enter a number (press Enter to add), or apply a supported operator.';
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

    // Validate function expressions and collect invalid numbers
    const invalidNumbers: string[] = [];

    for (const exp of expressions) {
      if (exp.type === 'function') {
        if (!exp.functionArgs || exp.functionArgs.length < 2) {
          errors.targetError = `${exp.functionType || 'Function'} requires at least 2 arguments`;
          return errors;
        }
      }

      // Validate number expressions - max 3 decimal places
      if (exp.type === 'number') {
        const decimalMatch = exp.value.match(/\.(\d+)$/);
        if (decimalMatch && decimalMatch[1].length > 3) {
          invalidNumbers.push(exp.value);
        }
      }
    }

    // If there are invalid numbers, show error
    if (invalidNumbers.length > 0) {
      errors.targetError =
        'Number entries have too many decimal places. Maximum of 3 decimal places allowed.';
      return errors;
    }

    // Check for consecutive operators or consecutive chips/manual entries/functions
    for (let i = 0; i < expressions.length - 1; i++) {
      const current = expressions[i];
      const next = expressions[i + 1];

      if (current.type === 'operator' && next.type === 'operator') {
        errors.targetError = 'Cannot have consecutive operators';
        return errors;
      }

      // Treat chips, manual entries, numbers, and functions the same - all need operators between them
      const isCurrentValue =
        current.type === 'chip' ||
        current.type === 'manual' ||
        current.type === 'number' ||
        current.type === 'function';
      const isNextValue =
        next.type === 'chip' ||
        next.type === 'manual' ||
        next.type === 'number' ||
        next.type === 'function';

      if (isCurrentValue && isNextValue) {
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

      // Odd indices should be object IDs (UUIDs), manual entries (starting with #), or numbers
      if (isOdd && operators.includes(String(value))) {
        errors.targetError =
          'Invalid target structure: Object ID expected at this position';
        return errors;
      }

      // Even indices should be operators
      if (isEven && !operators.includes(String(value))) {
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
