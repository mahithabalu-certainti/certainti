import { RdCreditCalculatorForAZ } from "./az.rd-credit-calculator";
import { RdCreditCalculatorForCA } from "./ca.rd-credit-calculator";
import { RdCreditCalculatorForNJ } from "./nj.rd-credit-calculator";
import { RdCreditCalculatorForCO } from "./co.rd-credit-calculator";
import { RdCreditCalculatorForCT } from "./ct.rd-credit-calculator";
import { RdCreditCalculatorForGA } from "./ga.rd-credit-calculator";
import { RdCreditCalculatorForIL } from "./il.rd-credit-calculator";
import { RdCreditCalculatorForMA } from "./ma.rd-credit-calculator";
import { RdCreditCalculatorForOH } from "./oh.rd-credit-calculator";
import { RdCreditCalculatorForSC } from "./sc.rd-credit-calculator";
import { RdCreditCalculatorForTX } from "./tx.rd-credit-calculator";
import { RdCreditCalculatorForID } from "./id.rd-credit-calculator";
import { RdCreditCalculatorForON } from "./ontario-credit-calculator";

export const stateCalculators: any = {
    "AZ": new RdCreditCalculatorForAZ(),
    "CA": new RdCreditCalculatorForCA(),
    "CO": new RdCreditCalculatorForCO(),
    "CT": new RdCreditCalculatorForCT(),
    "GA": new RdCreditCalculatorForGA(),
    "IL": new RdCreditCalculatorForIL(),
    "MA": new RdCreditCalculatorForMA(),
    "NJ": new RdCreditCalculatorForNJ(),
    "OH": new RdCreditCalculatorForOH(),
    "SC": new RdCreditCalculatorForSC(),
    "TX": new RdCreditCalculatorForTX(),
    "ID": new RdCreditCalculatorForID(),
    "ON": new RdCreditCalculatorForON()
};
