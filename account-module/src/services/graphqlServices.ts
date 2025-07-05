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
    const fetchAccountById = await Account.findOne({
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
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        statusMessage: STATUS_MESSAGE.accountUpdateSuccess,
                    }
                }
            }
            else {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    statusMessage: STATUS_MESSAGE.accountInactive
                }
            }
        }
    } else {
        return {
            statusCode: HttpStatus.NOT_FOUND,
            statusMessage: STATUS_MESSAGE.accountNoFound
        }
    }
}
}

export default AccountGraphQlServices