import { MAIN_SCHEMA_NAME } from "./constants";
import { ProjectFiscalIds } from "./types";

export const fetchProjectCostDetailsBasedOnCases = (caseRid : string, accountRid : string, schemaName : string, reduction : number, caseClosed : boolean) => {
    let alias = caseClosed ? 'c' : 'pf'
    let whereCond = caseClosed ? `${alias}.project_fiscal_rid` : `${alias}.rid`

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
    CAST(SUM((COALESCE(${alias}.total_cost_fte_prj, 0.00) * ${alias}.rd_percent_final)/100) AS DECIMAL(18,2)) AS employees,
    CAST(SUM((COALESCE(${alias}.total_cost_subcon_prj, 0.00) * ${alias}.rd_percent_final)/100) AS DECIMAL(18,2)) AS epw,
    ${alias}.project_name, ${whereCond}, ${alias}.currency_rid
    FROM
    ${schemaName}.case_projects c
    LEFT JOIN ${schemaName}.project_fiscal pf ON pf.rid = c.project_fiscal_rid 
    LEFT JOIN fetch_project_ids fpr ON fpr.project_fiscal_rid = pf.rid
    WHERE
    ${whereCond} = fpr.project_fiscal_rid
    AND
    pf.is_qualified = true
    GROUP BY
    ${alias}.project_name, ${whereCond}, ${alias}.currency_rid
    ORDER BY ${alias}.project_name ASC
    )
    SELECT 
    array_agg(jsonb_build_object(
    'project_fiscal_rid', rid,
    'project_name', project_name,
    'currency_rid', currency_rid,
    'employees', employees,
    'epw', epw,
    'reductions', CAST(epw * ${reduction}/100 AS DECIMAL(18,2)),
    'net_epw', CAST(epw - (epw * ${reduction}/100) AS DECIMAL(18,2)),
    'total_project_value_labor', CAST(epw - (epw * ${reduction}/100) + employees AS DECIMAL(18,2))
    )ORDER BY CAST(epw - (epw * ${reduction}/100) + employees AS DECIMAL(18,2)) DESC) AS projects
    FROM
    calculate_cost
    `
    return query;
}
export const fetchProjectCostDetailsForUkBasedOnCases = (caseRid : string, accountRid : string, schemaName : string, reduction : number, caseClosed : boolean) => {
    let alias = caseClosed ? 'c' : 'pf'
    let whereCond = caseClosed ? `${alias}.project_fiscal_rid` : `${alias}.rid`
    let query = 
    `
    WITH fetch_project_ids AS (
    SELECT project_client_group, project_fiscal_rid 
    FROM ${schemaName}.case_projects 
    WHERE
    case_rid = '${caseRid}'
    AND
    account_rid = '${accountRid}'
    ),
    calculate_cost AS (
    SELECT 
    CAST(SUM((COALESCE(${alias}.total_cost_fte_prj, 0.00) * ${alias}.rd_percent_final)/100) AS DECIMAL(18,2)) AS employees,
    CAST(SUM((COALESCE(${alias}.total_cost_subcon_prj, 0.00) * ${alias}.rd_percent_final)/100) AS DECIMAL(18,2)) AS epw,
    ${alias}.project_client_group, COUNT(${alias}.rid) AS total_projects
    FROM
    ${schemaName}.case_projects c
    LEFT JOIN ${schemaName}.project_fiscal pf ON pf.rid = c.project_fiscal_rid 
    LEFT JOIN fetch_project_ids fpr ON fpr.project_fiscal_rid = pf.rid AND fpr.project_client_group = pf.project_client_group
    WHERE
    ${whereCond} = fpr.project_fiscal_rid
    AND
    pf.is_qualified = true
    GROUP BY
    ${alias}.project_client_group
    ORDER BY ${alias}.project_client_group ASC
    )
    SELECT 
    array_agg(jsonb_build_object(
    'project_name', project_client_group,
    'total_projects_count', total_projects,
    'employees', employees,
    'epw', epw,
    'reductions', CAST(epw * ${reduction}/100 AS DECIMAL(18,2)),
    'net_epw', CAST(epw - (epw * ${reduction}/100) AS DECIMAL(18,2)),
    'total_project_value_labor', CAST(epw - (epw * ${reduction}/100) + employees AS DECIMAL(18,2))
    )ORDER BY CAST(epw - (epw * ${reduction}/100) + employees AS DECIMAL(18,2)) DESC) AS projects
    FROM
    calculate_cost
    `
    return query;
}
export const calculateRDExpenditureQuery = (schemaName : string, caseRid : string, accountRid : string, caseClosed : boolean) => {
    let alias = caseClosed ? 'c' : 'pf'
    let query = `
    SELECT 
    CAST((COALESCE(${alias}.total_cost_fte_prj, 0.00) * COALESCE(${alias}.rd_percent_final, 0.00))/100 AS DECIMAL(18,2)) AS fte_qre_amount,
    CAST((COALESCE(${alias}.total_cost_subcon_prj, 0.00) * COALESCE(${alias}.rd_percent_final, 0.00))/100 AS DECIMAL(18,2)) AS subcon_qre_amount
    FROM
    ${schemaName}.project_fiscal pf
    LEFT JOIN ${schemaName}.case_projects c ON c.project_fiscal_rid = pf.rid
    WHERE
    c.case_rid = '${caseRid}'
    AND
    ${alias}.account_rid = '${accountRid}'
    AND
    pf.is_qualified = true
    `
    return query;
}
export const fetchCountryData = (schemaName : string, caseRid : string) => {
    return `SELECT rid, created_datetime, modified_datetime, case_rid, country_rid, input_params, computed_fields FROM ${schemaName}.rd_credit_country_calculations WHERE case_rid = '${caseRid}'`
}
export const fetchRequiredPrjDataForCanada = (schemaName : string, caseRid : ProjectFiscalIds[], accountRid : string, caseClosed : boolean) => {
    let alias = caseClosed ? 'cp' : 'pf'
    let whereCond = caseClosed ? `${alias}.project_fiscal_rid` : `${alias}.rid`
    let query = 
    `SELECT
        ${alias}.project_code,
        ${alias}.project_name,
        COALESCE(${alias}.total_effort_prj,0.00) AS total_effort_prj,
        COALESCE(${alias}.total_cost_prj, 0.00) AS total_cost_prj,
        CAST((COALESCE(${alias}.total_cost_fte_prj, 0.00) * ${alias}.rd_percent_final)/100 AS DECIMAL(18,2)) AS total_cost_fte_prj,
        CAST((COALESCE(${alias}.total_cost_subcon_prj, 0.00) * ${alias}.rd_percent_final)/100 AS DECIMAL(18,2)) AS total_cost_subcon_prj,
        CAST((COALESCE(${alias}.total_cost_nonlabor_prj, 0.00) * ${alias}.rd_percent_final)/100 AS DECIMAL(18,2)) AS total_cost_nonlabor_prj,
        COALESCE(${alias}.rd_percent_final, 0.00) AS rd_percent_final
    FROM
        ${schemaName}.case_projects cp
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.rid = cp.project_fiscal_rid
    WHERE
        ${whereCond} IN (${caseRid.map((d : any) => `'${d.project_fiscal_rid}'`).join(',')})
        AND
        ${alias}.account_rid = '${accountRid}'
        AND
        pf.is_qualified = true
    `
    return query;
}
export const fetchRequiredPrjDataForCanadaOntRegion = (schemaName : string, caseRid : ProjectFiscalIds[], accountRid : string, regionRid : string, caseClosed : boolean) => {
    let fromTable : string
    let joinTable : string
    let dynamicQuery : string
    if(caseClosed) {
        dynamicQuery = `
        SELECT 
        cp.project_fiscal_rid,
        cp.project_code,
        cp.project_name,
        COALESCE(cp.total_effort_prj,0.00) AS total_effort_prj,
        COALESCE(cp.total_cost_prj, 0.00) AS total_cost_prj,
        CAST((COALESCE(cp.total_cost_fte_prj, 0.00) * (COALESCE(cp.rd_percent_final, 0.00))/100) AS DECIMAL(18,2)) AS total_cost_fte_prj,
        CAST((COALESCE(cp.total_cost_subcon_prj, 0.00) * (COALESCE(cp.rd_percent_final, 0.00))/100) AS DECIMAL(18,2)) AS total_cost_subcon_prj,
        CAST((COALESCE(cp.total_cost_nonlabor_prj, 0.00) * (COALESCE(cp.rd_percent_final, 0.00))/100) AS DECIMAL(18,2)) AS total_cost_nonlabor_prj,
        COALESCE(cp.rd_percent_final, 0.00) AS rd_percent_final
        FROM ${schemaName}.case_projects cp
        LEFT JOIN ${schemaName}.project_fiscal pf ON pf.rid = cp.project_fiscal_rid
        LEFT JOIN ${schemaName}.case_project_fiscal_region pfr ON pfr.project_fiscal_rid = pf.rid
        WHERE
        cp.project_fiscal_rid IN (${caseRid.map((d : any) => `'${d.rid}'`).join(',')})
        AND
        cp.account_rid = '${accountRid}'
        AND
        pf.is_qualified = true
        AND
        pfr.region_rid = '${regionRid}'
        GROUP BY
        cp.project_fiscal_rid,
        cp.project_code,
        cp.project_name,
        cp.total_effort_prj,
        cp.total_cost_prj,
        cp.total_cost_fte_prj,
        cp.total_cost_subcon_prj,
        cp.total_cost_nonlabor_prj,
        cp.rd_percent_final
        `
    } else {
        dynamicQuery = `
        SELECT 
        cp.rid,
        cp.project_code,
        cp.project_name,
        COALESCE(cp.total_effort_prj,0.00) AS total_effort_prj,
        COALESCE(cp.total_cost_prj, 0.00) AS total_cost_prj,
        CAST((COALESCE(cp.total_cost_fte_prj, 0.00) * (COALESCE(cp.rd_percent_final, 0.00))/100) AS DECIMAL(18,2)) AS total_cost_fte_prj,
        CAST((COALESCE(cp.total_cost_subcon_prj, 0.00) * (COALESCE(cp.rd_percent_final, 0.00))/100) AS DECIMAL(18,2)) AS total_cost_subcon_prj,
        CAST((COALESCE(cp.total_cost_nonlabor_prj, 0.00) * (COALESCE(cp.rd_percent_final, 0.00))/100) AS DECIMAL(18,2)) AS total_cost_nonlabor_prj,
        COALESCE(cp.rd_percent_final, 0.00) AS rd_percent_final
        FROM
        ${schemaName}.project_fiscal cp
        LEFT JOIN ${schemaName}.project_fiscal_region pfr ON pfr.project_fiscal_rid = cp.rid
        WHERE
        cp.rid IN (${caseRid.map((d : any) => `'${d.rid}'`).join(',')})
        AND
        cp.account_rid = '${accountRid}'
        AND
        cp.is_qualified = true
        AND
        pfr.region_rid = '${regionRid}'
        GROUP BY
        cp.rid
        `
    }
    return dynamicQuery;
}
export const countAssignedProjects = (caseRid : string, schemaName : string) => {
    return `SELECT COALESCE(COUNT(pf.rid), 0) AS total 
    FROM 
    ${schemaName}.project_fiscal pf
    LEFT JOIN ${schemaName}.case_projects cp ON cp.project_fiscal_rid = pf.rid 
    WHERE 
    cp.case_rid = '${caseRid}'
    AND
    pf.is_qualified = true`
}

export const fetchAssignedProjectIds = (caseRid : string, schemaName : string) => {
    return `SELECT project_fiscal_rid FROM ${schemaName}.case_projects WHERE case_rid = '${caseRid}'`
}
export const fetchAssignedProjectIdsForOntRegions = (caseRid : string, schemaName : string, regionId : string) => {
    let query = `SELECT pf.rid FROM ${schemaName}.project_fiscal pf LEFT JOIN ${schemaName}.case_projects cp ON cp.project_fiscal_rid = pf.rid WHERE cp.case_rid = '${caseRid}' AND pf.region_rid = '${regionId}' AND pf.is_qualified = true`
    return query
}

export const updateRRCASC280C = (caseRid : string, schemaName : string, userPreferenceASC : string, userPreferenceRRC : string) => {
    return `UPDATE ${schemaName}.cases SET rrc_credit_280_c = '${userPreferenceRRC}', asc_credit_280_c = '${userPreferenceASC}' WHERE rid = '${caseRid}'`
}

export const findTaskWeightageDetails = (weightageIds : string[]) => {
    return `SELECT rid, weightage_value FROM ${MAIN_SCHEMA_NAME}.task_weightage WHERE rid IN (${weightageIds.map((d : string) => `'${d}'`).join(',')})`
}

export const getCompletedTaskStatusId = () => {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.case_task_status WHERE task_status_name ILIKE '%Completed%'`
}
export const calculateCostForCaseSubmissionCurrentYear = (schemaName : string, caseRid : string, countryRid : string, type : string) => {
    let selectColumns : string = ``
    if(type === 'list') {
        selectColumns = 
        `COALESCE(rcc.final_credit, 0.00) AS final_credit, rcc.country_rid`
    } else {
        selectColumns = 
        `COALESCE(rcc.total_wages, 0.00) AS total_fte_cost, 
        COALESCE(rcc.total_subcontract, 0.00) AS total_subcon_cost,
        COALESCE(rcc.total_supplies, 0.00) AS total_nonlabor_cost,
        COALESCE(rcc.total_qre, 0.00) AS total_qre,
        COALESCE(rcc.average_annual_gross_receipts, 0.00) AS average_annual_gross_receipts`
    }
    return `
    SELECT 
    ${selectColumns}
    FROM
    ${schemaName}.rd_credit_country_calculations rcc
    WHERE
    rcc.case_rid = '${caseRid}'
    AND
    rcc.country_rid = '${countryRid}'
    `
}

export const calculateStateCostForCaseSubmissionCurrentYear = (schemaName : string, caseRid : string, stateRids : any[], type : string) => {
    let selectColumns : string = ``
    let condition : string = ``
    if(type === 'list') {
        selectColumns = 
        `COALESCE(rsc.final_credit, 0.00) AS final_credit, rsc.state_rid`
        condition = `rsc.state_rid IN (${stateRids.map((d : any) => `'${d}'`).join(",")})`
    } else {
        selectColumns = 
        `COALESCE(rsc.total_wages, 0.00) AS total_fte_cost, 
        COALESCE(rsc.total_subcontract, 0.00) AS total_subcon_cost,
        COALESCE(rsc.total_supplies, 0.00) AS total_nonlabor_cost,
        COALESCE(rsc.total_qre, 0.00) AS total_qre,
        COALESCE(rsc.average_annual_gross_receipts, 0.00) AS average_annual_gross_receipts,
        rsc.state_rid`
        condition = `rsc.state_rid IN (${stateRids.map((d : any) => `'${d.state_rid}'`).join(",")})`

    }
    return `
    SELECT
    ${selectColumns}
    FROM
    ${schemaName}.rd_credit_state_calculations rsc
    WHERE
    rsc.case_rid = '${caseRid}'
    AND
    ${condition}
    `
}

export const fetchProjectCostDetailsBasedOnCasesForRdforms = async (caseRid: string, accountRid: string, schemaName: string) => {
    const query = `
    WITH fetch_project_ids AS (
    SELECT project_fiscal_rid, rid, project_code, project_name ,qre_final
    FROM ${schemaName}.case_projects 
    WHERE
    case_rid = '${caseRid}'
    AND
    account_rid = '${accountRid}'
    ),
    calculate_cost AS (
    SELECT 
    cp.project_code, cp.project_name, cp.rid, cp.qre_final
    FROM
    ${schemaName}.project_fiscal cp
    LEFT JOIN fetch_project_ids fpr ON fpr.project_fiscal_rid = cp.rid
    WHERE
    cp.rid = fpr.project_fiscal_rid
    AND
    cp.is_qualified = true
    GROUP BY
    cp.project_code, cp.project_name, cp.rid, cp.qre_final
    ORDER BY cp.project_name ASC
    )
    SELECT 
    array_agg(jsonb_build_object(
    'project_code', project_code,
    'project_name', project_name,
    'qre_final', qre_final
    )ORDER BY project_name ASC) AS projects
    FROM
    calculate_cost
    `;
    return query;
  }

export const fetchTotalResourcesForCase = (caseRid: string, accountRid: string, schemaName: string) => {
    const query = `
    SELECT COUNT(pr.rid) AS total_resources
    FROM ${schemaName}.project_resource pr
    LEFT JOIN ${schemaName}.case_projects cp ON cp.project_fiscal_rid = pr.project_fiscal_rid
    LEFT JOIN ${schemaName}.project_fiscal pf ON pf.rid = cp.project_fiscal_rid
    WHERE cp.case_rid = '${caseRid}' AND cp.account_rid = '${accountRid}' AND pf.is_qualified = true
    `;
    return query;
  }