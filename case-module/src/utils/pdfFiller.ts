import {
  PDFDocument,
  PDFForm,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
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

// Type definitions
interface FieldInfo {
  type: string;
  value: string | boolean | null | undefined;
  field: PDFField;
}

interface FieldMapping {
  [fieldName: string]: FieldInfo;
}

/**
 * Convert flat array to field mapping
 */
function processFieldData(data: FieldData[]): {
  [key: string]: string | boolean;
} {
  const fieldMapping: { [key: string]: string | boolean } = {};

  const normalizeValue = (value: any): string => {
    let stringValue = String(value).trim();
    if (
      (stringValue.startsWith('"') && stringValue.endsWith('"')) ||
      (stringValue.startsWith("'") && stringValue.endsWith("'"))
    ) {
      stringValue = stringValue.slice(1, -1);
    }
    if (stringValue.endsWith("%")) {
      stringValue = stringValue.slice(0, -1).trim();
    }
    return stringValue;
  };

  data.forEach((item: FieldData) => {
    const fieldId = item.value_field_id;
    const value = item.value;
    const fieldType = item.field_type;

    if (fieldId && value !== null && value !== undefined) {
      if (fieldType === "yes_no") {
        fieldMapping[fieldId] =
          normalizeValue(value).toLowerCase() === "yes";
      } else {
        fieldMapping[fieldId] = normalizeValue(value);
      }
    }
  });

  return fieldMapping;
}

/**
 * Main execution function
 */
export async function pdfFiller(
  formData: FieldData[],
  accountRid: string,
  blobUrl: string,
  accountNumber: string,
  countryCode: string,
  stateCode: string,
  caseRid: string

): Promise<string> {
  try {
    logMessage("Starting PDF form filling process...");
    // Download input PDF from Azure Blob Storage
    const parsedBlobUrl = new URL(blobUrl);
    const [containerFromUrl] = parsedBlobUrl.pathname
      .split("/")
      .filter(Boolean);
    const inputContainer = containerFromUrl;
    if(!inputContainer) {
      throw new Error("Invalid blob URL: Container name not found");
    }
    const blobName = decodeURIComponent(
      parsedBlobUrl.pathname.split("/").slice(2).join("/"),
    );
    logMessage(
      `Attempting to download PDF from container: ${inputContainer}, blob: ${blobName}`,
    );
    const inputPdfBuffer = await downloadBufferFromAzureBlob(
      inputContainer,
      blobName,
    );
    const pdfDoc: PDFDocument = await PDFDocument.load(inputPdfBuffer, {
      ignoreEncryption: true,
    });
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
    const normalizedStateCode = stateCode?.trim();
    const stateSuffix = normalizedStateCode ? `_${normalizedStateCode}` : "";
    const outputFileName = `rd_form_${countryCode}${stateSuffix}_${timestamp}.pdf`;
    const outputBlobName = `cases/${caseRid}/rdForms/${outputFileName}`;

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
      outputBlobName,
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
