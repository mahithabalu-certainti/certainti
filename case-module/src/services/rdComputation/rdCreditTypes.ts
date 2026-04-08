// QRE for both current year and prior years
export interface QRE {
    fiscalYear?: number;          // optional for current year
    wages?: number;
    supplies?: number;
    contract?: number;
    qre?: number;                 // only for prior years
    business_tax_liability_sc?: number; // only for current year
    business_tax_liability_ct?: number;
    business_tax_liability_ga?: number;
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
    currentYearQREsFederal?:QRE;
    annualGrossReceipts?: AnnualGrossReceipt[]; // current year + prior 4 years
}

// Combined federal RD data
export interface FederalRDData {
    currentYearQREs: QRE;
    prior3YearsQREs: QRE[];
    annualGrossReceipts?: AnnualGrossReceipt[]; // current year + prior 4 years
}
