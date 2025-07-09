import { initSequelize } from "../config/maindbDataSource"
import { initOrgSequelize } from "../config/orgdbDataSource"
import { Account } from "../models/accountModel"
import { Status } from "../models/statusModel"
import { FLAG, HttpStatus, rawQueries, STATUS, STATUS_MESSAGE, TYPES_FLAG } from "../utils/constant"
import { setAccountDetails, setInlineValues, setKeyContact, setKeyContactData } from "../utils/helpers"
import configurations from "../config/config";

class AccountGraphQlServices {
    async inlineEditAccount(data : any) {
    let parentAccount: any
    let accountDetails: any
    let schemaName: string
    let flag : string
    let typeFlag : string

    const services = configurations.getInstance().getServices();
    const accountServices = services.accountServices;

    const sequelize = await initOrgSequelize()
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
                    typeFlag = TYPES_FLAG.child
                    flag = FLAG.restAPI
                } else {
                    typeFlag = TYPES_FLAG.parent
                    flag = FLAG.graphql
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
                    
                    let response = await accountServices.accountList(1, 1000, '', {account_number:{equals:`${fetchAccountById.r_number}`}}, 'account_name', 'ASC', {}, 'FY-All', flag, typeFlag)
                    let finalData = response.data?.account.data.map((d : any) => {
                    return {
                        rid : d.rid,
                        account_name : d.account_name,
                        currency_rid : d.currency_rid,
                        total_project_hours : d.total_project_hours,
                        total_projects : d.total_projects,
                        total_project_cost : d.total_project_cost,
                        total_projects_rd_credits : d.total_projects_rd_credits,
                        qualifying_project_hours_fed : d.qualifying_project_hours_fed,
                        qualifying_project_qre_fed : d.qualifying_project_qre_fed,
                        qualifying_project_rd_credits_fed : d.qualifying_project_rd_credits_fed,
                        r_number : d.r_number,
                        storage_type : d.storage_type,
                        professional_services_consultant : d.professional_services_consultant,
                        finance_lead : d.finance_lead,
                        finance_executive : d.finance_executive,
                        country : d.country == null ? null : {
                            rid : d.country.dataValues.rid,
                            country_name : d.country.dataValues.country_name
                        },
                        currency : d.currency == null ? null : {
                            rid : d.currency.dataValues.rid,
                            currency_name : d.currency.dataValues.currency_name,
                            currency_code : d.currency.dataValues.currency_code,
                            currency_symbol : d.currency.dataValues.currency_symbol
                        },
                        industry : d.industry == null ? null : {
                            rid : d.industry.dataValues.rid,
                            industry_name : d.industry.dataValues.industry_name
                        },
                        status : d.status == null ? null : {
                            status_name : d.status.dataValues.status_name
                        },
                        child_accounts : d.child_accounts.length < 1 ? [] : d.child_accounts.map((da : any) => {
                            return {
                                rid : da.rid,
                                account_name : da.account_name,
                                parent_account_rid : da.parent_account_rid,
                                currency_rid : da.currency_rid,
                                total_project_hours : da.total_project_hours,
                                total_projects : da.total_projects,
                                total_project_cost : da.total_project_cost,
                                total_projects_rd_credits : da.total_projects_rd_credits,
                                qualifying_project_hours_fed : da.qualifying_project_hours_fed,
                                qualifying_project_qre_fed : da.qualifying_project_qre_fed,
                                qualifying_project_rd_credits_fed : da.qualifying_project_rd_credits_fed,
                                r_number : da.r_number,
                                storage_type : da.storage_type,
                                professional_services_consultant : da.professional_services_consultant,
                                finance_lead : da.finance_lead,
                                finance_executive : da.finance_executive,
                                country : da.country == null ? null : {
                                    rid : da.country.dataValues.rid,
                                    country_name : da.country.dataValues.country_name
                                },
                                currency : da.currency == null ? null : {
                                    rid : da.currency.dataValues.rid,
                                    currency_code : da.currency.dataValues.currency_code,
                                    currency_symbol: da.currency.dataValues.currency_symbol
                                },
                                parent_account : da.parent_account == null ? null : {
                                    rid : da.parent_account.dataValues.rid,
                                    account_name : da.parent_account.dataValues.account_name
                                },
                                industry : da.industry == null ? null : {
                                    rid : da.industry.dataValues.rid,
                                    industry_name : da.industry.dataValues.industry_name
                                },
                                status : {
                                    status_name : da.status.dataValues.status_name
                                },
                               projects_by_fiscal_year : da.projects_by_fiscal_year.length < 1 ? [] : da.projects_by_fiscal_year.map((dat : any) => {
                                return {
                                    fiscal_year : dat.fiscal_year,
                                    account_rid : dat.account_rid,
                                    total_projects : dat.total_projects,
                                    total_project_hours : dat.total_project_hours,
                                    total_project_cost : dat.total_project_cost,
                                    qualifying_project_hours_fed : dat.qualifying_project_hours_fed,
                                    qualifying_project_qre_fed : dat.qualifying_project_qre_fed,
                                    qualifying_project_rd_credits_fed : dat.qualifying_project_rd_credits_fed,
                                    total_projects_rd_credits : dat.total_projects_rd_credits
                                }
                               }) 
                            }
                        })
                    }
                    })
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        statusMessage: STATUS_MESSAGE.accountUpdateSuccess,
                        data : finalData
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