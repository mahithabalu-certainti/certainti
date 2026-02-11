export const fetchCaseClosingRemarks = (schemaName : string, caseRid : string, sort : string, sortBy : string, isSortingRestricted : boolean) => {
  let sortValue;
  if(isSortingRestricted) {
    sortValue = ` `
  } else {
    if(sort === 'signoff_at') {
      sortValue = `ORDER BY created_datetime ${sortBy}`
    }
  }
  let query =
    `WITH fetch_remarks AS (
    SELECT case_rid, account_rid, signoff_type_rid, created_by, created_datetime
    FROM
    ${schemaName}.signoff_details
    WHERE
    case_rid = '${caseRid}'
    ${sortValue}
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
    console.log("Closing Remarks ====> ", query)
    return query;
}

export const fetchRdFormUrlForCountry = (schemaName : string, caseRid : string) => {
  let query = `
  SELECT 
  rc.rd_form_url AS country_url
  FROM 
  ${schemaName}.rd_credit_country_calculations rc
  WHERE
  rc.case_rid = '${caseRid}'
  AND
  rc.form_error_message IS NULL
  `
  return query;
}

export const fetchRdFormUrlForState = (schemaName : string, caseRid : string) => {
  let query = `
  SELECT 
  rs.rd_form_url AS state_url
  FROM 
  ${schemaName}.rd_credit_state_calculations rs
  WHERE
  rs.case_rid = '${caseRid}'
  AND
  rs.form_error_message IS NULL
  `
  return query;
}