/**
 * Utility functions for reordering computed fields based on state-specific requirements
 * Supports dynamic keys using pattern matching
 */

import { log } from "console";
import { logMessage } from "./helpers";

interface FieldPattern {
    pattern: string | RegExp;
    order: number;
}

interface StateFieldConfig {
    sectionOrder: string[];
    sectionFieldOrders: { [sectionKey: string]: FieldPattern[] };
    BOLD: string[];
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
        },
        BOLD: []
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
        },
        BOLD: []
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
        },
        BOLD: []
    },
    AZ: {
        sectionOrder: [
            "Qualified research expenses paid or incurred.",
            "Part 12 Current Taxable Year's Alternative Simplified Credit Calculation- (Complete lines 75 through 93 if electing the Alternative Simplified Credit. To elect the regular credit, complete Part 2, lines 8 through 27a.)"
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
                { pattern: /^20 Multiply line 15 by \d+(\.\d+)?\s*%\s*\(\d*\.?\d+\)\. Enter the result$/, order: 10 },
                { pattern: /^Enter \d+(\.\d+)?%? of line 15$/, order: 11 },
                { pattern: "21 Enter the lesser of line 19 or line 20", order: 12 },
                { pattern: "22 Add lines 10 and 21. Enter the total", order: 13 },
                { pattern: /^\* If line 22 is \$ \d+(\,\d{3})*(\.\d+)? or less, complete line 23 and skip lines 24 through 26\.$/, order: 14 },
                { pattern: /^\* If line 22 is more than \$ \d+(\,\d{3})*(\.\d+)?, skip line 23 and complete lines 24 through 26\.$/, order: 15 },
                { pattern: /^23 Multiply line 22 by \d+(\.\d+)?\s*%\s*\(\d*\.?\d+\)\. Enter the result$/, order: 16 },
                { pattern: /^24 Subtract \$ \d+(\,\d{3})*(\.\d+)? from line 22\. Enter the difference$/, order: 17 },
                { pattern: /^25 Multiply line 24 by \d+(\.\d+)?%?\. Enter the result$/, order: 18 },
                { pattern: /^26 Add \d+(\,\d{3})*(\.\d+)? to line 25\. Enter the total$/, order: 19 },
                { pattern: "27 a If the taxpayer is electing the regular credit, enter the amount from line 23 or line 26 .", order: 20 },
                { pattern: "27 b If the taxpayer is electing the Alternative Simplified Credit, enter the amount from page", order: 21 }
            ],
            "Part 12 Current Taxable Year's Alternative Simplified Credit Calculation- (Complete lines 75 through 93 if electing the Alternative Simplified Credit. To elect the regular credit, complete Part 2, lines 8 through 27a.)": [
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
                { pattern: /^85 Subtract line 84 from line 82\. Enter the difference\. If less than zero, enter [\"\"]?0[\"\"]?\.$/, order: 11 },
                { pattern: "86 Multiply line 82 by 50% (.50). Enter the result.", order: 12 },
                { pattern: "87 Enter the lesser of line 85 or line 86.", order: 13 },
                { pattern: "88 Add line 77 and line 87. Enter the total", order: 14 },
                { pattern: /^\* If line 88 is more than \d+, skip line 89\. Complete lines 90 through 93\.$/, order: 15 },
                { pattern: /^\* If line 88 is \d+ or less, complete lines 89 and 93\. Skip lines 90 through 92\.$/, order: 16 },
                { pattern: /^89 If line 88 is \d+ or less, multiply line 88 by 24% \(\.24\)\. Enter the result\.$/, order: 17 },
                { pattern: /^90 If line 88 is more than \d+, subtract \d+ from line 88\. Enter the difference\.$/, order: 18 },
                { pattern: /^91 Multiply line 90 by  \d+(\.\d+)?%?\. Enter the result\.$/, order: 19 },
                { pattern: /^92 Add \d+(\.\d+)? to line 91\. Enter the total\. $/, order: 20 },
                { pattern: "93 Enter the amount from line 89 or 92. Also enter this amount on page 1, Part 2, line 27b of this form and complete the remainder of Form 308.", order: 21 }
            ]
        },
        BOLD: ["15 Total qualified research expenses. Add line 11 through line 14"]
    },
    CA: {
        sectionOrder: [
            "Qualified research expenses paid or incurred."
        ],
        sectionFieldOrders: {
            "Qualified research expenses paid or incurred.": [
                { pattern: "5 Wages for qualified services. See instructions", order: 1 },
                { pattern: "6 Cost of supplies. See instructions", order: 2 },
                { pattern: "7 Rental or lease costs of computers. See instructions", order: 3 },
                { pattern: "8 Enter the applicable percentage of contract research expenses (see instructions)", order: 4 },
                { pattern: "9 Total qualified research expenses. Add line 5 through line 8 ", order: 5 },
                { pattern: "10 Enter fixed-base percentage, but not more than 16% (.16). See instructions ", order: 6 },
                { pattern: "11 Enter average annual gross receipts. See instructions", order: 7 },
                { pattern: "12 Base amount. Multiply line 11 by the percentage on line 10", order: 8 },
                { pattern: "13 Subtract line 12 from line 9. If zero or less, enter -0-", order: 9 },
                { pattern: /^14 Multiply line 9 by \d+(\.\d+)?%?\. See instructions$/, order: 10 },
                { pattern: "15 Enter the smaller of line 13 or line 14", order: 11 },
                { pattern: /^16 Multiply line 15 by \d+(\.\d+)?%?$/, order: 12 },
                { pattern: "17 a Regular credit. Add line 4 and line 16. If you do not elect the reduced credit under IRC Section 280C(c), enter the result here, and see instructions for the schedule to attach", order: 13 },
                { pattern: "b Reduced regular credit under IRC Section 280C(c). Multiply line 17a by the applicable percentage below:", order: 14 },
                { pattern: /^\d+(\.\d+)?%? for individuals and estates or trusts$/, order: 15 },
                { pattern: /^\d+(\.\d+)?%? for  corporations$/, order: 16 },
                { pattern: /^\d+(\.\d+)?%? for S corporations$/, order: 17 },
                { pattern: "Enter the reduced credit amount and write Section 280C(c) on the dotted line to the left of the entry space . . . . . . . . . . . . . . . . 17b :", order: 18 }
            ]
        },
        BOLD: []
    },
    CO: {
        sectionOrder: [
            "PART IV: Research and Experimental Activities Credit"
        ],
        sectionFieldOrders: {
            "PART IV: Research and Experimental Activities Credit": [
            { pattern : "A.Enter the current year qualified expenditures", order : 1 },
            { pattern : "B.Enter the first preceding year expenditures", order : 2 },
            { pattern : "C. Enter the second preceding year expenditures", order : 3 },
            { pattern : /^D.Enter the sum of lines B and C$/, order: 4 },
            { pattern : /^E.Enter \d+(\.\d+)?%? of line D$/, order: 5 },
            { pattern : /^F.Enter line A minus line E$/, order: 6 },
            { pattern : /^G.Allowable amount: \d+(\.\d+)?%? of line F$/, order: 7 }
        ]
        },
        BOLD: []
    },
    CT: {
        sectionOrder: [
            "Part I - Credit Computation",
            "Part I - Tentative Credit Computation", 
            "Part II - Credit Computation"
        ],
        sectionFieldOrders: {
            "Part I - Credit Computation": [
                { pattern: "1 Enter the amount of Connecticut research and experimental expenditures for the current income year.", order: 1 },
                { pattern: "2 Enter the amount of Connecticut research and experimental expenditures for the first prior income year.", order: 2 },
                { pattern: "3 Balance: Subtract Line 2 from Line 1. If zero or less, the corporation is not eligible for this credit.", order: 3 },
                { pattern: /^4 Tax credit: Multiply Line 3 by \d+(\.\d+)?%\. Enter here and on Form CT-1120K,  Part I-C, Column B\.$/, order: 4 }
            ],
            "Part I - Tentative Credit Computation": [
                { pattern: "1 Enter the amount of Connecticut research and experimental expenditures for the current income year. ", order: 1 },
                { pattern: "2 Enter the amount of excess Connecticut research and experimental expenditures for the current income year.   From Form CT - 1120RC Part I, Line 3.", order: 2 },
                { pattern: "3 Balance: Subtract Line 2 from Line 1.  Net research and development expenses for 2023", order: 3 },
                { pattern: "4c All other businesses determine amount from the Tentative Credit Rate Schedule on Page 2 of form.", order: 4 },
                { pattern: "4 Tentative credit: Enter the amount from Line 4a, 4b, or 4c.", order: 5 },
                { pattern: "5 Reduction of tentative tax credit for 2024: Applicable if Line 3 exceeds $200 million and workforce is reduced.", order: 6 },
                { pattern: "6 Allowable tentative tax credit for Current Year: Subtract Line 5 from Line 4. ", order: 7 }
            ],
            "Part II - Credit Computation": [
                { pattern: "1 Allowable Tentative Tax Credit for 2024 from Part 1, line 6", order: 1 },
                { pattern: /^2 Multiply Line 1 by \.\d+$/, order: 2 },
                { pattern: "3 Current Year CT Business Tax Liability", order: 3 },
                { pattern: /^4 Multiply Line 3 by \d+(\.\d+)?%\s*\.$/, order: 4 },
                { pattern: "5a Multiply Line 1 by two (2).", order: 5 },
                { pattern: /^5b Enter \d+(\.\d+)?% \(\.\d+\) of Line 3$/, order: 6 },
                { pattern: "5 Enter the lesser of Line 5a or Line 5b", order: 7 },
                { pattern: "6 Enter the greater of Line 4 or Line 5", order: 8 },
                { pattern: "7 2024 Research and Development Expenditures tax credit: Enter the lesser of Line 2 or Line 6 here and on Form CT-1120K, Part I-C, Column B.", order: 9 }
            ]
        },
        BOLD: []
    },
    OH: {
        sectionOrder: [
            "credit_calculation"
        ],
        sectionFieldOrders: {
            "credit_calculation": [
                { pattern: "Average Investment in Qualifying Research Expenses for Three Preceding Taxable Years:", order: 1 },
                { pattern: /^Tax Year \d{4} QREs$/, order: 2 },
                { pattern: /^Tax Year \d{4} QREs$/, order: 3 },
                { pattern: /^Tax Year \d{4} QREs$/, order: 4 },
                { pattern: "Average", order: 5 },
                { pattern: /^Total Investment in Qualifying Research Expense for Calendar Year \d{4}$/, order: 6 },
                { pattern: "Average Investment in Qualifying Research Expenses for Three Preceding Calendar Years", order: 7 },
                { pattern: "Net Excess of Qualifying Research Expenses for the Taxable Year", order: 8 },
                { pattern: /^\d{4} Credit Earned \(\d+(\.\d+)?%\)$/, order: 9 }
            ]
        },
        BOLD: []
    },
    NJ: {
        sectionOrder: [
            "CREDIT CALCULATION FOR QUALIFIED RESEARCH EXPENESES (ALTERNATIVE SIMPLIFIED CREDIT METHOD)",
            "TOTAL RESEARCH AND DEVELOPMENT TAX CREDIT"
        ],
        sectionFieldOrders: {
            "CREDIT CALCULATION FOR QUALIFIED RESEARCH EXPENESES (ALTERNATIVE SIMPLIFIED CREDIT METHOD)": [
                { pattern: "16 Wages for qualified services (do not include wages used to compute the Federal Jobs Credit)", order: 1 },
                { pattern: "19 Enter the applicable percentage of contract research expenses (see instructions)", order: 2 },
                { pattern: "20 Total qualified research expenses. Add lines 16 through 19", order: 3 },
                { pattern: "21 Enter your total qualified research expenses for the prior 3 privilege periods or tax years. If you had no qualified research expenses in any one of those years, skip lines 22 and 23 and enter the amount from line 20 on line 24.", order: 4 },
                { pattern: /^22 Divide line 21 by \d+(\.\d+)?$/, order: 5 },
                { pattern: "23 Subtract line 22 from line 20. If zero or less, enter zero. Include here and on line 24.", order: 6 },
                { pattern: "24 Enter amount from line 23 or if you skipped lines 22 and 23, enter amount from line 20. ", order: 7 }
            ],
            "TOTAL RESEARCH AND DEVELOPMENT TAX CREDIT": [
                { pattern: "26 Enter either line 15 or 24 (whichever method was used for federal purposes)", order: 1 },
                { pattern: "27 Add lines 25c and 26", order: 2 },
                { pattern: /^28 Multiply line 27 by \d+(\.\d+)?%$/, order: 3 },
                { pattern: "29 Research and Development Tax Credit carried forward from prior year (do not recompute)", order: 4 },
                { pattern: "30 Total credit available - Add lines 28 and 29", order: 5 }
            ]
        },
        BOLD: []
    },
    ID: {
        sectionOrder: [
            "Basic Research Payments. Only corporations complete lines 1 through 3",
            "Qualiﬁed Research Expenses Paid or Incurred for Research Conducted in Idaho"
        ],
        sectionFieldOrders: {
            "Basic Research Payments. Only corporations complete lines 1 through 3": [
                { pattern: "Basic research payments paid or incurred during the tax year to qualiﬁed organizations", order: 1 },
                { pattern: "Qualiﬁed organization base period amount", order: 2 },
                { pattern: "Subtract line 2 from line 1. If less than zero, enter zero", order: 3 }
            ],
            "Qualiﬁed Research Expenses Paid or Incurred for Research Conducted in Idaho": [
                { pattern: "Wages for qualiﬁed services performed in Idaho", order: 1 },
                { pattern: "Cost of supplies used in Idaho", order: 2 },
                { pattern: "Rental or lease costs of computers in Idaho", order: 3 },
                { pattern: "Enter the applicable percentage of contract research expenses", order: 4 },
                { pattern: "Total qualiﬁed research expenses for research conducted in Idaho. Add lines 4 through 7 ", order: 5 },
                { pattern: "Enter ﬁxed-base percentage, but not more than 16%, from page 2, Part A or B", order: 6 },
                { pattern: "Enter average annual Idaho gross receipts from page 2, Part C", order: 7 },
                { pattern: "Base amount. Multiply line 10 by the percentage on line 9", order: 8 },
                { pattern: "Subtract line 11 from line 8. If zero or less, enter zero", order: 9 },
                { pattern: "Multiply line 8 by 50%", order: 10 },
                { pattern: "Enter the smaller amount from line 12 or line 13", order: 11 },
                { pattern: "Add lines 3 and 14 ", order: 12 },
                { pattern: "Credit earned. Multiply line 15 by 5% ", order: 13 },
                { pattern: "Pass-through share of credit from an S corporation, partnership, trust, or estate", order: 14 },
                { pattern: "Credit received through unitary sharing. Include a schedule", order: 15 },
                { pattern: "Carryover of credit for Idaho research activities from prior years", order: 16 },
                { pattern: "Credit distributed to shareholders, partners, or beneﬁciaries", order: 17 },
                { pattern: "Credit shared with unitary aﬃliates", order: 18 },
                { pattern: "Total credit available subject to limitations. Add lines 16 through 19,then subtract lines 20 and 21", order: 19 },
                { pattern: "Enter the Idaho income tax from your tax return", order: 20 },
                { pattern: "Credit for income tax paid to other states ", order: 21 },
                { pattern: "Part-year resident grocery credit ", order: 22 },
                { pattern: "Credit for contributions to Idaho educational entities", order: 23 },
                { pattern: "Investment tax credit", order: 24 },
                { pattern: "Credit for contributions to Idaho youth and rehabilitation facilities", order: 25 },
                { pattern: "Credit for production equipment using post-consumer waste", order: 26 },
                { pattern: "Promoter-sponsored event credit ", order: 27 },
                { pattern: "Add lines 24a through 24g ", order: 28 },
                { pattern: "Net income tax after allowance of other credits. Subtract line 24h from line 23", order: 29 },
                { pattern: "Total credit available subject to limitations. Enter the amount from line 22", order: 30 },
                { pattern: "Credit for Idaho research activities allowed. Enter the smaller amount from line 25 or line 26 here and on Form 44, Part I, line 4", order: 31 }
            ]
        },
        BOLD: []
    }
 
    // TODO: Add configurations for other states (GA, etc.)
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
        logMessage(`No field ordering configuration found for state: ${stateCode}`);
        return computedFields;
    }

    if (
        stateCode === "CO" &&
        config.sectionFieldOrders["computed_fields"]
    ) {
        const reordered = reorderSectionFields(
            computedFields,
            config.sectionFieldOrders["computed_fields"]
        );
        return reordered;
    }

    // 🔹 Default behavior for other states
    const reorderedFields: any = {};

    config.sectionOrder.forEach(sectionKey => {

        // Try exact match first
        let matchedSectionKey = sectionKey;
        if (computedFields[sectionKey]) {
        } else {
          
            const flexibleMatch = Object.keys(computedFields).find(fieldSection => {
              
                
                // Try different matching strategies
                const strategies = [
                    // Strategy 1: Exact match
                    () => fieldSection === sectionKey,
                    // Strategy 2: Normalized comparison
                    () => {
                        const normalizedConfig = sectionKey.trim().toLowerCase().replace(/\s+/g, ' ');
                        const normalizedField = fieldSection.trim().toLowerCase().replace(/\s+/g, ' ');
                        return normalizedConfig === normalizedField;
                    },
                    // Strategy 3: Contains key phrases
                    () => {
                        return fieldSection.includes('Part 12') && fieldSection.includes('Alternative Simplified Credit');
                    },
                    // Strategy 4: Starts with same prefix
                    () => {
                        return fieldSection.startsWith('Part 12 Current Taxable Year');
                    }
                ];
                
                for (let i = 0; i < strategies.length; i++) {
                    const strategy = strategies[i];
                    if (strategy) {
                        const result = strategy();
                        if (result) return true;
                    }
                }
                
                return false;
            });
            
            if (flexibleMatch) {
                matchedSectionKey = flexibleMatch;
            } else {
                return; // Skip this section
            }
        }
        if (!computedFields[sectionKey]) return;

        if (config.sectionFieldOrders[sectionKey]) {
            reorderedFields[sectionKey] = reorderSectionFields(
                computedFields[sectionKey],
                config.sectionFieldOrders[sectionKey]
            );
        } else {
            reorderedFields[sectionKey] = computedFields[sectionKey];
        }
        
        // Check if this section has specific field ordering requirements
        if (config.sectionFieldOrders[sectionKey]) {
            reorderedFields[matchedSectionKey] = reorderSectionFields(
                computedFields[matchedSectionKey], 
                config.sectionFieldOrders[sectionKey]
            );
        } else {
            reorderedFields[matchedSectionKey] = computedFields[matchedSectionKey];
        }
    });

    Object.keys(computedFields).forEach(sectionKey => {
        if (!reorderedFields[sectionKey] && sectionKey !== 'BOLD') {
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