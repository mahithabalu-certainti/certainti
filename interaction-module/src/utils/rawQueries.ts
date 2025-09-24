import { Sequelize } from "sequelize";
import {
  ALPHANUMERIC_CONDITIONS,
  filtersColumns,
  filtersColumnsForInteractionSummary,
  filterTypes,
  filterTypesForIntHistory,
  filterTypesForSummaryInteractions,
  interactionFlag,
  MAIN_SCHEMA_NAME,
  responseSortKeys,
  STATUS_MESSAGE,
} from "./constants";

type filterType = {
  [key: string]: {
    [condition: string]: any;
  };
};

export const fetchInteractionForProjectLevelQuery = (
  account_rid: string,
  project_id: string,
  project_fiscal_rid: string,
  fiscal_year: number,
  sort: string,
  sortBy: string,
  filters: filterType,
  page: number,
  limit: number,
  flag: string,
  schemaName: string,
  disablePagination: boolean,
  accessibleIds: string[] = [],
  search : string,
  activeStatusId : string,
  reminderFlag : boolean,
  reminderFiltersIds : string[]
) => {
  let offset = (page - 1) * limit;
  let pagination = `LIMIT ${limit} OFFSET ${offset}`;
  let filteredQueryArray: string[] = [];
  let filterQueryValues;
  let sortValue: string;
  let whereConditions;
  let andConditions = ``;
  let searchValue;
  let reminderFilter : string = ``
  if (disablePagination) pagination = ` `;
  else pagination;

  if(search) searchValue = `%${search}%`
  else searchValue = `%%`

  if (flag == interactionFlag.account) {
    let fiscalQuery = ``;
    if (fiscal_year === 0) fiscalQuery = ` `;
    else fiscalQuery = ` AND i.fiscal_year = ${fiscal_year}`;
    whereConditions = `
        i.account_rid = '${account_rid}' 
        ${fiscalQuery}`;
  } else {
    whereConditions = `
        i.account_rid = '${account_rid}' 
        AND 
        i.project_fiscal_rid = '${project_fiscal_rid}'
        AND
        i.project_rid = '${project_id}'
        `;
  }
  if (accessibleIds.length > 0) {
    whereConditions += ` AND pf.project_rid = ANY(ARRAY[${accessibleIds.map(id => `'${id}'`).join(",")}]::text[])`;     
  }
  if(reminderFlag && reminderFiltersIds != undefined) {
    reminderFilter = `AND i.status_rid IN (${reminderFiltersIds.map((d : any) => `'${d}'`).join(',')})`
  }

  let filteredData = filterForInteractions(
    filters,
    andConditions,
    filteredQueryArray,
    filterTypes,
    filtersColumns
  );

  if (sort === filtersColumns.r_number)
    sortValue = `ORDER BY i.r_number ${sortBy}`;
  else if (sort === filtersColumns.iteration)
    sortValue = `ORDER BY i.interaction_iteration ${sortBy}`;
  else if (sort === filtersColumns.interaction_age)
    sortValue = `ORDER BY i.interaction_age ${sortBy}`;
  else if (sort === filtersColumns.recipient_name)
    sortValue = `ORDER BY i.recipient_name ${sortBy}`;
  else if (sort === filtersColumns.recipient_email)
    sortValue = `ORDER BY i.recipient_email ${sortBy}`;
  else if (sort === filtersColumns.last_sent_on)
    sortValue = `ORDER BY i.sent_on_datetime ${sortBy}`;
  else if (sort === filtersColumns.last_reminder_on)
    sortValue = `ORDER BY i.last_reminder_on ${sortBy}`;
  else if (sort === filtersColumns.response_submitted_on)
    sortValue = `ORDER BY i.response_submitted_on ${sortBy}`;
  else if (sort === filtersColumns.response_updated_on)
    sortValue = `ORDER BY i.response_updated_on ${sortBy}`;
  else if (sort === filtersColumns.attachment_count)
    sortValue = `ORDER BY i.attachment_count ${sortBy}`;
  else if (sort === filtersColumns.response_source)
    sortValue = `ORDER BY i.response_source ${sortBy}`;
  else if (sort === filtersColumns.created_datetime)
    sortValue = `ORDER BY i.created_datetime ${sortBy}`;
  else if (sort === filtersColumns.modified_datetime)
    sortValue = `ORDER BY i.modified_datetime ${sortBy}`;
  else if (sort === filtersColumns.project_code)
    sortValue = `ORDER BY pf.project_code ${sortBy}`;
  else if (sort === filtersColumns.fiscal_year)
    sortValue = `ORDER BY i.fiscal_year ${sortBy}`;
  else if (sort === filtersColumns.parent_interaction_rid)
    sortValue = `ORDER BY p.r_number ${sortBy}`;
  else if (sort === filtersColumns.createdAt)
    sortValue = `ORDER BY i.created_datetime ${sortBy}`;
  else sortValue = `ORDER BY i.r_number ASC`;

  if (filteredData?.filteredQueryArray.length! > 0) {
    filterQueryValues = filteredQueryArray.join(" AND ");
  } else {
    filterQueryValues = ` `;
  }

  let query = `
    WITH fetch_interaction AS (
        SELECT
            i.rid, i.r_number, i.interaction_iteration, COALESCE(i.interaction_age,0),
            i.status_rid,
           CASE 
            WHEN i.recipient_name IS NULL OR i.recipient_name = '' 
            THEN kcd.key_contact_name 
            ELSE i.recipient_name 
        END AS recipient_name,

        CASE 
            WHEN i.recipient_email IS NULL OR i.recipient_email = '' 
            THEN kcd.key_contact_email 
            ELSE i.recipient_email 
        END AS recipient_email, 
            i.sent_on_datetime, i.last_reminder_on, i.response_updated_on,
            i.response_submitted_on, i.response_source_rid, i.created_by, i.modified_by,
            i.created_datetime, i.modified_datetime,
            i.account_rid, i.project_rid, i.rid AS interaction_history, 
            i.interaction_url,i.project_fiscal_rid,
            COUNT(i.rid) OVER() AS total_records, i.interaction_age,
            i.interaction_source_rid, i.interaction_type_rid, i.attachment_count,i.interaction_level_rid,
            pf.project_code,pf.fiscal_year,
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM ${schemaName}.key_contact_details kcd 
                    WHERE kcd.entity_rid = i.project_fiscal_rid 
                    AND LOWER(kcd.entity_type) = 'project' 
                    AND kcd.include_in_communication = true 
                    AND kcd.status_rid = '${activeStatusId}'
                ) THEN true 
                ELSE false 
            END AS has_email_recipient,
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM ${schemaName}.key_contact_details kcd 
                    WHERE kcd.entity_rid = i.account_rid 
                    AND LOWER(kcd.entity_type) = 'account' 
                    AND kcd.include_in_communication = true 
                    AND kcd.status_rid = '${activeStatusId}'
                ) THEN true 
                ELSE false 
            END AS has_account_recipient
            FROM
            ${schemaName}.interactions i
            LEFT JOIN ${schemaName}.project_fiscal pf ON pf.rid = i.project_fiscal_rid
            LEFT JOIN LATERAL (
    SELECT kcd.key_contact_name, kcd.key_contact_email
    FROM ${schemaName}.key_contact_details kcd
    WHERE (
        -- If project_fiscal_rid is present, only use project
        (i.project_fiscal_rid IS NOT NULL
         AND kcd.entity_rid = i.project_fiscal_rid
         AND LOWER(kcd.entity_type) = 'project'
         AND kcd.include_in_communication = true)
        OR
        (i.project_fiscal_rid IS NULL
         AND kcd.entity_rid = i.account_rid
         AND LOWER(kcd.entity_type) = 'account'
         AND kcd.include_in_communication = true)
    )
    AND kcd.status_rid = '${activeStatusId}'
    LIMIT 1
) kcd ON true
            WHERE
            (i.r_number ILIKE '${searchValue}' OR i.recipient_name ILIKE '${searchValue}' OR i.recipient_email ILIKE '${searchValue}')
            AND
            ${whereConditions}
            ${reminderFilter}
            ${filteredData?.andConditions}
            ${filterQueryValues}
            ${sortValue}
    ),
    paginated_datas AS (
    SELECT * FROM fetch_interaction ${pagination}
    
    )
        SELECT 
        array_agg(jsonb_build_object(
        'rid', i.rid,
        'r_number', i.r_number,
        'interaction_iteration', i.interaction_iteration,
        'interaction_age', i.interaction_age,
        'status', i.status_rid,
        'recipient_name', i.recipient_name,
        'recipient_email', i.recipient_email,
        'last_resent_on', i.sent_on_datetime,
        'last_reminder_on', i.last_reminder_on,
        'response_updated_on', i.response_updated_on,
        'response_submitted_on', i.response_submitted_on,
        'response_source', i.response_source_rid,
        'created_by', i.created_by,
        'modified_by', i.modified_by,
        'created_datetime', i.created_datetime,
        'modified_datetime', i.modified_datetime,
        'account_rid', i.account_rid,
        'project_rid', i.project_rid,
        'project_fiscal_rid', i.project_fiscal_rid,
        'interaction_history', i.interaction_history,
        'interaction_url', i.interaction_url,
        'fiscal_year', i.fiscal_year,
        'total_records', i.total_records,
        'interaction_type', i.interaction_type_rid,
        'interaction_source', i.interaction_source_rid,
        'interaction_level', i.interaction_level_rid,
        'attachment_count', i.attachment_count,
        'project_code', i.project_code,
        'has_email_recipient', i.has_email_recipient,
        'has_account_recipient', i.has_account_recipient
        ) ) AS interactions

        FROM
        paginated_datas i
    `;

  return query;
};

export const listAllInteractionSummary = (
  page: number,
  limit: number,
  filters: filterType,
  globalFilters: any,
  fiscal_year: number,
  sort: string,
  sortBy: string,
  accessibleIds: string[] = [],
  search : string
) => {
  let offset = (page - 1) * limit;
  let pagination = `LIMIT ${limit} OFFSET ${offset}`;
  let filteredQueryArray: string[] = [];
  let andConditions = ``;
  let filterQueryValues;
  let accountIdsArray: string[] = [];
  let globalFiltersQueryConditions: string = ``;
  let fiscalYearQuery: string = ``;
  let whereKey: string = ``;
  let andConditionsForjoinsForTwo: string = ` `;
  let andConditionsForjoinsForThree: string = ` `;
  let sortValue;
  let searchValue : string

  let filterDatas = filterForInteractions(
    filters,
    andConditions,
    filteredQueryArray,
    filterTypesForSummaryInteractions,
    filtersColumnsForInteractionSummary
  );
  if (filterDatas?.filteredQueryArray?.length! > 0) {
    filterQueryValues = filterDatas?.filteredQueryArray.join(" AND ");
  } else {
    filterQueryValues = ``;
  }
  if (Object.keys(globalFilters).length > 0) {
    accountIdsArray = globalFiltersForInteractionSummary(globalFilters);
  }
  if (accountIdsArray.length > 0) {
    globalFiltersQueryConditions = ` i.account_rid IN (${accountIdsArray
      .map((d: any) => `'${d}'`)
      .join(",")})`;
  }
  const includeProjectFilter = accessibleIds.length > 0;
  const accessibleProjectsCondition = includeProjectFilter
    ? `pf.project_rid = ANY(ARRAY[${accessibleIds.map(id => `'${id}'`).join(",")}]::text[])`
    : "1=1";

  if (fiscal_year == 0) fiscalYearQuery = ``;
  else fiscalYearQuery = ` pf.fiscal_year = ${fiscal_year}`;
  
  if(search) searchValue = `%${search}%`
  else searchValue = `%%`

  if (
    globalFiltersQueryConditions !== "" ||
    fiscalYearQuery !== "" ||
    filterQueryValues !== "" ||
    accessibleProjectsCondition !== ""
  )
    whereKey = ` WHERE `;
  else whereKey = ``;

  // Dynamically add "AND" between non-empty conditions
  const conditions = [
    accessibleProjectsCondition,
    globalFiltersQueryConditions,
    fiscalYearQuery,
    filterQueryValues,
  ].filter(Boolean);

  // Helper to determine if "AND" is needed before each condition
  const getAnd = (index: number) => (index > 0 ? " AND " : "");

  // Build the joined conditions for the query
  let joinedConditions = "";
  conditions.forEach((cond, idx) => {
    joinedConditions += getAnd(idx) + cond;
  });

  // Assign ANDs for joins based on the order of conditions
  // (for backward compatibility with the rest of the query)
  andConditionsForjoinsForTwo = conditions.length > 1 ? " AND " : "";
  andConditionsForjoinsForThree = conditions.length > 2 ? " AND " : "";

 
  if (sort === filtersColumnsForInteractionSummary.r_number)
    sortValue = `ORDER BY i.r_number ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.iteration)
    sortValue = `ORDER BY i.interaction_iteration ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.interaction_age)
    sortValue = `ORDER BY i.interaction_age ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.recipient_name)
    sortValue = `ORDER BY i.recipient_name ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.recipient_email)
    sortValue = `ORDER BY i.recipient_email ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.last_sent_on)
    sortValue = `ORDER BY i.sent_on_datetime ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.last_reminder_on)
    sortValue = `ORDER BY i.last_reminder_on ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.response_submitted_on)
    sortValue = `ORDER BY i.response_submitted_on ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.response_updated_on)
    sortValue = `ORDER BY i.response_updated_on ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.attachment_count)
    sortValue = `ORDER BY i.attachment_count ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.response_source)
    sortValue = `ORDER BY i.response_source ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.created_datetime)
    sortValue = `ORDER BY i.created_datetime ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.modified_datetime)
    sortValue = `ORDER BY i.modified_datetime ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.status_name)
    sortValue = ` ORDER BY i.status_name ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.interaction_type_name)
    sortValue = ` ORDER BY i.interaction_type_name ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.interaction_source_name)
    sortValue = ` ORDER BY i.interaction_source_name ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.created_user_name)
    sortValue = ` ORDER BY i.created_user_name ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.updated_user_name)
    sortValue = ` ORDER BY i.updated_user_name ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.project_code)
    sortValue = ` ORDER BY i.project_code ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.account_name)
    sortValue = ` ORDER BY i.account_name ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.fiscal_year)
    sortValue = ` ORDER BY i.fiscal_year ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.response_source_name)
    sortValue = ` ORDER BY i.response_source_name ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.parent_interaction_rid)
    sortValue = ` ORDER BY parent_r_number ${sortBy}`;
  else if (sort === filtersColumnsForInteractionSummary.createdAt)
    sortValue = ` ORDER BY i.created_datetime ${sortBy}`;
  else sortValue = `ORDER BY i.r_number ASC`;

  let query = `
    WITH fetch_all_interactions AS 
    (SELECT i.interaction_rid AS rid, i.r_number, i.interaction_iteration, i.status_rid,
    s.status_name, i.recipient_name, i.recipient_email,
    i.sent_on_datetime, i.last_reminder_on, i.response_submitted_on,
    i.response_updated_on, i.attachment_count, i.rid AS interaction_history,
    i.interaction_url, p.r_number AS parent_r_number, i.interaction_type_rid,
    it.interaction_type_name, ir.rid AS response_source_rid, ir.response_source_name,
    i.created_by, CONCAT(u.first_name, ' ', u.last_name) AS created_user_name,
    CASE WHEN uu.first_name IS NULL THEN i.modified_by ELSE CONCAT(uu.first_name, ' ', uu.last_name) END AS updated_user_name,
    i.created_datetime, i.modified_datetime, i.account_rid, i.project_rid,
    i.interaction_source_rid, sn.interaction_source_name,
    i.project_fiscal_rid, COUNT(*) OVER() AS total_records, i.modified_by, i.interaction_age,
    a.account_name, pf.project_code, pf.fiscal_year
    FROM
    ${MAIN_SCHEMA_NAME}.interactions_summary i
    LEFT JOIN ${MAIN_SCHEMA_NAME}.interaction_type it ON it.rid = i.interaction_type_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.interaction_status s ON s.rid = i.status_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user u ON u.rid = i.created_by
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user uu ON uu.rid = i.modified_by
    LEFT JOIN ${MAIN_SCHEMA_NAME}.interactions_summary p ON p.interaction_rid = i.parent_interaction_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.interaction_source sn ON sn.rid = i.interaction_source_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.account a ON a.rid = i.account_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.project_fiscal_summary pf ON pf.project_fiscal_rid = i.project_fiscal_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.interaction_response_source ir ON ir.rid = i.response_source_rid
    WHERE
    (i.r_number ILIKE '${searchValue}' OR i.recipient_name ILIKE '${searchValue}' OR i.recipient_email ILIKE '${searchValue}')
    AND
    ${joinedConditions}
    ),
    
    paginated_data AS (
    SELECT * FROM fetch_all_interactions i ${sortValue} ${pagination}
    )
    SELECT 
        array_agg(jsonb_build_object(
            'rid', i.rid,
            'r_number', i.r_number,
            'interaction_iteration', i.interaction_iteration,
            'interaction_age', i.interaction_age,
            'status_rid', i.status_rid,
            'recipient_name', i.recipient_name,
            'recipient_email', i.recipient_email,
            'last_resent_on', i.sent_on_datetime,
            'last_reminder_on', i.last_reminder_on,
            'response_updated_on', i.response_updated_on,
            'response_submitted_on', i.response_submitted_on,
            'response_source_rid', i.response_source_rid,
            'response_source_name', i.response_source_name,
            'created_by', i.created_by,
            'modified_by', i.modified_by,
            'created_datetime', i.created_datetime,
            'modified_datetime', i.modified_datetime,
            'parent_interaction_rid', i.parent_r_number,
            'account_rid', i.account_rid,
            'account_name', i.account_name,
            'project_rid', i.project_rid,
            'project_fiscal_rid', i.project_fiscal_rid,
            'interaction_history', i.interaction_history,
            'interaction_url', i.interaction_url,
            'fiscal_year', i.fiscal_year,
            'total_records', i.total_records,
            'interaction_type_rid', i.interaction_type_rid,
            'interaction_source_rid', i.interaction_source_rid,
            'status_name', i.status_name,
            'interaction_type_name', i.interaction_type_name,
            'interaction_source_name', i.interaction_source_name,
            'created_user_name', i.created_user_name,
            'updated_user_name', i.updated_user_name,
            'attachment_count', i.attachment_count,
            'project_code', i.project_code
        )) AS interactions

        FROM
        paginated_data i`;
  return query;
};

const filterForInteractions = (
  filters: filterType,
  andConditions: string,
  filteredQueryArray: string[],
  filterTypes: any,
  filterColumns: Record<string, any>
) => {
  let filteredColumns: string | undefined;
  if (Object.keys(filters).length > 0) {
    for (let [key, conditions] of Object.entries(filters)) {
      if (Object.keys(filterTypes).includes(key)) {
        filteredColumns = filterColumns[key];
        andConditions = ` AND `;
      }
      for (let [condition, values] of Object.entries(conditions)) {
        switch (filterTypes[key]) {
          case "string": {
            let dynamicReference = ``;
            if (filteredColumns == "project_code") dynamicReference = `pf`;
            else if (filteredColumns == "account_name") dynamicReference = `a`;
            else if (filteredColumns == "fiscal_year") dynamicReference = `pf`;
            else if (filteredColumns == "parent_interaction_rid") {
              dynamicReference = `p`;
              filteredColumns = "r_number";
            } else dynamicReference = `i`;
            if (condition == ALPHANUMERIC_CONDITIONS.equals)
              filteredQueryArray.push(
                `LOWER(${dynamicReference}.${filteredColumns}) = LOWER('${values}')`
              );
            if (condition == ALPHANUMERIC_CONDITIONS.notEquals) {
              filteredQueryArray.push(
                `(LOWER(${dynamicReference}.${filteredColumns}) != LOWER('${values}') OR ${dynamicReference}.${filteredColumns} IS NULL)`
              );
            }
            if (condition == ALPHANUMERIC_CONDITIONS.isEmpty)
              filteredQueryArray.push(
                `${dynamicReference}.${filteredColumns} IS NULL`
              );
            if (condition == ALPHANUMERIC_CONDITIONS.contains)
              filteredQueryArray.push(
                `${dynamicReference}.${filteredColumns} ILIKE '%${values}%'`
              );
            if (condition == ALPHANUMERIC_CONDITIONS.IN)
              filteredQueryArray.push(
                `${dynamicReference}.${filteredColumns} IN (${values
                  .map((d: any) => `'${d}'`)
                  .join(",")})`
              );
            break;
          }
          case "number": {
            if (condition == ALPHANUMERIC_CONDITIONS.equals)
              filteredQueryArray.push(`i.${filteredColumns} = ${values}`);
            if (condition == ALPHANUMERIC_CONDITIONS.notEquals)
              filteredQueryArray.push(`i.${filteredColumns} != ${values}`);
            if (condition == ALPHANUMERIC_CONDITIONS.greater_than)
              filteredQueryArray.push(`i.${filteredColumns} > ${values}`);
            if (condition == ALPHANUMERIC_CONDITIONS.less_than)
              filteredQueryArray.push(`i.${filteredColumns} < ${values}`);
            if (condition == ALPHANUMERIC_CONDITIONS.between)
              filteredQueryArray.push(
                `i.${filteredColumns} BETWEEN ${values.join(" AND ")}`
              );
            if (condition == ALPHANUMERIC_CONDITIONS.isEmpty)
              filteredQueryArray.push(`i.${filteredColumns} IS NULL`);
            break;
          }
          case "datetime": {
            if (condition == ALPHANUMERIC_CONDITIONS.equals)
              filteredQueryArray.push(
                `DATE(i.${filteredColumns}) = '${values}'`
              );
            if (condition == ALPHANUMERIC_CONDITIONS.before)
              filteredQueryArray.push(
                `DATE(i.${filteredColumns}) < '${values}'`
              );
            if (condition == ALPHANUMERIC_CONDITIONS.after)
              filteredQueryArray.push(
                `DATE(i.${filteredColumns}) > '${values}'`
              );
            if (condition == ALPHANUMERIC_CONDITIONS.between)
              filteredQueryArray.push(
                `DATE(i.${filteredColumns}) BETWEEN ${values
                  .map((d: any) => `'${d}'`)
                  .join(" AND ")}`
              );
            if (condition == ALPHANUMERIC_CONDITIONS.isEmpty)
              filteredQueryArray.push(`DATE(i.${filteredColumns}) IS NULL`);
          }
        }
      }
    }
    return {
      filteredQueryArray,
      andConditions,
    };
  } else {
    filteredQueryArray = [];
    andConditions = ` `;
    return {
      filteredQueryArray,
      andConditions,
    };
  }
};

const globalFiltersForInteractionSummary = (
  globalFilters: Record<string, string[]>
) => {
  let arrayOfIds: string[] = [];
  for (let [key, items] of Object.entries(globalFilters)) {
    for (let item of items) {
      arrayOfIds.push(item);
    }
  }
  return arrayOfIds;
};

export const listResponseHistory = (
  interaction_rid: string,
  schemaName: string,
  page: number,
  limit: number,
  sort: string,
  sortBy: string
) => {
  let offset = (page - 1) * limit;
  let pagination = `LIMIT ${limit} OFFSET ${offset}`;
  let sortQuery: string = ``;

  if (responseSortKeys.includes(sort.toLowerCase()))
    sortQuery = `ORDER BY ${sort} ${sortBy}`;
  else sortQuery = `ORDER BY r_number ASC`;

  let query = `
    WITH fetch_interaction_response AS (
    SELECT 
    DISTINCT ON (r.interaction_version) 
    r.rid, i.r_number, r.response_by, r.response_on, r.response_email,
    r.interaction_response, i.interaction_source_rid,
    r.response_source_rid, r.interaction_version, r.interaction_rid, r.interaction_item_rid
    FROM 
    ${schemaName}.interaction_response_history r
    LEFT JOIN ${schemaName}.interactions i ON i.rid = r.interaction_rid
    WHERE
    i.rid = '${interaction_rid}'
    AND
    r.interaction_item_rid IS NOT NULL
    ),
    counted_datas AS (
    SELECT f.*, COUNT(f.*) OVER() AS total_records FROM fetch_interaction_response f
    ),
    paginated_data AS (
    SELECT * FROM counted_datas   ${sortQuery}  ${pagination}
    )
    
    SELECT 
    array_agg(jsonb_build_object(
    'rid', i.rid,
    'interaction_rid', i.interaction_rid,
    'interaction_item_rid', i.interaction_item_rid,
    'r_number', i.r_number,
    'response_by_rid', i.response_by,
    'response_on', i.response_on,
    'response_email', i.response_email,
    'interaction_response', i.interaction_response,
    'interaction_source_rid', i.interaction_source_rid,
    'total_records', i.total_records,
    'response_source_rid', i.response_source_rid,
    'interaction_version', i.interaction_version
    )${sortQuery} NULLS LAST) AS response_history
    FROM
    paginated_data i`;
  return query;
};

export const listInteractionHistory = (
  page: number,
  limit: number,
  sort: string,
  sortBy: string,
  filter: filterType,
  interactionRid: string,
  schemaName: string
) => {
  let offset = (page - 1) * limit;
  let pagination = `LIMIT ${limit} OFFSET ${offset}`;
  let filterQueryArray: string[] = [];
  let sortValue: any = ``;
  let keyType;
  let andConditions: string = ``;
  let filterQueryCombinedValues: string = ``;

  if (sort.toLowerCase() === "date")
    sortValue = `ORDER BY ih.created_datetime ${sortBy}`;
  else sortValue = `ORDER BY ih.created_datetime ASC`;

  if (Object.keys(filter).length > 0) {
    for (let [key, condition] of Object.entries(filter)) {
      if (Object.keys(filterTypesForIntHistory).includes(key)) {
        keyType = filterTypesForIntHistory[key];
        andConditions = ` AND `;
      }
      for (let [cond, values] of Object.entries(condition)) {
        switch (keyType) {
          case "string": {
            if (cond === ALPHANUMERIC_CONDITIONS["equals"]) {
              filterQueryArray.push(` ih.new_status_rid = '${values}'`);
              break;
            }
            if (cond === ALPHANUMERIC_CONDITIONS["notEquals"]) {
              filterQueryArray.push(` ih.new_status_rid != '${values}'`);
              break;
            }
            if (cond === ALPHANUMERIC_CONDITIONS["IN"]) {
              filterQueryArray.push(
                ` ih.new_status_rid IN (${values
                  .map((d: any) => `'${d}'`)
                  .join(",")})`
              );
              break;
            }
          }
          case "datetime": {
            if (cond === ALPHANUMERIC_CONDITIONS["equals"]) {
              filterQueryArray.push(` DATE(ih.created_datetime) = '${values}'`);
              break;
            }
            if (cond === ALPHANUMERIC_CONDITIONS["before"]) {
              filterQueryArray.push(` DATE(ih.created_datetime) < '${values}'`);
              break;
            }
            if (cond === ALPHANUMERIC_CONDITIONS["after"]) {
              filterQueryArray.push(` DATE(ih.created_datetime) > '${values}'`);
              break;
            }
            if (cond === ALPHANUMERIC_CONDITIONS["between"]) {
              filterQueryArray.push(
                ` DATE(ih.created_datetime) BETWEEN ${values
                  .map((d: any) => `'${d}'`)
                  .join(" AND ")}`
              );
              break;
            }
            if (cond === ALPHANUMERIC_CONDITIONS["isEmpty"]) {
              filterQueryArray.push(` ih.created_datetime IS NULL`);
              break;
            }
          }
          default:
            break;
        }
      }
    }
  }
  

  if (filterQueryArray.length > 0) {
    filterQueryCombinedValues = filterQueryArray.join("AND");
  }

  let query = `
      WITH base_interaction AS (
        SELECT 
          i.rid AS interaction_rid,
          i.r_number,
          i.response_source_rid,
          i.interaction_source_rid,
          p.project_code,
          p.project_name
        FROM ${schemaName}.interactions i
        LEFT JOIN ${schemaName}.project p ON p.rid = i.project_rid
        WHERE i.rid = '${interactionRid}'
      ),
  
      filtered_history AS (
        SELECT 
          ih.rid,
          ih.new_status_rid,
          ih.created_datetime,
          ih.interaction_rid,
          COUNT(*) OVER() AS total_records
        FROM ${schemaName}.interaction_status_history ih
        WHERE ih.interaction_rid = '${interactionRid}'
        ${andConditions}
        ${filterQueryCombinedValues}
        ${sortValue}
      ),
  
      paginated_data AS (
        SELECT * FROM filtered_history
        ${pagination}
      )
  
      SELECT 
  bi.r_number AS interaction_rnumber,
  bi.project_code,
  bi.project_name,
  bi.response_source_rid,
  bi.interaction_source_rid,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'total_records', pd.total_records,
        'interaction_history_rid', pd.rid,
        'new_status_rid', pd.new_status_rid,
        'date', pd.created_datetime
      )
      ORDER BY pd.created_datetime ASC NULLS LAST
    ) FILTER (WHERE pd.rid IS NOT NULL),
    '[]'::jsonb
  ) AS interaction_history
FROM base_interaction bi
LEFT JOIN paginated_data pd ON pd.interaction_rid = bi.interaction_rid
GROUP BY 
  bi.r_number, bi.project_code, bi.project_name, 
  bi.response_source_rid, bi.interaction_source_rid
    `;

  return query;
};

export const listAttachments = (
  page: number,
  limit: number,
  interaction_rid: string,
  schemaName: string,
  search : string
) => {
  let offset = (page - 1) * limit;
  let pagination = `LIMIT ${limit} OFFSET ${offset}`;
  let searchValue : string = ``
  if(search) searchValue = `%${search}%`
  else searchValue = `%%`

  let query = `WITH fetch_attachments AS (
        SELECT 
            ia.rid, ii.question_seq_num AS r_number, ia.attachment_name,
            ia.attachment_type, ia.attachment_size,
            ia.attachment_url, ia.created_datetime, 
            ia.created_by, COUNT(*) OVER() AS total_records,
            ia.interaction_version
        FROM
        ${schemaName}.interaction_attachments ia
		    LEFT JOIN ${schemaName}.interaction_items ii ON ii.rid = ia.interaction_item_rid
        LEFT JOIN ${schemaName}.interactions i ON ia.interaction_rid = i.rid
        WHERE
        ia.interaction_rid = '${interaction_rid}'
        AND
        ia.interaction_version = i.interaction_version
        AND
        (ia.attachment_name ILIKE '${searchValue}' OR ii.question_seq_num ILIKE '${searchValue}')
    ),
    paginated_data AS (
    SELECT * FROM fetch_attachments ${pagination}
    )
    SELECT 
    array_agg(jsonb_build_object(
    'rid', i.rid,
    'question_rnumber', i.r_number,
    'name', i.attachment_name,
    'type', i.attachment_type,
    'size', i.attachment_size,
    'created_by', i.created_by,
    'uploaded_date', i.created_datetime,
    'total_records', i.total_records,
    'version', i.interaction_version,
    'download_link', i.attachment_url
    )) AS attachments
    FROM
    paginated_data i 
    `;

  return query;
};

export const interactionResponseHistoryByVersion = (
  interaction_rid: string,
  version: number,
  schemaName: string
) => {
  let query = `WITH fetch_rid_response_history AS (
        SELECT 
            irh.rid
        FROM 
            ${schemaName}.interaction_response_history irh
        WHERE
            irh.interaction_rid = '${interaction_rid}'
            AND
            irh.interaction_version = ${version}
        GROUP BY irh.rid
    ),
    fetch_attachments AS (
        SELECT 
            a.attachment_name, a.attachment_size, a.attachment_type, a.attachment_url, a.interaction_rid, a.interaction_item_rid
        FROM
        ${schemaName}.interaction_attachments a
        LEFT JOIN fetch_rid_response_history irh ON irh.rid = a.interaction_response_rid
        WHERE
        a.interaction_version = ${version}
        AND
        a.interaction_item_rid IS NOT NULL
        AND
        a.interaction_response_rid IN (irh.rid)
    ),
    fetch_global_attachments AS (
        SELECT a.attachment_name, a.attachment_size, a.attachment_type, a.attachment_url, a.interaction_rid
        FROM
        ${schemaName}.interaction_attachments a
        where 
        a.interaction_rid = '${interaction_rid}'
        AND
        a.interaction_version = ${version}
        AND
        a.interaction_item_rid IS NULL
        AND
        a.interaction_response_rid IS NULL
    ),
    fetch_interaction_responses AS (
        SELECT 
            irh.rid, irh.interaction_item_rid, irh.interaction_response,
            irh.response_on, irh.r_number, irh.interaction_version,
            array_agg(jsonb_build_object(
            'file_name', a.attachment_name,
            'file_size', a.attachment_size,
            'file_type', a.attachment_type,
            'file_url', a.attachment_url
            )) AS attachments,
            array_agg(jsonb_build_object(
            'file_name', fa.attachment_name,
            'file_size', fa.attachment_size,
            'file_type', fa.attachment_type,
            'file_url', fa.attachment_url
            )) AS global_attachments
        FROM
        ${schemaName}.interaction_response_history irh
        LEFT JOIN fetch_attachments a ON a.interaction_rid = irh.interaction_rid AND a.interaction_item_rid = irh.interaction_item_rid
        LEFT JOIN fetch_global_attachments fa ON fa.interaction_rid = irh.interaction_rid
        WHERE
            irh.interaction_rid = '${interaction_rid}'
            AND
            irh.interaction_version = ${version}
        GROUP BY 
            irh.interaction_item_rid, irh.interaction_response,
            irh.response_on, irh.r_number, irh.rid, irh.interaction_version
    ),
    fetch_interaction_questions AS (
        SELECT 
            i.r_number AS response_rnumber, p.project_name,
            ii.question_seq_num, ii.question, a.attachments, a.global_attachments,
            a.interaction_response, a.response_on,i.response_updated_on,
            i.response_submitted_on, i.rid AS interaction_rid,
            ii.rid AS interaction_item_rid, a.rid AS interaction_response_rid, a.interaction_version
        FROM
        ${schemaName}.interactions i
        LEFT JOIN ${schemaName}.project p ON p.rid = i.project_rid AND p.account_rid = i.account_rid
        LEFT JOIN ${schemaName}.interaction_items ii ON ii.interaction_rid = i.rid
        LEFT JOIN fetch_interaction_responses a ON a.interaction_item_rid = ii.rid
        WHERE
            i.rid = '${interaction_rid}'
            AND
			a.interaction_version = ${version}
        GROUP BY
		    a.rid, a.r_number, p.project_name,i.r_number,
            ii.question_seq_num, ii.question,
            a.interaction_response, a.response_on,i.response_updated_on,
            i.response_submitted_on, i.rid,
            ii.rid, a.rid, a.attachments, a.interaction_version, a.global_attachments
    )
    
    SELECT 
    array_agg(jsonb_build_object(
    'interaction_rid', i.interaction_rid,
    'interaction_item_rid', i.interaction_item_rid,
    'interaction_response_rid', i.interaction_response_rid,
    'response_id', i.response_rnumber,
    'project_name', i.project_name,
    'response_on', i.response_on,
    'response_updated_on', i.response_updated_on,
    'response_submitted_on', i.response_submitted_on,
    'question_id', i.question_seq_num,
    'question', i.question,
    'response', i.interaction_response,
    'attachments', i.attachments,
    'global_attachments', i.global_attachments
    )ORDER BY i.question_seq_num ASC NULLS LAST) AS responses_history_details
    FROM
    fetch_interaction_questions i
    `;
  return query;
};

export const fetchAllParentRNumber = () => {
  let query = `SELECT r_number
        FROM
           "${MAIN_SCHEMA_NAME}".account
        WHERE
           storage_type = '${STATUS_MESSAGE.separateDb}'
           AND
           parent_account_rid IS NULL`;
  return query;
};

export const fetchProjectAttachmentsRids = (schemaName: string) => {
  let query = `
    SELECT attach_to AS project_fiscal_rid, account_rid FROM "${schemaName}".attachments where attachment_level = 'project' AND
    is_ai_processed = false
    `;
  return query;
};

export const fetchProjectInteractionRid = (schemaName: string) => {
  let query = `
    SELECT account_rid, project_fiscal_rid FROM ${schemaName}.interactions WHERE is_ai_processed = false
    `;
  return query;
};

export const checkTableExists = (schemaName: string, table: string) => {
  return `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = '${table}')`;
};

export const fetchInteractionForSentResentStatus = async (
  schemaName: string,
  mainDb: Sequelize,
  orgDb: Sequelize
) => {
  let fetchInteractionStatus: any = await mainDb.query(
    `SELECT rid, status_name from ${MAIN_SCHEMA_NAME}.interaction_status WHERE LOWER(status_name) IN ('sent', 'resent')`
  );
  const mapInteractionStatus: Map<string, string> = new Map(
    fetchInteractionStatus[0].map((d: any) => [d.rid, d.status_name])
  );
  const fetchAllInteractions: any = await orgDb.query(
    `SELECT rid, status_rid FROM ${schemaName}.interactions`
  );

  let updatedResponse = fetchAllInteractions[0].map((d: any) => {
    return {
      ...d,
      status_name:
        mapInteractionStatus.get(d.status_rid) == undefined
          ? null
          : mapInteractionStatus.get(d.status_rid)?.toLowerCase(),
    };
  });
  for (let data of updatedResponse) {
    await updateInteractionAge(data, schemaName, orgDb, mainDb);
  }
};

const updateInteractionAge = async (
  data: any,
  schemaName: string,
  orgDb: Sequelize,
  mainDb: Sequelize
) => {
  let interactions: any;
  let dateTimeColumn: any;
  console.log("statusName : ", data.status_name);
  if (data.status_name === "sent") {
    dateTimeColumn = `sent_on_datetime`;
    interactions = await orgDb.query(
      findDateDifferenceQuery(schemaName, data.status_rid, dateTimeColumn)
    );
    if (interactions[0].length > 0) {
      for (let i of interactions[0]) {
        await orgDb.query(
          updateInteractionForAgeQuery(schemaName, i.rid, i.age)
        );
        await mainDb.query(updateInteractionAgeSummary(i.rid, i.age));
      }
    }
  } else if (data.status_name === "resent") {
    dateTimeColumn = `last_resent_on`;
    interactions = await orgDb.query(
      findDateDifferenceQuery(schemaName, data.status_rid, dateTimeColumn)
    );
    if (interactions[0].length > 0) {
      for (let i of interactions[0]) {
        await orgDb.query(
          updateInteractionForAgeQuery(schemaName, i.rid, i.age)
        );
      }
    }
  }
};

const findDateDifferenceQuery = (
  schemaName: string,
  rid: any,
  dateTimeColumn: string
) => {
  return `SELECT COALESCE(DATE(NOW()) - DATE(i.${dateTimeColumn}), 0) AS age, i.rid
            FROM ${schemaName}.interactions i
            WHERE
            i.status_rid = '${rid}'
            `;
};

const updateInteractionForAgeQuery = (
  schemaName: string,
  rid: string,
  age: number
) => {
  return `UPDATE ${schemaName}.interactions i SET interaction_age = ${age} WHERE i.rid = '${rid}'`;
};

const updateInteractionAgeSummary = (rid: string, age: number) => {
  return `UPDATE ${MAIN_SCHEMA_NAME}.interactions_summary i SET interaction_age = ${age} WHERE i.interaction_rid = '${rid}'`;
};

export const fetchStatusIdsForReminderList = () => {
  return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.interaction_status WHERE (status_name ILIKE '%${interactionStatus.SENT}%' OR status_name ILIKE '%${interactionStatus.RESPONSE_DRAFT}%')`
}

const interactionStatus = {
  SENT : "sent",
  RESPONSE_DRAFT : "response_draft"
}