import { RdCreditCalculatorForAZ } from "./azRdCreditCalculator";
import { RdCreditCalculatorForCA } from "./caRdCreditCalculator";
import { RdCreditCalculatorForNJ } from "./njRdCreditCalculator";
import { RdCreditCalculatorForCO } from "./coRdCreditCalculator";
import { RdCreditCalculatorForCT } from "./ctRdCreditCalculator";
import { RdCreditCalculatorForGA } from "./gaRdCreditCalculator";
import { RdCreditCalculatorForIL } from "./ilRdCreditCalculator";
import { RdCreditCalculatorForMA } from "./maRdCreditCalculator";
import { RdCreditCalculatorForOH } from "./ohRdCreditCalculator";
import { RdCreditCalculatorForSC } from "./scRdCreditCalculator";
import { RdCreditCalculatorForTX } from "./txRdCreditCalculator";
import { RdCreditCalculatorForID } from "./idRdCreditCalculator";
import { RdCreditCalculatorForON } from "./ontarioCreditCalculator";

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
