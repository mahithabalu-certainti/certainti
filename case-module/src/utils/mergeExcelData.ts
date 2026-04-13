import ExcelJS from "exceljs";

export async function mergeExcelsToSingleFile(
  countryBase64: string,
  stateBase64: string
): Promise<string> {
  const finalWb = new ExcelJS.Workbook();

  // ─── Helper to load base64 into workbook ───
  const loadWorkbook = async (base64: string) => {
    const wb = new ExcelJS.Workbook();
    const buffer = Buffer.from(base64, "base64");
    // ✅ Convert to ArrayBuffer (this avoids ALL TS issues)
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    await wb.xlsx.load(arrayBuffer);
    return wb;
  };

  const copySheets = (sourceWb: ExcelJS.Workbook, sheetName: string) => {
    const sourceSheet = sourceWb.worksheets[0]; // assuming 1 sheet
    const newSheet = finalWb.addWorksheet(sheetName);
    if (!sourceSheet) return;

    // Copy column widths
    sourceSheet.columns.forEach((col, i) => {
      newSheet.getColumn(i + 1).width = col.width;
    });

    // Copy rows + styles
    sourceSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const newRow = newSheet.getRow(rowNumber);

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const newCell = newRow.getCell(colNumber);

        newCell.value = cell.value;

        // Copy styles
        newCell.style = { ...cell.style };

        // Copy border explicitly (important)
        if (cell.border) {
          newCell.border = cell.border;
        }

        if (cell.fill) {
          newCell.fill = cell.fill;
        }

        if (cell.font) {
          newCell.font = cell.font;
        }

        if (cell.alignment) {
          newCell.alignment = cell.alignment;
        }

        if (cell.numFmt) {
          newCell.numFmt = cell.numFmt;
        }
      });
    });
    if (sourceSheet.model?.merges) {
      sourceSheet.model.merges.forEach((mergeRange: string) => {
        newSheet.mergeCells(mergeRange);
      });
    }
  };

  // ─── Load both workbooks ───
  if (countryBase64) {
    const countryWb = await loadWorkbook(countryBase64);
    copySheets(countryWb, "Federal - CAN");
  }

  if (stateBase64) {
    const stateWb = await loadWorkbook(stateBase64);
    copySheets(stateWb, "State - ON");
  }

  // ─── Return merged file ───
  const buffer = await finalWb.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}