import { FederalRDData, StateRDData } from "./rdCreditTypes";

/**
 * Mock Data for State RD Computation
 * To load mock Data :
 * import { StateMockDataLoadMap } from "../financialRDCredit/rdDataLoadMockService";
 * stateRdData = StateMockDataLoadMap["CT"]!;
 */
export const StateMockDataLoadMap: Record<string, StateRDData> = {
    CO: {
        prior3YearsQREs: [
            { fiscalYear: 2024, qre: 75000 },
            { fiscalYear: 2023, qre: 50000 },
            { fiscalYear: 2022, qre: 50000 }
        ],
        currentYearQREs: {
            wages: 50000,
            supplies: 50000,
            contract: 0,
            business_tax_liability: 0
        }
    },
    
    GA: {
        annualGrossReceipts: [
            { fiscalYear: 2025, grossReceipts: 1000000 },
            { fiscalYear: 2024, grossReceipts: 900000 },
            { fiscalYear: 2023, grossReceipts: 800000 },
            { fiscalYear: 2022, grossReceipts: 700000 }
        ],
        prior3YearsQREs: [
            { fiscalYear: 2024, qre: 75000 },
            { fiscalYear: 2023, qre: 60000 },
            { fiscalYear: 2022, qre: 50000 }
        ],
        currentYearQREs: {
            wages: 50000,
            supplies: 50000,
            contract: 0,
            business_tax_liability: 50000
        }
    },

    CT: {
        prior3YearsQREs: [
            { fiscalYear: 2024, qre: 50000 },
            { fiscalYear: 2023, qre: 60000 },
            { fiscalYear: 2022, qre: 50000 }
        ],
        currentYearQREs: {
            wages: 50000,
            supplies: 50000,
            contract: 0,
            business_tax_liability: 200000
        }
    },

    IL: {
        prior3YearsQREs: [
            { fiscalYear: 2024, qre: 50000, wages: 80000, contract: 50000 },
            { fiscalYear: 2023, qre: 60000, wages: 60000, contract: 40000 },
            { fiscalYear: 2022, qre: 50000, wages: 50000, contract: 25000 }
        ],
        currentYearQREs: {
            wages: 100000,
            supplies: 0,
            contract: 100000
        }
    },

    MA: {
        annualGrossReceipts: [
            { fiscalYear: 2025, grossReceipts: 2000000 },
            { fiscalYear: 2024, grossReceipts: 1900000 },
            { fiscalYear: 2023, grossReceipts: 1800000 },
            { fiscalYear: 2022, grossReceipts: 1600000 },
            { fiscalYear: 2021, grossReceipts: 1500000 }
        ],
        prior3YearsQREs: [
            { fiscalYear: 2024, wages: 80000, contract: 50000 },
            { fiscalYear: 2023, wages: 60000, contract: 40000 },
            { fiscalYear: 2022, wages: 50000, contract: 25000 }
        ],
        currentYearQREs: {
            wages: 100000,
            supplies: 0,
            contract: 100000,
            business_tax_liability: 0
        }
    },

    NJ: {
        prior3YearsQREs: [
            { fiscalYear: 2024, wages: 80000, contract: 50000 },
            { fiscalYear: 2023, wages: 60000, contract: 40000 },
            { fiscalYear: 2022, wages: 50000, contract: 25000 }
        ],
        currentYearQREs: {
            wages: 100000,
            supplies: 0,
            contract: 100000,
            business_tax_liability: 0
        }
    },

    OH: {
        prior3YearsQREs: [
            { fiscalYear: 2024, wages: 80000, contract: 50000 },
            { fiscalYear: 2023, wages: 60000, contract: 40000 },
            { fiscalYear: 2022, wages: 50000, contract: 25000 }
        ],
        currentYearQREs: {
            wages: 100000,
            supplies: 0,
            contract: 100000,
            business_tax_liability: 0
        }
    },

    SC: {
        prior3YearsQREs: [
            { fiscalYear: 2024, wages: 80000, contract: 50000 },
            { fiscalYear: 2023, wages: 60000, contract: 40000 },
            { fiscalYear: 2022, wages: 50000, contract: 25000 }
        ],
        currentYearQREs: {
            wages: 100000,
            supplies: 0,
            contract: 100000,
            business_tax_liability: 50000
        }
    },

    TX: {
        prior3YearsQREs: [
            { fiscalYear: 2024, wages: 80000, contract: 50000 },
            { fiscalYear: 2023, wages: 60000, contract: 40000 },
            { fiscalYear: 2022, wages: 50000, contract: 25000 }
        ],
        currentYearQREs: {
            wages: 100000,
            supplies: 0,
            contract: 100000,
            business_tax_liability: 0
        }
    },

    ID: {
        prior3YearsQREs: [
            { fiscalYear: 2024, wages: 80000, contract: 50000 },
            { fiscalYear: 2023, wages: 60000, contract: 40000 },
            { fiscalYear: 2022, wages: 50000, contract: 25000 }
        ],
        currentYearQREs: {
            wages: 100000,
            supplies: 0,
            contract: 100000,
            business_tax_liability: 0
        }
    }
};

export const FederalMockDataLoadMap: Record<string, FederalRDData> = {
    USA: {
        prior3YearsQREs: [
            { fiscalYear: 2024, qre:  3823236.75  },
            { fiscalYear: 2023, qre:  3751258.87  },
            { fiscalYear: 2022, qre:  3368174.98  }
        ],
        currentYearQREs: {
            wages:  2263944.15 ,
            supplies: 0,
            contract:  795909.20 ,
            business_tax_liability: 0
        }
    }
}
