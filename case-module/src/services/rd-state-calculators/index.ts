import { AZrdCreditCalculator } from "./az.rd-credit-calculator";
import { CArdCreditCalculator } from "./ca.rd-credit-calculator";
import { NYrdCreditCalculator } from "./ny.rd-credit-calculator";

export const stateCalculators: any = {
    "AZ": new AZrdCreditCalculator(),
    "CA": new CArdCreditCalculator(),
    "NY": new NYrdCreditCalculator()
};
