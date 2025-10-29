export const fetchCasesHeadersDatas = (schemaName : string, caseRid : string) => {
    return `
    SELECT c.rid, c.account_rid, ad.account_name, c.case_name, c.filing_type_rid,
    c.case_owner_rid, c.fiscal_year, c.status_rid, c.case_total_projects,
    c.case_total_project_cost, c.case_total_rd_cost, c.case_total_qre_cost

    FROM
    ${schemaName}.cases c
    LEFT JOIN ${schemaName}.account_details ad ON ad.account_rid = c.account_rid
    WHERE
    c.rid = '${caseRid}'
    `
}