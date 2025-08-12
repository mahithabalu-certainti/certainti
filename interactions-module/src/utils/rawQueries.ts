import { ALPHANUMERIC_CONDITIONS, filtersColumns, filterTypes, interactionFlag } from "./constants"

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
    let filteredColumns;
    let filteredQueryArray : string[] = []
    let filterQueryValues;
    let sortValue : string;
    let whereConditions;
    let andConditions;
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

    if(Object.keys(filters).length > 0) {
        for(let [key, conditions] of Object.entries(filters)) {
            if(Object.keys(filtersColumns).includes(key)) {
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
                        if(condition == ALPHANUMERIC_CONDITIONS.contains) {
                            filteredQueryArray.push(`i.${filteredColumns} ILIKE '%${values}%'`)
                        }
                            
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
        }
    } else {
        filteredQueryArray = []
        andConditions = ` `
    }

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
    else if(sort === filtersColumns.fiscal_year) sortValue = `ORDER BY i.fiscal_year ${sortBy}`
    else sortValue = `ORDER BY i.r_number ASC`

    if(filteredQueryArray.length > 0) {
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
            ${andConditions}
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

