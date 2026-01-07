export const fetchProjectCostDetailsBasedOnCases = (caseRid : string, accountRid : string, schemaName : string, reduction : number) => {
    let query = 
    `
    WITH fetch_project_ids AS (
    SELECT project_fiscal_rid, rid 
    FROM ${schemaName}.case_projects 
    WHERE
    case_rid = '${caseRid}'
    AND
    account_rid = '${accountRid}'
    ),
    calculate_cost AS (
    SELECT 
    CAST(SUM(COALESCE(cp.total_cost_fte_prj, 0.00)) AS DECIMAL(18,2)) AS employees,
    CAST(SUM(COALESCE(cp.total_cost_subcon_prj, 0.00)) AS DECIMAL(18,2)) AS epw,
    cp.project_name, cp.project_fiscal_rid, cp.currency_rid
    FROM
    ${schemaName}.case_projects cp
    LEFT JOIN fetch_project_ids fpr ON fpr.rid = cp.rid
    WHERE
    cp.project_fiscal_rid = fpr.project_fiscal_rid
    GROUP BY
    cp.project_name, cp.project_fiscal_rid, cp.currency_rid
    ORDER BY cp.project_name ASC
    )
    SELECT 
    array_agg(jsonb_build_object(
    'project_fiscal_rid', project_fiscal_rid,
    'project_name', project_name,
    'currency_rid', currency_rid,
    'employees', employees,
    'epw', epw,
    'reductions', CAST(epw * ${reduction}/100 AS DECIMAL(18,2)),
    'net_epw', CAST(epw - (epw * ${reduction}/100) AS DECIMAL(18,2)),
    'total_project_value_labor', CAST(epw - (epw * ${reduction}/100) + employees AS DECIMAL(18,2))
    )) AS projects
    FROM
    calculate_cost
    `
    return query;
}
export const calculateRDExpenditureQuery = (schemaName : string, caseRid : string, accountRid : string) => {
    let query = `
    SELECT 
    CAST((COALESCE(cp.total_cost_fte_prj, 0.00) * COALESCE(cp.rd_percent_final, 0.00))/100 AS DECIMAL(18,2)) AS fte_qre_amount,
    CAST((COALESCE(cp.total_cost_subcon_prj, 0.00) * COALESCE(cp.rd_percent_final, 0.00))/100 AS DECIMAL(18,2)) AS subcon_qre_amount,
    CAST((COALESCE(cp.total_cost_nonlabor_prj, 0.00) * COALESCE(cp.rd_percent_final, 0.00))/100 AS DECIMAL(18,2)) AS nonlabor_qre_amount
    FROM
    ${schemaName}.case_projects cp
    WHERE
    cp.case_rid = '${caseRid}'
    AND
    cp.account_rid = '${accountRid}'
    `
    return query;
}
export const fetchCountryData = (schemaName : string, caseRid : string, countryRid : string) => {
    return `SELECT rid, created_datetime, modified_datetime, case_rid, country_rid, input_params, computed_fields FROM ${schemaName}.rd_credit_country_calculations WHERE case_rid = '${caseRid}'`
}