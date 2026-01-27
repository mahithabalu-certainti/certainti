// Enhanced column extractor for multiple field ID formats

export interface FieldItem {
    field_id: string;
    center?: number[];
    page?: number;
    [key: string]: any;
}

export class ColumnExtractor {
    // Main function to get column field IDs
    static getColumnFieldIds(fieldsData: FieldItem[], firstRowFieldId: string): string[] {
        try {
            // Priority 1: Try Row-Index based extraction for structured tables
            // This handles cases where field names don't align (e.g. f3_02 -> f3_06) but are in the same relative position
            if (this.isTableStructure(firstRowFieldId)) {
                const rowIndexColumns = this.getRowIndexColumn(fieldsData, firstRowFieldId);
                if (rowIndexColumns.length > 0) {
                    return rowIndexColumns;
                }
            }

            // Priority 2: Position-based extraction (if coordinates available)
            const firstField = fieldsData.find(f => f.field_id === firstRowFieldId);
            if (firstField && firstField.center && firstField.center.length >= 2) {
                const positionColumns = this.getColumnByPosition(fieldsData, firstRowFieldId);
                if (positionColumns.length > 0) {
                    return positionColumns;
                }
            }

            // Priority 3: Fallback to existing pattern-based logic
            const patternType = this.identifyPattern(firstRowFieldId);

            switch (patternType) {
                case 'structured':
                    return this.getStructuredColumn(fieldsData, firstRowFieldId);
                case 'descriptive':
                    return this.getDescriptiveColumn(fieldsData, firstRowFieldId);
                case 'table':
                    return this.getTableColumn(fieldsData, firstRowFieldId);
                case 'generic':
                default:
                    return this.getGenericColumn(fieldsData, firstRowFieldId);
            }
        } catch (error) {
            console.error(`Error extracting column: ${(error as Error).message}`);
            return [];
        }
    }

    static isTableStructure(fieldId: string): boolean {
        return /(?:Row|Line)\d+/i.test(fieldId) || /\[\d+\]/.test(fieldId);
    }

    // New Strategy: Row-Index Extraction
    static getRowIndexColumn(fieldsData: FieldItem[], targetFieldId: string): string[] {
        try {
            // 1. Identify the parent container (remove the specific field part)
            const rowMatch = targetFieldId.match(/((?:Row|Line)\d+(?:\[\d+\])?)/i);
            if (!rowMatch || !rowMatch[1]) return [];

            const rowPart = rowMatch[1];
            const parts = targetFieldId.split(rowPart);
            if (parts.length < 2) return [];

            const prefix = parts[0];
            if (prefix === undefined) return [];

            // 2. Identify the specific page (if available) to limit scope
            const targetField = fieldsData.find(f => f.field_id === targetFieldId);
            const targetPage = targetField?.page;

            // 3. Group all fields by their Row/Line
            const rowGroups: { [key: string]: FieldItem[] } = {};

            fieldsData.forEach(field => {
                if (!field.field_id.startsWith(prefix)) return;
                if (targetPage !== undefined && field.page !== undefined && field.page !== targetPage) return;

                const match = field.field_id.match(/((?:Row|Line)\d+(?:\[\d+\])?)/i);
                if (match && match[1]) {
                    const rowKey = match[1];
                    if (!rowGroups[rowKey]) {
                        rowGroups[rowKey] = [];
                    }
                    rowGroups[rowKey].push(field);
                }
            });

            // 4. Sort fields in each row by X-coordinate
            Object.keys(rowGroups).forEach(key => {
                const group = rowGroups[key];
                if (group) {
                    group.sort((a, b) => {
                        const xA = a.center?.[0] ?? 0;
                        const xB = b.center?.[0] ?? 0;

                        if (Math.abs(xA - xB) < 1) {
                            return 0;
                        }
                        return xA - xB;
                    });
                }
            });

            // 5. Find the index of our target field in its row
            const targetRowKey = rowPart;
            const targetRowFields = rowGroups[targetRowKey];
            if (!targetRowFields) return [];

            const targetIndex = targetRowFields.findIndex(f => f.field_id === targetFieldId);
            if (targetIndex === -1) return [];

            // 6. Extract the field at the SAME index from ALL rows
            const columnFields: string[] = [];

            // Sort rows by their number
            const sortedRowKeys = Object.keys(rowGroups).sort((a, b) => {
                const matchA = a.match(/\d+/);
                const matchB = b.match(/\d+/);
                const numA = matchA ? parseInt(matchA[0], 10) : 0;
                const numB = matchB ? parseInt(matchB[0], 10) : 0;
                return numA - numB;
            });

            for (const key of sortedRowKeys) {
                const fields = rowGroups[key];
                if (fields && fields[targetIndex]) {
                    columnFields.push(fields[targetIndex].field_id);
                }
            }

            return columnFields;

        } catch (error) {
            console.error(`Error in Row-Index extraction: ${(error as Error).message}`);
            return [];
        }
    }


    // Identify the pattern type
    static identifyPattern(fieldId: string): string {
        // Pattern 1: Structured format with fX_XX pattern
        if (fieldId.includes('f') && /\d+_\d+/.test(fieldId) && fieldId.includes('[')) {
            return 'structured';
        }

        // Pattern 2: Descriptive format with explicit "Column X" pattern
        if (/Column\s+[A-I]/i.test(fieldId)) {
            return 'descriptive';
        }

        // Pattern 3: Table format with patterns like 1(a), 1(b), 1(c)
        if (/\(\w\)/.test(fieldId) || /column\s*\(\w\)/i.test(fieldId)) {
            return 'table';
        }

        // Pattern 4: Generic format
        return 'generic';
    }

    // Handle structured format: topmostSubform[0].Page3[0].Table_PartI[0].Row1[0].f3_01[0]
    static getStructuredColumn(fieldsData: FieldItem[], firstRowFieldId: string): string[] {
        try {
            // Parse the structured field ID
            const parts = firstRowFieldId.split('.');
            const fieldName = parts[parts.length - 1] || '';
            const fieldBase = fieldName.split('[')[0] || '';

            // Extract column number (last digits after underscore)
            const columnNumParts = fieldBase.split('_');
            const columnNum = columnNumParts.length > 0 ? columnNumParts.pop() : undefined;

            if (!columnNum) {
                return this.getGenericColumn(fieldsData, firstRowFieldId);
            }

            // Get table prefix
            const tablePrefix = parts.slice(0, -2).join('.') + '.';

            // Collect matching fields
            const columnFields: string[] = [];

            for (const field of fieldsData) {
                const fieldId = field.field_id;

                if (fieldId.startsWith(tablePrefix)) {
                    const fieldParts = fieldId.split('.');
                    const currentFieldName = fieldParts[fieldParts.length - 1] || '';
                    const currentFieldBase = currentFieldName.split('[')[0] || '';
                    const currentColParts = currentFieldBase.split('_');
                    const currentColNum = currentColParts.length > 0 ? currentColParts.pop() : undefined;

                    if (currentColNum === columnNum) {
                        columnFields.push(fieldId);
                    }
                }
            }

            // Sort by row number
            columnFields.sort((a, b) => {
                const rowAMatch = a.match(/Row(\d+)\[/);
                const rowBMatch = b.match(/Row(\d+)\[/);
                const rowA = rowAMatch ? parseInt(rowAMatch[1] || '0', 10) : 0;
                const rowB = rowBMatch ? parseInt(rowBMatch[1] || '0', 10) : 0;
                return rowA - rowB;
            });

            return columnFields;
        } catch (error) {
            console.error(`Error in structured column extraction: ${(error as Error).message}`);
            return this.getGenericColumn(fieldsData, firstRowFieldId);
        }
    }

    // Handle descriptive format: Step 3-Line 11-Column A- Expiration Date YYYY
    static getDescriptiveColumn(fieldsData: FieldItem[], firstRowFieldId: string): string[] {
        try {
            // Extract column letter
            const columnMatch = firstRowFieldId.match(/Column\s+([A-I])(?:\s*-\s*|$)/i);
            if (!columnMatch) {
                return this.getGenericColumn(fieldsData, firstRowFieldId);
            }

            const columnLetter = (columnMatch[1] || '').toUpperCase();

            // Extract step number if present
            const stepMatch = firstRowFieldId.match(/Step\s+(\d+)/i);
            const stepNumber = stepMatch ? stepMatch[1] : null;

            // Collect matching fields
            const columnFields: string[] = [];

            for (const field of fieldsData) {
                const fieldId = field.field_id;
                const currentColMatch = fieldId.match(/Column\s+([A-I])(?:\s*-\s*|$)/i);

                if (currentColMatch && (currentColMatch[1] || '').toUpperCase() === columnLetter) {
                    if (stepNumber) {
                        const currentStepMatch = fieldId.match(/Step\s+(\d+)/i);
                        if (currentStepMatch && currentStepMatch[1] === stepNumber) {
                            columnFields.push(fieldId);
                        }
                    } else {
                        columnFields.push(fieldId);
                    }
                }
            }

            // Sort by line number
            columnFields.sort((a, b) => {
                const matchA = a.match(/Line\s+(\d+)/i);
                const matchB = b.match(/Line\s+(\d+)/i);
                const lineA = matchA ? parseInt(matchA[1] || "0", 10) : 0;
                const lineB = matchB ? parseInt(matchB[1] || "0", 10) : 0;
                return lineA - lineB;
            });

            return columnFields;
        } catch (error) {
            console.error(`Error in descriptive column extraction: ${(error as Error).message}`);
            return this.getGenericColumn(fieldsData, firstRowFieldId);
        }
    }

    // Handle table format: Part III, Line 1(a). Corporation
    static getTableColumn(fieldsData: FieldItem[], firstRowFieldId: string): string[] {
        try {
            // Extract column identifier (like "a", "b", "c" from 1(a), 1(b), etc.)
            const columnMatch = firstRowFieldId.match(/\((\w)\)/);
            if (!columnMatch) {
                return this.getGenericColumn(fieldsData, firstRowFieldId);
            }

            const columnLetter = (columnMatch[1] || '').toLowerCase(); // a, b, c, etc.

            // Extract line/row context (like "Line 1", "Line 2", etc.)
            const lineMatch = firstRowFieldId.match(/(?:Line|Row)\s+(\d+)/i);
            const lineContext = lineMatch ? lineMatch[0] : null;

            // Extract part/section context
            const partMatch = firstRowFieldId.match(/(?:Part|Section)\s+[IVXLC\d]+/i);
            const partContext = partMatch ? partMatch[0] : null;

            // Build context string for filtering
            const context: string[] = [];
            if (partContext) context.push(partContext);
            if (lineContext) context.push(lineContext);

            // Collect matching fields
            const columnFields: string[] = [];

            for (const field of fieldsData) {
                const fieldId = field.field_id;

                // Check if field has the same column letter in parentheses
                const fieldColMatch = fieldId.match(/\((\w)\)/);
                if (fieldColMatch && (fieldColMatch[1] || '').toLowerCase() === columnLetter) {

                    // Check context if available
                    let contextMatches = true;
                    if (context.length > 0) {
                        for (const ctx of context) {
                            if (!fieldId.includes(ctx)) {
                                contextMatches = false;
                                break;
                            }
                        }
                    }

                    if (contextMatches) {
                        columnFields.push(fieldId);
                    }
                }
            }

            // Sort by line number if possible
            columnFields.sort((a, b) => {
                try {
                    const lineA = this.extractLineNumber(a);
                    const lineB = this.extractLineNumber(b);
                    return lineA - lineB;
                } catch {
                    return a.localeCompare(b);
                }
            });

            return columnFields;
        } catch (error) {
            console.error(`Error in table column extraction: ${(error as Error).message}`);
            return this.getGenericColumn(fieldsData, firstRowFieldId);
        }
    }

    // Generic fallback method
    static getGenericColumn(fieldsData: FieldItem[], firstRowFieldId: string): string[] {
        try {
            // Try to extract the last part as identifier
            const parts = firstRowFieldId.split(/[.,\s-]+/).filter(p => p);
            const lastPart = parts[parts.length - 1] || '';

            // Look for fields with similar ending pattern
            const columnFields: string[] = [];

            for (const field of fieldsData) {
                const fieldId = field.field_id;
                const fieldParts = fieldId.split(/[.,\s-]+/).filter(p => p);
                const fieldLastPart = fieldParts[fieldParts.length - 1] || '';

                if (fieldLastPart && fieldLastPart === lastPart) {
                    columnFields.push(fieldId);
                }
            }

            // Sort if possible
            columnFields.sort((a, b) => {
                try {
                    const matchA = a.match(/\d+/g);
                    const matchB = b.match(/\d+/g);
                    const numA = matchA ? parseInt(matchA[0], 10) : 0;
                    const numB = matchB ? parseInt(matchB[0], 10) : 0;
                    return numA - numB;
                } catch {
                    return a.localeCompare(b);
                }
            });

            return columnFields;
        } catch (error) {
            console.error(`Error in generic column extraction: ${(error as Error).message}`);
            return [];
        }
    }

    // Helper to extract line number
    static extractLineNumber(fieldId: string): number {
        const lineMatch = fieldId.match(/(?:Line|Row)\s+(\d+)/i);
        return lineMatch ? parseInt(lineMatch[1] || '0', 10) : 0;
    }

    // Alternative: Extract by column position based on center coordinates
    static getColumnByPosition(fieldsData: FieldItem[], firstRowFieldId: string, tolerance: number = 20): string[] {
        try {
            // Find the first field
            const firstField = fieldsData.find(f => f.field_id === firstRowFieldId);
            if (!firstField || !firstField.center || firstField.center.length < 2) {
                return [];
            }

            const firstX = firstField.center[0] || 0;
            const targetPage = firstField.page;


            // Find fields with similar X coordinates (within tolerance) AND same page
            const columnFields = fieldsData
                .filter(field => {
                    // Check page if available
                    if (targetPage !== undefined && field.page !== undefined && field.page !== targetPage) return false;

                    if (!field.center || field.center.length < 2) return false;
                    const currentX = field.center[0] || 0;
                    return Math.abs(currentX - firstX) <= tolerance;
                })
                .map(field => field.field_id);

            // Sort by Y coordinate (top to bottom)
            columnFields.sort((a, b) => {
                const fieldA = fieldsData.find(f => f.field_id === a);
                const fieldB = fieldsData.find(f => f.field_id === b);

                const yA = fieldA && fieldA.center && fieldA.center.length > 1 ? (fieldA.center[1] || 0) : 0;
                const yB = fieldB && fieldB.center && fieldB.center.length > 1 ? (fieldB.center[1] || 0) : 0;
                return yB - yA; // Sort Descending to handle top-to-bottom for this coordinate system
            });

            return columnFields;
        } catch (error) {
            console.error(`Error in position-based extraction: ${(error as Error).message}`);
            return [];
        }
    }
}