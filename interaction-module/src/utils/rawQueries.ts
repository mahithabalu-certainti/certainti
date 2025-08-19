import { ALPHANUMERIC_CONDITIONS, filtersColumns, filtersColumnsForInteractionSummary, filterTypes, filterTypesForSummaryInteractions, interactionFlag, MAIN_SCHEMA_NAME, responseSortKeys } from "./constants"

type filterType = {
        [key : string] : {
            [condition : string] : any
        }
}

export const fetchInteractionForProjectLevelQuery = (
    account_rid : string, 
    project_id : string, 
    project_fiscal_rid : string,
    fiscal_year : number,
    sort : string,
    sortBy : string,
    filters : filterType,
    page : number,
    limit : number,
    flag : string,
    schemaName : string,
    disablePagination : boolean
) => {
    let offset = (page - 1 ) * limit
    let pagination = `LIMIT ${limit} OFFSET ${offset}`
    let filteredQueryArray : string[] = []
    let filterQueryValues;
    let sortValue : string;
    let whereConditions;
    let andConditions = ``;
    if(disablePagination) pagination = ` `
    else pagination

    if(flag == interactionFlag.account) {
        whereConditions = `
        i.account_rid = '${account_rid}' 
        AND 
        i.fiscal_year = ${fiscal_year}`
    } else {
        whereConditions = `
        i.account_rid = '${account_rid}' 
        AND 
        i.project_fiscal_rid = '${project_fiscal_rid}'
        AND
        i.project_rid = '${project_id}'
        AND
        i.fiscal_year = ${fiscal_year}
        `
    }
    let filteredData = filterForInteractions(filters, andConditions, filteredQueryArray, filterTypes)

    if(sort === filtersColumns.r_number) sortValue = `ORDER BY i.r_number ${sortBy}`
    else if(sort === filtersColumns.iteration) sortValue = `ORDER BY i.interaction_iteraction ${sortBy}`
    else if(sort === filtersColumns.interaction_age) sortValue = `ORDER BY i.interaction_age ${sortBy}`
    else if(sort === filtersColumns.recipient_name) sortValue = `ORDER BY i.recipient_name ${sortBy}`
    else if(sort === filtersColumns.recipient_email) sortValue = `ORDER BY i.recipient_email ${sortBy}`
    else if(sort === filtersColumns.last_sent_on) sortValue = `ORDER BY i.last_resent_on ${sortBy}`
    else if(sort === filtersColumns.last_reminder_on) sortValue = `ORDER BY i.last_reminder_on ${sortBy}`
    else if(sort === filtersColumns.response_submitted_on) sortValue = `ORDER BY i.response_submitted_on ${sortBy}`
    else if(sort === filtersColumns.response_updated_on) sortValue = `ORDER BY i.response_updated_on ${sortBy}`
    else if(sort === filtersColumns.attachments) sortValue = `ORDER BY i.attachments ${sortBy}`
    else if(sort === filtersColumns.response_source) sortValue = `ORDER BY i.response_source ${sortBy}`
    else if(sort === filtersColumns.created_datetime) sortValue = `ORDER BY i.created_datetime ${sortBy}`
    else if(sort === filtersColumns.modified_datetime) sortValue = `ORDER BY i.modified_datetime ${sortBy}`
    else sortValue = `ORDER BY i.r_number ASC`

    if(filteredData?.filteredQueryArray.length! > 0) {
        filterQueryValues = filteredQueryArray.join(' AND ')
    } else {
        filterQueryValues = ` `
    }

    let query = 
    `
    WITH fetch_interaction AS (
        SELECT
            i.rid, i.r_number, i.interaction_iteration, COALESCE(i.interaction_age,0),
            i.status_rid, i.recipient_name, i.recipient_email,
            i.last_resent_on, i.last_reminder_on, i.response_updated_on,
            i.response_submitted_on, i.response_source, i.created_by, i.modified_by,
            i.created_datetime, i.modified_datetime, p.r_number AS parent_r_number,
            i.account_rid, i.project_rid, i.rid AS interaction_history, 
            i.interaction_url, i.fiscal_year, i.project_fiscal_rid,
            COUNT(i.rid) OVER() AS total_records, i.interaction_age,
            i.interaction_source_rid, i.interaction_type_rid

            FROM
            ${schemaName}.interactions i
            LEFT JOIN ${schemaName}.interactions p ON p.rid = i.parent_interaction_rid
            WHERE
            ${whereConditions}
            ${filteredData?.andConditions}
            ${filterQueryValues}
    ),
    paginated_datas AS (
    SELECT * FROM fetch_interaction ${pagination}
    
    )
        SELECT 
        array_agg(jsonb_build_object(
        'rid', i.rid,
        'r_number', i.r_number,
        'interaction_iteration', i.interaction_iteration,
        'interaction_age', i.interaction_age,
        'status', i.status_rid,
        'recipient_name', i.recipient_name,
        'recipient_email', i.recipient_email,
        'last_resent_on', i.last_resent_on,
        'last_reminder_on', i.last_reminder_on,
        'response_updated_on', i.response_updated_on,
        'response_submitted_on', i.response_submitted_on,
        'response_source', i.response_source,
        'created_by', i.created_by,
        'modified_by', i.modified_by,
        'created_datetime', i.created_datetime,
        'modified_datetime', i.modified_datetime,
        'parent_interaction_rid', i.parent_r_number,
        'account_rid', i.account_rid,
        'project_rid', i.project_rid,
        'project_fiscal_rid', i.project_fiscal_rid,
        'interaction_history', i.interaction_history,
        'interaction_url', i.interaction_url,
        'fiscal_year', i.fiscal_year,
        'total_records', i.total_records,
        'interaction_type', i.interaction_type_rid,
        'interaction_source', i.interaction_source_rid
        )${sortValue}) AS interactions

        FROM
        paginated_datas i
    `

    return query

}

export const listAllInteractionSummary = (
    page : number, limit : number, filters : filterType, globalFilters : any, fiscal_year : number, 
    sort : string, sortBy : string
) => {
    let offset = (page - 1) * limit
    let pagination = `LIMIT ${limit} OFFSET ${offset}`
    let filteredQueryArray : string[] = []
    let andConditions = ``
    let filterQueryValues;
    let accountIdsArray : string[] = [];
    let globalFiltersQueryConditions : string = ``
    let fiscalYearQuery : string = ``
    let whereKey : string = ``
    let andConditionsForjoinsForTwo : string = ` `
    let andConditionsForjoinsForThree : string = ` `
    let sortValue

    let filterDatas = filterForInteractions(filters, andConditions, filteredQueryArray, filterTypesForSummaryInteractions);
    if(filterDatas?.filteredQueryArray?.length! > 0) {
        filterQueryValues = filterDatas?.filteredQueryArray.join(' AND ')
    } else {
        filterQueryValues = ``
    }
    if(Object.keys(globalFilters).length > 0) {
        accountIdsArray = globalFiltersForInteractionSummary(globalFilters)
    }
    if(accountIdsArray.length > 0) {
        globalFiltersQueryConditions = ` i.account_rid IN (${accountIdsArray.map((d : any) => `'${d}'`).join(',')})`
    }

    if(fiscal_year == 0) fiscalYearQuery = ``
    else fiscalYearQuery = ` i.fiscal_year = ${fiscal_year}`

    if(globalFiltersQueryConditions !== '' || fiscalYearQuery !== '' || filterQueryValues !== '') whereKey = ` WHERE `
    else whereKey = ``
    
    if(globalFiltersQueryConditions !== '' && fiscalYearQuery !== '' && filterQueryValues !== '') {
        andConditionsForjoinsForTwo = ` AND `
        andConditionsForjoinsForThree = ` AND `
    }
    else if(globalFiltersQueryConditions !== '' && fiscalYearQuery !== '') andConditionsForjoinsForTwo = ` AND `
    else if(globalFiltersQueryConditions !== '' && filterQueryValues !== '') andConditionsForjoinsForThree = ` AND `
    else if(fiscalYearQuery !== '' && filterQueryValues !== '' ) andConditionsForjoinsForThree = ` AND `
    else {
        andConditionsForjoinsForTwo = ``
        andConditionsForjoinsForThree = `` 
    }

    if(sort === filtersColumnsForInteractionSummary.r_number) sortValue = `ORDER BY i.r_number ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.iteration) sortValue = `ORDER BY i.interaction_iteraction ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.interaction_age) sortValue = `ORDER BY i.interaction_age ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.recipient_name) sortValue = `ORDER BY i.recipient_name ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.recipient_email) sortValue = `ORDER BY i.recipient_email ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.last_sent_on) sortValue = `ORDER BY i.last_resent_on ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.last_reminder_on) sortValue = `ORDER BY i.last_reminder_on ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.response_submitted_on) sortValue = `ORDER BY i.response_submitted_on ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.response_updated_on) sortValue = `ORDER BY i.response_updated_on ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.attachments) sortValue = `ORDER BY i.attachments ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.response_source) sortValue = `ORDER BY i.response_source ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.created_datetime) sortValue = `ORDER BY i.created_datetime ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.modified_datetime) sortValue = `ORDER BY i.modified_datetime ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.status_name) sortValue = ` ORDER BY s.status_name ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.interaction_type_name) sortValue = ` ORDER BY i.interaction_type_name ${sortBy}`
    else if(sort === filtersColumnsForInteractionSummary.interaction_source_name) sortValue = ` ORDER BY i.interaction_source_name ${sortBy}`
    else if(sort === filterTypesForSummaryInteractions.created_user_name) sortValue = ` ORDER BY i.created_user_name ${sortBy}`
    else if(sort === filterTypesForSummaryInteractions.updated_user_name) sortValue = ` ORDER BY i.updated_user_name ${sortBy}`
    else sortValue = `ORDER BY i.r_number ASC`


    let query =
    `
    WITH fetch_all_interactions AS 
    (SELECT i.rid, i.r_number, i.interaction_iteration, i.interaction_status_rid,
    s.status_name, i.recipient_name, i.recipient_email,
    i.last_resent_on, i.last_reminder_on, i.response_submitted_on,
    i.response_updated_on, i.attachment_count, i.rid AS interaction_history,
    i.interaction_url, p.r_number AS parent_r_number, i.interaction_type_rid,
    it.interaction_type_name, i.response_source,
    i.created_by, CONCAT(u.first_name, ' ', u.last_name) AS created_user_name,
    CONCAT(uu.first_name, ' ', uu.last_name) AS updated_user_name,
    i.created_datetime, i.modified_datetime, i.fiscal_year, i.account_rid, i.project_rid,
    i.interaction_source_rid, sn.interaction_source_name,
    i.project_fiscal_rid, COUNT(*) OVER() AS total_records, i.modified_by, i.interaction_age
    FROM
    ${MAIN_SCHEMA_NAME}.interactions_summary i
    LEFT JOIN ${MAIN_SCHEMA_NAME}.interaction_type it ON it.rid = i.interaction_type_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.interaction_status s ON s.rid = i.interaction_status_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user u ON u.rid = i.created_by
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user uu ON uu.rid = i.modified_by
    LEFT JOIN ${MAIN_SCHEMA_NAME}.interactions_summary p ON p.rid = i.parent_interaction_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.interaction_source sn ON sn.rid = i.interaction_source_rid
    ${whereKey}
    ${globalFiltersQueryConditions}
    ${andConditionsForjoinsForTwo}
    ${fiscalYearQuery}
    ${andConditionsForjoinsForThree}
    ${filterQueryValues}
    ),
    paginated_data AS (
    SELECT * FROM fetch_all_interactions ${pagination}
    )
    SELECT 
        array_agg(jsonb_build_object(
            'rid', i.rid,
            'r_number', i.r_number,
            'interaction_iteration', i.interaction_iteration,
            'interaction_age', i.interaction_age,
            'interaction_status_rid', i.interaction_status_rid,
            'recipient_name', i.recipient_name,
            'recipient_email', i.recipient_email,
            'last_resent_on', i.last_resent_on,
            'last_reminder_on', i.last_reminder_on,
            'response_updated_on', i.response_updated_on,
            'response_submitted_on', i.response_submitted_on,
            'response_source', i.response_source,
            'created_by', i.created_by,
            'modified_by', i.modified_by,
            'created_datetime', i.created_datetime,
            'modified_datetime', i.modified_datetime,
            'parent_interaction_rid', i.parent_r_number,
            'account_rid', i.account_rid,
            'project_rid', i.project_rid,
            'project_fiscal_rid', i.project_fiscal_rid,
            'interaction_history', i.interaction_history,
            'interaction_url', i.interaction_url,
            'fiscal_year', i.fiscal_year,
            'total_records', i.total_records,
            'interaction_type_rid', i.interaction_type_rid,
            'interaction_source_rid', i.interaction_source_rid,
            'status_name', i.status_name,
            'interaction_type_name', i.interaction_type_name,
            'interaction_source_name', i.interaction_source_name,
            'created_user_name', i.created_user_name,
            'updated_user_name', i.updated_user_name
        )${sortValue}) AS interactions

        FROM
        paginated_data i`
    return query
}

const filterForInteractions = (
    filters : filterType, andConditions : string,
    filteredQueryArray : string[], filterTypes : any
    ) => {
        let filteredColumns : string | undefined;
        if(Object.keys(filters).length > 0) {
        for(let [key, conditions] of Object.entries(filters)) {
            if(Object.keys(filtersColumnsForInteractionSummary).includes(key)) {
                filteredColumns = filtersColumns[key]
                andConditions = ` AND `
            }
            for(let [condition, values] of Object.entries(conditions)) {
                switch(filterTypes[key]) {
                    case "string" : {
                        if(condition == ALPHANUMERIC_CONDITIONS.equals) 
                            filteredQueryArray.push(`LOWER(i.${filteredColumns}) = LOWER('${values}')`)
                        if(condition == ALPHANUMERIC_CONDITIONS.notEquals)
                            filteredQueryArray.push(`LOWER(i.${filteredColumns}) != LOWER('${values}')`)
                        if(condition == ALPHANUMERIC_CONDITIONS.isEmpty) 
                            filteredQueryArray.push(`i.${filteredColumns} IS NULL`)
                        if(condition == ALPHANUMERIC_CONDITIONS.contains)
                            filteredQueryArray.push(`i.${filteredColumns} ILIKE '%${values}%'`)
                        if(condition == ALPHANUMERIC_CONDITIONS.IN)
                            filteredQueryArray.push(`i.${filteredColumns} IN (${values.map((d : any) => `'${d}'`).join(',')})`)
                        break;
                    }
                    case "number" : {
                        if(condition == ALPHANUMERIC_CONDITIONS.equals) 
                            filteredQueryArray.push(`i.${filteredColumns} = ${values}`)
                        if(condition == ALPHANUMERIC_CONDITIONS.notEquals)
                            filteredQueryArray.push(`i.${filteredColumns} != ${values}`)
                        if(condition == ALPHANUMERIC_CONDITIONS.greater_than)
                            filteredQueryArray.push(`i.${filteredColumns} > ${values}`)
                        if(condition == ALPHANUMERIC_CONDITIONS.less_than) 
                            filteredQueryArray.push(`i.${filteredColumns} < ${values}`)
                        if(condition == ALPHANUMERIC_CONDITIONS.between)
                            filteredQueryArray.push(`i.${filteredColumns} BETWEEN ${values.join(' AND ')}`)
                        break;
                    }
                    case "datetime" : {
                        if(condition == ALPHANUMERIC_CONDITIONS.equals) 
                            filteredQueryArray.push(`DATE(i.${filteredColumns}) = '${values}'`)
                        if(condition == ALPHANUMERIC_CONDITIONS.before) 
                            filteredQueryArray.push(`DATE(i.${filteredColumns}) < '${values}'`)
                        if(condition == ALPHANUMERIC_CONDITIONS.after) 
                            filteredQueryArray.push(`DATE(i.${filteredColumns}) > '${values}'`)
                        if(condition == ALPHANUMERIC_CONDITIONS.between) 
                            filteredQueryArray.push(`DATE(i.${filteredColumns}) BETWEEN '${values.map((d : any) => `'${d}'`).join(' AND ')}'`)
                        if(condition == ALPHANUMERIC_CONDITIONS.isEmpty)
                            filteredQueryArray.push(`DATE(i.${filteredColumns}) IS NULL`)
                    }
                }
            }
            return {
                filteredQueryArray, andConditions
            }
        }
    } else {
        filteredQueryArray = []
        andConditions = ` `
        return {
            filteredQueryArray, andConditions
        }
    }
}

const globalFiltersForInteractionSummary = (globalFilters : Record<string, string[]>) => {
    let arrayOfIds : string[] = []
    for(let [key, items] of Object.entries(globalFilters)) {
        for(let item of items) {
            arrayOfIds.push(item)
        }
    }
    return arrayOfIds;
}

export const listResponseHistory = (interaction_rid : string, schemaName : string, page : number, limit : number, sort : string, sortBy : string) => {
    let offset = (page - 1 ) * limit
    let pagination = `LIMIT ${limit} OFFSET ${offset}`
    let sortQuery : string = ``

    if(responseSortKeys.includes(sort.toLowerCase())) sortQuery = `ORDER BY i.${sort} ${sortBy}`
    else sortQuery = `ORDER BY i.r_number ASC`
    
    let query = 
    `
    WITH fetch_interaction_response AS (
    SELECT i.rid, i.r_number, r.response_by, r.response_on, r.response_email,
    r.interaction_response, i.interaction_source_rid, COUNT(i.rid) OVER() AS total_records,
    r.response_source
    FROM 
    ${schemaName}.interaction_response_history r
    LEFT JOIN ${schemaName}.interactions i ON i.rid = r.interaction_rid
    WHERE
    i.rid = '${interaction_rid}'
    ),
    paginated_data AS (
    SELECT * FROM fetch_interaction_response ${pagination}
    )
    
    SELECT 
    array_agg(jsonb_build_object(
    'rid', i.rid,
    'r_number', i.r_number,
    'response_by_rid', i.response_by,
    'response_on', i.response_on,
    'response_email', i.response_email,
    'interaction_response', i.interaction_response,
    'interaction_source_rid', i.interaction_source_rid,
    'total_records', i.total_records,
    'response_source', i.response_source
    )${sortQuery}) AS response_history
    FROM
    paginated_data i`
    return query
}

