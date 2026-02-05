import { RdCreditCalculatorForAus } from "./ausRdCreditcalculator";
import { RdCreditCalculatorForCAN } from "./canRdCreditcalculator";
import { RdCreditCalculatorForIRL } from "./irlRdCreditCalculator";
import { RdCreditCalculatorForUK } from "./ukRdCreditCalculator";
import { RdCreditCalculatorForUSA } from "./usaRdCreditCalculator";

export const federalCalculators: any = {
    "USA": new RdCreditCalculatorForUSA(),
    "GBR": new RdCreditCalculatorForUK(),
    "IRL": new RdCreditCalculatorForIRL(),
    "AUS": new RdCreditCalculatorForAus(),
    "CAN": new RdCreditCalculatorForCAN()
};