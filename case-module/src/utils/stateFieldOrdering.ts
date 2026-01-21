/**
 * Utility functions for reordering computed fields based on state-specific requirements
 * Supports dynamic keys using pattern matching
 */

interface FieldPattern {
    pattern: string | RegExp;
    order: number;
}

interface StateFieldConfig {
    sectionOrder: string[];
    sectionFieldOrders: { [sectionKey: string]: FieldPattern[] };
}

// Configuration for each state's field ordering with dynamic key support
const stateConfigurations: { [stateCode: string]: StateFieldConfig } = {
    TX: {
        sectionOrder: [
            "Qualified Research Expenses in Texas (QRET)",
             "Credit Calculation for Entities with 3 preceding periods of QRET ",
             "Credit Calculation for Entities with no QRET in one or more of the 3 preceding periods",
             "Research and Development (R&D) Activities Credit",
        ],
        sectionFieldOrders: {
            "Qualified Research Expenses in Texas (QRET)": [
                { pattern: "1a. Total QRET for the period covered by this report", order: 1 },
                { pattern: "1b. QRET under higher education contracts for the period covered by this report", order: 2 },
                { pattern: "2a. Total QRET in 1st preceding tax period", order: 3 },
                { pattern: "2b. QRET under higher education contracts for the 1st preceding tax period", order: 4 },
                { pattern: "3a. Total QRET in 2nd preceding tax period", order: 5 },
                { pattern: "3b. QRET under higher education contracts for the 2nd preceding tax period", order: 6 },
                { pattern: "4a. Total QRET in 3rd preceding tax period", order: 7 },
                { pattern: "4b. QRET under higher education contracts for the 3rd preceding tax period", order: 8 }
            ],
            "Credit Calculation for Entities with 3 preceding periods of QRET ": [
                { pattern: "5. Average QRET for preceding periods", order: 1 },
                { pattern: /^6\. Average QRET x/, order: 2 },
                { pattern: "7. Difference", order: 3 },
                { pattern: /^8\. Credit \(If amount in Item 1b is zero/, order: 4 },
                { pattern: /^9\. Credit.*If amount in Item 1b is greater than zero/, order: 5 }
            ],
            "Credit Calculation for Entities with no QRET in one or more of the 3 preceding periods": [
                { pattern: /^10\. Credit \(If amount in Item 1b is zero/, order: 1 },
                { pattern: /^11\. Credit \(If amount in Item 1b is greater than zero/, order: 2 }
            ],
            "Research and Development (R&D) Activities Credit": [
                { pattern: "12. R&D activities credit", order: 1 },
                { pattern: "13. R&D activities credit carried forward from prior years", order: 2 },
                { pattern: "14. R&D activities credit available", order: 3 }
            ]
        }
    },
 
    // TODO: Add configurations for other states (GA, OH, MA, NJ, etc.)
};

/**
 * Reorders computed fields for a specific state
 * @param stateCode - The state code (e.g., 'TX', 'CA', 'NY')
 * @param computedFields - The computed fields object to reorder
 * @returns The reordered computed fields object
 */
export function reorderComputedFieldsForState(stateCode: string, computedFields: any): any {
    const config = stateConfigurations[stateCode];
    
    if (!config) {
        // If no configuration exists for this state, return original fields
        console.log(`No field ordering configuration found for state: ${stateCode}`);
        return computedFields;
    }

    const reorderedFields: any = {};

    // First, reorder the main sections according to state config
    config.sectionOrder.forEach(sectionKey => {
        if (computedFields[sectionKey]) {
            // Check if this section has specific field ordering requirements
            if (config.sectionFieldOrders[sectionKey]) {
                reorderedFields[sectionKey] = reorderSectionFields(
                    computedFields[sectionKey], 
                    config.sectionFieldOrders[sectionKey]
                );
            } else {
                reorderedFields[sectionKey] = computedFields[sectionKey];
            }
        }
    });

    // Add any remaining sections that weren't in the configuration
    Object.keys(computedFields).forEach(sectionKey => {
        if (!reorderedFields[sectionKey]) {
            reorderedFields[sectionKey] = computedFields[sectionKey];
        }
    });

    return reorderedFields;
}

/**
 * Reorders fields within a specific section using pattern matching for dynamic keys
 * @param sectionData - The section object to reorder
 * @param fieldPatterns - Array of field patterns with order information
 * @returns The reordered section object
 */
function reorderSectionFields(sectionData: any, fieldPatterns: FieldPattern[]): any {
    const orderedSection: any = {};
    const fieldEntries: Array<{ key: string; value: any; order: number }> = [];
    
    // Match each field in sectionData to patterns and assign order
    Object.keys(sectionData).forEach(fieldKey => {
        let matchFound = false;
        
        for (const fieldPattern of fieldPatterns) {
            if (typeof fieldPattern.pattern === 'string') {
                // Exact string match
                if (fieldKey === fieldPattern.pattern) {
                    fieldEntries.push({
                        key: fieldKey,
                        value: sectionData[fieldKey],
                        order: fieldPattern.order
                    });
                    matchFound = true;
                    break;
                }
            } else if (fieldPattern.pattern instanceof RegExp) {
                // Regex pattern match
                if (fieldPattern.pattern.test(fieldKey)) {
                    fieldEntries.push({
                        key: fieldKey,
                        value: sectionData[fieldKey],
                        order: fieldPattern.order
                    });
                    matchFound = true;
                    break;
                }
            }
        }
        
        // If no pattern matched, add to end with high order number
        if (!matchFound) {
            fieldEntries.push({
                key: fieldKey,
                value: sectionData[fieldKey],
                order: 9999
            });
        }
    });
    
    // Sort by order and build the ordered section
    fieldEntries.sort((a, b) => a.order - b.order);
    fieldEntries.forEach(entry => {
        orderedSection[entry.key] = entry.value;
    });
    
    return orderedSection;
}

/**
 * Checks if a state has field ordering configuration
 * @param stateCode - The state code to check
 * @returns True if configuration exists for the state
 */
export function hasFieldOrderingConfig(stateCode: string): boolean {
    return stateCode in stateConfigurations;
}

/**
 * Gets available configured states
 * @returns Array of state codes that have field ordering configurations
 */
export function getConfiguredStates(): string[] {
    return Object.keys(stateConfigurations);
}

/**
 * Adds or updates field ordering configuration for a state
 * @param stateCode - The state code
 * @param config - The field ordering configuration
 */
export function addStateConfiguration(stateCode: string, config: StateFieldConfig): void {
    stateConfigurations[stateCode] = config;
}