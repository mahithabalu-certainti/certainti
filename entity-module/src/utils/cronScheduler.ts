import cron from "node-cron";
import axios from "axios";
import { CurrencyConversion } from "../models/currencyConversionModel";
import { errorLog, logMessage } from "./helpers";
import { initMainDbSequelize } from "../config/mainDataSource";

const CURRENCY_API_URL = "https://open.er-api.com/v6/latest/USD";

let isModelInitialized = false;

async function ensureModelInitialized() {
  if (!isModelInitialized) {
    const sequelize = await initMainDbSequelize();
    CurrencyConversion.initialize(sequelize);
    isModelInitialized = true;
  }
}

// Run twice a day: at midnight and noon (00:00 and 12:00)
// This will fetch conversion rates to USD and update the DB
async function syncCurrencyConversion() {
  logMessage("Starting Currency Conversion sync...");
  try {
    await ensureModelInitialized();

    const response = await axios.get(CURRENCY_API_URL);
    if (response.data && response.data.rates) {
      const rates = response.data.rates;
      const baseCurrencyCode = response.data.base_code;

      const records = [];
      for (const [toCurrencyCode, rate] of Object.entries(rates)) {
         const rateNum = Number(rate);
         if (rateNum > 0) {
           records.push({
             from_currency_code: toCurrencyCode,
             to_currency_code: baseCurrencyCode,
             conversion_rate: 1 / rateNum,
           });
         }
      }

      // Upsert records into CurrencyConversion
      if (records.length > 0) {
        await CurrencyConversion.destroy({ where: { to_currency_code: baseCurrencyCode } });
        await CurrencyConversion.bulkCreate(records);
        logMessage(`Successfully updated ${records.length} currency conversion rates.`);
      }
    } else {
      errorLog("Currency Conversion Sync", "Invalid response from currency API.");
    }
  } catch (error) {
    errorLog("Currency Conversion Sync", (error as Error).message);
  }
}

// Run immediately on server start to populate initial data
syncCurrencyConversion();

// Run twice a day: at midnight and noon (00:00 and 12:00)
// This will fetch conversion rates to USD and update the DB
cron.schedule("0 0,12 * * *", syncCurrencyConversion);
