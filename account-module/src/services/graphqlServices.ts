import { initSequelize } from "../config/maindbDataSource"
import { initOrgSequelize } from "../config/orgdbDataSource"
import { Account } from "../models/accountModel"
import { Status } from "../models/statusModel"
import { HttpStatus, rawQueries, STATUS, STATUS_MESSAGE } from "../utils/constant"
import { setAccountDetails, setInlineValues, setKeyContact, setKeyContactData } from "../utils/helpers"

class AccountGraphQlServices {
    async inlineEditAccount(data : any) {
    let parentAccount: any
    let accountDetails: any
    let schemaName: string

    const sequelize = await initOrgSequelize()
    const mainSequelize = await initSequelize()
    const fetchAccountById : any = await Account.findOne({
        where: {
            rid: data.account_rid
        },
        raw: true
    })
    if (fetchAccountById) {
        const isAccountActive = await Status.findOne({
            where: {
                rid: fetchAccountById.status_rid
            }, raw: true
        })
        if (isAccountActive) {
            if (isAccountActive.status_name == STATUS.active) {
                if (fetchAccountById.parent_account_rid != null) {
                    parentAccount = await Account.findOne({
                        where: {
                            rid: fetchAccountById.parent_account_rid
                        }, raw: true
                    })
                    schemaName = `"trd365_${parentAccount?.r_number?.replace('ACC-', '')}"`
                    accountDetails = await sequelize.query(rawQueries.fetchAccountDetails(schemaName, fetchAccountById.rid))
                } else {
                    schemaName = `"trd365_${fetchAccountById?.r_number?.replace('ACC-', '')}"`
                    accountDetails = await sequelize.query(rawQueries.fetchAccountDetails(schemaName, fetchAccountById.rid))
                }
                const setAccountData = setInlineValues(fetchAccountById, data, accountDetails[0])
                let updateAccount = await Account.update(setAccountData.newDbData, {
                    where: {
                        rid: fetchAccountById.rid
                    }
                })
                let accDetailsData = setAccountData.newDbAccDetailsData;
                await setAccountDetails(accDetailsData, schemaName, fetchAccountById.rid, sequelize)
                if (data.key_contacts !== undefined) {
                    if (data.key_contacts.length > 0) {
                        await setKeyContactData(data, sequelize, schemaName)
                    }
                }
                if (updateAccount.length > 0) {
                    let fetchUpdatedAccount = await Account.findOne({
                        where : {
                            rid : data.account_rid
                        }
                    })
                    let fetchAccount = await sequelize.query(rawQueries.fetchAccountWithRelevantData(schemaName, data.account_rid))
                    let fetchCountry : any = await mainSequelize.query(rawQueries.fetchCountry(fetchAccountById.country_rid))
                    let fetchIndustry : any = await mainSequelize.query(rawQueries.fetchIndustry(fetchAccountById.industry_rid))
                    let fetchCurrency : any = await mainSequelize.query(rawQueries.fetchCurrency(fetchAccountById.currency_rid))
                    let industry;
                    let country;
                    let currency;
                    if(fetchCountry[0][0] == undefined) country = null
                    else country = {
                                rid : fetchCountry[0][0].rid, 
                                country_name : fetchCountry[0][0].country_name
                            }
                    if(fetchIndustry[0][0] == undefined) industry = null
                    else industry = {
                                rid : fetchIndustry[0][0].rid,
                                industry_name : fetchIndustry[0][0].industry_name
                            }
                    if(fetchCurrency[0][0] == undefined) currency = null
                    else currency = {
                                rid : fetchCurrency[0][0].rid,
                                currency_name : fetchCurrency[0][0].currency_name,
                                currency_code : fetchCurrency[0][0].currency_code,
                                currency_symbol : fetchCurrency[0][0].currency_symbol
                            }
                    let response = fetchAccount[0].map((d : any) => {
                        return {
                            rid : d.account_rid,
                            parent_account_rid : fetchUpdatedAccount!.parent_account_rid,
                            account_name : d.account_name,
                            max_ai_interactions : d.max_ai_interactions,
                            autosend_interaction : d.autosend_interaction,
                            fiscal_start_date : d.fiscal_start_date,
                            fiscal_end_date : d.fiscal_end_date,
                            website : d.website,
                            storage_type : d.storage_type,
                            business_details : d.business_details,
                            finance_lead : fetchUpdatedAccount!.finance_lead,
                            finance_executive : fetchUpdatedAccount!.finance_executive,
                            professional_services_consultant : fetchUpdatedAccount!.professional_services_consultant,
                            industry_other : fetchUpdatedAccount!.industry_name_other,
                            country : country,
                            industry : industry,
                            currency : currency,
                            status : {
                                status_name : isAccountActive.status_name
                            },
                            total_project_hours : fetchUpdatedAccount!.total_project_hours,
                            total_projects : fetchUpdatedAccount!.total_projects,
                            qualifying_project_hours_fed : fetchUpdatedAccount!.qualifying_project_hours_fed,
                            qualifying_project_qre_fed : fetchUpdatedAccount!.qualifying_project_qre_fed,
                            qualifying_project_rd_credits_fed : fetchUpdatedAccount!.qualifying_project_rd_credits_fed
                        }
                    })
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        statusMessage: STATUS_MESSAGE.accountUpdateSuccess,
                        data : response
                    }
                }
            }
            else {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    statusMessage: STATUS_MESSAGE.accountInactive,
                    data : null
                }
            }
        }
    } else {
        return {
            statusCode: HttpStatus.NOT_FOUND,
            statusMessage: STATUS_MESSAGE.accountNoFound,
            data : null
        }
    }
}
}

export default AccountGraphQlServices