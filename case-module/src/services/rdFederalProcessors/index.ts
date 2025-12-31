import { RdCreditCalculatorForUK } from "./uk.rd-credit-calculator";
import { RdCreditCalculatorForUSA } from "./usa.rd-credit-calculator";

export const federalCalculators: any = {
    "USA": new RdCreditCalculatorForUSA(),
    "GBR": new RdCreditCalculatorForUK()
};