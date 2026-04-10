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
import { RdCreditCalculatorForVA } from "./vaRdCreditCalculator";
import { RdCreditCalculatorForKS } from "./ksRdCreditCalculator";
import { RdCreditCalculatorForLA } from "./laRdCreditCalculator";
import { RdCreditCalculatorForKY } from "./kyRdCreditCalculator";
import { RdCreditCalculatorForWI } from "./wiRdCreditCalculator";
import { RdCreditCalculatorForDC } from "./dcRdCreditCalculator";
import { RdCreditCalculatorForNM } from "./nmRdCreditCalculator";
import { RdCreditCalculatorForIA } from "./iaRdCreditCalculator";
import { RdCreditCalculatorForRI } from "./riRdCreditCalculator";
import { RdCreditCalculatorForMN } from "./mnRdCreditCalculator";
import { RdCreditCalculatorForVT } from "./vtRdCreditCalculator";
import { RdCreditCalculatorForNH } from "./nhRdCreditCalculator";
import { RdCreditCalculatorForME } from "./meRdCreditCalculator";
import { RdCreditCalculatorForNE } from "./neRdCreditCalculator";
import { RdCreditCalculatorForNY } from "./nyRdCreditCalculator";


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
    "ON": new RdCreditCalculatorForON(),
    "VA": new RdCreditCalculatorForVA(),
    "KS": new RdCreditCalculatorForKS(),
    "KY": new RdCreditCalculatorForKY(),
    "LA": new RdCreditCalculatorForLA(),
    "WI":new RdCreditCalculatorForWI(),
    "DC": new RdCreditCalculatorForDC(),
    "NM": new RdCreditCalculatorForNM(),
    "IA": new RdCreditCalculatorForIA(),
    "RI": new RdCreditCalculatorForRI(),
    "MN": new RdCreditCalculatorForMN(),
    "VT": new RdCreditCalculatorForVT(),
    "NH": new RdCreditCalculatorForNH(),
    "ME": new RdCreditCalculatorForME(),
    "NE": new RdCreditCalculatorForNE(),
    "NY": new RdCreditCalculatorForNY()
};
