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