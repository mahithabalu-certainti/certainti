class FinancialRDPreviewService {

    /**
     * 
     * @returns 
     */
    loadDataForGA() {
        //This can used inside the compute method
        // currentYearQREs = this.loadData.currentYearQREs;
        // annualGrossReceipts = this.loadData.annualGrossReceipts;
        // prior3YearsQREs = this.loadData.prior3YearsQREs;

        const annualGrossReceipts: any[] = [
            { fiscalYear: 2025, grossReceipts: 1000000 },
            { fiscalYear: 2024, grossReceipts: 900000 },
            { fiscalYear: 2023, grossReceipts: 800000 },
            { fiscalYear: 2022, grossReceipts: 700000 }
        ];

        const prior3YearsQREs: any[] = [
            { fiscalYear: 2024, qre: 75000 },
            { fiscalYear: 2023, qre: 60000 },
            { fiscalYear: 2022, qre: 50000 }
        ];

        const currentYearQREs = {
            wages: 50000,
            supplies: 50000,
            contract: 0,
            business_tax_liability: 50000
        }

        return {
            annualGrossReceipts,
            prior3YearsQREs,
            currentYearQREs
        }

    }

    /**
     * 
     * @returns 
     */
    loadDataForCT() {
        //This can used inside the compute method
        // currentYearQREs = this.loadData.currentYearQREs;
        // prior3YearsQREs = this.loadData.prior3YearsQREs;
        const prior3YearsQREs: any[] = [
            { fiscalYear: 2024, qre: 50000 },
            { fiscalYear: 2023, qre: 60000 },
            { fiscalYear: 2022, qre: 50000 }
        ];

        const currentYearQREs = {
            wages: 50000,
            supplies: 50000,
            contract: 0,
            business_tax_liability: 200000
        }

        return {
            prior3YearsQREs,
            currentYearQREs
        }
    }

    /**
     * 
     * @returns 
     */
    loadDataForIL() {

        // currentYearQREs = this.loadData.currentYearQREs;
        // prior3YearsQREs = this.loadData.prior3YearsQREs;

        const prior3YearsQREs: any[] = [
            { fiscalYear: 2024, qre: 50000, wages: 80000, contract: 50000 },
            { fiscalYear: 2023, qre: 60000, wages: 60000, contract: 40000 },
            { fiscalYear: 2022, qre: 50000, wages: 50000, contract: 25000 }
        ];

        const currentYearQREs = {
            wages: 100000,
            supplies: 0,
            contract: 100000
        }

        return {
            prior3YearsQREs,
            currentYearQREs
        }
    }

    loadDataForMA() {
        //This can used inside the compute method
        // currentYearQREs = this.loadData.currentYearQREs;
        // annualGrossReceipts = this.loadData.annualGrossReceipts;
        // prior3YearsQREs = this.loadData.prior3YearsQREs;

        const annualGrossReceipts: any[] = [
            { fiscalYear: 2025, grossReceipts: 2000000 },
            { fiscalYear: 2024, grossReceipts: 1900000 },
            { fiscalYear: 2023, grossReceipts: 1800000 },
            { fiscalYear: 2022, grossReceipts: 1600000 },
            { fiscalYear: 2021, grossReceipts: 1500000 }
        ];

        const prior3YearsQREs: any[] = [
            { fiscalYear: 2024, wages: 80000, contract: 50000 },
            { fiscalYear: 2023, wages: 60000, contract: 40000 },
            { fiscalYear: 2022, wages: 50000, contract: 25000 }
        ];

        const currentYearQREs = {
            wages: 100000,
            supplies: 0,
            contract: 100000,
            business_tax_liability: 0
        }

        return {
            annualGrossReceipts,
            prior3YearsQREs,
            currentYearQREs
        }

    }
}

export default FinancialRDPreviewService;