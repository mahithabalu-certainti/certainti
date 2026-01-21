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
    MA: {
        sectionOrder: [
            "PART 1. QUALIFIED RESEARCH EXPENSES",
            "PART 2. CREDIT DETERMINED UNDER c. 63, s. 38M(b), (ALTERNATE SIMPLIFIED METHOD)",
            "PART 3. CREDIT DETERMINED UNDER c. 63, A. 38M(a)"
        ],
        sectionFieldOrders: {
            "PART 1. QUALIFIED RESEARCH EXPENSES": [
                { pattern: "1 Qualified wage expenses for this corporation", order: 1 },
                { pattern: "2 Qualified supply expenses for this corporation", order: 2 },
                { pattern: "3 Qualified computer rental time expenses for this corporation", order: 3 },
                { pattern: /^4 Enter \d+(\.\d+)?% of qualified contract expenses for this corporation$/, order: 4 },
                { pattern: "5 Total qualified research expenses for this corporation. Add lines 1 through 4", order: 5 },
                { pattern: "6 Total qualified research expenses for this aggregate group", order: 6 }
            ],
            "PART 2. CREDIT DETERMINED UNDER c. 63, s. 38M(b), (ALTERNATE SIMPLIFIED METHOD)": [
                { pattern: "If using the Alternative Simplified Method and you did not have qualified research expenses in each of the three prior years, fill in oval Also skip lines 7 through 10", order: 1 },
                { pattern: "7 Average qualified research expenses for the 3 most recent prior years", order: 2 },
                { pattern: /^8 Enter \d+(\.\d+)?% of line 7$/, order: 3 },
                { pattern: "9 Subtract the amount on line 8 from current year expenses on line 6. Not less than 0", order: 4 },
                { pattern: "10 Applicable rate for Alternative Simplified Method", order: 5 },
                { pattern: "11 Total credit for the group. if the taxpayer did not have qualified research expenses in each of the three prior years,enter 5% of the amount on line 6; otherwise, multiply line 9 by line 10", order: 6 },
                { pattern: "12 Percentage of aggregate group credit attributable to this corporation. Line 5 divided by line 6", order: 7 },
                { pattern: "13 Amount of group credit for this corporation. Multiply line 11 by line 12", order: 8 }
            ],
            "PART 3. CREDIT DETERMINED UNDER c. 63, A. 38M(a)": [
                { pattern: "14 Fixed-base ratio (see instructions)", order: 1 },
                { pattern: "15 Average annual gross receipts from the 4 most recent taxable years", order: 2 },
                { pattern: /^16 Base amount\. Multiply line 14 by line 15\. Not less than \d+(\.\d+)?% of line 6$/, order: 3 },
                { pattern: "21 Percentage of aggregated group credit attributable to this corporation. Line 5 divided by line 6.", order: 4 }
            ]
        }
    },
    SC: {
        sectionOrder: [
            "SOUTH CAROLINA RESEARCH EXPENSES CREDIT"
        ],
        sectionFieldOrders: {
            "SOUTH CAROLINA RESEARCH EXPENSES CREDIT": [
                { pattern: "1 Qualified research expenses made in South Carolina.", order: 1 },
                { pattern: /^2 Enter \d+(\.\d+)?% of line 1\. This is your current year credit\.$/, order: 2 },
                { pattern: "3 Research Expenses Credit Carried forward from previous years (attach schedule).", order: 3 },
                { pattern: "4 Line 2 plus line 3 (Total Research Expenses Credit before limitations).", order: 4 },
                { pattern: "5 Tax Liability (income tax and license fees) before claiming credits.", order: 5 },
                { pattern: "7 Line 5 minus line 6 (If less than zero enter zero).", order: 6 },
                { pattern: /^8 Multiply line 7 by \d+(\.\d+)?%?\.$/, order: 7 },
                { pattern: "9 Enter the lesser of line 4 or line 8. (This is the amount of Research Expenses Credit you may use this year.)", order: 8 },
                { pattern: "10 Line 4 minus line 9. (Unused Research Expenses Credit can be carried forward for up to 10 years.)", order: 9 }
            ]
        }
    },
    AZ: {
        sectionOrder: [
            "Qualified research expenses paid or incurred.",
            "Alternative Simplified Credit. To elect the regular credit, complete Part 2, lines 8 through 27a.)"
        ],
        sectionFieldOrders: {
            "Qualified research expenses paid or incurred.": [
                { pattern: "11 Wages for qualified services (do not include wages used in figuring the federal work opportunity credit)", order: 1 },
                { pattern: "12 Cost of supplies", order: 2 },
                { pattern: "13 Cost to rent or lease computers", order: 3 },
                { pattern: "14 Contract research expenses: See instructions", order: 4 },
                { pattern: "15 Total qualified research expenses. Add line 11 through line 14", order: 5 },
                { pattern: "16 Average annual Arizona gross receipts: See instructions", order: 6 },
                { pattern: /^17 Fixed-base percentage \[not more than \d+(\.\d+)?%\]: See instructions$/, order: 7 },
                { pattern: "18 Base amount: Multiply line 16 by the percentage on line 17. Enter the result", order: 8 },
                { pattern: "19 Subtract line 18 from line 15. If less than zero, enter 0", order: 9 },
                { pattern: /^20 Multiply line 15 by \d+(\.\d+)?%?\. Enter the result$/, order: 10 },
                { pattern: /^Enter \d+(\.\d+)?%? of line 15$/, order: 11 },
                { pattern: "21 Enter the lesser of line 19 or line 20", order: 12 },
                { pattern: "22 Add lines 10 and 21. Enter the total", order: 13 },
                { pattern: /^\* If line 22 is \$ \d+(\,\d{3})*(\.\d+)? or less, complete line 23 and skip lines 24 through 26\.$/, order: 14 },
                { pattern: /^\* If line 22 is more than \$ \d+(\,\d{3})*(\.\d+)?, skip line 23 and complete lines 24 through 26\.$/, order: 15 },
                { pattern: "23 Multiply line 22 by 24% (.24). Enter the result", order: 16 },
                { pattern: /^24 Subtract \$ \d+(\,\d{3})*(\.\d+)? from line 22\. Enter the result$/, order: 17 },
                { pattern: /^25 Multiply line 24 by \d+(\.\d+)?%?\. Enter the result$/, order: 18 },
                { pattern: /^26 Add \d+(\,\d{3})*(\.\d+)? to line 25\. Enter the total$/, order: 19 },
                { pattern: "27 a If the taxpayer is electing the regular credit, enter the amount from line 23 or line 26 .", order: 20 },
                { pattern: "27 b If the taxpayer is electing the Alternative Simplified Credit, enter the amount from page", order: 21 }
            ],
            "Alternative Simplified Credit. To elect the regular credit, complete Part 2, lines 8 through 27a.)": [
                { pattern: "75 Basic research payments paid or incurred to qualified organizations:", order: 1 },
                { pattern: "76 Qualified organization base period amount", order: 2 },
                { pattern: "77 Subtract line 76 from line 75. Enter the difference. If less than zero, enter 0.", order: 3 },
                { pattern: "78 Current year wages for qualified services (do not include wages used in figuring the federal work opportunity credit)", order: 4 },
                { pattern: "79 Current year cost of supplies", order: 5 },
                { pattern: "80 Current year cost to rent or lease computers", order: 6 },
                { pattern: "81 Current contract research expenses: See instructions", order: 7 },
                { pattern: "82 Total research expenses for the current year: Add lines 78 through 81. Enter the total", order: 8 },
                { pattern: "83 Enter your total qualified research expenses for the prior 3 years. If you have no QREs in any one of those three years, STOP! You do not qualify for the ASC", order: 9 },
                { pattern: "84 Average qualified research expenses for the prior three years. Divide line 83 by 6.0. Enter the result", order: 10 },
                { pattern: "85 Subtract line 84 from line 82. Enter the difference. If less than zero, enter 0.", order: 11 },
                { pattern: "86 Multiply line 82 by 50% (.50). Enter the result.", order: 12 },
                { pattern: "87 Enter the lesser of line 85 or line 86.", order: 13 },
                { pattern: "88 Add line 77 and line 87. Enter the total", order: 14 },
                { pattern: /^\* If line 88 is \d+(\,\d{3})*(\.\d+)? or less, complete lines 89 and 93\. Skip lines 90 through 92\.$/, order: 15 },
                { pattern: /^\* If line 88 is more than \d+(\,\d{3})*(\.\d+)?, skip line 89\. Complete lines 90 through 93\.$/, order: 16 },
                { pattern: /^89 If line 88 is \d+(\,\d{3})*(\.\d+)? or less, multiply line 88 by 24% \(\.24\)\. Enter the result\.$/, order: 17 },
                { pattern: /^90 If line 88 is more than \d+(\,\d{3})*(\.\d+)?, subtract \d+(\,\d{3})*(\.\d+)? from line 88\. Enter the difference\.$/, order: 18 },
                { pattern: /^91 Multiply line 90 by  \d+(\.\d+)?%?\. Enter the result\.$/, order: 19 },
                { pattern: /^92 Add \d+(\,\d{3})*(\.\d+)? to line 91\. Enter the total\. $/, order: 20 },
                { pattern: "93 Enter the amount from line 89 or 92. Also enter this amount on page 1, Part 2, line 27b of this form and complete the remainder of Form 308.", order: 21 }
            ]
        }
    }

    // TODO: Add configurations for other states (GA, OH, NJ, etc.)
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