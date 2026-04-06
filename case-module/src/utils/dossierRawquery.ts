import { MAIN_SCHEMA_NAME } from "./constants";

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
    return query;
}

export const fetchRdFormUrlForCountry = (schemaName : string, caseRid : string) => {
  let query = `
  SELECT 
  rc.rd_form_url AS country_url, rc.country_rid
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
  rs.rd_form_url AS state_url, rs.state_rid
  FROM
  ${schemaName}.rd_credit_state_calculations rs
  WHERE
  rs.case_rid = '${caseRid}'
  AND
  rs.form_error_message IS NULL
  `
  return query;
}

export const fetchStateCalcDataForDossier = (schemaName: string, caseRid: string) => {
  return `
  SELECT
    rs.state_rid,
    rs.input_params,
    rs.computed_fields
  FROM
    ${schemaName}.rd_credit_state_calculations rs
  WHERE
    rs.case_rid = '${caseRid}'
    AND rs.input_params IS NOT NULL
    AND rs.computed_fields IS NOT NULL
  `
}

export const fetchStateCodesByRids = (stateRids: string[]) => {
  const ridList = stateRids.map(r => `'${r}'`).join(', ');
  return `SELECT rid, state_code FROM ${MAIN_SCHEMA_NAME}.state WHERE rid IN (${ridList})`
}

export const fetchCountryCalcDataForDossier = (schemaName: string, caseRid: string) => {
  return `
  SELECT
    rs.country_rid,
    rs.country_export_data
  FROM
    ${schemaName}.rd_credit_country_calculations rs
  WHERE
    rs.case_rid = '${caseRid}'
    AND rs.input_params IS NOT NULL
    AND rs.computed_fields IS NOT NULL
  `
}