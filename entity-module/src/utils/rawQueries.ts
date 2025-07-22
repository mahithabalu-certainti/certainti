import { ALPHANUMERIC_CONDITIONS, IMPORT_FILTER_COLUMNS, STATUS_MESSAGE } from "./constants";
type filterType = {
        [key : string] : {
            [condition : string] : any
        }
}

export const listAllImportedDatasQuery = (page : number, limit : number, sort : string, sortBy : string, account_rid : string, filters : filterType, schemaName : string, disablePagination : boolean, fiscal_year : number) => {
    let offset = (page - 1 ) * limit;
    let pagination = disablePagination ? `` : `LIMIT ${limit} OFFSET ${offset}`;
    let filterArray = []
    let filterValues = ``
    let filteredFinalValues = ``
    let sortValue;
    let where = ``
    let keyColumns;
    let alias = `a`
    let and = ``

    let fiscalYearQuery = ``
    if(fiscal_year == 0) {
        fiscalYearQuery = ` `
    } else {
        fiscalYearQuery = `a.fiscal_year = ${fiscal_year}`
    }

    if(Object.keys(filters).length != 0 || fiscal_year !== 0) {
        where = ` WHERE `
        if(Object.keys(filters).length != 0 && fiscal_year !== 0) {
            and = ` AND `
        }
        else if(Object.keys(filters).length != 0 && fiscal_year == 0) {
            and = ` `
        } 
        else if(Object.keys(filters).length == 0 && fiscal_year != 0) {
            and = ` `
        }
    } else {
        where = ` `
    }

    if (sort === 'r_number') sortValue = `a.r_number ${sortBy}`;
    else if (sort === 'file_name') sortValue = `a.document_name ${sortBy}`;
    else if (sort === 'format') sortValue = `a.document_format ${sortBy}`;
    else if (sort === 'size') sortValue = `
    CASE 
    WHEN a.document_size ILIKE '%kb' THEN CAST(REGEXP_REPLACE(a.document_size, '[^0-9.]', '', 'g') AS DECIMAL ) * 1024 
    WHEN a.document_size ILIKE '%bytes' THEN CAST(REGEXP_REPLACE(a.document_size, '[^0-9.]', '', 'g') AS DECIMAL)
    WHEN a.document_size ILIKE '%mb' THEN CAST(REGEXP_REPLACE(a.document_size, '[^0-9.]', '', 'g') AS DECIMAL) * 1024 * 1024
    ELSE 0
    END ${sortBy}`
    else if (sort === 'fiscal') sortValue = `a.fiscal_year ${sortBy}`;
    else if (sort === 'entity') sortValue = `a.entity_type ${sortBy}`;
    else if (sort === 'total_records') sortValue = `a.total_records ${sortBy}`;
    else if (sort === 'records_loaded_successfully') sortValue = `a.records_loaded_successfully ${sortBy}`;
    else if (sort === 'records_failed_to_load') sortValue = `a.records_failed_to_load ${sortBy}`;
    else if (sort === 'status') sortValue = `a.document_status ${sortBy}`;
    else if (sort === 'imported_on') sortValue = `a.uploaded_datetime ${sortBy}`;
    else if (sort === 'status_description') sortValue = `a.status_description ${sortBy}`;
    else if (sort === 'import_type') sortValue = `a.import_type ${sortBy}`;           
    else if (sort === 'imported_by') sortValue = `a.uploaded_by_user_rid ${sortBy}`;
    else if (sort === 'records_with_warning') sortValue = `a.total_staging_warning_count ${sortBy}`;
    else sortValue = `a.r_number ASC`

    if(Object.keys(filters).length != 0) {
    for(let [key, conditions] of Object.entries(filters)) {
        if(Object.keys(IMPORT_FILTER_COLUMNS).includes(key)) {
            keyColumns = IMPORT_FILTER_COLUMNS[key]
        }
        for(let [cond, values] of Object.entries(conditions)) {
            switch (cond) {
                case ALPHANUMERIC_CONDITIONS.equals: {
                    let checkDateTypes = isStrictIsoDate(values)
                    let checkNumberTypes = isNumber(values)
                    if(checkNumberTypes) {
                        filterValues = `${alias}.${keyColumns} = '${parseInt(values)}'`
                        filterArray.push(filterValues)
                        break
                    } 
                    else if(checkDateTypes){
                        filterValues = `${alias}.${keyColumns}::date = '${values}'`
                        filterArray.push(filterValues)
                        break
                    } 
                    else {
                        filterValues = `LOWER(${alias}.${keyColumns}) = '${values.toLowerCase()}'`
                        filterArray.push(filterValues)
                        break
                    } 
                }
                case ALPHANUMERIC_CONDITIONS.notEquals : {
                    let checkDateTypes = isStrictIsoDate(values)
                    let checkNumberTypes = isNumber(values)
                    if(checkNumberTypes) {
                        filterValues = `${alias}.${keyColumns} != '${parseInt(values)}'`
                        filterArray.push(filterValues)
                        break
                    } 
                    else if(checkDateTypes){
                        filterValues = `${alias}.${keyColumns}::date != '${values}'`
                        filterArray.push(filterValues)
                        break
                    } 
                    else {
                        filterValues = `LOWER(${alias}.${keyColumns}) != '${values.toLowerCase()}'`
                        filterArray.push(filterValues)
                        break
                    } 
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
                    let checkNumberTypes = isNumber(values)
                    if(checkNumberTypes) {
                        filterValues = `${alias}.${keyColumns} < ${parseInt(values)}`
                        filterArray.push(filterValues)
                        break
                    }
                }
                case ALPHANUMERIC_CONDITIONS.greater_than : {
                    let checkNumberTypes = isNumber(values)
                    if(checkNumberTypes) {
                        filterValues = `${alias}.${keyColumns} > ${parseInt(values)}`
                        filterArray.push(filterValues)
                        break
                    }
                }
                case ALPHANUMERIC_CONDITIONS.between : {
                    
                    let checkDateTypes = isStrictIsoDate(values[0])
                    let dynamicKeyColumns;
                    if(checkDateTypes) dynamicKeyColumns = `${keyColumns}::date`
                    else dynamicKeyColumns = `${keyColumns}`
                    filterValues = `${alias}.${dynamicKeyColumns} BETWEEN ${values.map((d : any) => {
                        if(checkDateTypes) return `'${d}'`
                        else return parseInt(d)
                    } ).join(' AND ')}`
                    filterArray.push(filterValues)
                    break
                }
                case ALPHANUMERIC_CONDITIONS.before : {
                    let checkDateTypes = isStrictIsoDate(values)
                    if(checkDateTypes) {
                        filterValues = `${alias}.${keyColumns} < '${values}::date'`
                        filterArray.push(filterValues)
                        break
                    }
                }
                case ALPHANUMERIC_CONDITIONS.after : {
                    let checkDateTypes = isStrictIsoDate(values)
                    if(checkDateTypes) {
                        filterValues = `${alias}.${keyColumns} > '${values}::date'`
                        filterArray.push(filterValues)
                        break
                    }
                }
                default:
                    break;
            }
        }
    }
    } else {
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
    ((COALESCE(i.total_staging_processed, 0) - COALESCE(i.target_load_error_records_count, 0))) AS records_loaded_successfully,
    (COALESCE(i.target_load_error_records_count,0) + (COALESCE(i.total_records, 0) - COALESCE(i.total_staging_processed,0))) AS records_failed_to_load,
    i.total_staging_warning_count,d.document_status, i.uploaded_datetime, i.uploaded_by_user_rid,
    i.upload_failure_reason, d.document_url
    FROM ${schemaName}.import i
    LEFT JOIN ${schemaName}.account_details a ON a.account_rid = i.account_rid
    LEFT JOIN ${schemaName}.document d ON d.rid = i.document_rid
    WHERE 
    a.account_rid = '${account_rid}'
    ),
    counted_and_filtered_datas AS (
    SELECT COUNT(*) OVER() AS total_count, a.* 
    FROM all_datas a 
    ${where} 
    ${fiscalYearQuery} ${and}
    ${filteredFinalValues}
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
    'status_description', a.upload_failure_reason,
    'imported_on', a.uploaded_datetime,
    'imported_by', a.uploaded_by_user_rid,
    'document_url', a.document_url
    )ORDER BY ${sortValue}) AS imports
    FROM paginated_datas a
    `
    return query
}

function isStrictIsoDate(value: any): boolean {
  if (typeof value !== "string") return false;

  // Match format strictly: YYYY-MM-DD
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(value)) return false;

  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function isNumber(value : any) {
  return !isNaN(value) && /^\d+$/.test(value);
}
export const listAllLoadFailures = (schemaName: string, import_rid: string, entity_type: string) => {
  const query = `
    WITH import_data AS (
      SELECT r_number, entity_type, document_rid
      FROM ${schemaName}.import
      WHERE rid = '${import_rid}'
    )
    SELECT p.*
    FROM ${schemaName}.history_staging_${entity_type} p
    JOIN import_data i ON p.document_rid = i.document_rid
    WHERE p.status != 'Success'
      AND p.error_descriptions NOT ILIKE '%staging:%'
  `;

  return query;
};


export const listAllStageFailures = (schemaName: string, import_rid: string, entity_type: string) => { 
  const query = `
    WITH import_data AS (
      SELECT r_number, entity_type, document_rid
      FROM ${schemaName}.import
      WHERE rid = '${import_rid}'
    )
    SELECT 
      p.*,
      TRIM(split_part(p.error_descriptions, 'staging:', 2)) AS error_descriptions
    FROM ${schemaName}.history_staging_${entity_type} p
    JOIN import_data i ON p.document_rid = i.document_rid
    WHERE p.status != 'Success'
      AND p.error_descriptions ILIKE '%staging:%'
  `;

  return query;
};

export const fetchImportListByRid = (rid : string, schemaName : string) => {
    let query = `
    SELECT 
    jsonb_build_object(
    'rid', i.rid,
    'r_number', i.r_number,
    'file_name', i.document_name,
    'format', d.document_format,
    'size', d.document_size,
    'entity', i.entity_type,
    'total_records', i.total_records,
    'fiscal', i.fiscal_year,
    'status', d.document_status,
    'status_description', i.upload_failure_reason,
    'imported_on', i.uploaded_datetime,
    'imported_by', i.uploaded_by_user_rid,
    'records_loaded_successfully', ((COALESCE(i.total_staging_processed, 0) - COALESCE(i.target_load_error_records_count, 0))),
    'records_failed_to_load', i.target_load_error_records_count,
    'records_failed_to_stage', (COALESCE(i.total_records,0) - COALESCE(i.total_staging_processed, 0)),
    'records_with_warning', i.total_staging_warning_count,
    'document_url', d.document_url
    ) AS imports
    FROM ${schemaName}.import i
    LEFT JOIN ${schemaName}.document d ON d.rid = i.document_rid
    WHERE 
    i.rid = '${rid}'
    `
    return query;
}