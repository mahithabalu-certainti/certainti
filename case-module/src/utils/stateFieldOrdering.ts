/**
 * Utility functions for reordering computed fields based on state-specific requirements
 * Supports dynamic keys using pattern matching
 */

import { logMessage } from "./helpers";

interface FieldPattern {
    pattern: string | RegExp;
    order: number;
}

interface StateFieldConfig {
    hasFieldOrderingConfig?: boolean;
    sectionOrder: string[];
    sectionFieldOrders: { [sectionKey: string]: FieldPattern[] };
    BOLD: string[];
}

// Configuration for each state's field ordering with dynamic key support
const stateConfigurations: { [stateCode: string]: StateFieldConfig } = {
    GA: {
        sectionOrder: [
            "Input Information",
            "tables",
            "Application of Credit and Carry-Forward"
        ],
        sectionFieldOrders: {
            "Input Information": [
                { pattern: "Current Year Georgia Gross Receipts (A)", order: 1 },
                { pattern: "Current Year Research Expenses in Georgia (B)", order: 2 },
                { pattern: "Total of all other credits (C)", order: 3 },
                { pattern: "Credit carry-over from PY (D)", order: 4 },
                { pattern: "Current Tax Liability Without Credits (E)", order: 5 }
            ],
            tables: [
                { pattern: "Ratio Calculation", order: 1 },
                { pattern: "Calculation of Average", order: 2 },
                { pattern: "Calculation of Tax Base", order: 3 },
                { pattern: "Calculation of Tax Credit", order: 4 }
            ],
            "Ratio Calculation": [
                { pattern: "table_headers", order: 1 },
                { pattern: "table_rows", order: 2 },
                { pattern: "Total", order: 3 }
            ],
            "Calculation of Average": [
                { pattern: "table_headers", order: 1 },
                { pattern: "table_rows", order: 2 }
            ],
            "Calculation of Tax Base": [
                { pattern: "table_headers", order: 1 },
                { pattern: "table_rows", order: 2 }
            ],
            "Calculation of Tax Credit": [
                { pattern: "table_headers", order: 1 },
                { pattern: "table_rows", order: 2 }
            ],
            "Application of Credit and Carry-Forward": [
                { pattern: "[1] Current Tax Liability w/o applied credits - E", order: 1 },
                { pattern: "[2] Value of all Other Credits Claimed - C", order: 2 },
                { pattern: "[3] Remaining Tax Liability (C-E)", order: 3 },
                { pattern: /^\[4\] Maximum Credit Allowed \(Line 3 \* \d+(\.\d+)?%\)$/, order: 4 },
                { pattern: "[5] Research Tax Credit - J", order: 5 },
                { pattern: "[5a] Tax Carryover from PY - D", order: 6 },
                { pattern: "[6] Total available Research Tax Credit (J+D)", order: 7 },
                { pattern: "[7] Credit to be claimed on return  (lesser of line 4 or 6)", order: 8 },
                { pattern: "[8] Unused Credit or Carry-Forward", order: 9 }
            ]
        },
        BOLD: []
    },
    TX: {
        sectionOrder: [
            "Qualified Research Expenses in Texas (QRET)",
             "Credit Calculation for Entities with 3 preceding periods of QRET ",
             "Credit Calculation for Entities with no QRET in one or more of the 3 preceding periods",
             "Research and Development (R&D) Activities Credit",
        ],
        sectionFieldOrders: {
        "Qualified Research Expenses in Texas (QRET)": [
            { pattern: /^\[1a\]\s*Total QRET for the period covered by this report$/, order: 1 },
            { pattern: /^\[1b\]\s*QRET under higher education contracts for the period covered by this report$/, order: 2 },
            { pattern: /^\[2a\]\s*Total QRET in 1st preceding tax period$/, order: 3 },
            { pattern: /^\[2b\]\s*QRET under higher education contracts for the 1st preceding tax period$/, order: 4 },
            { pattern: /^\[3a\]\s*Total QRET in 2nd preceding tax period$/, order: 5 },
            { pattern: /^\[3b\]\s*QRET under higher education contracts for the 2nd preceding tax period$/, order: 6 },
            { pattern: /^\[4a\]\s*Total QRET in 3rd preceding tax period$/, order: 7 },
            { pattern: /^\[4b\]\s*QRET under higher education contracts for the 3rd preceding tax period$/, order: 8 }
        ],

        "Credit Calculation for Entities with 3 preceding periods of QRET ": [
            { pattern: /^\[5\]\s*Average QRET for preceding periods$/, order: 1 },
            { pattern: /^\[6\]\s*Average QRET x/i, order: 2 },
            { pattern: /^\[7\]\s*Difference$/, order: 3 },
            { pattern: /^\[8\]\s*Credit\s*\(If amount in Item 1b is zero, multiply Item 7 by .*/i, order: 4 },
            { pattern: /^\[9\]\s*Credit\s*\(If amount in Item 1b is greater than zero, multiply Item 7 by .*/i, order: 5 }
        ],

        "Credit Calculation for Entities with no QRET in one or more of the 3 preceding periods": [
            { pattern: /^\[10\]\s*Credit \(If amount in Item 1b is zero/i, order: 1 },
            { pattern: /^\[11\]\s*Credit \(If amount in Item 1b is greater than zero/i, order: 2 }
        ],

        "Research and Development (R&D) Activities Credit": [
            { pattern: /^\[12\]\s*R&D activities credit$/, order: 1 },
            { pattern: /^\[13\]\s*R&D activities credit carried forward from prior years$/, order: 2 },
            { pattern: /^\[14\]\s*R&D activities credit available$/, order: 3 }
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
            { pattern: /^\[1\]\s*Qualified wage expenses for this corporation/, order: 1 },
            { pattern: /^\[2\]\s*Qualified supply expenses for this corporation/, order: 2 },
            { pattern: /^\[3\]\s*Qualified computer rental time expenses for this corporation/, order: 3 },
            { pattern: /^\[4\]\s*Enter \d+(\.\d+)?% of qualified contract expenses for this corporation$/, order: 4 },
            { pattern: /^\[5\]\s*Total qualified research expenses for this corporation\. Add lines 1 through 4/, order: 5 },
            { pattern: /^\[6\]\s*Total qualified research expenses for this aggregate group/, order: 6 }
            ],

            "PART 2. CREDIT DETERMINED UNDER c. 63, s. 38M(b), (ALTERNATE SIMPLIFIED METHOD)": [
            { pattern: /^text$/, order: 1 },

            { pattern: /^\[7\]\s*Average qualified research expenses for the 3 most recent prior years/, order: 2 },

            { pattern: /^\[8\]\s*Enter \d+(\.\d+)?% of line 7$/, order: 3 },

            {
                pattern:
                /^\[9\]\s*Subtract the amount on line 8 from current year expenses on line 6\. Not less than 0/,
                order: 4
            },

            { pattern: /^\[10\]\s*Applicable rate for Alternative Simplified Method/, order: 5 },

            {
                pattern:
                /^\[11\]\s*Total credit for the group\. if the taxpayer did not have qualified research expenses in each of the three prior years,enter 5% of the amount on line 6; otherwise, multiply line 9 by line 10/,
                order: 6
            },

            {
                pattern:
                /^\[12\]\s*Percentage of aggregate group credit attributable to this corporation\. Line 5 divided by line 6/,
                order: 7
            },

            {
                pattern:
                /^\[13\]\s*Amount of group credit for this corporation\. Multiply line 11 by line 12/,
                order: 8
            }
            ],

           "PART 3. CREDIT DETERMINED UNDER c. 63, A. 38M(a)": [
            { pattern: /^\[14\]\s*Fixed-base ratio \(see instructions\)/, order: 1 },

            {
                pattern:
                /^\[15\]\s*Average annual gross receipts from the 4 most recent taxable years/,
                order: 2
            },

            {
                pattern:
                /^\[16\]\s*Base amount\. Multiply line 14 by line 15\. Not less than \d+(\.\d+)?% of line 6$/,
                order: 3
            },

            {
                pattern:
                /^\[17\]\s*Subtract line 16 from current year expenses on line 6\. Not less than 0/,
                order: 4
            },

            {
                pattern:
                /^\[18\]\s*Total group credit for qualified research expenses\. Multiply line 17 by \d+(\.\d+)?%$/,
                order: 5
            },

            {
                pattern:
                /^\[19\]\s*Total group credit for basic research payments \(see instructions\)/,
                order: 6
            },

            {
                pattern:
                /^\[20\]\s*Total Research Credit for aggregate group\. Combine line 18 and 19/,
                order: 7
            },

            {
                pattern:
                /^\[21\]\s*Percentage of aggregated group credit attributable to this corporation\. Line 5 divided by line 6\./,
                order: 8
            },

            {
                pattern:
                /^\[22\]\s*Amount of credit for this corporation\. Multiply line 20 by line 21\./,
                order: 9
            }
            ]
        },
        BOLD: []
    },
    SC: {
        sectionOrder: [
            "yesSpilt"
        ],
        sectionFieldOrders: {
            "yesSpilt": [
                { pattern: /^\[1\] Qualified research expenses made in South Carolina\.$/, order: 1 },
                { pattern: /^\[2\] Enter .+% of line 1\. This is your current year credit\.$/, order: 2 },
                { pattern: /^\[3\] Research Expenses Credit Carried forward from previous years \(attach schedule\)\.$/, order: 3 },
                { pattern: /^\[4\] Line 2 plus line 3 \(Total Research Expenses Credit before limitations\)\.$/, order: 4 },
                { pattern: /^\[5\] Tax Liability \(income tax and license fees\) before claiming credits\.$/, order: 5 },
                { pattern: /^\[6\] Total of all credits other than the Research Expenses Credit$/, order: 6 },
                { pattern: /^\[7\] Line 5 minus line 6 \(If less than zero enter zero\)\.$/, order: 7 },
                { pattern: /^\[8\] Multiply line 7 by .+\.$/, order: 8 },
                { pattern: /^\[9\] Enter the lesser of line 4 or line 8\. \(This is the amount of Research Expenses Credit you may use this year\.\)$/, order: 9 },
                { pattern: /^\[10\] Line 4 minus line 9\. \(Unused Research Expenses Credit can be carried forward for up to 10 years\.\)$/, order: 10 }
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
        { pattern: /^\[11\] Wages for qualified services/, order: 11 },
        { pattern: /^\[12\] Cost of supplies/, order: 12 },
        { pattern: /^\[13\] Cost to rent or lease computers/, order: 13 },
        { pattern: /^\[14\] Contract research expenses/, order: 14 },
        { pattern: /^\[15\] Total qualified research expenses/, order: 15 },
        { pattern: /^\[16\] Average annual Arizona gross receipts/, order: 16 },
        { pattern: /^\[17\] Fixed-base percentage/, order: 17 },
        { pattern: /^\[18\] Base amount/, order: 18 },
        { pattern: /^\[19\] Subtract line 18 from line 15/, order: 19 },
        { pattern: /^\[20\] Multiply line 15/, order: 20 },
        { pattern: /^\[21\] Enter the lesser of line 19 or line 20/, order: 21 },
        { pattern: /^\[22\] Add lines 10 and 21/, order: 22 },
        { pattern: /^\* If line 22 is \$ .* less/, order: 22.1 },
        { pattern: /^\* If line 22 is more than/, order: 22.2 },
        { pattern: /^\[23\] Multiply line 22 by \d+(\.\d+)?% \(0?\.\d+\)\. Enter the result/, order: 23 },
        { pattern: /^\[24\] Subtract \$ .* from line 22/, order: 24 },
        { pattern: /^\[25\] Multiply line 24/, order: 25 },
        { pattern: /^\[26\] Add .* to line 25/, order: 26 },
        { pattern: /^\[27 a\] If the taxpayer is electing the regular credit/, order: 27 },
        { pattern: /^\[27 b\] If the taxpayer is electing the Alternative Simplified Credit/, order: 28 }
    ],

    "Part 12 Current Taxable Year's Alternative Simplified Credit Calculation- (Complete lines 75 through 93 if electing the Alternative Simplified Credit. To elect the regular credit, complete Part 2, lines 8 through 27a.)": [
        { pattern: /^\[75\] Basic research payments/, order: 75 },
        { pattern: /^\[76\] Qualified organization base period amount/, order: 76 },
        { pattern: /^\[77\] Subtract line 76 from line 75/, order: 77 },
        { pattern: /^\[78\] Current year wages/, order: 78 },
        { pattern: /^\[79\] Current year cost of supplies/, order: 79 },
        { pattern: /^\[80\] Current year cost to rent/, order: 80 },
        { pattern: /^\[81\] Current contract research expenses/, order: 81 },
        { pattern: /^\[82\] Total research expenses/, order: 82 },
        { pattern: /^\[83\] Enter your total qualified research expenses/, order: 83 },
        { pattern: /^\[84\] Average qualified research expenses/, order: 84 },
        { pattern: /^\[85\] Subtract line 84 from line 82/, order: 85 },
        { pattern: /^\[86\] Multiply line 82/, order: 86 },
        { pattern: /^\[87\] Enter the lesser of line 85 or line 86/, order: 87 },
        { pattern: /^\[88\] Add line 77 and line 87/, order: 88 },
        { pattern: /^\* If line 88 is .* less/, order: 88.1 },
        { pattern: /^\* If line 88 is more than/, order: 88.2 },
        { pattern: /^\[89\] If line 88 is .* multiply/, order: 89 },
        { pattern: /^\[90\] If line 88 is more than/, order: 90 },
        { pattern: /^\[91\] Multiply line 90/, order: 91 },
        { pattern: /^\[92\] Add .* to line 91/, order: 92 },
        { pattern: /^\[93\] Enter the amount from line 89 or 92/, order: 93 }
    ]
    },
  BOLD: [
    "15. Total qualified research expenses. Add line 11 through line 14"
  ]
},

CA: {
    sectionOrder: [
        "(Line) Qualified research expenses paid or incurred."
    ],
    sectionFieldOrders: {
        "(Line) Qualified research expenses paid or incurred.": [
        { pattern: "[5] Wages for qualified services. See instructions", order: 1 },
        { pattern: "[6] Cost of supplies. See instructions", order: 2 },
        { pattern: "[7] Rental or lease costs of computers. See instructions", order: 3 },
        { pattern: "[8] Enter the applicable percentage of contract research expenses (see instructions)", order: 4 },
        { pattern: "[9] Total qualified research expenses. Add line 5 through line 8", order: 5 },
        {
            pattern: /^\[10\] Enter fixed-base percentage, but not more than \d+% \((0?\.\d+)\)\. See instructions\s*$/,
            order: 6
        },
        { pattern: "[11] Enter average annual gross receipts. See instructions", order: 7 },
        { pattern: "[12] Base amount. Multiply line 11 by the percentage on line 10", order: 8 },
        { pattern: "[13] Subtract line 12 from line 9. If zero or less, enter -0-", order: 9 },
        {
            pattern: /^\[14\] Multiply line 9 by \d+(?:\.\d+)?\s*%\s*\(\d+(?:\.\d+)?\)\. See instructions$/,
            order: 10
        },
        { pattern: "[15] Enter the smaller of line 13 or line 14", order: 11 },
        {
            pattern: /^\[16\] Multiply line 15 by \d+(?:\.\d+)?%\s*\(\d+\.\d+\)$/,
            order: 12
        },
        {
            pattern: "[17 a] Regular credit. Add line 4 and line 16. If you do not elect the reduced credit under IRC Section 280C(c), enter the result here, and see instructions for the schedule to attach",
            order: 13
        },
        {
            pattern: "[17 b] Reduced regular credit under IRC Section 280C(c). Multiply line 17a by the applicable percentage below:",
            order: 14
        },
        { pattern: /^\d+(\.\d+)?%? \(\d+(\.\d+)?\) for individuals and estates or trusts$/, order: 15 },
        { pattern: /^\d+(\.\d+)?%? \(\d+(\.\d+)?\) for  corporations$/, order: 16 },
        { pattern: /^\d+(\.\d+)?%? \(\d+(\.\d+)?\) for S corporations$/, order: 17 },
        { pattern: "Enter the reduced credit amount and write Section 280C(c) on the dotted line to the left of the entry space . . . . . . . . . . . . . . . . 17b", order: 18 }
        ]
    },
    BOLD: []
},
    CO: {
        sectionOrder: [
            "(PART IV) Research and Experimental Activities Credit",
            "Research and Experimental Activities Credit Do not send, keep for your records"
        ],
        sectionFieldOrders: {
            "(PART IV) Research and Experimental Activities Credit" : [
                { pattern : "text", order : 1}
            ],
            "Research and Experimental Activities Credit Do not send, keep for your records": [
           { pattern: "[A] Enter the current year qualified expenditures", order: 1 },
            { pattern: "[B] Enter the first preceding year expenditures", order: 2 },
            { pattern: "[C] Enter the second preceding year expenditures", order: 3 },
            { pattern: /^\[D\] Enter the sum of lines B and C$/, order: 4 },
            { pattern: /^\[E\] Enter \d+(\.\d+)?%? of line D$/, order: 5 },
            { pattern: /^\[F\] Enter line A minus line E$/, order: 6 },
            { pattern: /^\[G\] Allowable amount: \d+(\.\d+)?%? of line F$/, order: 7 }
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
            {
            pattern: "[1] Enter the amount of Connecticut research and experimental expenditures for the current income year.",
            order: 1
            },
            {
            pattern: "[2] Enter the amount of Connecticut research and experimental expenditures for the first prior income year.",
            order: 2
            },
            {
            pattern: "[3] Balance: Subtract Line 2 from Line 1. If zero or less, the corporation is not eligible for this credit.",
            order: 3
            },
            {
            pattern: /^\[4\] Tax credit: Multiply Line 3 by \d+(\.\d+)?%\. Enter here and on Form CT-1120K, Part I-C, Column B\.$/,
            order: 4
            }
        ],

        "Part I - Tentative Credit Computation": [
            {
            pattern: "[1] Enter the amount of Connecticut research and experimental expenditures for the current income year.",
            order: 1
            },
            {
            pattern: "[2] Enter the amount of excess Connecticut research and experimental expenditures for the current income year. From Form CT-1120RC Part I, Line 3.",
            order: 2
            },
            {
            pattern: /^\[3\] Balance: Subtract Line 2 from Line 1\. Net research and development expenses for \d{4}$/,
            order: 3
            },
            {
            pattern: "[4 a] Qualified small businesses multiply amount on Line 3 by 6% (.06)",
            order: 4
            },
            {
            pattern: "[4 b] Companies headquartered in an Enterprise Zone, with revenues in excess of $3 billion, employing more than 2,500 employees, may elect to multiply amount on Line 3 by 3.5% (.035).",
            order: 5
            },
            {
            pattern: "[4 c] All other businesses determine amount from the Tentative Credit Rate Schedule on Page 2 of form.",
            order: 6
            },
            {
            pattern: "[4] Tentative credit: Enter the amount from Line 4a, 4b, or 4c.",
            order: 7
            },
            {
            pattern: "[5] Reduction of tentative tax credit for 2024: Applicable if Line 3 exceeds $200 million and workforce is reduced.",
            order: 8
            },
            {
            pattern: "[6] Allowable tentative tax credit for Current Year: Subtract Line 5 from Line 4.",
            order: 9
            }
        ],

        "Part II - Credit Computation": [
            {
            pattern: /^\[1\] Allowable Tentative Tax Credit for \d{4} from Part 1, line 6$/,
            order: 1
            },
            {
            pattern: /^\[2\] Multiply Line 1 by \d+(\.\d+)?%$/,
            order: 2
            },
            {
            pattern: "[3] Current Year CT Business Tax Liability",
            order: 3
            },
            {
            pattern: /^\[4\] Multiply Line 3 by \d+(\.\d+)?%\s*$/,
            order: 4
            },
            {
            pattern: /^\[5 a\] Multiply Line 1 by \d+(\.\d+)?$/,
            order: 5
            },
            {
            pattern: /^\[5 b\] Enter \d+(\.\d+)?% \(\d+(\.\d+)?\) of Line 3$/,
            order: 6
            },
            {
            pattern: "[5] Enter the lesser of Line 5a or Line 5b",
            order: 7
            },
            {
            pattern: "[6] Enter the greater of Line 4 or Line 5",
            order: 8
            },
            {
            pattern: "[7] 2024 Research and Development Expenditures tax credit: Enter the lesser of Line 2 or Line 6 here and on Form CT-1120K, Part I-C, Column B.",
            order: 9
            }
        ]
        },

        BOLD: []
    },
    OH: {
        sectionOrder: [
            "NoTitle"
        ],
        sectionFieldOrders: {
            "NoTitle": [
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
            "[PART I] CREDIT CALCULATION FOR BASIC RESEARCH PAYMENTS",
            "[PART II] CREDIT CALCULATION FOR BASIC RESEARCH PAYMENTS",
            "[PART III] CREDIT CALCULATION FOR QUALIFIED RESEARCH EXPENSES",
            "[PART IV] CREDIT CALCULATION FOR QUALIFIED RESEARCH EXPENESES (ALTERNATIVE SIMPLIFIED CREDIT METHOD)",
            "[PART V] TOTAL RESEARCH AND DEVELOPMENT TAX CREDIT",
            "[PART VI] CALCULATION OF THE ALLOWABLE CREDIT AMOUNT AND CARRYOVER"
        ],
        sectionFieldOrders: {
            "[PART I] CREDIT CALCULATION FOR BASIC RESEARCH PAYMENTS": [
                { pattern: /^\[1\]\s*Enter the basic research payments paid or incurred to qualified organizations/, order: 1 }
            ],
            "[PART II] CREDIT CALCULATION FOR BASIC RESEARCH PAYMENTS": [
                { pattern: /^\[2\]\s*Enter the basic research payments paid or incurred to qualified organizations/, order: 1 },
                { pattern: /^\[3\]\s*Enter the base period amount/, order: 2 },
                { pattern: /^\[4\]\s*Subtract line 3 from line 2/, order: 3 }
            ],
            "[PART III] CREDIT CALCULATION FOR QUALIFIED RESEARCH EXPENSES": [
                { pattern: /^\[5\]\s*Wages for Qualified services/, order: 1 },
                { pattern: /^\[6\]\s*Cost of Supplies/, order: 2 },
                { pattern: /^\[7\]\s*Rental or lease costs of computers/, order: 3 },
                { pattern: /^\[8\]\s*Enter 65%/, order: 4 },
                { pattern: /^\[9\]\s*Total qualified research expenses/, order: 5 },
                { pattern: /^\[10\]\s*Enter fixed-based percentage/, order: 6 },
                { pattern: /^\[11\]\s*Enter average annual gross receipts/, order: 7 },
                { pattern: /^\[12\]\s*Base amount/, order: 8 },
                { pattern: /^\[13\]\s*Subtract line 12 from line 9/, order: 9 },
                { pattern: /^\[14\]\s*Enter 50%/, order: 10 },
                { pattern: /^\[15\]\s*Enter the smaller of line 13 or 14/, order: 11 }
            ],
            "[PART IV] CREDIT CALCULATION FOR QUALIFIED RESEARCH EXPENESES (ALTERNATIVE SIMPLIFIED CREDIT METHOD)": [
                { pattern: /^\[16\]\s*Wages for qualified services/, order: 1 },
                { pattern: /^\[17\]\s*Cost of Supplies/, order: 2 },
                { pattern: /^\[18\]\s*Rental or lease costs of computers/, order: 3 },
                { pattern: /^\[19\]\s*Enter the applicable percentage of contract research expenses/, order: 4 },
                { pattern: /^\[20\]\s*Total qualified research expenses\. Add lines 16 through 19/, order: 5 },
                { pattern: /^\[21\]\s*Enter your total qualified research expenses for the prior 3 privilege periods/, order: 6 },
                { pattern: /^\[22\]\s*Divide line 21 by \d+(\.\d+)?/, order: 7 },
                { pattern: /^\[23\]\s*Subtract line 22 from line 20/, order: 8 },
                { pattern: /^\[24\]\s*Enter amount from line 23/, order: 9 }
            ],
            "[PART V] TOTAL RESEARCH AND DEVELOPMENT TAX CREDIT": [
                { pattern: /^\[26\]\s*Enter either line 15 or 24/, order: 1 },
                { pattern: /^\[27\]\s*Add lines 25c and 26/, order: 2 },
                { pattern: /^\[28\]\s*Multiply line 27 by \d+(\.\d+)?%$/, order: 3 },
                { pattern: /^\[29\]\s*Research and Development Tax Credit carried forward from prior year/, order: 4 },
                { pattern: /^\[30\]\s*Total credit available - Add lines 28 and 29/, order: 5 }
            ],
            "[PART VI] CALCULATION OF THE ALLOWABLE CREDIT AMOUNT AND CARRYOVER": [
                { pattern: /^\[31\]\s*Enter tax liability from page 1/, order: 1 },
                { pattern: /^\[32\]\s*Enter the required minimum tax liability/, order: 2 },
                { pattern: /^\[33\]\s*Subtract line 32 from line 31/, order: 3 },
                { pattern: /^\[34\]\s*Tax credit used by taxpayer on current year's return/, order: 4 },
                { pattern: /^\(a\)/, order: 5 },
                { pattern: /^\(b\)/, order: 6 },
                { pattern: /^\(c\)/, order: 7 },
                { pattern: /^\(d\)/, order: 8 },
                { pattern: /^\[35\]\s*Subtract line 34 form line 33/, order: 9 },
                { pattern: /^\[36\]\s*Allowable credit for the current period or tax year/, order: 10 },
                { pattern: /^\[37\]\s*a\) research and development tax credit carryover/, order: 11 },
                { pattern: /^\[37\]\s*b\) Amount of credit shared in current year/, order: 12 },
                { pattern: /^\[37\]\s*c\) Amount of credit carryover to following year's return/, order: 13 }
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
            {
            pattern: "[1] Basic research payments paid or incurred during the tax year to qualified organizations",
            order: 1
            },
            {
            pattern: "[2] Qualified organization base period amount",
            order: 2
            },
            {
            pattern: "[3] Subtract line 2 from line 1. If less than zero, enter zero",
            order: 3
            }
        ],

        "Qualiﬁed Research Expenses Paid or Incurred for Research Conducted in Idaho": [
            { pattern: "[4] Wages for qualified services performed in Idaho", order: 1 },
            { pattern: "[5] Cost of supplies used in Idaho", order: 2 },
            { pattern: "[6] Rental or lease costs of computers in Idaho", order: 3 },
            { pattern: "[7] Enter the applicable percentage of contract research expenses", order: 4 },
            {
            pattern: "[8] Total qualified research expenses for research conducted in Idaho. Add lines 4 through 7",
            order: 5
            },
            {
            pattern: "[9] Enter fixed-base percentage, but not more than 16%, from page 2, Part A or B",
            order: 6
            },
            {
            pattern: "[10] Enter average annual Idaho gross receipts from page 2, Part C",
            order: 7
            },
            {
            pattern: "[11] Base amount. Multiply line 10 by the percentage on line 9",
            order: 8
            },
            {
            pattern: "[12] Subtract line 11 from line 8. If zero or less, enter zero",
            order: 9
            },
            {
            pattern: /^\[13\] Multiply line 8 by .*%$/,
            order: 10
            },
            {
            pattern: "[14] Enter the smaller amount from line 12 or line 13",
            order: 11
            },
            {
            pattern: "[15] Add lines 3 and 14",
            order: 12
            },
            {
            pattern: /^\[16\] Credit earned\. Multiply line 15 by .*%\s*$/,
            order: 13
            },
            {
            pattern: "[17] Pass-through share of credit from an S corporation, partnership, trust, or estate",
            order: 14
            },
            {
            pattern: "[18] Credit received through unitary sharing. Include a schedule",
            order: 15
            },
            {
            pattern: "[19] Carryover of credit for Idaho research activities from prior years",
            order: 16
            },
            {
            pattern: "[20] Credit distributed to shareholders, partners, or beneficiaries",
            order: 17
            },
            {
            pattern: "[21] Credit shared with unitary affiliates",
            order: 18
            },
            {
            pattern: "[22] Total credit available subject to limitations. Add lines 16 through 19, then subtract lines 20 and 21",
            order: 19
            },
            {
            pattern: "[23] Enter the Idaho income tax from your tax return",
            order: 20
            },

            { pattern: "[24 a] Credit for income tax paid to other states", order: 21 },
            { pattern: "[b] Part-year resident grocery credit", order: 22 },
            { pattern: "[c] Credit for contributions to Idaho educational entities", order: 23 },
            { pattern: "[d] Investment tax credit", order: 24 },
            {
            pattern: "[e] Credit for contributions to Idaho youth and rehabilitation facilities",
            order: 25
            },
            {
            pattern: "[f] Credit for production equipment using post-consumer waste",
            order: 26
            },
            { pattern: "[g] Promoter-sponsored event credit", order: 27 },
            { pattern: "[h] Add lines 24a through 24g", order: 28 },

            {
            pattern: "[25] Net income tax after allowance of other credits. Subtract line 24h from line 23",
            order: 29
            },
            {
            pattern: "[26] Total credit available subject to limitations. Enter the amount from line 22",
            order: 30
            },
            {
            pattern: "[27] Credit for Idaho research activities allowed. Enter the smaller amount from line 25 or line 26 here and on Form 44, Part I, line 4",
            order: 31
            }
        ]
        },

        BOLD: []
    },
    VA: {
        sectionOrder: [
            "Section 1 – Primary Credit Calculation Round to the nearest whole dollar.",
            "Section 2 – Alternative Simplified Credit Calculation",
            "Section 1 – Summary of Expenses",
            "Section 1 – VA Qualified Research and Development Expenses",
            "Section 2 – Determine the Fixed Base Percentage",
            "Section 3 – Determine the Virginia Base Amount",
            "Section 4 – Virginia Base Amount",
            "Section 1 – Virginia Qualified Research and Development Expenses",
            "Section 2 – Determination of How to Compute the Credit",
            "Section 3 – Average Qualified Research and Development Expenses Calculation",
            "Section 4 – Adjusted Expenses Calculation"
        ],
        sectionFieldOrders: {
            "Section 1 – Primary Credit Calculation Round to the nearest whole dollar.": [
                { pattern: /^\[1\] Virginia Qualified Research and Development Expenses\. Enter amount paid/, order: 1 },
                { pattern: /^\[1\] Virginia Qualified Research and Development Expenses\. Column B/, order: 2 },
                { pattern: /^\[2\] College and University Expenses Percentage/, order: 3 },
                { pattern: /^\[3\] Virginia Base Amount for the Taxable Year/, order: 4 },
                { pattern: /^\[3\] College and University Base Amount/, order: 5 },
                { pattern: /^\[4\] Adjusted Expenses Amount\. Subtract Line 3 from Line 1\. Column A/, order: 6 },
                { pattern: /^\[4\] Adjusted Expenses Amount\. Subtract Line 3 from Line 1\. Column B/, order: 7 },
                { pattern: /^\[5\] Total Eligible Research Expenses/, order: 8 },
                { pattern: /^\[5\] Eligible College and University Research Expenses/, order: 9 },
                { pattern: /^\[6\] Credit Computation\. Multiply Line 5, Column A/, order: 10 },
                { pattern: /^\[6\] Credit Computation\. Multiply Line 5, Column B/, order: 11 },
                { pattern: /^\[7\] Credit Requested/, order: 12 },
            ],
            "Section 2 – Alternative Simplified Credit Calculation": [
                { pattern: /^\[1\] Total Adjusted Calendar Year Qualified Research and Development Expenses\. Enter the amount/, order: 1 },
                { pattern: /^\[1\] Total Adjusted Calendar Year Qualified Research and Development Expenses\. Column B/, order: 2 },
            ],
            "Section 1 – Summary of Expenses": [
                { pattern: /^\[1\] Contract Research Expenses\. Column A/, order: 1 },
                { pattern: /^\[1\] Contract Research Expenses\. Column B/, order: 2 },
                { pattern: /^\[2\] Supply Expenses\. Column A/, order: 3 },
                { pattern: /^\[2\] Supply Expenses\. Column B/, order: 4 },
                { pattern: /^\[3\] Wages\. Column A/, order: 5 },
                { pattern: /^\[3\] Wages\. Column B/, order: 6 },
                { pattern: /^\[4\] Total Qualified Expenses\. Column A/, order: 7 },
                { pattern: /^\[4\] Total Qualified Expenses\. Column B/, order: 8 },
            ],
            "Section 1 – VA Qualified Research and Development Expenses": [
                { pattern: /^\[1a\] VA Qualified Research and Development Expenses in CY/, order: 1 },
            ],
            "Section 2 – Determine the Fixed Base Percentage": [
                { pattern: /^\[2a\] Expenses for the 3rd preceding taxable year/, order: 1 },
                { pattern: /^\[2b\] Expenses for the 2nd preceding taxable year/, order: 2 },
                { pattern: /^\[2c\] Expenses for the preceding taxable year/, order: 3 },
                { pattern: /^\[2d\] Total Expenses\. Add Lines 2a-2c/, order: 4 },
                { pattern: /^\[2e\] Average Qualified Research and Development Expenses for the Prior 3 Taxable Years/, order: 5 },
                { pattern: /^\[2f\] Gross receipts for the 3rd preceding taxable year/, order: 6 },
                { pattern: /^\[2g\] Gross receipts for the 2nd preceding taxable year/, order: 7 },
                { pattern: /^\[2h\] Gross receipts for the preceding taxable year/, order: 8 },
                { pattern: /^\[2i\] Total Gross Receipts\. Add Lines 2f through 2h/, order: 9 },
                { pattern: /^\[2j\] Average Gross Receipts for Prior 3 Taxable Years/, order: 10 },
                { pattern: /^\[2k\] Percentage of Virginia Qualified Research and Development Expenses/, order: 11 },
            ],
            "Section 3 – Determine the Virginia Base Amount": [
                { pattern: /^\[3a\] Gross receipts for the 4th preceding taxable year/, order: 1 },
                { pattern: /^\[3b\] Gross receipts for the 3rd preceding taxable year/, order: 2 },
                { pattern: /^\[3c\] Gross receipts for the 2nd preceding taxable year/, order: 3 },
                { pattern: /^\[3d\] Gross receipts for the preceding taxable year/, order: 4 },
                { pattern: /^\[3e\] Total Gross Receipts\. Add Lines 3a through 3d/, order: 5 },
                { pattern: /^\[3f\] Average Gross Receipts for Prior 4 Taxable Years/, order: 6 },
                { pattern: /^\[3g\] Base Amount\. Calendar Year Filers/, order: 7 },
            ],
            "Section 4 – Virginia Base Amount": [
                { pattern: /^\[4a\] Virginia Base Amount/, order: 1 },
            ],
            "Section 1 – Virginia Qualified Research and Development Expenses": [
                { pattern: /^\[1a\] Virginia Qualified Research and Development Expenses in CY\. Column A/, order: 1 },
                { pattern: /^\[1a\] Virginia Qualified Research and Development Expenses in CY\. Column B/, order: 2 },
            ],
            "Section 2 – Determination of How to Compute the Credit": [
                { pattern: /^\[2\] Were research and development expenses paid or incurred/, order: 1 },
            ],
            "Section 3 – Average Qualified Research and Development Expenses Calculation": [
                { pattern: /^\[3a\] Expenses for the 3rd preceding taxable year/, order: 1 },
                { pattern: /^\[3b\] Expenses for the 2nd preceding taxable year/, order: 2 },
                { pattern: /^\[3c\] Expenses for the preceding taxable year/, order: 3 },
                { pattern: /^\[3d\] Total expenses from preceding 3 taxable years/, order: 4 },
                { pattern: /^\[3e\] Average qualified research and development expenses/, order: 5 },
            ],
            "Section 4 – Adjusted Expenses Calculation": [
                { pattern: /^\[4a\] Enter the current year expenses\. Column A must include/, order: 1 },
                { pattern: /^\[4a\] Enter the current year expenses\. Column B/, order: 2 },
                { pattern: /^\[4b\] If expenses were incurred in connection with a Virginia college/, order: 3 },
                { pattern: /^\[4c\] Column A/, order: 4 },
                { pattern: /^\[4c\] Column B/, order: 5 },
                { pattern: /^\[4d\] Multiply the amount\(s\) on Line 4c by .+\. Column A/, order: 6 },
                { pattern: /^\[4d\] Multiply the amount\(s\) on Line 4c by .+\. Column B/, order: 7 },
                { pattern: /^\[4e\] Subtract Line 4d from Line 4a.+Column A/, order: 8 },
                { pattern: /^\[4e\] Subtract Line 4d from Line 4a.+Column B/, order: 9 },
            ],
        },
        BOLD: []
    },
    IA: {
        sectionOrder: [
            "PART II — U.S. Qualified Research Expenses (Lines 5–16)",
            "PART III — Calculation of Tax Credit Based on Percentage of Research Occurring within Iowa"
        ],
        sectionFieldOrders: {
            "PART II — U.S. Qualified Research Expenses (Lines 5–16)": [
                { pattern: /^\[2\] Certain amounts paid or incurred to energy consortia/, order: 1 },
                { pattern: /^\[3\] Basic research payments to qualified organizations/, order: 2 },
                { pattern: /^\[4\] Qualified organization base period amount/, order: 3 },
                { pattern: /^\[5\] Wages for qualified research services/, order: 4 },
                { pattern: /^\[6\] Cost of supplies used in conducting qualified research/, order: 5 },
                { pattern: /^\[7\] Rental or lease costs of computers used in conducting qualified research/, order: 6 },
                { pattern: /^\[8\] Applicable portion of contract research expenses/, order: 7 },
                { pattern: /^\[9\] Total qualified research expenses\. Add lines 5 through 8/, order: 8 },
                { pattern: /^\[10\] Fixed-base percentage/, order: 9 },
                { pattern: /^\[11\] Average U\.S\. annual gross receipts for tax years/, order: 10 },
                { pattern: /^\[12\] Multiply line 11 by the percentage on line 10/, order: 11 },
                { pattern: /^\[13\] Subtract line 12 from line 9\. If zero or less, enter zero/, order: 12 },
                { pattern: /^\[14\] Multiply line 9 by/, order: 13 },
                { pattern: /^\[15\] Enter the smaller of line 13 or line 14/, order: 14 },
                { pattern: /^\[16\] Total allowable U\.S\. qualified research expenses\. Add lines 2 and 15/, order: 15 }
            ],
            "PART III — Calculation of Tax Credit Based on Percentage of Research Occurring within Iowa": [
                { pattern: /^\[17\] Basic research payments to qualified organizations in Iowa/, order: 1 },
                { pattern: /^\[18\] Iowa apportioned qualified organization base period amount/, order: 2 },
                { pattern: /^\[19\] Subtract line 18 from line 17\. If zero or less, enter zero/, order: 3 },
                { pattern: /^\[20\] Multiply line 19 by/, order: 4 },
                { pattern: /^\[21\] Wages for qualified research services performed in Iowa/, order: 5 },
                { pattern: /^\[22\] Non-qualifying Iowa wages\. See instructions/, order: 6 },
                { pattern: /^\[23\] Qualifying Iowa wages\. Subtract line 22 from line 21/, order: 7 },
                { pattern: /^\[24\] Cost of supplies used in conducting qualified research in Iowa/, order: 8 },
                { pattern: /^\[25\] Eligible cost of Iowa supplies\. Multiply line 24 by/, order: 9 },
                { pattern: /^\[26\] Applicable portion of contract research expenses incurred in Iowa/, order: 10 },
                { pattern: /^\[27\] Non-qualifying Iowa contract research expenses\. See instructions/, order: 11 },
                { pattern: /^\[28\] Qualifying Iowa contract research expenses\. Subtract line 27 from line 26/, order: 12 },
                { pattern: /^\[29\] Total Iowa qualified research expenses\. Add lines 23, 25, and 28/, order: 13 },
                { pattern: /^\[30\] Total U\.S\. qualified research expenses\. Add lines 2 and 9/, order: 14 },
                { pattern: /^\[31\] Iowa share of research\. Divide line 29 by line 30/, order: 15 },
                { pattern: /^\[32\] Expenses allocable to Iowa\. Multiply line 16 by the percentage on line 31/, order: 16 },
                { pattern: /^\[33\] Multiply line 32 by/, order: 17 },
                { pattern: /^\[34\] Iowa RAC\. Add lines 20 and 33/, order: 18 },
                { pattern: /^\[35\] Share of Iowa RAC for members of a controlled group/, order: 19 },
                { pattern: /^\[36\] Iowa Supplemental RAC/, order: 20 },
                { pattern: /^\[37\] Pass-through Iowa Supplemental RAC/, order: 21 }
            ]
        },
        BOLD: []
    },
    KS: {
        sectionOrder: [
            "PART A – COMPUTATION OF MAXIMUM ALLOWABLE CREDIT FOR THIS YEAR'S EXPENDITURES",
            "PART B – COMPUTATION OF ALLOWED CREDIT FOR THIS YEAR'S EXPENDITURES"
        ],
        sectionFieldOrders: {
            "PART A – COMPUTATION OF MAXIMUM ALLOWABLE CREDIT FOR THIS YEAR'S EXPENDITURES": [
                { pattern: "[1] Research and development expenditures for current year.", order: 1 },
                { pattern: "[a] Machinery and Equipment", order: 2 },
                { pattern: "[b] Payroll", order: 3 },
                { pattern: "[c] Other (describe)", order: 4 },
                { pattern: "[2] Research and development expenditures for the:", order: 5 },
                { pattern: "[a] first preceding taxable year.", order: 6 },
                { pattern: "[b] second preceding taxable year, if applicable (see instructions).", order: 7 },
                { pattern: "[3] Total (add lines 1, 2a, and if applicable 2b, and enter the total on line 3; see instructions).", order: 8 },
                { pattern: "[4] Average (divide line 3 by 3). This is your average expenditure over the last three years.", order: 9 },
                { pattern: "[5] Expenditure amount for credit (subtract line 4 from line 1; cannot be less than zero).", order: 10 },
                { pattern: /^\[6\] Total research and development credit \(multiply line 5 by \d+(\.\d+)?% or \.\d+\)\.$/, order: 11 },
                { pattern: /^\[7\] Maximum allowable credit in any one year \(multiply line 6 by \d+(\.\d+)?% or \.\d+\)\.$/, order: 12 }
            ],
            "PART B – COMPUTATION OF ALLOWED CREDIT FOR THIS YEAR'S EXPENDITURES": [
                { pattern: "[8] Amount of your tax liability for this tax year after all other credits other than this credit.", order: 1 },
                { pattern: "[9] Amount of credit allowable as a result of expenditures made this tax year (enter amount from line 7 or line 8, whichever is less).", order: 2 }
            ]
        },
        BOLD: []
    },
    LA: {
        sectionOrder: [
            "RESEARCH & DEVELOPMENT TAX CREDIT CALCULATION - 6765"
        ],
        sectionFieldOrders: {
            "RESEARCH & DEVELOPMENT TAX CREDIT CALCULATION - 6765": [
                { pattern: /^\[1\] \d{4} LA Research & Development Expenditures$/, order: 1 },
                { pattern: /^\[2\] \d{4} LA Research & Development Expenditures$/, order: 2 },
                { pattern: /^\[3\] \d{4} LA Research & Development Expenditures$/, order: 3 },
                { pattern: "[4] 3 Previous Years Average", order: 4 },
                { pattern: /^\[5\] Base Calculation \(\d+(\.\d+)?% x Line 4\)$/, order: 5 },
                { pattern: /^\[6\] \d{4} LA Research & Development Expenditures$/, order: 6 },
                { pattern: "[7] Increase in LA R&D Expenditures (Line 6 minus Line 5)", order: 7 },
                { pattern: /^\[8\] Credit Percentage \([\d.]+ % with .+ LA employees\)$/, order: 8 },
                { pattern: "[9] Louisiana Research Credit (Line 7 times Line 8)", order: 9 }
            ]
        },
        BOLD: []
    },
    ME: {
        sectionOrder: [
            "Maine - Credit Calculations"
        ],
        sectionFieldOrders: {
            "Maine - Credit Calculations": [
                { pattern: /^\[1\] Basic research payments in excess of the federal base/, order: 1 },
                { pattern: /^\[2\] Basic research payments credit \(multiply line 1 by/, order: 2 },
                { pattern: /^\[3\] Total qualified research expenses spent for research conducted in Maine/, order: 3 },
                { pattern: /^\[4\] Total qualified research expenses applied to research conducted in Maine for the three previous tax years/, order: 4 },
                { pattern: /^\[4a\]/, order: 5 },
                { pattern: /^\[4b\]/, order: 6 },
                { pattern: /^\[4c\]/, order: 7 },
                { pattern: /^\[5\] Qualified research expenses in excess of base amount/, order: 8 },
                { pattern: /^\[6\] Qualified research expense credit \(multiply line 5 by/, order: 9 },
                { pattern: /^\[7\] Carryforward from previous years/, order: 10 },
                { pattern: /^\[8\] Total available credit/, order: 11 }
            ]
        },
        BOLD: []
    },
    MN: {
        sectionOrder: [
            "Minnesota Credit for Increasing Research Activities (M30-I)"
        ],
        sectionFieldOrders: {
            "Minnesota Credit for Increasing Research Activities (M30-I)": [
                { pattern: /^\[1\] Wages for qualifed services/, order: 1 },
                { pattern: /^\[2\] Cost of supplies/, order: 2 },
                { pattern: /^\[3\] Amounts paid or incurred for the right to use computers/, order: 3 },
                { pattern: /^\[4\] Applicable percentage of contract expenses/, order: 4 },
                { pattern: /^\[5\] Amount paid to qualified research organizations for basic research/, order: 5 },
                { pattern: /^\[6\] Development contributions to a nonprofit organization/, order: 6 },
                { pattern: /^\[7\] Total qualified research expenses in Minnesota/, order: 7 },
                { pattern: /^\[15\] Tax year/, order: 8 },
                { pattern: /^\[16\] Tax year/, order: 9 },
                { pattern: /^\[17\] Tax year/, order: 10 },
                { pattern: /^\[18\] Tax year/, order: 11 },
                { pattern: /^\[19\] Add lines 15 through 18/, order: 12 },
                { pattern: /^\[20\] Average annual gross income\/mine value/, order: 13 },
                { pattern: /^\[21\] Multiply line 20 by the percentage on line 14/, order: 14 },
                { pattern: /^\[22\] Multiply line 7 by/, order: 15 },
                { pattern: /^\[23\] Base amount/, order: 16 },
                { pattern: /^\[24\] Subtract line 23 from line 7/, order: 17 },
                { pattern: /^\[25\] Enter the amount from line 24 or \$/, order: 18 },
                { pattern: /^\[26\] Subtract line 25 from line 24/, order: 19 },
                { pattern: /^\[27\] Multiply line 25 by/, order: 20 },
                { pattern: /^\[28\] Multiply line 26 by/, order: 21 },
                { pattern: /^\[29\] Current credit \(add lines 27 and 28\)/, order: 22 },
                { pattern: /^\[30\] Credit carryover from/, order: 23 },
                { pattern: /^\[31\] Tentative credit \(add lines 29 and 30\)/, order: 24 },
                { pattern: /^\[32\] Limitation/, order: 25 },
                { pattern: /^\[33\] Credit for increasing research activities/, order: 26 },
                { pattern: /^\[34\] Credit carryover to/, order: 27 }
            ]
        },
        BOLD: []
    },
    NE: {
        sectionOrder: [
            "NoTitle"
        ],
        sectionFieldOrders: {
            "NoTitle": [
                { pattern: /^\[2\] Enter total amount of federal research credit allowed/, order: 1 },
                { pattern: "[3] Nebraska property factor (attach schedule showing calculations)", order: 2 },
                { pattern: "[3a] Off-campus, but in Nebraska.", order: 3 },
                { pattern: /^\[3b\] On-campus in Nebraska\./, order: 4 },
                { pattern: "[4] Nebraska payroll factor (attach schedule showing calculations)", order: 5 },
                { pattern: "[4a] Off-campus, but in Nebraska.", order: 6 },
                { pattern: "[4b] On-campus in Nebraska.", order: 7 },
                { pattern: "[5a] Add lines 3a and 4a (off-campus).", order: 8 },
                { pattern: "[5b] Add lines 3b and 4b (on-campus).", order: 9 },
                { pattern: "[6] Average property and payroll factors", order: 10 },
                { pattern: "[6a] Off-campus (line 5a ÷ 2).", order: 11 },
                { pattern: "[6b] On-campus (line 5b ÷ 2).", order: 12 },
                { pattern: "[7a] Multiply line 2 x line 6a (off-campus) .", order: 13 },
                { pattern: "[7b] Multiply line 2 x line 6b (on-campus).", order: 14 },
                { pattern: "[8a] Regular research tax credit (line 7a x 15%) (off-campus).", order: 15 },
                { pattern: "[8b] Enhanced research tax credit (line 7b x 35%) (on-campus).", order: 16 },
                { pattern: "[9] Total research tax credit (line 8a plus line 8b) .", order: 17 },
                { pattern: "[10] Enter amount of all qualified expenses for R&D activities in Nebraska.", order: 18 },
                { pattern: /^\[11\] Enter amount of expenses on line 10 which were not performed/, order: 19 },
                { pattern: /^\[12\] Enter amount of expenses on line 10 which were performed/, order: 20 },
                { pattern: /^\[13\] Enter total amount of qualified expenses for R&D activities in all states/, order: 21 },
                { pattern: "[14] Divide line 11 by line 13 (off-campus).", order: 22 },
                { pattern: "[15] Divide line 12 by line 13 (on-campus).", order: 23 },
                { pattern: "[16] Multiply line 2 x line 14 (off-campus).", order: 24 },
                { pattern: "[17] Multiply line 2 x line 15 (on-campus).", order: 25 },
                { pattern: /^\[18\] Regular research tax credit \(line 16 × \d+(\.\d+)?%\) — off-campus$/, order: 26 },
                { pattern: /^\[19\] Enhanced research tax credit \(line 17 × \d+(\.\d+)?%\) — on-campus$/, order: 27 },
                { pattern: "[20] Total research tax credit (line 18 plus line 19.", order: 28 },
                { pattern: "[21] Enter the larger of line 9 or line 20.", order: 29 },
                { pattern: /^\[22\] Amount of credit \(refundable to the entity/, order: 30 },
                { pattern: /^\[23\] Amount of credit from line 21 used for refunds/, order: 31 },
                { pattern: /^\[24\] Amount of credit from line 21 \(nonrefundable\) distributed/, order: 32 },
                { pattern: "[25] Total credit usage (line 22 + line 23 + line 24). Total cannot exceed line 21", order: 33 }
            ]
        },
        BOLD: [
            "[9] Total research tax credit (line 8a plus line 8b) .",
            "[20] Total research tax credit (line 18 plus line 19.",
            "[21] Enter the larger of line 9 or line 20.",
            "[25] Total credit usage (line 22 + line 23 + line 24). Total cannot exceed line 21"
        ]
    },
    NH: {
        sectionOrder: [
            "NH Research & Development Tax Credit Application"
        ],
        sectionFieldOrders: {
            "NH Research & Development Tax Credit Application": [
                { pattern: /^\[A\] Qualified Manufacturing Research & Development expenditures.*per Federal Return/, order: 1 },
                { pattern: /^\[B\] Qualified Manufacturing Research & Development expenditures.*attributable to NH/, order: 2 },
                { pattern: /^\[C\] Amount of Research & Development Credit requested/, order: 3 }
            ]
        },
        BOLD: []
    },
    RI: {
        sectionOrder: [
            "RI Schedule RC — R&D Expense Credit"
        ],
        sectionFieldOrders: {
            "RI Schedule RC — R&D Expense Credit": [
                { pattern: "[1] Federal Qualified Research Expenses from Federal Form 6765, line 9 or line 20", order: 1 },
                { pattern: "[2] Federal Base Amount from Federal Form 6765, line 9 or 23", order: 2 },
                { pattern: "[3] Federal Excess Expenses. Subtract line 2 from line 1", order: 3 },
                { pattern: "[4] Amount of Federal Excess Expenses from line 3 incurred in Rhode Island", order: 4 },
                { pattern: /^\[5\] CREDIT - \([\d.]+% on expenditures up to/, order: 5 },
                { pattern: "[6] Unused R&D Expense Credit from preceding year(s). Attach a schedule with amounts and year of origination", order: 6 },
                { pattern: "[7] Total R&D Expense Credit Available. Add lines 5 and 6", order: 7 },
                { pattern: "[8] Tax amount from Form RI-1120C, line 11 or Form T-71, line 7", order: 8 },
                { pattern: "[9] MAXIMUM R&D Expense Credit. Multiply line 8 by 50%. Enter here and on the applicable line on Schedule B-CR", order: 9 },
                { pattern: "[10] Credit carryover. Subtract line 9 from line 7", order: 10 }
            ]
        },
        BOLD: []
    },
    VT: {
        sectionOrder: [
            "Section A—Regular Credit. Skip this section and go to Section B if you are electing or previously elected (and are not revoking) the alternative simplified credit",
            "Section B—Alternative Simplified Credit. Skip this section if you are completing Section A.",
            "Section C—Current Year Credit",
            "Section D—Qualified Small Business Payroll Tax Election and Payroll Tax Credit. Skip this section if the payroll tax election does not apply. See instructions.",
            "Section E—Other Information. See instructions.",
            "Section F—Qualified Research Expenses Summary. See instructions."
        ],
        sectionFieldOrders: {
            "Section A—Regular Credit. Skip this section and go to Section B if you are electing or previously elected (and are not revoking) the alternative simplified credit": [
                { pattern: /^\[1\] Certain amounts paid or incurred to energy consortia/, order: 1 },
                { pattern: /^\[2\] Basic research payments/, order: 2 },
                { pattern: /^\[3\] Qualified organization base period amount/, order: 3 },
                { pattern: /^\[4\] Subtract line 3 from line 2/, order: 4 },
                { pattern: /^Note: Complete Section F/, order: 5 },
                { pattern: "[5] Total qualified research expenses (QREs). Enter amount from line 48", order: 6 },
                { pattern: /^\[6\] Enter fixed-base percentage/, order: 7 },
                { pattern: "[7] Enter average annual gross receipts. See instructions", order: 8 },
                { pattern: "[8] Multiply line 7 by the percentage on line 6", order: 9 },
                { pattern: /^\[9\] Subtract line 8 from line 5/, order: 10 },
                { pattern: /^\[10\] Multiply line 5 by/, order: 11 },
                { pattern: "[11] Enter the smaller of line 9 or line 10", order: 12 },
                { pattern: "[12] Add lines 1, 4, and 11", order: 13 },
                { pattern: /^\[13\] If you elect to reduce the credit under section 280C/, order: 14 }
            ],
            "Section B—Alternative Simplified Credit. Skip this section if you are completing Section A.": [
                { pattern: /^\[14\] Certain amounts paid or incurred to energy consortia/, order: 1 },
                { pattern: /^\[15\] Basic research payments to qualified organizations/, order: 2 },
                { pattern: /^\[16\] Qualified organization base period amount/, order: 3 },
                { pattern: /^\[17\] Subtract line 16 from line 15/, order: 4 },
                { pattern: "[18] Add lines 14 and 17", order: 5 },
                { pattern: /^\[19\] Multiply line 18 by/, order: 6 },
                { pattern: "[20] Total qualified research expenses (QREs). Enter amount from line 48", order: 7 },
                { pattern: /^\[21\] Enter your total QREs for the prior 3 tax years/, order: 8 },
                { pattern: "[22] Divide line 21 by 6.0", order: 9 },
                { pattern: /^\[23\] Subtract line 22 from line 20/, order: 10 },
                { pattern: /^\[24\] Multiply line/, order: 11 },
                { pattern: "[25] Add lines 19 and 24", order: 12 },
                { pattern: /^\[26\] If you elect to reduce the credit under section 280C/, order: 13 }
            ],
            "Section C—Current Year Credit": [
                { pattern: /^\[27\]/, order: 1 },
                { pattern: /^\[28\] Subtract line 27 from line 13 or line 26/, order: 2 },
                { pattern: /^\[29\] Credit for increasing research activities from partnerships/, order: 3 },
                { pattern: "[30] Add lines 28 and 29", order: 4 },
                { pattern: /^\[31\] Amount allocated to beneficiaries/, order: 5 },
                { pattern: /^\[32\] Estates and trusts/, order: 6 }
            ],
            "Section D—Qualified Small Business Payroll Tax Election and Payroll Tax Credit. Skip this section if the payroll tax election does not apply. See instructions.": [
                { pattern: /^\[33 a\]/, order: 1 },
                { pattern: /^\[33 b\]/, order: 2 },
                { pattern: /^\[34\]/, order: 3 },
                { pattern: /^\[35\]/, order: 4 },
                { pattern: /^\[36\]/, order: 5 }
            ],
            "Section E—Other Information. See instructions.": [
                { pattern: /^\[37\]/, order: 1 },
                { pattern: /^\[38\]/, order: 2 },
                { pattern: /^\[39\]/, order: 3 },
                { pattern: /^\[40\]/, order: 4 },
                { pattern: /^\[41\]/, order: 5 }
            ],
            "Section F—Qualified Research Expenses Summary. See instructions.": [
                { pattern: /^\[42\] Total wages for qualified services/, order: 1 },
                { pattern: "[43] Total costs of supplies for all business components", order: 2 },
                { pattern: "[44] Total rental or lease cost of computers for all business components", order: 3 },
                { pattern: "[45] Total applicable amount of contract research for all business components (do not include basic research payments)", order: 4 },
                { pattern: "[46] Enter the applicable amount of all basic research payments. See instructions", order: 5 },
                { pattern: "[47] Add line 45 and line 46", order: 6 },
                { pattern: /^\[48\] Add lines 42, 43, 44, and 47/, order: 7 }
            ]
        },
        BOLD: [
        ]
    },
    WI: {
        sectionOrder: [
            "Wisconsin Schedule R — Research Credits"
        ],
        sectionFieldOrders: {
            "Wisconsin Schedule R — Research Credits": [
                { pattern: /^\[1\]\s*Enter Wisconsin research wage expenses/, order: 1 },
                { pattern: /^\[2\]\s*Enter Wisconsin research supplies expenses/, order: 2 },
                { pattern: /^\[3\]\s*Enter Wisconsin research computer rental expenses/, order: 3 },
                { pattern: /^\[4\]\s*Enter applicable percentage of Wisconsin contract research expenses/, order: 4 },
                { pattern: /^\[5\]\s*Enter expenses used to compute the federal orphan drug credit/, order: 5 },
                { pattern: /^\[6\]\s*Add lines 1 through 5/, order: 6 },
                { pattern: /^\[7\]\s*Wages included on line 6 that qualify for the Wisconsin development zones credit/, order: 7 },
                { pattern: /^\[8\]\s*Subtract line 7 from line 6/, order: 8 },
                { pattern: /^\[9\]\s*Enter average Wisconsin qualified research expenses for the three prior years/, order: 9 },
                { pattern: /^\[9a\]\s*1st prior year qualified research expenses/, order: 10 },
                { pattern: /^\[9b\]\s*2nd prior year qualified research expenses/, order: 11 },
                { pattern: /^\[9c\]\s*3rd prior year qualified research expenses/, order: 12 },
                { pattern: /^\[9d\]\s*Total \(add lines 9a through 9c\)/, order: 13 },
                { pattern: /^\[9e\]\s*Divide line 9d by 3/, order: 14 },
                { pattern: /^\[10\]\s*Multiply line 9e by 50%/, order: 15 },
                { pattern: /^\[11\]\s*Subtract line 10 from line 8/, order: 16 },
                { pattern: /^\[12\]\s*Check one of the boxes below to indicate the credit being claimed/, order: 17 },
                { pattern: /^\[12a\]\s*Qualified research activities \(5\.75%\)/, order: 18 },
                { pattern: /^\[12b\]\s*Qualified research activities related to internal combustion engines \(11\.5%\)/, order: 19 },
                { pattern: /^\[12c\]\s*Qualified research activities related to certain energy efficient products \(11\.5%\)/, order: 20 },
                { pattern: /^\[13\]\s*If line 10 is -0- because you did not have qualified research expenses/, order: 21 },
                { pattern: /^\[13a\]\s*Qualified research activities \(2\.875%\)/, order: 22 },
                { pattern: /^\[13b\]\s*Qualified research activities related to internal combustion engines \(5\.75%\)/, order: 23 },
                { pattern: /^\[13c\]\s*Qualified research activities related to certain energy efficient products \(5\.75%\)/, order: 24 },
                { pattern: /^\[14\]\s*Multiply line 11 by the credit rate indicated on line/, order: 25 },
                { pattern: /^\[15a\]\s*Entity Name/, order: 26 },
                { pattern: /^\[15a\]\s*FEIN/, order: 27 },
                { pattern: /^\[15b\]\s*Entity Name/, order: 28 },
                { pattern: /^\[15b\]\s*FEIN/, order: 29 },
                { pattern: /^\[15c\]\s*Total pass through credits from additional schedule/, order: 30 },
                { pattern: /^\[15d\]\s*Total pass through credits \(add lines 15a through 15c\)/, order: 31 },
                { pattern: /^\[16\]\s*Total research credits \(add lines 14 and 15d\)/, order: 32 },
                { pattern: /^\[16a\]\s*Fiduciaries - Fill in the amount of credit allocated to beneficiaries/, order: 33 },
                { pattern: /^\[16b\]\s*Fiduciaries - Subtract line 16a from line 16/, order: 34 },
                { pattern: /^\[17\]\s*Multiply line 16 .*by \.25 \(25%\)/, order: 35 },
                { pattern: /^\[18\]\s*Amount of credit from line 16 .*used to offset tax/, order: 36 },
                { pattern: /^\[19\]\s*Subtract line 18 from line 16/, order: 37 },
                { pattern: /^\[20\]\s*Enter the lesser of line 17 or line 19/, order: 38 },
                { pattern: /^\[21\]\s*Subtract line 20 from line 19/, order: 39 },
                { pattern: /^\[22\]\s*Carryover of prior year.*s unused research credit/, order: 40 },
                { pattern: /^\[23\]\s*Add lines 18, 21, and 22/, order: 41 }
            ]
        },
        BOLD: []
    },
    DC: {
        sectionOrder: [
            "Section A — Section A—Regular Credit. Skip this section and go to Section B if you are electing or previously elected (and are not revoking) the alternative simplified credit.",
            "Section B—Alternative Simplified Credit. Skip this section if you are completing Section A.",
            "Section C—Current Year Credit"
        ],
        sectionFieldOrders: {
            "Section A — Section A—Regular Credit. Skip this section and go to Section B if you are electing or previously elected (and are not revoking) the alternative simplified credit.": [
                { pattern: /^\[1\] Certain amounts paid or incurred to energy consortia/, order: 1 },
                { pattern: /^\[2\] Basic research payments to qualified organizations/, order: 2 },
                { pattern: /^\[3\] Qualified organization base period amount/, order: 3 },
                { pattern: /^Subtract line 3 from line 2/, order: 4 },
                { pattern: /^\[4\] Note: Complete Section F/, order: 5 },
                { pattern: /^\[5\] Total qualified research expenses \(QREs\)/, order: 6 },
                { pattern: /^\[6\] Enter fixed-base percentage/, order: 7 },
                { pattern: /^\[7\] Enter average annual gross receipts/, order: 8 },
                { pattern: /^\[8\] Multiply line 7 by the percentage on line 6/, order: 9 },
                { pattern: /^\[9\] Subtract line 8 from line 5/, order: 10 },
                { pattern: /^\[10\] Multiply line 5 by/, order: 11 },
                { pattern: /^\[11\] Enter the smaller of line 9 or line 10/, order: 12 },
                { pattern: /^\[12\] Add lines 1, 4, and 11/, order: 13 },
                { pattern: /^\[13\]If you elect to reduce the credit under section 280C/, order: 14 }
            ],
            "Section B—Alternative Simplified Credit. Skip this section if you are completing Section A.": [
                { pattern: /^\[14\] Certain amounts paid or incurred to energy consortia/, order: 1 },
                { pattern: /^\[15\] Basic research payments to qualified organizations/, order: 2 },
                { pattern: /^\[16\] Qualified organization base period amount/, order: 3 },
                { pattern: /^\[17\] Subtract line 16 from line 15/, order: 4 },
                { pattern: /^\[18\] Add lines 14 and 17/, order: 5 },
                { pattern: /^\[19\] Multiply line 18 by/, order: 6 },
                { pattern: /^Note: Complete Section F before going to line 20/, order: 7 },
                { pattern: /^\[20\] Total qualified research expenses \(QREs\)/, order: 8 },
                { pattern: /^\[21\] Enter your total QREs for the prior 3 tax years/, order: 9 },
                { pattern: /^\[22\] Divide line 21 by 6/, order: 10 },
                { pattern: /^\[23\] Subtract line 22 from line 20/, order: 11 },
                { pattern: /^\[24\] Multiply line/, order: 12 },
                { pattern: /^\[25\] Add lines 19 and 24/, order: 13 },
                { pattern: /^\[26\] If you elect to reduce the credit under section 280C/, order: 14 }
            ],
            "Section C—Current Year Credit": [
                { pattern: /^\[27\]/, order: 1 },
                { pattern: /^\[28\] Subtract line 27 from line 13 or line 26/, order: 2 },
                { pattern: /^\[29\] Credit for increasing research activities from partnerships/, order: 3 },
                { pattern: /^\[30\] Add lines 28 and 29/, order: 4 },
                { pattern: /^\[31\] Amount allocated to beneficiaries/, order: 5 },
                { pattern: /^\[32\] Estates and trusts/, order: 6 }
            ]
        },
        BOLD: []
    },

    // USA Federal Form 6765 — RRC (Section A) and ASC (Section B)
    // Fields are matched against the FLATTENED section data
    // (rrc280C / asc280C sub-objects are merged into the parent section before ordering)
    USA: {
        sectionOrder: [
            "(Regular Credit)",
            "(ASC Credit)"
        ],
        sectionFieldOrders: {
            "(Regular Credit)": [
                { pattern: /^\[5\]\s*Total Qualified Research Expenses$/, order: 1 },
                { pattern: /^\[6\]\s*Fixed-base percentage$/, order: 2 },
                { pattern: /^\[7\]\s*Average Annual Gross Receipts$/, order: 3 },
                { pattern: /^\[8\]\s*Multiply line 7 by percentage on line 6$/, order: 4 },
                { pattern: /^\[9\]\s*Subtract line 8 from line 5$/, order: 5 },
                { pattern: /^\[10\]\s*Multiply line 5 by/, order: 6 },
                { pattern: /^\[11\]\s*Enter smaller of line 9 or line 10$/, order: 7 },
                { pattern: /^\[13\]\s*Electing reduced credit under 280C$/, order: 8 },
                { pattern: /^Multiply line 11 by/, order: 9 }
            ],
            "(ASC Credit)": [
                { pattern: /^\[20\]\s*Total Qualified Research Expenses$/, order: 1 },
                { pattern: /^\[21\]\s*Total QREs for prior 3 tax years$/, order: 2 },
                { pattern: /^\[22\]\s*Divide line 21 by 6\.0$/, order: 3 },
                { pattern: /^\[23\]\s*Subtract line 22 from line 20$/, order: 4 },
                { pattern: /^Enter \d+%/, order: 5 },
                { pattern: /^\[24\]\s*Multiply line 23 by the percentage above$/, order: 6 },
                { pattern: /^\[25\]\s*Add lines 19 and 24$/, order: 7 },
                { pattern: /^\[26\]\s*Electing reduced credit under 280C$/, order: 8 },
                { pattern: /^Multiply line 20 by/, order: 9 }
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
        logMessage(`No field ordering configuration found for state: ${stateCode}`);
        return computedFields;
    }

    // Handle states with computed_fields wrapper (NJ, CO, etc.)
    if (
        (stateCode === "CO" || stateCode === "NJ") &&
        config.sectionFieldOrders["computed_fields"]
    ) {
        // Reorder the top-level computed_fields object
        const reorderedComputedFields = reorderSectionFields(
            computedFields.computed_fields || computedFields,
            config.sectionFieldOrders["computed_fields"]
        );
        
        // Now reorder fields within each section
        const finalReorderedFields: any = {};
        config.sectionOrder.forEach(sectionKey => {
            if (reorderedComputedFields[sectionKey]) {
                if (config.sectionFieldOrders[sectionKey]) {
                    finalReorderedFields[sectionKey] = reorderSectionFields(
                        reorderedComputedFields[sectionKey],
                        config.sectionFieldOrders[sectionKey]
                    );
                } else {
                    finalReorderedFields[sectionKey] = reorderedComputedFields[sectionKey];
                }
            }
        });

        // Add BOLD array from configuration
        if (config.BOLD && config.BOLD.length > 0) {
            finalReorderedFields.BOLD = config.BOLD;
        }

        return {
            computed_fields: finalReorderedFields
        };
    }

    const reorderedFields: any = {};

    config.sectionOrder.forEach(sectionKey => {

        if (computedFields[sectionKey]) {
            if (config.sectionFieldOrders[sectionKey]) {
                reorderedFields[sectionKey] = reorderSectionFields(
                    computedFields[sectionKey], 
                    config.sectionFieldOrders[sectionKey]
                );
            } else {
                reorderedFields[sectionKey] = computedFields[sectionKey];
            }
        } else {
            // Try to find a match with similar text (for cases where there might be encoding differences)
            const similarSection = Object.keys(computedFields).find(availableSection => {
                const normalizedAvailable = availableSection.trim().replace(/\s+/g, ' ').replace(/'/g, "'");
                const normalizedConfig = sectionKey.trim().replace(/\s+/g, ' ').replace(/'/g, "'");
                return normalizedAvailable === normalizedConfig;
            });
            
            if (similarSection) {
                if (config.sectionFieldOrders[sectionKey]) {
                    reorderedFields[similarSection] = reorderSectionFields(
                        computedFields[similarSection], 
                        config.sectionFieldOrders[sectionKey]
                    );
                } else {
                    reorderedFields[similarSection] = computedFields[similarSection];
                }
            }
        }
    });

    Object.keys(computedFields).forEach(sectionKey => {
        if (!reorderedFields[sectionKey] && sectionKey !== 'BOLD') {
            reorderedFields[sectionKey] = computedFields[sectionKey];
        }
    });

    // Add BOLD array from configuration
    if (config.BOLD && config.BOLD.length > 0) {
        reorderedFields.BOLD = config.BOLD;
    }
    
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

export const IL_LINE_ORDER: Array<{
    label?: string;   // optional
    pattern: RegExp;
}> = [
    { label: "[Line 23] Illinois wages for qualified services", pattern: /^\[Line 23\]/ },
    { label: "[Line 24] Illinois cost of supplies", pattern: /^\[Line 24\]/ },
    { label: "[Line 25] Illinois rental or lease costs of computers", pattern: /^\[Line 25\]/ },
    { pattern: /^\[Line 26\]\s*\d+(\.\d+)?% of Illinois contract expenses/ },
    {
        label:
        "[Line 27] Illinois basic research payments to qualified organizations (corporations only)",
        pattern: /^\[Line 27\]/
    },
    {
        label:
        "[Line 28] Add lines 23 through 27 of each column. Total Illinois qualifying expenses",
        pattern: /^\[Line 28\]/
    },
    {
        label:
        "[Line 29] Subtract Column A, Line 28 from Column B, Line 28. If negative, enter zero",
        pattern: /^\[Line 29\]/
    },
    { pattern: /^\[Line 30\]\s*Multiply Line 29 by \d+(\.\d+)?%/ },
    {
        label:
        "[Line 31] Enter any distributive share of R&D Credit from partnerships and S corporations",
        pattern: /^\[Line 31\]/
    },
    { label: "[Line 32] IL Research and Development Credit", pattern: /^\[Line 32\]/ }
];

