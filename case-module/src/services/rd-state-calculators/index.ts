import { RdCreditCalculatorForAZ } from "./az.rd-credit-calculator";
import { RdCreditCalculatorForCA } from "./ca.rd-credit-calculator";
import { RdCreditCalculatorForNJ } from "./nj.rd-credit-calculator";
import { RdCreditCalculatorForCO } from "./co.rd-credit-calculator";
import { RdCreditCalculatorForCT } from "./ct.rd-credit-calculator";
import { RdCreditCalculatorForGA } from "./ga.rd-credit-calculator";
import { RdCreditCalculatorForIL } from "./il.rd-credit-calculator";

export const stateCalculators: any = {
    "AZ": new RdCreditCalculatorForAZ(),
    "CA": new RdCreditCalculatorForCA(),
    "CO": new RdCreditCalculatorForCO(),
    "CT": new RdCreditCalculatorForCT(),
    "GA": new RdCreditCalculatorForGA(),
    "IL": new RdCreditCalculatorForIL(),
    "NJ": new RdCreditCalculatorForNJ()
};
