import { RdCreditCalculatorForAZ } from "./az.rd-credit-calculator";
import { RdCreditCalculatorForCA } from "./ca.rd-credit-calculator";
import { RdCreditCalculatorForNJ } from "./nj.rd-credit-calculator";
import { RdCreditCalculatorForCO } from "./co.rd-credit-calculator";

export const stateCalculators: any = {
    "AZ": new RdCreditCalculatorForAZ(),
    "CA": new RdCreditCalculatorForCA(),
    "CO": new RdCreditCalculatorForCO(),
    "NJ": new RdCreditCalculatorForNJ()
};
