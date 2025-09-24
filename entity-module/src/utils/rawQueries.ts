import { ALPHANUMERIC_CONDITIONS, IMPORT_FILTER_COLUMNS, STATUS_MESSAGE, SUMMARY_HIGHLIGHTS_FLAG } from "./constants";
type filterType = {
        [key : string] : {
            [condition : string] : any
        }
}


export const listAllImportedDatasQuery = (page : number, limit : number, sort : string, sortBy : string, account_rid : string, filters : filterType, schemaName : string, disablePagination : boolean, fiscal_year : number, search : string) => {
    let offset = (page - 1 ) * limit;
    let pagination = disablePagination ? `` : `LIMIT ${limit} OFFSET ${offset}`;
    let filterArray = []
    let filterValues = ``
    let filteredFinalValues = ``
    let sortValue;
    let keyColumns;
    let alias = `a`
    let and = ``
    let searchValue : string = ``

    let fiscalYearQuery = ``
    if(fiscal_year == 0) {
        fiscalYearQuery = ` `
    } else {
        fiscalYearQuery = `AND a.fiscal_year = ${fiscal_year}`
    }

    if(search) searchValue = `%${search}%`
    else searchValue = `%%`

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
    else if (sort === 'status_description') sortValue = `a.upload_failure_reason ${sortBy}`;
    else if (sort === 'import_type') sortValue = `a.import_type ${sortBy}`;           
    else if (sort === 'imported_by') sortValue = `a.uploaded_by_user_rid ${sortBy}`;
    else if (sort === 'records_with_warning') sortValue = `a.total_staging_warning_count ${sortBy}`;
    else sortValue = `a.r_number ASC`

    if(Object.keys(filters).length != 0) {
    for(let [key, conditions] of Object.entries(filters)) {
        if(Object.keys(IMPORT_FILTER_COLUMNS).includes(key)) {
            keyColumns = IMPORT_FILTER_COLUMNS[key]
            and = ` AND `
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
                        filterValues = `LOWER(${alias}.${keyColumns}) = '${values.toLowerCase().replace(/'/g, "''")}'`
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
                        filterValues = `LOWER(${alias}.${keyColumns}) IS DISTINCT FROM '${values.toLowerCase().replace(/'/g, "''")}'`
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
                    filterValues = `${alias}.${keyColumns} ILIKE '%${values.replace(/'/g, "''")}%'`
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
        and = ` `
    }

    if(filterArray.length < 1) {
        filteredFinalValues = ` `
    } else {
        filteredFinalValues = filterArray.join(' AND ')
    }
    let query = 
    `
    WITH all_datas AS (
    SELECT i.rid, i.r_number, i.document_name, d.document_format, i.document_rid,
    d.document_size,i.entity_type, i.total_records,i.fiscal_year,
    CASE WHEN 
        i.target_load_end_timestamp IS NOT NULL
        THEN ((COALESCE(i.total_staging_processed, 0) - COALESCE(i.target_load_error_records_count, 0)))
        ELSE 0
        END AS records_loaded_successfully,
    CASE WHEN 
        i.target_load_end_timestamp IS NOT NULL 
        THEN (COALESCE(i.target_load_error_records_count,0) + (COALESCE(i.total_records, 0) - COALESCE(i.total_staging_processed,0)))
        ELSE 0
        END AS records_failed_to_load,
    CASE WHEN
        i.target_load_end_timestamp IS NOT NULL
        THEN i.total_staging_warning_count
        ELSE 0
        END AS total_staging_warning_count,
    d.document_status, i.uploaded_datetime, i.uploaded_by_user_rid,
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
    WHERE
    (a.document_name ILIKE '${searchValue}' OR a.document_status ILIKE '${searchValue}' OR a.r_number ILIKE '${searchValue}' OR a.entity_type ILIKE '${searchValue}')
    ${fiscalYearQuery}
    ${and}
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
    'document_url', a.document_url,
    'document_rid', a.document_rid
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
export const getCurrencyDetailsQuery = (schemaName: string, currencyIds: string[]) => {
  const query = `
    SELECT rid, currency_name, currency_symbol, currency_code
    FROM ${schemaName}.currency
    WHERE rid IN (:ids)
  `;

  const replacements = {
    ids: currencyIds,
  };

  return { query, replacements };
};

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
    'document_url', d.document_url,
    'document_rid', i.document_rid
    ) AS imports
    FROM ${schemaName}.import i
    LEFT JOIN ${schemaName}.document d ON d.rid = i.document_rid
    WHERE 
    i.rid = '${rid}'
    `
    return query;
}

export const summaryHighlightsQuery = (account_rid : string, fiscal_year : number, schemaName : string) => {
    let query = 
    `
    WITH calculate_rd_credits_projects AS (
    SELECT DISTINCT ON (a.account_rid) 
            COUNT(*)OVER() AS total_projects_rd_credits,
            a.account_rid
        FROM 
        ${schemaName}.account_fiscal a
        LEFT JOIN ${schemaName}.project p ON p.account_rid = a.account_rid
        WHERE 
            a.account_rid = '${account_rid}'
            AND
            a.fiscal_year = ${fiscal_year} 
            AND
            p.is_rd_qualified = true
        GROUP BY
        a.account_rid, p.rid
    ),
    resource_metrics AS (
        SELECT DISTINCT ON (a.account_rid) 
            a.total_fte, a.total_subcon,
            SUM(COALESCE(pf.total_nonlabor_prj, 0)) AS  total_nonlabor,
            a.account_rid
        FROM 
        ${schemaName}.account_fiscal a
        LEFT JOIN ${schemaName}.project p ON p.account_rid = a.account_rid
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
        WHERE 
            a.account_rid = '${account_rid}'
            AND
            a.fiscal_year = ${fiscal_year} 
        GROUP BY
        a.account_rid,a.total_fte, a.total_subcon
    ),
    calculate_hours_fte AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            COALESCE(af.total_project_hours_fte,0) AS project_level, 
            COALESCE(af.total_project_res_hours_fte,0) AS project_resource_level, 
            COALESCE(af.total_project_task_hours_fte,0) AS project_task_level
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.account_rid = ad.account_rid AND pf.fiscal_year = af.fiscal_year
        WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
    ),
    calculate_cost_fte AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            COALESCE(af.total_project_cost_fte,0) AS project_level, 
            COALESCE(af.total_project_res_cost_fte,0) AS project_resource_level, 
            COALESCE(af.total_project_task_cost_fte,0) AS project_task_level
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.account_rid = ad.account_rid AND pf.fiscal_year = af.fiscal_year
        WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
    ),
    calculate_hours_subcon AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            COALESCE(af.total_project_hours_subcon,0) AS project_level, 
            COALESCE(af.total_project_res_hours_subcon,0) AS project_resource_level, 
            COALESCE(af.total_project_task_hours_subcon,0) AS project_task_level
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.account_rid = ad.account_rid AND pf.fiscal_year = af.fiscal_year
        WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
    ),
    calculate_cost_subcon AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid, 
            COALESCE(af.total_project_cost_subcon,0) AS project_level, 
            COALESCE(af.total_project_res_cost_subcon,0) AS project_resource_level, 
            COALESCE(af.total_project_task_cost_subcon,0) AS project_task_level
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.account_rid = ad.account_rid AND pf.fiscal_year = af.fiscal_year
        WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
    ),
    calculate_cost_nonlabor AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid, 
            COALESCE(af.total_project_cost_nonlabor,0) AS project_level, 
            COALESCE(af.total_project_res_cost_nonlabor,0) AS project_resource_level
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.account_rid = ad.account_rid AND pf.fiscal_year = af.fiscal_year
        WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
    ),
    calculate_rd_credits_federal AS (
        SELECT DISTINCT ON (af.account_rid)
            af.account_rid,
            COALESCE(af.total_projects_rd_credits_fte,0) AS rd_credits_fte,
            COALESCE(af.total_projects_rd_credits_subcon,0) AS rd_credits_subcon,
            SUM(COALESCE(pf.rd_credits_nonlabor_fed_level,0)) AS rd_credits_nonlabor,
            COALESCE(af.total_projects_rd_credits,0) AS rd_credits_total
        FROM
        ${schemaName}.account_fiscal af
        LEFT JOIN ${schemaName}.account_details ad ON ad.account_rid = af.account_rid
        LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
        WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
        group by
        af.account_rid, af.total_projects_rd_credits_fte,af.total_projects_rd_credits_subcon, pf.rd_credits_nonlabor_fed_level,
        af.total_projects_rd_credits
    ),
    calculate_rd_credits_statewise AS (
        SELECT DISTINCT ON (af.account_rid)
            af.account_rid,
            COALESCE(af.total_projects_rd_credits_fte,0) AS rd_credits_fte,
            COALESCE(af.total_projects_rd_credits_subcon,0) AS rd_credits_subcon,
            SUM(COALESCE(pf.rd_credits_nonlabor_fed_level,0)) AS rd_credits_nonlabor,
            COALESCE(af.total_projects_rd_credits,0) AS rd_credits_total
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN ${schemaName}.account_fiscal_region af ON af.account_rid = ad.account_rid
        LEFT JOIN ${schemaName}.project_fiscal_region p ON p.region_rid = af.region_rid
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.project_rid
        WHERE 
        ad.account_rid = '${account_rid}'
        AND
        af.fiscal_year = ${fiscal_year}
        GROUP BY
        af.account_rid, af.total_projects_rd_credits_fte,af.total_projects_rd_credits_subcon, pf.rd_credits_nonlabor_fed_level,
        af.total_projects_rd_credits
    ),
    calculate_total_rd_credits AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            COALESCE(af.rd_credits_fte, 0) + COALESCE(afr.rd_credits_fte, 0) AS rd_credits_fte,
            COALESCE(af.rd_credits_subcon, 0) + COALESCE(afr.rd_credits_subcon, 0) AS rd_credits_subcon,
            COALESCE(af.rd_credits_nonlabor, 0) + COALESCE(afr.rd_credits_nonlabor, 0) AS rd_credits_nonlabor,
            COALESCE(af.rd_credits_total, 0) + COALESCE(afr.rd_credits_total, 0) AS rd_credits_total
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN calculate_rd_credits_statewise afr ON afr.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_federal af ON af.account_rid = ad.account_rid
        WHERE 
        ad.account_rid = '${account_rid}'
        GROUP BY 
        ad.account_rid,
        af.rd_credits_fte, af.rd_credits_subcon, af.rd_credits_nonlabor,
        afr.rd_credits_fte, afr.rd_credits_subcon, afr.rd_credits_nonlabor,
        af.rd_credits_total, afr.rd_credits_total

    )

    SELECT 
        jsonb_build_object(
        'metric','No Of Resources',
        'fte', rm.total_fte,
        'subcon', rm.total_subcon,
        'nonlabor', rm.total_nonlabor,
        'total_projects_rd_credits', crcp.total_projects_rd_credits
        ) AS resource_metrics,

        jsonb_build_object(
        'metric_name', 'FTE Effort',
        'permission', 'fte_effort',
        'project_level', chf.project_level,
        'project_resource_level', chf.project_resource_level,
        'project_task_level', chf.project_task_level
        ) AS fte_hours,

        jsonb_build_object(
        'metric_name', 'FTE Cost',
        'permission', 'fte_cost',
        'project_level', ccf.project_level,
        'project_resource_level', ccf.project_resource_level,
        'project_task_level', ccf.project_task_level
        ) AS fte_cost,

        jsonb_build_object(
        'metric_name', 'Sub Con Effort',
        'permission', 'sub_con_effort',
        'project_level', csh.project_level,
        'project_resource_level', csh.project_resource_level,
        'project_task_level', csh.project_task_level
        ) AS subcon_hours,

        jsonb_build_object(
        'metric_name', 'Sub Con Cost',
        'permission', 'sub_con_cost',
        'project_level', scc.project_level,
        'project_resource_level', scc.project_resource_level,
        'project_task_level', scc.project_task_level
        ) AS subcon_cost,

        jsonb_build_object(
        'metric_name', 'Non Labor Cost',
        'permission', 'non_labor_cost',
        'project_level', ccn.project_level,
        'project_resource_level', ccn.project_resource_level
        ) AS nonlabor_cost,

        jsonb_build_object(
        'name', 'Federal',
        'rd_credits_fte', rdf.rd_credits_fte,
        'rd_credits_subcon', rdf.rd_credits_subcon,
        'rd_credits_nonlabor', rdf.rd_credits_nonlabor,
        'rd_credits_total', rdf.rd_credits_total
        ) AS federal,

        jsonb_build_object(
        'name' ,'Statewise',
        'rd_credits_fte', rds.rd_credits_fte,
        'rd_credits_subcon', rds.rd_credits_subcon,
        'rd_credits_nonlabor', rds.rd_credits_nonlabor,
        'rd_credits_total', rds.rd_credits_total
        ) AS state_wise,

        jsonb_build_object(
        'name','Grand Total',
        'rd_credits_fte', trd.rd_credits_fte,
        'rd_credits_subcon', trd.rd_credits_subcon,
        'rd_credits_nonlabor', trd.rd_credits_nonlabor,
        'rd_credits_total', trd.rd_credits_total
        ) AS grand_total
        
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN calculate_rd_credits_projects crcp ON crcp.account_rid = ad.account_rid
        LEFT JOIN resource_metrics rm ON rm.account_rid = ad.account_rid
        LEFT JOIN calculate_hours_fte chf ON chf.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_fte ccf ON ccf.account_rid = ad.account_rid
        LEFT JOIN calculate_hours_subcon csh ON csh.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_subcon scc ON scc.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_nonlabor ccn ON ccn.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_federal rdf ON rdf.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_statewise rds ON rds.account_rid = ad.account_rid
        LEFT JOIN calculate_total_rd_credits trd ON trd.account_rid = ad.account_rid
        WHERE
        ad.account_rid = '${account_rid}'
    `
    return query;
}

export const fetchIsRdQualifiedProjectQuery = (account_rid : string, schemaName : string, fiscal_year : number) => {
    let query = 
    `
    WITH calculate_rd_credits_projects AS (
        SELECT DISTINCT COUNT(*) OVER() AS total_projects_rd_credits, p.account_rid
        FROM 
        ${schemaName}.account_details ad
        LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
        LEFT JOIN ${schemaName}.project p ON p.account_rid = af.account_rid
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid AND pf.fiscal_year = af.fiscal_year
        WHERE 
        p.is_rd_qualified = true
        and
        p.account_rid = '${account_rid}'
        AND
        af.fiscal_year = ${fiscal_year}
        GROUP BY
        p.account_rid, p.rid
    ),
    calculate_resource_metrics AS (
        SELECT 
        DISTINCT ON (a.account_rid)  
        SUM(COALESCE(pf.total_fte_prj, 0)) AS total_fte, 
        SUM(COALESCE(pf.total_subcon_prj, 0)) AS total_subcon,
        SUM(COALESCE(pf.total_nonlabor_prj, 0)) AS total_nonlabor, 
        a.account_rid
        FROM
		${schemaName}.account_details a
        LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = a.account_rid
        LEFT JOIN ${schemaName}.project p ON p.account_rid = af.account_rid
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid AND pf.fiscal_year = af.fiscal_year
        WHERE 
        a.account_rid = '${account_rid}'
        AND
        af.fiscal_year = ${fiscal_year}
        AND
        p.is_rd_qualified = true
		GROUP BY
		a.account_rid
    ),
    calculate_hours_fte AS (
        SELECT DISTINCT ON (ad.account_rid)
                ad.account_rid,
                SUM(COALESCE(pf.total_effort_fte_prj,0)) AS project_level, 
                SUM(COALESCE(pf.total_effort_fte_from_prj_res,0)) AS project_resource_level, 
                SUM(COALESCE(pf.total_effort_fte_from_tasks,0)) AS project_task_level
            FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project p ON p.account_rid = af.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid AND pf.fiscal_year = af.fiscal_year
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
            AND
            p.is_rd_qualified = true
            GROUP BY
            ad.account_rid
    ),
    calculate_hours_subcon AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            SUM(COALESCE(pf.total_effort_subcon_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_effort_subcon_from_prj_res,0)) AS project_resource_level, 
            SUM(COALESCE(pf.total_effort_subcon_from_tasks,0)) AS project_task_level
            FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project p ON p.account_rid = af.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid AND pf.fiscal_year = af.fiscal_year
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
            AND
            p.is_rd_qualified = true
            GROUP BY
            ad.account_rid
            ),
    calculate_cost_fte AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            SUM(COALESCE(pf.total_cost_fte_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_cost_fte_from_prj_res,0)) AS project_resource_level, 
            SUM(COALESCE(pf.total_cost_fte_from_tasks,0)) AS project_task_level
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project p ON p.account_rid = af.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid AND pf.fiscal_year = af.fiscal_year
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
            AND
            p.is_rd_qualified = true
            GROUP BY
            ad.account_rid
    ),
    calculate_cost_subcon AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            SUM(COALESCE(pf.total_cost_subcon_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_cost_subcon_from_prj_res,0)) AS project_resource_level, 
            SUM(COALESCE(pf.total_cost_subcon_from_tasks,0)) AS project_task_level
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project p ON p.account_rid = af.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid AND pf.fiscal_year = af.fiscal_year
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
            AND
            p.is_rd_qualified = true
            GROUP BY
            ad.account_rid
    ),
    calculate_cost_nonlabor AS (
    SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            SUM(COALESCE(pf.total_cost_nonlabor_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_cost_nonlabor_from_prj_res,0)) AS project_resource_level
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project p ON p.account_rid = af.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid AND pf.fiscal_year = af.fiscal_year
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
            AND
            p.is_rd_qualified = true
            GROUP BY
            ad.account_rid
    ),
    calculate_rd_credits_federal AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            SUM(COALESCE(pf.rd_credits_fte_fed_level,0)) AS rd_credits_fte,
            SUM(COALESCE(pf.rd_credits_subcon_fed_level,0)) AS rd_credits_subcon,
            SUM(COALESCE(pf.rd_credits_nonlabor_fed_level,0)) AS rd_credits_nonlabor,
            SUM(COALESCE(pf.rd_credits_total,0)) AS rd_credits_total
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project p ON p.account_rid = af.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid AND pf.fiscal_year = af.fiscal_year
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            p.is_rd_qualified = true
            GROUP BY
            ad.account_rid
    ),
    calculate_rd_credits_statewise AS (
    SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            SUM(COALESCE(afr.rd_credits_fte_fed_level,0)) AS rd_credits_fte,
            SUM(COALESCE(afr.rd_credits_subcon_fed_level,0)) AS rd_credits_subcon,
            SUM(COALESCE(afr.rd_credits_nonlabor_fed_level,0)) AS rd_credits_nonlabor,
            SUM(COALESCE(afr.rd_credits_total,0)) AS rd_credits_total
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.account_fiscal af ON af.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.account_fiscal_region fr ON fr.account_rid = af.account_rid
            LEFT JOIN ${schemaName}.project_fiscal_region afr ON afr.region_rid = fr.region_rid
            LEFT JOIN ${schemaName}.project p ON p.region_rid = afr.region_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid AND pf.fiscal_year = af.fiscal_year
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
            AND
            p.is_rd_qualified = true
            GROUP BY
            ad.account_rid
    ),
    calculate_rd_credits_total AS (
            SELECT DISTINCT ON (ad.account_rid) ad.account_rid, 
            COALESCE(cf.rd_credits_fte,0) + COALESCE(cr.rd_credits_fte,0) AS rd_credits_fte,
            COALESCE(cf.rd_credits_subcon,0) + COALESCE(cr.rd_credits_subcon,0) AS rd_credits_subcon,
            COALESCE(cf.rd_credits_nonlabor,0) + COALESCE(cr.rd_credits_nonlabor,0) AS rd_credits_nonlabor,
            COALESCE(cf.rd_credits_total,0) + COALESCE(cr.rd_credits_total,0) AS rd_credits_total
        FROM 
            ${schemaName}.account_details ad
            LEFT JOIN calculate_rd_credits_statewise cf ON cf.account_rid = ad.account_rid
            LEFT JOIN calculate_rd_credits_federal cr ON cr.account_rid = ad.account_rid
        WHERE 
            ad.account_rid = '${account_rid}'
        )
    
    SELECT 
        jsonb_build_object(
        'metric','No Of Resources',
        'fte', rm.total_fte,
        'subcon', rm.total_subcon,
        'nonlabor', rm.total_nonlabor,
        'total_projects_rd_credits', crcp.total_projects_rd_credits
        ) AS resource_metrics,

        jsonb_build_object(
        'metric_name', 'FTE Effort',
        'permission', 'fte_effort',
        'project_level', chf.project_level,
        'project_resource_level', chf.project_resource_level,
        'project_task_level', chf.project_task_level
        ) AS fte_hours,

        jsonb_build_object(
        'metric_name', 'FTE Cost',
        'permission', 'fte_cost',
        'project_level', ccf.project_level,
        'project_resource_level', ccf.project_resource_level,
        'project_task_level', ccf.project_task_level
        ) AS fte_cost,

        jsonb_build_object(
        'metric_name', 'Sub Con Effort',
        'permission', 'sub_con_effort',
        'project_level', csh.project_level,
        'project_resource_level', csh.project_resource_level,
        'project_task_level', csh.project_task_level
        ) AS subcon_hours,

        jsonb_build_object(
        'metric_name', 'Sub Con Cost',
        'permission','sub_con_cost',
        'project_level', scc.project_level,
        'project_resource_level', scc.project_resource_level,
        'project_task_level', scc.project_task_level
        ) AS subcon_cost,

        jsonb_build_object(
        'metric_name', 'Non Labor Cost',
        'permission','non_labor_cost',
        'project_level', ccn.project_level,
        'project_resource_level', ccn.project_resource_level
        ) AS nonlabor_cost,

        jsonb_build_object(
        'name', 'Federal',
        'rd_credits_fte', rdf.rd_credits_fte,
        'rd_credits_subcon', rdf.rd_credits_subcon,
        'rd_credits_nonlabor', rdf.rd_credits_nonlabor,
        'rd_credits_total', rdf.rd_credits_total
        ) AS federal,

        jsonb_build_object(
        'name' ,'Statewise',
        'rd_credits_fte', rds.rd_credits_fte,
        'rd_credits_subcon', rds.rd_credits_subcon,
        'rd_credits_nonlabor', rds.rd_credits_nonlabor,
        'rd_credits_total', rds.rd_credits_total
        ) AS state_wise,

        jsonb_build_object(
        'name','Grand Total',
        'rd_credits_fte', trd.rd_credits_fte,
        'rd_credits_subcon', trd.rd_credits_subcon,
        'rd_credits_nonlabor', trd.rd_credits_nonlabor,
        'rd_credits_total', trd.rd_credits_total
        ) AS grand_total
        
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN calculate_rd_credits_projects crcp ON crcp.account_rid = ad.account_rid
        LEFT JOIN calculate_resource_metrics rm ON rm.account_rid = ad.account_rid
        LEFT JOIN calculate_hours_fte chf ON chf.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_fte ccf ON ccf.account_rid = ad.account_rid
        LEFT JOIN calculate_hours_subcon csh ON csh.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_subcon scc ON scc.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_nonlabor ccn ON ccn.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_federal rdf ON rdf.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_statewise rds ON rds.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_total trd ON trd.account_rid = ad.account_rid
        WHERE
        ad.account_rid = '${account_rid}'
    `
    return query
}

export const summaryHighlightsQueryRegion = (account_rid : string, fiscal_year : number, schemaName : string, region_rid : string) => {
    let query =
    `
    WITH calculate_rd_claimed_projects AS (
    SELECT
    af.account_rid,
    COALESCE(COUNT(*) OVER(), 0) AS total_projects_rd_credits
    FROM 
        ${schemaName}.account_fiscal_region af
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.region_rid = af.region_rid AND pf.fiscal_year = ${fiscal_year}
        WHERE 
        af.account_rid = '${account_rid}'
        AND
        af.fiscal_year = ${fiscal_year}
        AND
        af.region_rid = '${region_rid}'
        AND
        pf.is_rd_claim_qualified = true
    ),
    resource_metrics AS (
        SELECT DISTINCT ON (af.account_rid) 
        SUM(COALESCE(p.total_fte_prj,0)) as total_fte, 
        SUM(COALESCE(p.total_subcon_prj,0)) as total_subcon,
        SUM(COALESCE(p.total_nonlabor_prj, 0)) AS total_nonlabor,
        af.account_rid
        FROM 
        ${schemaName}.account_fiscal_region af
		LEFT JOIN ${schemaName}.project_fiscal p 
        ON p.region_rid = af.region_rid 
        AND p.account_rid = af.account_rid AND p.fiscal_year = ${fiscal_year}
        WHERE 
        af.account_rid = '${account_rid}'
        AND
        af.fiscal_year = ${fiscal_year}
        AND
        af.region_rid = '${region_rid}' 
        GROUP BY af.account_rid
    ),
    calculate_hours_fte AS (
       SELECT DISTINCT ON (afr.account_rid)
            afr.account_rid,
            SUM(COALESCE(pf.total_effort_fte_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_effort_fte_from_prj_res,0))AS project_resource_level, 
            SUM(COALESCE(pf.total_effort_fte_from_tasks,0)) AS project_task_level
        FROM
        ${schemaName}.account_fiscal_region afr
        LEFT JOIN ${schemaName}.project_fiscal pf 
        ON pf.account_rid = afr.account_rid 
        AND pf.region_rid = afr.region_rid AND pf.fiscal_year = ${fiscal_year}
        WHERE 
            afr.account_rid = '${account_rid}'
            AND
            afr.fiscal_year = ${fiscal_year}
            AND
			afr.region_rid = '${region_rid}'
        GROUP BY
        afr.account_rid
    ),
    calculate_cost_fte AS (
        SELECT DISTINCT ON (afr.account_rid)
            afr.account_rid,
            SUM(COALESCE(pf.total_cost_fte_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_cost_fte_from_prj_res,0)) AS project_resource_level, 
            SUM(COALESCE(pf.total_cost_fte_from_tasks,0)) AS project_task_level

        FROM ${schemaName}.account_fiscal_region afr
        LEFT JOIN ${schemaName}.project_fiscal pf 
        ON pf.account_rid = afr.account_rid 
        AND pf.region_rid = afr.region_rid AND pf.fiscal_year = ${fiscal_year}
        WHERE 
            afr.account_rid = '${account_rid}'
            AND
            afr.fiscal_year = ${fiscal_year}
            AND
			afr.region_rid = '${region_rid}'
            GROUP BY
        afr.account_rid
    ),
    calculate_hours_subcon AS (
        SELECT DISTINCT ON (afr.account_rid)
            afr.account_rid,
            SUM(COALESCE(pf.total_effort_subcon_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_effort_subcon_from_prj_res,0)) AS project_resource_level, 
            SUM(COALESCE(pf.total_effort_subcon_from_tasks,0)) AS project_task_level

        FROM ${schemaName}.account_fiscal_region afr
        LEFT JOIN ${schemaName}.project_fiscal pf 
        ON pf.account_rid = afr.account_rid 
        AND pf.region_rid = afr.region_rid AND pf.fiscal_year = ${fiscal_year}
        WHERE 
            afr.account_rid = '${account_rid}'
            AND
            afr.fiscal_year = ${fiscal_year}
            AND
			afr.region_rid = '${region_rid}'
            GROUP BY
        afr.account_rid
    ),
    calculate_cost_subcon AS (
        SELECT DISTINCT ON (afr.account_rid)
            afr.account_rid, 
            SUM(COALESCE(pf.total_cost_subcon_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_cost_subcon_from_prj_res,0)) AS project_resource_level, 
            SUM(COALESCE(pf.total_cost_subcon_from_tasks,0)) AS project_task_level
        
        FROM ${schemaName}.account_fiscal_region afr
        LEFT JOIN ${schemaName}.project_fiscal pf 
        ON pf.account_rid = afr.account_rid 
        AND pf.region_rid = afr.region_rid AND pf.fiscal_year = ${fiscal_year}
        WHERE 
            afr.account_rid = '${account_rid}'
            AND
            afr.fiscal_year = ${fiscal_year}
            AND
			afr.region_rid = '${region_rid}'
            GROUP BY
        afr.account_rid
    ),
    calculate_cost_nonlabor AS (
        SELECT DISTINCT ON (afr.account_rid)
            afr.account_rid, 
            SUM(COALESCE(pf.total_cost_nonlabor_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_cost_nonlabor_from_prj_res,0)) AS project_resource_level
        
        FROM ${schemaName}.account_fiscal_region afr
        LEFT JOIN ${schemaName}.project_fiscal pf 
        ON pf.account_rid = afr.account_rid 
        AND pf.region_rid = afr.region_rid AND pf.fiscal_year = ${fiscal_year}
        WHERE 
            afr.account_rid = '${account_rid}'
            AND
            afr.fiscal_year = ${fiscal_year}
            AND
			afr.region_rid = '${region_rid}'
            GROUP BY
        afr.account_rid
    ),
    calculate_rd_credits_federal AS (
        SELECT DISTINCT ON (af.account_rid)
            af.account_rid,
            COALESCE(af.total_projects_rd_credits_fte,0) AS rd_credits_fte,
            COALESCE(af.total_projects_rd_credits_subcon,0) AS rd_credits_subcon,
            SUM(COALESCE(pf.rd_credits_nonlabor_fed_level,0)) AS rd_credits_nonlabor,
            COALESCE(af.total_projects_rd_credits, 0) AS rd_credits_total
        FROM
        ${schemaName}.account_fiscal af
        LEFT JOIN ${schemaName}.account_details ad ON ad.account_rid = af.account_rid
		LEFT JOIN ${schemaName}.account_fiscal_region afr ON afr.account_rid = af.account_rid
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.region_rid = afr.region_rid 
        WHERE 
            ad.account_rid = '${account_rid}'
            AND
            af.fiscal_year = ${fiscal_year}
        GROUP BY af.account_rid, af.total_projects_rd_credits_fte, af.total_projects_rd_credits_subcon, 
                 pf.rd_credits_nonlabor_fed_level, af.total_projects_rd_credits
    ),
    calculate_rd_credits_statewise AS (
        SELECT DISTINCT ON (af.account_rid)
            af.account_rid,
            SUM(COALESCE(pf.rd_credits_fte_fed_level,0)) AS rd_credits_fte,
            SUM(COALESCE(pf.rd_credits_subcon_fed_level,0)) AS rd_credits_subcon,
            SUM(COALESCE(pf.rd_credits_nonlabor_fed_level,0)) AS rd_credits_nonlabor,
            SUM(COALESCE(pf.rd_credits_total,0)) AS rd_credits_total
        FROM
        ${schemaName}.account_fiscal_region af
        LEFT JOIN ${schemaName}.project_fiscal pf 
        ON pf.account_rid = af.account_rid 
        AND pf.region_rid = af.region_rid AND pf.fiscal_year = ${fiscal_year}
        WHERE 
        af.account_rid = '${account_rid}'
        AND
        af.fiscal_year = ${fiscal_year}
        AND
		af.region_rid = '${region_rid}'
        GROUP BY af.account_rid
    ),
    calculate_total_rd_credits AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            COALESCE(af.rd_credits_fte, 0) + COALESCE(afr.rd_credits_fte, 0) AS rd_credits_fte,
            COALESCE(af.rd_credits_subcon, 0) + COALESCE(afr.rd_credits_subcon, 0) AS rd_credits_subcon,
            COALESCE(af.rd_credits_nonlabor, 0) + COALESCE(afr.rd_credits_nonlabor, 0) AS rd_credits_nonlabor,
            COALESCE(af.rd_credits_total, 0) + COALESCE(afr.rd_credits_total, 0) AS rd_credits_total
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN calculate_rd_credits_statewise af on af.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_federal afr ON afr.account_rid = ad.account_rid
        WHERE 
        ad.account_rid = '${account_rid}'
        GROUP BY 
        af.rd_credits_fte,
        af.rd_credits_subcon,
        afr.rd_credits_fte,
        afr.rd_credits_subcon,
        af.rd_credits_nonlabor,
        afr.rd_credits_nonlabor,
        ad.account_rid,
        af.rd_credits_total,
        afr.rd_credits_total
    )

    SELECT 
        jsonb_build_object(
        'metric','No Of Resources',
        'fte', rm.total_fte,
        'subcon', rm.total_subcon,
        'nonlabor',rm.total_nonlabor,
        'total_projects_rd_credits', crcp.total_projects_rd_credits
        ) AS resource_metrics,

        jsonb_build_object(
        'metric_name', 'FTE Effort',
        'permission', 'fte_effort',
        'project_level', chf.project_level,
        'project_resource_level', chf.project_resource_level,
        'project_task_level', chf.project_task_level
        ) AS fte_hours,

        jsonb_build_object(
        'metric_name', 'FTE Cost',
        'permission', 'fte_cost',
        'project_level', ccf.project_level,
        'project_resource_level', ccf.project_resource_level,
        'project_task_level', ccf.project_task_level
        ) AS fte_cost,

        jsonb_build_object(
        'metric_name', 'Sub Con Effort',
        'permission', 'sub_con_effort',
        'project_level', csh.project_level,
        'project_resource_level', csh.project_resource_level,
        'project_task_level', csh.project_task_level
        ) AS subcon_hours,

        jsonb_build_object(
        'metric_name', 'Sub Con Cost',
        'permission', 'sub_con_cost',
        'project_level', scc.project_level,
        'project_resource_level', scc.project_resource_level,
        'project_task_level', scc.project_task_level
        ) AS subcon_cost,

        jsonb_build_object(
        'metric_name', 'Non Labor Cost',
        'permission', 'non_labor_cost',
        'project_level', ccn.project_level,
        'project_resource_level', ccn.project_resource_level
        ) AS nonlabor_cost,

        jsonb_build_object(
        'name', 'Federal',
        'rd_credits_fte', rdf.rd_credits_fte,
        'rd_credits_subcon', rdf.rd_credits_subcon,
        'rd_credits_nonlabor', rdf.rd_credits_nonlabor,
        'rd_credits_total', rdf.rd_credits_total
        ) AS federal,

        jsonb_build_object(
        'name' ,'Statewise',
        'rd_credits_fte', rds.rd_credits_fte,
        'rd_credits_subcon', rds.rd_credits_subcon,
        'rd_credits_nonlabor', rds.rd_credits_nonlabor,
        'rd_credits_total', rds.rd_credits_total
        ) AS state_wise,

        jsonb_build_object(
        'name','Grand Total',
        'rd_credits_fte', trd.rd_credits_fte,
        'rd_credits_subcon', trd.rd_credits_subcon,
        'rd_credits_nonlabor', trd.rd_credits_nonlabor,
        'rd_credits_total', trd.rd_credits_total
        ) AS grand_total
        
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN calculate_rd_claimed_projects crcp ON crcp.account_rid = ad.account_rid
        LEFT JOIN resource_metrics rm ON rm.account_rid = ad.account_rid
        LEFT JOIN calculate_hours_fte chf ON chf.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_fte ccf ON ccf.account_rid = ad.account_rid
        LEFT JOIN calculate_hours_subcon csh ON csh.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_subcon scc ON scc.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_nonlabor ccn ON ccn.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_federal rdf ON rdf.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_statewise rds ON rds.account_rid = ad.account_rid
        LEFT JOIN calculate_total_rd_credits trd ON trd.account_rid = ad.account_rid
        WHERE
        ad.account_rid = '${account_rid}'
    `
    return query;
}

export const fetchIsRdQualifiedProjectQueryRegion = (account_rid : string, schemaName : string, fiscal_year : number, region_rid : string) => {
    let query = 
    `
    WITH calculate_rd_credits_projects AS (
        SELECT DISTINCT COUNT(*) OVER() AS total_projects_rd_credits, afr.account_rid
        FROM 
       ${schemaName}.account_fiscal_region afr
        LEFT JOIN ${schemaName}.project_fiscal pf 
        ON pf.region_rid = afr.region_rid AND pf.account_rid = afr.account_rid 
        AND pf.fiscal_year = ${fiscal_year}
        WHERE 
        pf.is_rd_claim_qualified = true
        and
        afr.account_rid = '${account_rid}'
        AND
        afr.fiscal_year = ${fiscal_year}
        AND
		afr.region_rid = '${region_rid}'
    ),
    calculate_resource_metrics AS (
        SELECT 
        DISTINCT ON (afr.account_rid)  
        SUM(COALESCE(pf.total_fte_prj, 0)) AS total_fte, 
        SUM(COALESCE(pf.total_subcon_prj, 0)) AS total_subcon,
        SUM(COALESCE(pf.total_nonlabor_prj, 0)) AS total_nonlabor, 
        afr.account_rid
        FROM
		${schemaName}.account_fiscal_region afr
        LEFT JOIN ${schemaName}.project_fiscal pf 
        ON pf.region_rid = afr.region_rid 
        AND pf.account_rid = afr.account_rid
        AND pf.fiscal_year = ${fiscal_year}
        WHERE 
        afr.account_rid = '${account_rid}'
        AND
        afr.fiscal_year = ${fiscal_year}
        AND
        pf.is_rd_claim_qualified = true
        AND
		afr.region_rid = '${region_rid}'
		GROUP BY
		afr.account_rid
    ),
    calculate_hours_fte AS (
        SELECT DISTINCT ON (afr.account_rid)
                afr.account_rid,
                SUM(COALESCE(pf.total_effort_fte_prj,0)) AS project_level, 
                SUM(COALESCE(pf.total_effort_fte_from_prj_res,0)) AS project_resource_level, 
                SUM(COALESCE(pf.total_effort_fte_from_tasks,0)) AS project_task_level
            FROM
            ${schemaName}.account_fiscal_region afr
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.region_rid = afr.region_rid AND pf.account_rid = afr.account_rid
            WHERE 
            afr.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.is_rd_claim_qualified = true
            AND
		    afr.region_rid = '${region_rid}'
            GROUP BY
            afr.account_rid
    ),
    calculate_hours_subcon AS (
        SELECT DISTINCT ON (afr.account_rid)
            afr.account_rid,
            SUM(COALESCE(pf.total_effort_subcon_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_effort_subcon_from_prj_res,0)) AS project_resource_level, 
            SUM(COALESCE(pf.total_effort_subcon_from_tasks,0)) AS project_task_level
            FROM
            ${schemaName}.account_fiscal_region afr
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.region_rid = afr.region_rid AND pf.account_rid = afr.account_rid
            WHERE 
            afr.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.is_rd_claim_qualified = true
            AND
		    afr.region_rid = '${region_rid}'
            GROUP BY
            afr.account_rid
            ),
    calculate_cost_fte AS (
        SELECT DISTINCT ON (afr.account_rid)
            afr.account_rid,
            SUM(COALESCE(pf.total_cost_fte_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_cost_fte_from_prj_res,0)) AS project_resource_level, 
            SUM(COALESCE(pf.total_cost_fte_from_tasks,0)) AS project_task_level
        FROM
            ${schemaName}.account_fiscal_region afr
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.region_rid = afr.region_rid AND pf.account_rid = afr.account_rid
            WHERE 
            afr.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.is_rd_claim_qualified = true
            AND
		    afr.region_rid = '${region_rid}'
            GROUP BY
            afr.account_rid
    ),
    calculate_cost_subcon AS (
        SELECT DISTINCT ON (afr.account_rid)
            afr.account_rid,
            SUM(COALESCE(pf.total_cost_subcon_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_cost_subcon_from_prj_res,0)) AS project_resource_level, 
            SUM(COALESCE(pf.total_cost_subcon_from_tasks,0)) AS project_task_level
        FROM
            ${schemaName}.account_fiscal_region afr
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.region_rid = afr.region_rid AND pf.account_rid = afr.account_rid
            WHERE 
            afr.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.is_rd_claim_qualified = true
            AND
		    afr.region_rid = '${region_rid}'
            GROUP BY
            afr.account_rid
    ),
    calculate_cost_nonlabor AS (
    SELECT DISTINCT ON (afr.account_rid)
            afr.account_rid,
            SUM(COALESCE(pf.total_cost_nonlabor_prj,0)) AS project_level, 
            SUM(COALESCE(pf.total_cost_nonlabor_from_prj_res,0)) AS project_resource_level
        FROM
            ${schemaName}.account_fiscal_region afr
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.region_rid = afr.region_rid AND pf.account_rid = afr.account_rid
            WHERE 
            afr.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.is_rd_claim_qualified = true
            AND
		    afr.region_rid = '${region_rid}'
            GROUP BY
            afr.account_rid
    ),
    calculate_rd_credits_federal AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            SUM(COALESCE(pf.rd_credits_fte_fed_level,0)) AS rd_credits_fte,
            SUM(COALESCE(pf.rd_credits_subcon_fed_level,0)) AS rd_credits_subcon,
            SUM(COALESCE(pf.rd_credits_nonlabor_fed_level,0)) AS rd_credits_nonlabor,
            SUM(COALESCE(pf.rd_credits_total,0)) AS rd_credits_total
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.account_fiscal_region afr ON afr.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project p ON p.account_rid = afr.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.is_rd_claim_qualified = true
            GROUP BY
            ad.account_rid
    ),
    calculate_rd_credits_statewise AS (
    SELECT DISTINCT ON (afr.account_rid)
            afr.account_rid,
            SUM(COALESCE(pf.rd_credits_fte_fed_level,0)) AS rd_credits_fte,
            SUM(COALESCE(pf.rd_credits_subcon_fed_level,0)) AS rd_credits_subcon,
            SUM(COALESCE(pf.rd_credits_nonlabor_fed_level,0)) AS rd_credits_nonlabor,
            SUM(COALESCE(pf.rd_credits_total,0)) AS rd_credits_total
        FROM
            ${schemaName}.account_fiscal_region afr
            LEFT JOIN ${schemaName}.project_fiscal pf 
            ON pf.region_rid = afr.region_rid 
            AND pf.account_rid = afr.account_rid
            AND pf.fiscal_year = ${fiscal_year}
            WHERE 
            afr.account_rid = '${account_rid}'
            AND
            afr.fiscal_year = ${fiscal_year}
            AND
            pf.is_rd_claim_qualified = true
            AND
		    afr.region_rid = '${region_rid}'
            GROUP BY
            afr.account_rid
    ),
    calculate_rd_credits_total AS (
            SELECT DISTINCT ON (ad.account_rid) ad.account_rid, 
            COALESCE(cf.rd_credits_fte,0) + COALESCE(cr.rd_credits_fte,0) AS rd_credits_fte,
            COALESCE(cf.rd_credits_subcon,0) + COALESCE(cr.rd_credits_subcon,0) AS rd_credits_subcon,
            COALESCE(cf.rd_credits_nonlabor,0) + COALESCE(cr.rd_credits_nonlabor,0) AS rd_credits_nonlabor,
            COALESCE(cf.rd_credits_total,0) + COALESCE(cr.rd_credits_total,0) AS rd_credits_total
        FROM 
            ${schemaName}.account_details ad
            LEFT JOIN calculate_rd_credits_statewise cf ON cf.account_rid = ad.account_rid
            LEFT JOIN calculate_rd_credits_federal cr ON cr.account_rid = ad.account_rid
        WHERE 
            ad.account_rid = '${account_rid}'
        )
    
    SELECT 
        jsonb_build_object(
        'metric','No Of Resources',
        'fte', rm.total_fte,
        'subcon', rm.total_subcon,
        'nonlabor', rm.total_nonlabor,
        'total_projects_rd_credits', crcp.total_projects_rd_credits
        ) AS resource_metrics,

        jsonb_build_object(
        'metric_name', 'FTE Effort',
        'permission', 'fte_effort',
        'project_level', chf.project_level,
        'project_resource_level', chf.project_resource_level,
        'project_task_level', chf.project_task_level
        ) AS fte_hours,

        jsonb_build_object(
        'metric_name', 'FTE Cost',
        'permission', 'fte_cost',
        'project_level', ccf.project_level,
        'project_resource_level', ccf.project_resource_level,
        'project_task_level', ccf.project_task_level
        ) AS fte_cost,

        jsonb_build_object(
        'metric_name', 'Sub Con Effort',
        'permission', 'sub_con_effort',
        'project_level', csh.project_level,
        'project_resource_level', csh.project_resource_level,
        'project_task_level', csh.project_task_level
        ) AS subcon_hours,

        jsonb_build_object(
        'metric_name', 'Sub Con Cost',
        'permission', 'sub_con_cost',
        'project_level', scc.project_level,
        'project_resource_level', scc.project_resource_level,
        'project_task_level', scc.project_task_level
        ) AS subcon_cost,

        jsonb_build_object(
        'metric_name', 'Non Labor Cost',
        'permission', 'non_labor_cost',
        'project_level', ccn.project_level,
        'project_resource_level', ccn.project_resource_level
        ) AS nonlabor_cost,

        jsonb_build_object(
        'name', 'Federal',
        'rd_credits_fte', rdf.rd_credits_fte,
        'rd_credits_subcon', rdf.rd_credits_subcon,
        'rd_credits_nonlabor', rdf.rd_credits_nonlabor,
        'rd_credits_total', rdf.rd_credits_total
        ) AS federal,

        jsonb_build_object(
        'name' ,'Statewise',
        'rd_credits_fte', rds.rd_credits_fte,
        'rd_credits_subcon', rds.rd_credits_subcon,
        'rd_credits_nonlabor', rds.rd_credits_nonlabor,
        'rd_credits_total', rds.rd_credits_total
        ) AS state_wise,

        jsonb_build_object(
        'name','Grand Total',
        'rd_credits_fte', trd.rd_credits_fte,
        'rd_credits_subcon', trd.rd_credits_subcon,
        'rd_credits_nonlabor', trd.rd_credits_nonlabor,
        'rd_credits_total', trd.rd_credits_total
        ) AS grand_total
        
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN calculate_rd_credits_projects crcp ON crcp.account_rid = ad.account_rid
        LEFT JOIN calculate_resource_metrics rm ON rm.account_rid = ad.account_rid
        LEFT JOIN calculate_hours_fte chf ON chf.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_fte ccf ON ccf.account_rid = ad.account_rid
        LEFT JOIN calculate_hours_subcon csh ON csh.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_subcon scc ON scc.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_nonlabor ccn ON ccn.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_federal rdf ON rdf.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_statewise rds ON rds.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_total trd ON trd.account_rid = ad.account_rid
        WHERE
        ad.account_rid = '${account_rid}'
    `
    return query
}

export const fetchProjectQueryByPrjId = (account_rid : string, schemaName : string, fiscal_year : number, project_fiscal_rid : string) => {
    let query = 
    `
    WITH calculate_resource_metrics AS (
        SELECT 
        DISTINCT ON (a.account_rid)  
        COALESCE(pf.total_fte_prj, 0) AS total_fte, 
        COALESCE(pf.total_subcon_prj, 0) AS total_subcon,
        COALESCE(pf.total_nonlabor_prj, 0) AS total_nonlabor,
        a.account_rid,
        pf.claim_status
        FROM
		${schemaName}.account_details a
        LEFT JOIN ${schemaName}.project p ON p.account_rid = a.account_rid
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
        WHERE 
        a.account_rid = '${account_rid}'
        AND
        pf.fiscal_year = ${fiscal_year}
        AND
		pf.rid = '${project_fiscal_rid}'
		GROUP BY
		a.account_rid,pf.total_fte_prj, pf.total_subcon_prj, pf.total_nonlabor_prj,pf.claim_status
    ),
    fetch_project_name AS (
        SELECT project_name, account_rid FROM ${schemaName}.project_fiscal
        WHERE
        rid = '${project_fiscal_rid}'
    ),
    calculate_hours_fte AS (
        SELECT DISTINCT ON (ad.account_rid)
                ad.account_rid,
                COALESCE(pf.total_effort_fte_prj,0) AS project_level, 
                COALESCE(pf.total_effort_fte_from_prj_res,0) AS project_resource_level, 
                COALESCE(pf.total_effort_fte_from_tasks,0) AS project_task_level
            FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
		    pf.rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid,pf.total_effort_fte_prj,pf.total_effort_fte_from_prj_res,pf.total_effort_fte_from_tasks 
    ),
    calculate_hours_subcon AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            COALESCE(pf.total_effort_subcon_prj,0) AS project_level, 
            COALESCE(pf.total_effort_subcon_from_prj_res,0) AS project_resource_level, 
            COALESCE(pf.total_effort_subcon_from_tasks,0) AS project_task_level
            FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
		    pf.rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid, pf.total_effort_subcon_prj,pf.total_effort_subcon_from_prj_res, pf.total_effort_subcon_from_tasks
            ),
    calculate_cost_fte AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            COALESCE(pf.total_cost_fte_prj,0) AS project_level, 
            COALESCE(pf.total_cost_fte_from_prj_res,0) AS project_resource_level, 
            COALESCE(pf.total_cost_fte_from_tasks,0) AS project_task_level
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
		    pf.rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid, pf.total_cost_fte_prj, pf.total_cost_fte_from_prj_res, pf.total_cost_fte_from_tasks
    ),
    calculate_cost_subcon AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            COALESCE(pf.total_cost_subcon_prj,0) AS project_level, 
            COALESCE(pf.total_cost_subcon_from_prj_res,0) AS project_resource_level, 
            COALESCE(pf.total_cost_subcon_from_tasks,0) AS project_task_level
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
		    pf.rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid, pf.total_cost_subcon_prj, pf.total_cost_subcon_from_prj_res, pf.total_cost_subcon_from_tasks
    ),
    calculate_cost_nonlabor AS (
    SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            COALESCE(pf.total_cost_nonlabor_prj,0) AS project_level, 
            COALESCE(pf.total_cost_nonlabor_from_prj_res,0) AS project_resource_level
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
		    pf.rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid, pf.total_cost_nonlabor_prj, pf.total_cost_nonlabor_from_prj_res
    ),
    calculate_rd_credits_federal AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            COALESCE(pf.rd_credits_fte_fed_level,0) AS rd_credits_fte,
            COALESCE(pf.rd_credits_subcon_fed_level,0) AS rd_credits_subcon,
            COALESCE(pf.rd_credits_nonlabor_fed_level, 0) AS rd_credits_nonlabor,
            COALESCE(pf.rd_credits_total) AS rd_credits_total
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
		    pf.rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid, pf.rd_credits_fte_fed_level, pf.rd_credits_subcon_fed_level,pf.rd_credits_nonlabor_fed_level,pf.rd_credits_total  
    ),
    calculate_rd_credits_statewise AS (
    SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            COALESCE(pf.qre_fte,0) AS qre_fte,
            COALESCE(pf.qre_subcon,0) AS qre_subcon,
            COALESCE(pf.qre_nonlabor, 0) AS qre_nonlabor,
            COALESCE(pf.qre_final, 0) AS qre_final
        FROM
            ${schemaName}.account_details ad
			LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
		    pf.rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid, pf.qre_fte, pf.qre_subcon, pf.qre_nonlabor, pf.qre_final
    ),

    calculate_rd_credits_total AS (
            SELECT DISTINCT ON (ad.account_rid) ad.account_rid, 
            COALESCE(pf.rd_percent_potential_ai,0) AS rd_percent_potential,
            COALESCE(pf.rd_percent_adjustment,0) AS rd_percent_adjustment,
            COALESCE(pf.rd_percent_final,0) AS rd_percent_final
        FROM
            ${schemaName}.account_details ad
			LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
		    pf.rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid,pf.rd_percent_potential_ai,pf.rd_percent_adjustment,pf.rd_percent_final
        ),
    
        calculate_federal AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            SUM(COALESCE(pf.rd_credits_fte_fed_level,0)) AS rd_credits_fte,
            SUM(COALESCE(pf.rd_credits_subcon_fed_level,0)) AS rd_credits_subcon,
            SUM(COALESCE(pf.rd_credits_nonlabor_fed_level,0)) AS rd_credits_nonlabor
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.project_rid = p.rid
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
		    pf.rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid
    ),
    calculate_statewise AS (
    SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            SUM(COALESCE(afr.rd_credits_fte_fed_level,0)) AS rd_credits_fte,
            SUM(COALESCE(afr.rd_credits_subcon_fed_level,0)) AS rd_credits_subcon,
            SUM(COALESCE(afr.rd_credits_nonlabor_fed_level,0)) AS rd_credits_nonlabor
        FROM
            ${schemaName}.account_details ad
			LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.project_fiscal_region afr ON afr.project_rid = p.rid
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.region_rid = afr.region_rid
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
		    pf.rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid
    ),
    calculate_total AS (
            SELECT DISTINCT ON (ad.account_rid) ad.account_rid, 
            COALESCE(cf.rd_credits_fte,0) + COALESCE(cr.rd_credits_fte,0) AS rd_credits_fte,
            COALESCE(cf.rd_credits_subcon,0) + COALESCE(cr.rd_credits_subcon,0) AS rd_credits_subcon,
            COALESCE(cf.rd_credits_nonlabor,0) + COALESCE(cr.rd_credits_nonlabor,0) AS rd_credits_nonlabor
        FROM 
            ${schemaName}.account_details ad
            LEFT JOIN calculate_statewise cf ON cf.account_rid = ad.account_rid
            LEFT JOIN calculate_federal cr ON cr.account_rid = ad.account_rid
        WHERE 
            ad.account_rid = '${account_rid}'
        )
    
    SELECT 
        jsonb_build_object(
        'metric','No Of Resources',
        'fte', rm.total_fte,
        'subcon', rm.total_subcon,
        'nonlabor', rm.total_nonlabor,
        'project_name', fpn.project_name,
        'claim_status', rm.claim_status
        ) AS resource_metrics,

        jsonb_build_object(
        'metric_name', 'FTE Effort',
        'permission', 'fte_effort',
        'project_level', chf.project_level,
        'project_resource_level', chf.project_resource_level,
        'project_task_level', chf.project_task_level
        ) AS fte_hours,

        jsonb_build_object(
        'metric_name', 'FTE Cost',
        'permission', 'fte_cost',
        'project_level', ccf.project_level,
        'project_resource_level', ccf.project_resource_level,
        'project_task_level', ccf.project_task_level
        ) AS fte_cost,

        jsonb_build_object(
        'metric_name', 'Sub Con Effort',
        'permission', 'sub_con_effort',
        'project_level', csh.project_level,
        'project_resource_level', csh.project_resource_level,
        'project_task_level', csh.project_task_level
        ) AS subcon_hours,

        jsonb_build_object(
        'metric_name', 'Sub Con Cost',
        'permission', 'sub_con_cost',
        'project_level', scc.project_level,
        'project_resource_level', scc.project_resource_level,
        'project_task_level', scc.project_task_level
        ) AS subcon_cost,

        jsonb_build_object(
        'metric_name', 'Non Labor Cost',
        'permission', 'non_labor_cost',
        'project_level', ccn.project_level,
        'project_resource_level', ccn.project_resource_level
        ) AS nonlabor_cost,

        jsonb_build_object(
        'name', 'rd_credits',
        'rd_credits_fte', rdf.rd_credits_fte,
        'rd_credits_subcon', rdf.rd_credits_subcon,
        'rd_credits_nonlabor', rdf.rd_credits_nonlabor,
        'rd_credits_total', rdf.rd_credits_total
        ) AS rd_credits,

        jsonb_build_object(
        'name' ,'qre',
        'qre_fte', rds.qre_fte,
        'qre_subcon', rds.qre_subcon,
        'qre_nonlabor', rds.qre_nonlabor,
        'qre_final', rds.qre_final
        ) AS qre,

        jsonb_build_object(
        'name','rd_percent',
        'rd_percent_potential', trd.rd_percent_potential,
        'rd_percent_adjustment', trd.rd_percent_adjustment,
        'rd_percent_final', trd.rd_percent_final
        ) AS rd_percent,

        jsonb_build_object(
        'name', 'Federal',
        'rd_credits_fte', rdff.rd_credits_fte,
        'rd_credits_subcon', rdff.rd_credits_subcon,
        'rd_credits_nonlabor', rdff.rd_credits_nonlabor
        ) AS federal,

        jsonb_build_object(
        'name' ,'Statewise',
        'rd_credits_fte', rdss.rd_credits_fte,
        'rd_credits_subcon', rdss.rd_credits_subcon,
        'rd_credits_nonlabor', rdss.rd_credits_nonlabor
        ) AS state_wise,

        jsonb_build_object(
        'name','Grand Total',
        'rd_credits_fte', trdd.rd_credits_fte,
        'rd_credits_subcon', trdd.rd_credits_subcon,
        'rd_credits_nonlabor', trdd.rd_credits_nonlabor
        ) AS grand_total
        
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN calculate_resource_metrics rm ON rm.account_rid = ad.account_rid
        LEFT JOIN calculate_hours_fte chf ON chf.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_fte ccf ON ccf.account_rid = ad.account_rid
        LEFT JOIN calculate_hours_subcon csh ON csh.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_subcon scc ON scc.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_nonlabor ccn ON ccn.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_federal rdf ON rdf.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_statewise rds ON rds.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_total trd ON trd.account_rid = ad.account_rid
        LEFT JOIN calculate_federal rdff ON rdf.account_rid = ad.account_rid
        LEFT JOIN calculate_statewise rdss ON rds.account_rid = ad.account_rid
        LEFT JOIN calculate_total trdd ON trd.account_rid = ad.account_rid
        LEFT JOIN fetch_project_name fpn ON fpn.account_rid = ad.account_rid
        WHERE
        ad.account_rid = '${account_rid}'
    `
    return query
}

export const fetchResCodeWithPrjResRole = (schemaName : string, search : string, statusId : string, accountId : string, project_fiscal_rid : string) => {
    let searchValue : string = ``

    if(search) searchValue = `%${search}%`
    else searchValue = `%%`

    let query = `
    SELECT ps.rid, r.resource_code, ps.project_resource_role
    FROM
    ${schemaName}.project_resource ps
    LEFT JOIN ${schemaName}.resources r ON r.rid = ps.resource_rid
    WHERE
    ps.account_rid = '${accountId}'
    AND
    (r.resource_code ILIKE '${searchValue}' OR ps.project_resource_role ILIKE '${searchValue}')
    AND
    r.status_rid = '${statusId}'
    AND
    ps.project_fiscal_rid = '${project_fiscal_rid}'
    ORDER BY ps.created_datetime ASC
    `
    return query;
  }