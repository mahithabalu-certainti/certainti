import { RdCreditCalculatorForAZ } from "./az.rd-credit-calculator";
import { RdCreditCalculatorForCA } from "./ca.rd-credit-calculator";
import { RdCreditCalculatorForNJ } from "./nj.rd-credit-calculator";

export const stateCalculators: any = {
    "AZ": new RdCreditCalculatorForAZ(),
    "CA": new RdCreditCalculatorForCA(),
    "NJ": new RdCreditCalculatorForNJ()
};
