export const fetchCaseClosingRemarks = (schemaName : string, caseRid : string) => {
  let query =
    `WITH fetch_remarks AS (
    SELECT case_rid, account_rid, signoff_type_rid, created_by, created_datetime
    FROM
    ${schemaName}.signoff_details
    WHERE
    case_rid = '${caseRid}'
    )

    SELECT f.case_rid,
    array_agg(jsonb_build_object(
    'signoff_type_rid', f.signoff_type_rid,
    'created_by', f.created_by,
    'created_datetime', f.created_datetime
    )) AS signoff_details
    FROM
    fetch_remarks f
    GROUP BY
    f.case_rid
    `
    return query;
}