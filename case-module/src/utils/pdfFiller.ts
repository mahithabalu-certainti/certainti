import {
  PDFDocument,
  PDFForm,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFField,
} from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { FieldData } from "./types";
import {
  downloadBufferFromAzureBlob,
  logMessage,
  uploadBufferToAzureBlob,
} from "./helpers";
import { BlobServiceClient } from "@azure/storage-blob";

// Type definitions
interface FieldInfo {
  type: string;
  value: string | boolean | null | undefined;
  field: PDFField;
}

interface FieldMapping {
  [fieldName: string]: FieldInfo;
}

// JSON data is always a flat array
type JsonData = FieldData[];

/**
 * Convert flat array to field mapping
 */
function processFieldData(data: FieldData[]): {
  [key: string]: string | boolean;
} {
  const fieldMapping: { [key: string]: string | boolean } = {};

  data.forEach((item: FieldData) => {
    const fieldId = item.value_field_id;
    const value = item.value;
    const fieldType = item.field_type;

    if (fieldId && value !== null && value !== undefined) {
      if (fieldType === "yes_no") {
        fieldMapping[fieldId] = String(value).toLowerCase() === "yes";
      } else {
        fieldMapping[fieldId] = String(value);
      }
    }
  });

  return fieldMapping;
}

/**
 * Extract all form fields from PDF for debugging
 * @param pdfPath - Path to the PDF file
 * @returns Object containing field information
 */
async function extractFormFields(pdfPath: string): Promise<FieldMapping> {
  try {
    const pdfBytes: Buffer = await fs.readFile(pdfPath);
    const pdfDoc: PDFDocument = await PDFDocument.load(pdfBytes);
    const form: PDFForm = pdfDoc.getForm();
    const fields: FieldMapping = {};

    // Get all form fields
    const formFields: PDFField[] = form.getFields();

    formFields.forEach((field: PDFField) => {
      const fieldName: string = field.getName();
      let fieldType: string = "unknown";
      let currentValue: string | boolean | null = null;

      // Determine field type and get current value using type guards
      try {
        if (field instanceof PDFTextField) {
          fieldType = "text";
          currentValue = (field as PDFTextField).getText() || null;
        } else if (field instanceof PDFCheckBox) {
          fieldType = "checkbox";
          currentValue = (field as PDFCheckBox).isChecked();
        } else if (field instanceof PDFRadioGroup) {
          fieldType = "radio";
          currentValue = (field as PDFRadioGroup).getSelected() || null;
        } else if (field.constructor.name === "PDFDropdown") {
          fieldType = "dropdown";
          currentValue = (field as any).getSelected?.() || null;
        }
      } catch (typeError: any) {
        console.warn(
          `⚠️ Error reading field ${fieldName}: ${typeError.message}`,
        );
      }

      fields[fieldName] = {
        type: fieldType,
        value: currentValue,
        field: field,
      };
    });
    return fields;
  } catch (error) {
    console.error("Error extracting form fields:", error);
    throw error;
  }
}

/**
 * Fill PDF form fields using data from JSON array
 * @param inputPdf - Path to unfilled PDF template
 * @param jsonData - Flat array of field data
 * @param outputPdf - Path for output filled PDF
 * @returns Path to the filled PDF
 */
async function fillPdfFromData(
  inputPdf: string,
  jsonData: FieldData[],
  outputPdf: string,
): Promise<string> {
  try {
    // Validate that it's an array
    if (!Array.isArray(jsonData)) {
      throw new Error("JSON data must be a flat array of field objects");
    }

    // Process field data
    const fieldMapping = processFieldData(jsonData);
    // Load PDF
    const pdfBytes: Buffer = await fs.readFile(inputPdf);
    const pdfDoc: PDFDocument = await PDFDocument.load(pdfBytes);
    const form: PDFForm = pdfDoc.getForm();

    // Fill the fields
    let filledCount: number = 0;
    for (const [fieldName, fieldValue] of Object.entries(fieldMapping)) {
      try {
        // Try to get the field
        const field: PDFField | undefined = form.getFieldMaybe(fieldName);

        if (field) {
          if (field instanceof PDFTextField) {
            (field as PDFTextField).setText(String(fieldValue));
            filledCount++;
          } else if (field instanceof PDFCheckBox) {
            const checkboxField = field as PDFCheckBox;
            if (typeof fieldValue === "boolean") {
              if (fieldValue) {
                checkboxField.check();
              } else {
                checkboxField.uncheck();
              }
            } else {
              // Handle string values for checkboxes
              const boolValue =
                String(fieldValue).toLowerCase() === "true" ||
                String(fieldValue).toLowerCase() === "yes" ||
                String(fieldValue) === "1";
              if (boolValue) {
                checkboxField.check();
              } else {
                checkboxField.uncheck();
              }
            }
            filledCount++;
          } else if (field instanceof PDFRadioGroup) {
            try {
              (field as PDFRadioGroup).select(String(fieldValue));
              filledCount++;
            } catch (radioError: any) {
              console.warn(
                `⚠️ Could not set radio value for ${fieldName}: ${radioError.message}`,
              );
            }
          } else if (field.constructor.name === "PDFDropdown") {
            try {
              (field as any).select(String(fieldValue));
              filledCount++;
            } catch (dropdownError: any) {
              console.warn(
                `⚠️ Could not set dropdown value for ${fieldName}: ${dropdownError.message}`,
              );
            }
          }
        } else {
          console.warn(`⚠️ Field not found: ${fieldName}`);
        }
      } catch (fieldError: any) {
        console.warn(
          `⚠️ Error filling field ${fieldName}: ${fieldError.message}`,
        );
      }
    }

    console.log(`✅ Successfully filled ${filledCount} fields`);

    // Force form field appearances to be generated
    form.updateFieldAppearances();

    // Save the filled PDF
    const pdfBytesOut = await pdfDoc.save();
    await fs.writeFile(outputPdf, pdfBytesOut);

    return outputPdf;
  } catch (error) {
    console.error("Error filling PDF:", error);
    throw error;
  }
}

/**
 * Debug function to see all available form fields
 * @param pdfPath - Path to the PDF file
 * @returns Object containing field information
 */
async function debugFormFields(pdfPath: string): Promise<FieldMapping> {
  const fields: FieldMapping = await extractFormFields(pdfPath);
  return fields;
}

/**
 * Validate that all fields in JSON data exist in PDF
 * @param inputPdf - Path to the PDF file
 * @param jsonData - Flat array of field data
 * @returns Array of missing field IDs
 */
async function validateDataMapping(
  inputPdf: string,
  jsonData: FieldData[],
): Promise<string[]> {
  try {
    // Validate that it's an array
    if (!Array.isArray(jsonData)) {
      throw new Error("JSON data must be a flat array of field objects");
    }

    // Get PDF fields
    const pdfFields: FieldMapping = await extractFormFields(inputPdf);

    // Collect all field IDs from flat array
    const jsonFieldIds: Set<string> = new Set<string>();

    jsonData.forEach((item: FieldData) => {
      if (item.value_field_id) {
        jsonFieldIds.add(item.value_field_id);
      }
    });

    // Check for missing fields
    const missingFields: string[] = [];
    jsonFieldIds.forEach((fieldId) => {
      if (!(fieldId in pdfFields)) {
        missingFields.push(fieldId);
      }
    });

    if (missingFields.length > 0) {
      console.log("⚠️  WARNING: Some JSON fields not found in PDF:");
      missingFields.forEach((fieldId) => {
        console.log(`   - ${fieldId}`);
      });
    } else {
      console.log("✅ All JSON fields found in PDF");
    }

    return missingFields;
  } catch (error) {
    console.error("Error validating JSON mapping:", error);
    throw error;
  }
}

// uploadToAzureBlob is now imported from helpers.ts

/**
 * Main execution function
 */
export async function pdfFiller(
  formData: FieldData[],
  accountRid: string,
  blobUrl: string,
  accountNumber: string,
): Promise<string> {
  try {
    logMessage("Starting PDF form filling process...");
    // Download input PDF from Azure Blob Storage
    let inputContainer = "d001-e66380cd-d24c-4581-8e29-07ada063acdb";
    let burl = new URL(blobUrl);
    const blobName = decodeURIComponent(
      burl.pathname.split("/").slice(2).join("/"),
    );
    logMessage(
      `Attempting to download PDF from container: ${inputContainer}, blob: ${blobName}`,
    );
    const inputPdfBuffer = await downloadBufferFromAzureBlob(
      inputContainer,
      blobName,
    );
    const pdfDoc: PDFDocument = await PDFDocument.load(inputPdfBuffer);
    const form: PDFForm = pdfDoc.getForm();
    const allFields = form.getFields();
    const fieldMapping = processFieldData(formData);
    let filledCount = 0;
    for (const [fieldName, fieldValue] of Object.entries(fieldMapping)) {
      try {
        const field: PDFField | undefined = form.getFieldMaybe(fieldName);
        if (field) {
          logMessage(`Filling field: ${fieldName} with value: ${fieldValue}`);

          // Handle null values - fill with blank/empty
          if (fieldValue === null || fieldValue === undefined) {
            if (field instanceof PDFTextField) {
              (field as PDFTextField).setText("");
              filledCount++;
            } else if (field instanceof PDFCheckBox) {
              (field as PDFCheckBox).uncheck();
              filledCount++;
            } else if (field instanceof PDFRadioGroup) {
              // For radio groups, we can't easily clear selection, so skip
              logMessage(`Skipping null value for radio field: ${fieldName}`);
            } else if (field.constructor.name === "PDFDropdown") {
              // For dropdowns, we can't easily clear selection, so skip
              logMessage(
                `Skipping null value for dropdown field: ${fieldName}`,
              );
            }
          } else if (field instanceof PDFTextField) {
            (field as PDFTextField).setText(String(fieldValue));
            filledCount++;
          } else if (field instanceof PDFCheckBox) {
            const checkboxField = field as PDFCheckBox;
            if (typeof fieldValue === "boolean") {
              if (fieldValue) {
                checkboxField.check();
              } else {
                checkboxField.uncheck();
              }
            } else {
              const boolValue =
                String(fieldValue).toLowerCase() === "true" ||
                String(fieldValue).toLowerCase() === "yes" ||
                String(fieldValue) === "1";
              if (boolValue) {
                checkboxField.check();
              } else {
                checkboxField.uncheck();
              }
            }
            filledCount++;
          } else if (field instanceof PDFRadioGroup) {
            try {
              (field as PDFRadioGroup).select(String(fieldValue));
              filledCount++;
            } catch (e) {
              logMessage(`Error selecting radio value for ${fieldName}: ${e}`);
            }
          } else if (field.constructor.name === "PDFDropdown") {
            try {
              (field as any).select(String(fieldValue));
              filledCount++;
            } catch (e) {
              logMessage(
                `Error selecting dropdown value for ${fieldName}: ${e}`,
              );
            }
          }
        } else {
          logMessage(`Field not found in PDF: ${fieldName}`);
        }
      } catch (err) {
        logMessage(`Error filling field ${fieldName}: ${err}`);
      }
    }
    logMessage(`Total fields filled: ${filledCount}`);
    form.updateFieldAppearances();
    const pdfBytesOut = await pdfDoc.save();
    const timestamp = Date.now();
    const outputFileName = `filled_form_${timestamp}.pdf`;

    // Save to local file for testing purposes
    /*const timestamp = Date.now();
        const outputFileName = `filled_form_${timestamp}.pdf`;
        const outputPath = path.join(process.cwd(), 'output', outputFileName);
        
        // Ensure output directory exists
        await fs.mkdir(path.join(process.cwd(), 'output'), { recursive: true });
        
        // Write PDF to local file
        await fs.writeFile(outputPath, pdfBytesOut);
        logMessage(`PDF saved locally to: ${outputPath}`); */

    // TODO: Uncomment for production - upload to Azure Blob
    const url = await uploadBufferToAzureBlob(
      Buffer.from(pdfBytesOut),
      outputFileName,
      accountNumber.toLowerCase(),
    );
    logMessage(`PDF uploaded to Azure Blob: ${url}`);
    return url;

    // return outputPath;
  } catch (error: any) {
    logMessage(`❌ Error in main process: ${error.message}`);
    console.log(error);
    throw error;
  }
}

/**
 * Simple one-line function to fill PDF from data
 * @param inputPdfPath - Path to input PDF
 * @param fieldData - Flat array of field data
 * @param outputPdfPath - Path to output PDF
 * @returns Path to the filled PDF
 */
async function fillPdfSimple(
  inputPdfPath: string,
  fieldData: FieldData[],
  outputPdfPath: string,
): Promise<string> {
  return await fillPdfFromData(inputPdfPath, fieldData, outputPdfPath);
}
