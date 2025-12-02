// QRE for both current year and prior years
export interface QRE {
    fiscalYear?: number;          // optional for current year
    wages?: number;
    supplies?: number;
    contract?: number;
    qre?: number;                 // only for prior years
    business_tax_liability?: number; // only for current year
}

// Annual Gross Receipts
export interface AnnualGrossReceipt {
    fiscalYear: number;
    grossReceipts: number;
}

// Combined state RD data
export interface StateRDData {
    currentYearQREs: QRE;
    prior3YearsQREs: QRE[];
    annualGrossReceipts?: AnnualGrossReceipt[]; // current year + prior 4 years
}
