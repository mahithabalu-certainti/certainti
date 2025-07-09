import { initSequelize } from "../config/maindbDataSource"
import { initOrgSequelize } from "../config/orgdbDataSource"
import { Account } from "../models/accountModel"
import { Status } from "../models/statusModel"
import { HttpStatus, rawQueries, STATUS, STATUS_MESSAGE } from "../utils/constant"
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
                    let response = await accountServices.accountById(data.account_rid)
                    let d = response.data?.accountById
                    let finalData = {
                        rid : d.rid,
                        r_number : d.r_number,
                        eid : d.dataValues.eid,
                        created_by : d.dataValues.created_by,
                        modified_by : d.dataValues.modified_by,
                        created_datetime : d.dataValues.created_datetime,
                        modified_datetime : d.dataValues.modified_datetime,
                        comments : d.dataValues.comments,
                        account_name : d.dataValues.account_name,
                        status_rid : d.dataValues.status_rid,
                        is_parent : d.dataValues.is_parent,
                        annual_revenue : d.dataValues.annual_revenue,
                        region_rid : d.dataValues.region_rid,
                        storage_type : d.dataValues.storage_type,
                        logo_url : d.dataValues.logo_url,
                        organisation_name : d.dataValues.organisation_name,
                        parent_account_rid : d.dataValues.parent_account_rid,
                        database_connection_rid : d.dataValues.daabase_connection_rid,
                        country_rid : d.dataValues.country_rid,
                        currency_rid : d.dataValues.currency_rid,
                        industry_rid : d.dataValues.industry_rid,
                        industry_name_other : d.dataValues.industry_name_other,
                        is_file_drop_enabled : d.dataValues.is_file_drop_enabled,
                        file_drop_medium : d.dataValues.file_drop_medium,
                        file_drop_config_id : d.dataValues.file_drop_config_id,
                        professional_services_consultant : d.dataValues.professional_services_consultant,
                        finance_lead : d.dataValues.finance_lead,
                        finance_executive : d.dataValues.finance_executive,
                        total_project_hours : d.dataValues.total_project_hours,
                        total_projects : d.dataValues.total_projects,
                        total_project_cost : d.dataValues.total_project_cost,
                        total_projects_rd_credits : d.dataValues.total_projects_rd_credits,
                        qualifying_project_hours_fed : d.dataValues.qualifying_project_hours_fed,
                        qualifying_project_qre_fed : d.dataValues.qualifying_project_qre_fed,
                        qualifying_project_rd_credits_fed : d.dataValues.qualifying_project_rd_credits_fed,

                        country : d.country == null ? null : {
                            country_code : d.country.dataValues.country_code,
                            country_name : d.country.dataValues.country_name
                        },
                        currency : d.currency == null ? null : {
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
                        parent_account : d.parent_account == null ? null : {
                            account_name : d.parent_account.dataValues.account_name
                        },
                        industry_rid_name : d.industry_rid_name
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