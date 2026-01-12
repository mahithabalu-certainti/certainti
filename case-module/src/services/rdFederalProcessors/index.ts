import { RdCreditCalculatorForAus } from "./aus.rd-credit-calculator";
import { RdCreditCalculatorForCAN } from "./can.rd-credit-calculator";
import { RdCreditCalculatorForIRL } from "./irl.rd-credit-calculator";
import { RdCreditCalculatorForUK } from "./uk.rd-credit-calculator";
import { RdCreditCalculatorForUSA } from "./usa.rd-credit-calculator";

export const federalCalculators: any = {
    "USA": new RdCreditCalculatorForUSA(),
    "GBR": new RdCreditCalculatorForUK(),
    "IRL": new RdCreditCalculatorForIRL(),
    "AUS": new RdCreditCalculatorForAus(),
    "CAN": new RdCreditCalculatorForCAN()
};