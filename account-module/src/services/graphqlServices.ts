import { initSequelize } from "../config/maindbDataSource"
import { initOrgSequelize } from "../config/orgdbDataSource"
import { Account } from "../models/accountModel"
import { Status } from "../models/statusModel"
import { HttpStatus, rawQueries, STATUS, STATUS_MESSAGE } from "../utils/constant"
import { setAccountDetails, setInlineValues, setKeyContact, setKeyContactData } from "../utils/helpers"
import { Sequelize, Op, QueryTypes } from "sequelize";
import SchemaService from "./schemaService"

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
                if(data.account_name != undefined) {
                    const checkAccountNameExists = await Account.findOne({
                        where : {
                            account_name : {
                                [Op.iLike] : data.account_name
                            },
                            rid : {
                                [Op.ne] : data.account_rid
                            }
                        }
                    })
                    if(checkAccountNameExists) {
                        return {
                            statusCode: HttpStatus.BAD_REQUEST,
                            statusMessage: `An account with the name "${data.account_name}" already exists. Please choose a different name.`,
                            data: null
                        } 
                    }
                }
                if (fetchAccountById.storage_type == STATUS_MESSAGE.storeInParent) {
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
                if (
                    Object.keys(setAccountData.newDbData).length === 0 &&
                    Object.keys(setAccountData.newDbAccDetailsData).length === 0 
                    ) {
                    return {
                        statusCode: HttpStatus.BAD_REQUEST,
                        statusMessage: STATUS_MESSAGE.noDataToUpdate,
                        data: null
                    };
                    }
                // Store existing account name before update for comparison
                const existingAccName = fetchAccountById.account_name;
                
                let updateAccount = await Account.update(setAccountData.newDbData, {
                    where: {
                        rid: fetchAccountById.rid
                    }
                })
                if (updateAccount[0] === 0) {
                    return {
                        statusCode: HttpStatus.BAD_REQUEST,
                        statusMessage: STATUS_MESSAGE.accountUpdateFailed,
                        data: null
                    };
                }
                
                // Update group name if account name changed
                if (data.account_name != undefined && data.account_name !== existingAccName) 
                {
                    console.log("Account name changed from", existingAccName, "to", data.account_name);
                    const schemaService = new SchemaService();
                    await schemaService.updateGroupNameForAccount(fetchAccountById.rid, data.userId, fetchAccountById.is_parent, data.account_name);
                }           
                let accDetailsData = setAccountData.newDbAccDetailsData;
                await setAccountDetails(accDetailsData, schemaName, fetchAccountById.rid, sequelize)
                if (data.key_contacts !== undefined) {
                    if (data.key_contacts.length > 0) {
                        await setKeyContactData(data, sequelize, schemaName)
                    }
                }
                if (updateAccount.length > 0) {
                    let response : any = await mainSequelize.query(rawQueries.fetchAccountForInlineRespone(data.account_rid))
                    let d = response[0][0]
                    let finalData = {
                        rid : d.rid,
                        account_name : d.account_name,
                        parent_account_rid : d.parent_account_rid,
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
                            rid : d.country.rid,
                            country_name : d.country.country_name
                        },
                        currency : d.currency == null ? null : {
                            rid : d.currency.rid,
                            currency_code : d.currency.currency_code,
                            currency_symbol : d.currency.currency_symbol
                        },
                        industry : d.industry == null ? null : {
                            rid : d.industry.rid,
                            industry_name : d.industry.industry_name
                        },
                        status : d.status == null ? null : {
                            status_name : d.status.status_name
                        },
                        parent_account : d.parent_account == null ? null : {
                            rid : d.parent_account.rid,
                            account_name : d.parent_account.account_name
                        },
                        industry_name_other : d.industry_name_other
                    }
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
        } else {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    statusMessage: STATUS_MESSAGE.invalidStatus,
                    data : null
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