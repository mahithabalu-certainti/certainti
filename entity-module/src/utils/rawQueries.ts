import { ALPHANUMERIC_CONDITIONS, IMPORT_FILTER_COLUMNS, STATUS_MESSAGE } from "./constants";
type filterType = {
        [key : string] : {
            [condition : string] : any
        }
}

export const listAllImportedDatasQuery = (page : number, limit : number, sort : string, sortBy : string, account_rid : string, filters : filterType, schemaName : string, disablePagination : boolean) => {
    let offset = (page - 1 ) * limit;
    let pagination = disablePagination ? `` : `LIMIT ${limit} OFFSET ${offset}`;
    let filterArray = []
    let filterValues = ``
    let filteredFinalValues = ``
    let sortValue;
    let where = ``
    let keyColumns;
    let alias = `a`

    if (sort === 'r_number') sortValue = `a.r_number ${sortBy}`;
    else if (sort === 'file_name') sortValue = `a.document_name ${sortBy}`;
    else if (sort === 'format') sortValue = `a.document_format ${sortBy}`;
    else if (sort === 'size') sortValue = `a.document_size ${sortBy}`;
    else if (sort === 'fiscal') sortValue = `a.fiscal_year ${sortBy}`;
    else if (sort === 'entity') sortValue = `a.entity_type ${sortBy}`;
    else if (sort === 'total_records') sortValue = `a.total_records ${sortBy}`;
    else if (sort === 'records_loaded_successfully') sortValue = `a.records_loaded_successfully ${sortBy}`;
    else if (sort === 'records_failed_to_load') sortValue = `a.records_failed_to_load ${sortBy}`;
    else if (sort === 'status') sortValue = `a.document_status ${sortBy}`;
    else if (sort === 'imported_on') sortValue = `a.uploaded_on ${sortBy}`;
    else if (sort === 'status_description') sortValue = `a.status_description ${sortBy}`;
    else if (sort === 'import_type') sortValue = `a.import_type ${sortBy}`;           
    else if (sort === 'imported_by') sortValue = `a.uploaded_by_user_rid ${sortBy}`;
    else if (sort === 'records_with_warning') sortValue = `a.total_staging_warning_count ${sortBy}`;
    else sortValue = `a.r_number ASC`

    if(Object.keys(filters).length != 0) {
    where = `WHERE `
    for(let [key, conditions] of Object.entries(filters)) {
        if(Object.keys(IMPORT_FILTER_COLUMNS).includes(key)) {
            keyColumns = IMPORT_FILTER_COLUMNS[key]
        }
        for(let [cond, values] of Object.entries(conditions)) {
            switch (cond) {
                case ALPHANUMERIC_CONDITIONS.equals: {
                    filterValues = `LOWER(${alias}.${keyColumns}) = '${values.toLowerCase()}'`
                    filterArray.push(filterValues)
                    break
                }
                case ALPHANUMERIC_CONDITIONS.notEquals : {
                    filterValues = `LOWER(${alias}.${keyColumns}) != '${values.toLowerCase()}'`
                    filterArray.push(filterValues)
                    break
                }
                case ALPHANUMERIC_CONDITIONS.isEmpty : {
                    filterValues = `${alias}.${keyColumns} IS NULL`
                    filterArray.push(filterValues)
                    break  
                }
                case ALPHANUMERIC_CONDITIONS.contains : {
                    filterValues = `${alias}.${keyColumns} ILIKE '%${values}%'`
                    filterArray.push(filterValues)
                    break
                }
                case ALPHANUMERIC_CONDITIONS.IN : {
                    filterValues = `${alias}.${keyColumns} IN(${values.map((d : any) => `'${d}'`).join(',')})`
                    filterArray.push(filterValues)
                    break
                }
                case ALPHANUMERIC_CONDITIONS.less_than : {
                    filterValues = `${alias}.${keyColumns} < ${values}`
                    filterArray.push(filterValues)
                    break
                }
                case ALPHANUMERIC_CONDITIONS.greater_than : {
                    filterValues = `${alias}.${keyColumns} > ${values}`
                    filterArray.push(filterValues)
                    break
                }
                case ALPHANUMERIC_CONDITIONS.between : {
                    filterValues = `${alias}.${keyColumns} BETWEEN ${values.map((d : any) => `'${d}'`).join(' AND ')}`
                    filterArray.push(filterValues)
                    break
                }
                case ALPHANUMERIC_CONDITIONS.before : {
                    filterValues = `${alias}.${keyColumns} < '${values}'`
                    filterArray.push(filterValues)
                    break
                }
                case ALPHANUMERIC_CONDITIONS.after : {
                    filterValues = `${alias}.${keyColumns} > '${values}'`
                    filterArray.push(filterValues)
                    break
                }
                default:
                    break;
            }
        }
    }
    } else {
        where = ` `
        filterArray = []
    }

    if(filterArray.length < 1) {
        filteredFinalValues = ` `
    } else {
        filteredFinalValues = filterArray.join(' AND ')
    }
    let query = 
    `
    WITH all_datas AS (
    SELECT i.rid, i.r_number, i.document_name, d.document_format,
    d.document_size,i.entity_type, i.total_records,i.fiscal_year,
    (SELECT COUNT(*) FROM ${schemaName}.import ii WHERE ii.account_rid = i.account_rid AND ii.target_load_status = '${STATUS_MESSAGE.targetLoadSuccess}') AS records_loaded_successfully,
    (SELECT COUNT(*) FROM ${schemaName}.import ii WHERE ii.account_rid = i.account_rid AND ii.target_load_status = '${STATUS_MESSAGE.targetLoadFailed}') AS records_failed_to_load,
    i.total_staging_warning_count,d.document_status, i.uploaded_datetime::date, i.uploaded_by_user_rid
    FROM ${schemaName}.import i
    LEFT JOIN ${schemaName}.account_details a ON a.account_rid = i.account_rid
    LEFT JOIN ${schemaName}.document d ON d.rid = i.document_rid
    WHERE 
    a.account_rid = '${account_rid}'
    ),
    counted_and_filtered_datas AS (
    SELECT COUNT(*) OVER() AS total_count, a.* 
    FROM all_datas a 
    ${where} ${filteredFinalValues}
    ),

    paginated_datas AS (
    select c.* 
    FROM
    counted_and_filtered_datas c
    ${pagination}
    )

    SELECT 
    array_agg(jsonb_build_object(
    'rid', a.rid,
    'count', a.total_count,
    'r_number', a.r_number,
    'file_name', a.document_name,
    'format', a.document_format,
    'size', a.document_size,
    'entity', a.entity_type,
    'total_records', a.total_records,
    'fiscal', a.fiscal_year,
    'records_loaded_successfully',a.records_loaded_successfully,
    'records_failed_to_load', a.records_failed_to_load,
    'records_with_warning', a.total_staging_warning_count,
    'status', a.document_status,
    'imported_on', a.uploaded_datetime::date,
    'imported_by', a.uploaded_by_user_rid
    )ORDER BY ${sortValue}) AS imports
    FROM paginated_datas a
    `
    return query
} 