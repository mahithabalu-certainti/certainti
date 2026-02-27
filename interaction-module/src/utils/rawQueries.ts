import { Sequelize } from "sequelize";
import {
  ALPHANUMERIC_CONDITIONS,
  filtersColumns,
  filtersColumnsForInteractionSummary,
  filterTypes,
  filterTypesForIntHistory,
  filterTypesForSummaryInteractions,
  FourPartColumnsTypes,
  interactionFlag,
  MAIN_SCHEMA_NAME,
  rawQueries,
  responseSortKeys,
  STATUS_MESSAGE,
  templatefiltersColumns,
} from "./constants";
import { FourPartColumns } from "./constants";

export type filterType = {
  [key: string]: {
    [condition: string]: any;
  };
};

export const fetchInteractionForProjectLevelQuery = (
  account_rid: string,
  project_id: string,
  project_fiscal_rid: string,
  case_rid: string,
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
  let accountLevelkeyContactQuery : string = ``
  let aggregatedQuery : string = `` 
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
    accountLevelkeyContactQuery = `kcd.key_contact_name, kcd.key_contact_email,`
    aggregatedQuery = `
        ,'key_contact_name', i.key_contact_name,
        'key_contact_email', i.key_contact_email`
  } else if (flag == interactionFlag.case) {
    accountLevelkeyContactQuery = `kcd.key_contact_name, kcd.key_contact_email,`
    aggregatedQuery = `
        ,'key_contact_name', i.key_contact_name,
        'key_contact_email', i.key_contact_email`
    whereConditions = `
        i.account_rid = '${account_rid}' 
        AND i.project_rid IN (
          SELECT project_rid 
          FROM ${schemaName}.case_projects 
          WHERE case_rid = '${case_rid}'
        )`;
  } else {
    accountLevelkeyContactQuery = `kcd.key_contact_name, kcd.key_contact_email,`
    aggregatedQuery = `
        ,'key_contact_name', i.key_contact_name,
        'key_contact_email', i.key_contact_email`
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
  else if (sort === filtersColumns.sent_on_datetime)
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
  else if (sort === filtersColumns.project_name )
    sortValue = `ORDER BY pf.project_name ${sortBy}`;
  else if (sort === filtersColumns.fiscal_year)
    sortValue = `ORDER BY i.fiscal_year ${sortBy}`;
  else if (sort === filtersColumns.parent_interaction_rid)
    sortValue = `ORDER BY p.r_number ${sortBy}`;
  else if (sort === filtersColumns.createdAt)
    sortValue = `ORDER BY i.created_datetime ${sortBy}`;
  else if (sort === filtersColumns.four_part_r_number)
    sortValue = `ORDER BY fpr.r_number ${sortBy}`
  else if (sort === filtersColumns.interaction_batch_id)
    sortValue = `ORDER BY i.interaction_batch_id ${sortBy}`
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
            i.status_rid, ${accountLevelkeyContactQuery}
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
            pf.project_code,pf.project_name, fpr.r_number AS four_part_r_number, i.interaction_batch_id,
            i.interaction_assessment_source_rid, i.four_part_assessment_rid,
            CASE 
                WHEN i.project_fiscal_rid IS NULL THEN i.fiscal_year
                ELSE pf.fiscal_year
            END AS fiscal_year,
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
            LEFT JOIN ${schemaName}.four_part_assessment fpr ON fpr.rid = i.four_part_assessment_rid
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
        'project_name', i.project_name, 
        'has_email_recipient', i.has_email_recipient,
        'has_account_recipient', i.has_account_recipient,
        'interaction_batch_id', i.interaction_batch_id,
        'four_part_r_number', i.four_part_r_number,
        'interaction_assessment_source_rid', i.interaction_assessment_source_rid,
        'four_part_assessment_rid', i.four_part_assessment_rid
        ${aggregatedQuery}
        ) ) AS interactions

        FROM
        paginated_datas i
    `;

  return query;
};

export const fetchInteractionTemplates = async (
  sort: string,
  sortBy: string,
  filters: filterType,
  page: number,
  limit: number,
  search : string,
  apiSource : string,
  templateType : string,
  mainDb:Sequelize,
  apitype : string
) => {
  let offset = (page - 1) * limit;
  let pagination = `LIMIT ${limit} OFFSET ${offset}`;
  let filteredQueryArray: string[] = [];
  let filterQueryValues;
  let sortValue: string;
  let andConditions = ``;
  let interactionLLevelCondition = ``;
  let searchValue;


  if(search) searchValue = `%${search}%`
  else searchValue = `%%`
  if(apiSource === 'interaction' && templateType) {
    pagination = ``;
    const [activeStatus]: any[] = await mainDb.query(
                  rawQueries.fetchActiveStatusByType("Active"),
                  { type: "SELECT" }
                );
    let [fetchInteractionStatus]: any[] = await mainDb.query(
   rawQueries.fetchInteractionLevelRidByName(templateType)
  );
  let interactionLevelId = fetchInteractionStatus[0]?.rid;
   interactionLLevelCondition = ` AND i.interaction_level_rid = '${interactionLevelId}'  AND i.status_rid = '${activeStatus?.rid}' `
  }
  if (apitype === "export") {
    pagination = ``;
  }


  let filteredData = filterForInteractionTemplates(
    filters,
    andConditions,
    filteredQueryArray,
    filterTypes,
    templatefiltersColumns
  );
  if (sort === templatefiltersColumns.r_number)
    sortValue = `ORDER BY i.r_number ${sortBy}`;
  else if (sort === templatefiltersColumns.created_datetime)
    sortValue = `ORDER BY i.created_datetime ${sortBy}`;
  else if (sort === templatefiltersColumns.modified_datetime)
    sortValue = `ORDER BY i.modified_datetime ${sortBy}`;
  else if (sort === templatefiltersColumns.interaction_type_rid)
    sortValue = `ORDER BY it.interaction_type_name ${sortBy}`;
  else if (sort === templatefiltersColumns.interaction_level_rid)
    sortValue = `ORDER BY il.interaction_level_name ${sortBy}`;
  else if (sort === templatefiltersColumns.template_name)
    sortValue = `ORDER BY i.template_name ${sortBy}`;
  else if (sort === templatefiltersColumns.status_rid)
    sortValue = `ORDER BY s.status_name ${sortBy}`;
  else if (sort === templatefiltersColumns.created_user_name)
    sortValue = `ORDER BY created_user_name ${sortBy}`;
  else if (sort === templatefiltersColumns.modified_user_name)
    sortValue = `ORDER BY modified_user_name ${sortBy}`;
  else if (sort === templatefiltersColumns.createdAt)
    sortValue = `ORDER BY created_datetime ${sortBy}`;
  else sortValue = `ORDER BY i.r_number ASC`;

  if (filteredData?.filteredQueryArray.length! > 0) {
    filterQueryValues = filteredQueryArray.join(" AND ");
  } else {
    filterQueryValues = ` `;
  }

  let query = `
    WITH fetch_interaction_templates AS (
        SELECT
            i.rid, i.r_number,
            i.status_rid,s.status_name,
            i.created_by, i.modified_by,
            i.created_datetime, i.modified_datetime,
            COUNT(i.rid) OVER() AS total_records,
            i.interaction_type_rid,it.interaction_type_name,
            i.interaction_level_rid,il.interaction_level_name,
            i.template_name,
            uc.first_name || ' ' || uc.last_name AS created_user_name,
            um.first_name || ' ' || um.last_name AS modified_user_name

            FROM
            ${MAIN_SCHEMA_NAME}.interaction_templates i
            LEFT JOIN ${MAIN_SCHEMA_NAME}.interaction_level il ON il.rid = i.interaction_level_rid
            LEFT JOIN ${MAIN_SCHEMA_NAME}.interaction_type it ON it.rid = i.interaction_type_rid
            LEFT JOIN ${MAIN_SCHEMA_NAME}.status s ON s.rid = i.status_rid
            LEFT JOIN ${MAIN_SCHEMA_NAME}.user uc ON uc.rid = i.created_by
            LEFT JOIN ${MAIN_SCHEMA_NAME}.user um ON um.rid = i.modified_by
            WHERE
            (i.r_number ILIKE '${searchValue}')
            ${interactionLLevelCondition}
            ${filteredData?.andConditions}
            ${filterQueryValues}
            ${sortValue}
    ),
    paginated_datas AS (
    SELECT * FROM fetch_interaction_templates ${pagination}
    
    )
        SELECT 
        array_agg(jsonb_build_object(
        'rid', i.rid,
        'r_number', i.r_number,
        'status', i.status_rid,
        'status_name', i.status_name,
        'created_by', i.created_by,
        'modified_by', i.modified_by,
        'created_datetime', i.created_datetime,
        'modified_datetime', i.modified_datetime,
        'interaction_type', i.interaction_type_rid,
        'interaction_type_name', i.interaction_type_name,
        'interaction_level', i.interaction_level_rid,
        'interaction_level_name', i.interaction_level_name,
        'total_records', i.total_records,
        'created_user_name', i.created_user_name,
        'modified_user_name', i.modified_user_name,
        'template_name', i.template_name
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
            else if (filteredColumns == "project_name") dynamicReference = `pf`;
            else if (filteredColumns == "account_name") dynamicReference = `a`;
            else if (filteredColumns == "fiscal_year") dynamicReference = `pf`;
            else if (filteredColumns == 'four_part_r_number') {
              dynamicReference = `fpr`
              filteredColumns = "r_number"
            }
            else if (filteredColumns == "parent_interaction_rid") {
              dynamicReference = `p`;
              filteredColumns = "r_number";
            } else dynamicReference = `i`;
            
            const stringCondition = buildStringFilterCondition(condition, values, filteredColumns!, dynamicReference);
            if (stringCondition) {
              filteredQueryArray.push(stringCondition);
            }
            break;
          }
          case "number": {
            const numericCondition = buildNumericFilterCondition(condition, values, filteredColumns!);
            if (numericCondition) {
              filteredQueryArray.push(numericCondition);
            }
            break;
          }
          case "datetime": {
            const datetimeCondition = buildDatetimeFilterCondition(condition, values, filteredColumns!);
            if (datetimeCondition) {
              filteredQueryArray.push(datetimeCondition);
            }
            break;
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

const filterForInteractionTemplates = (
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
            if (filteredColumns == "created_by") dynamicReference = `uc`;
            else if (filteredColumns == "modified_by") dynamicReference = `um`;
            else if (filteredColumns == "created_user_name") dynamicReference = ``;
            else dynamicReference = `i`;
            
            const stringCondition = buildStringFilterCondition(condition, values, filteredColumns!, dynamicReference);
            if (stringCondition) {
              filteredQueryArray.push(stringCondition);
            }
            break;
          }
          case "number": {
            const numericCondition = buildNumericFilterCondition(condition, values, filteredColumns!);
            if (numericCondition) {
              filteredQueryArray.push(numericCondition);
            }
            break;
          }
          case "datetime": {
            const datetimeCondition = buildDatetimeFilterConditionTemplates(condition, values, filteredColumns!);
            if (datetimeCondition) {
              filteredQueryArray.push(datetimeCondition);
            }
            break;
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
            ii.rid AS interaction_item_rid, a.rid AS interaction_response_rid, a.interaction_version,
            ii.is_mandatory
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
            ii.rid, a.rid, a.attachments, a.interaction_version, a.global_attachments,
            ii.is_mandatory
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
    'is_mandatory', i.is_mandatory,
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
  return `SELECT rid, status_name,status_type FROM ${MAIN_SCHEMA_NAME}.interaction_status WHERE (LOWER(status_name) = '${interactionStatus.SENT}' OR LOWER(status_name) = '${interactionStatus.RESPONSE_DRAFT}')`
}

const interactionStatus = {
  SENT : "sent",
  RESPONSE_DRAFT : "response draft"
}
// Utility function for handling numeric filter conditions
const buildNumericFilterCondition = (
  condition: string,
  values: any,
  filteredColumns: string,
  tableAlias: string = 'i'
): string => {
  const columnRef = `${tableAlias}.${filteredColumns}`;
  
  switch (condition) {
    case ALPHANUMERIC_CONDITIONS.equals:
      if(filteredColumns === 'fiscal_year') {
        return `CASE WHEN i.project_fiscal_rid IS NULL THEN i.fiscal_year ELSE pf.fiscal_year END = ${values}`;
      } else {
        return `${columnRef} = ${values}`;
      }
    case ALPHANUMERIC_CONDITIONS.notEquals:
      if(filteredColumns === 'fiscal_year') {
        return `CASE WHEN i.project_fiscal_rid IS NULL THEN i.fiscal_year ELSE pf.fiscal_year END != ${values}`
      } else {
        return `${columnRef} != ${values}`;
      }
    case ALPHANUMERIC_CONDITIONS.greater_than:
      return `${columnRef} > ${values}`;
    case ALPHANUMERIC_CONDITIONS.less_than:
      return `${columnRef} < ${values}`;
    case ALPHANUMERIC_CONDITIONS.between:
      return `${columnRef} BETWEEN ${values.join(" AND ")}`;
    case ALPHANUMERIC_CONDITIONS.isEmpty:
      return `${columnRef} IS NULL`;
    case ALPHANUMERIC_CONDITIONS.IN :
      return `CASE WHEN i.project_fiscal_rid IS NULL THEN i.fiscal_year ELSE pf.fiscal_year END IN (${values.map((d : any) => `${d}`)})`
    default:
      return '';
  }
};

// Utility function for handling string filter conditions
const buildStringFilterCondition = (
  condition: string,
  values: any,
  filteredColumns: string,
  dynamicReference: string
): string => {
  let columnRef = `${dynamicReference}.${filteredColumns}`;
  
  // Handle computed user name fields
  if (filteredColumns === 'created_user_name') {
    columnRef = `(uc.first_name || ' ' || uc.last_name)`;
  } else if (filteredColumns === 'modified_user_name') {
    columnRef = `(um.first_name || ' ' || um.last_name)`;
  }
  
  switch (condition) {
    case ALPHANUMERIC_CONDITIONS.equals:
      return `LOWER(${columnRef}) = LOWER('${values}')`;
    case ALPHANUMERIC_CONDITIONS.notEquals:
      return `(LOWER(${columnRef}) != LOWER('${values}') OR ${columnRef} IS NULL)`;
    case ALPHANUMERIC_CONDITIONS.isEmpty:
      return `${columnRef} IS NULL`;
    case ALPHANUMERIC_CONDITIONS.contains:
      return `${columnRef} ILIKE '%${values}%'`;
    case ALPHANUMERIC_CONDITIONS.IN:
      return `${columnRef} IN (${values.map((d: any) => `'${d}'`).join(",")})`;
    default:
      return '';
  }
};

// Utility function for handling datetime filter conditions
const buildDatetimeFilterCondition = (
  condition: string,
  values: any,
  filteredColumns: string,
  tableAlias: string = 'i'
): string => {
  const columnRef = `DATE(${tableAlias}.${filteredColumns})`;
  
  switch (condition) {
    case ALPHANUMERIC_CONDITIONS.equals:
      return `${columnRef} = '${values}'`;
    case ALPHANUMERIC_CONDITIONS.before:
      return `${columnRef} < '${values}'`;
    case ALPHANUMERIC_CONDITIONS.after:
      return `${columnRef} > '${values}'`;
    case ALPHANUMERIC_CONDITIONS.between:
      return `${columnRef} BETWEEN ${values.map((d: any) => `'${d}'`).join(" AND ")}`;
    case ALPHANUMERIC_CONDITIONS.isEmpty:
      return `${columnRef} IS NULL`;
    default:
      return '';
  }
};

const buildDatetimeFilterConditionTemplates = (
  condition: string,
  values: any,
  filteredColumns: string,
  tableAlias: string = 'i'
): string => {
  const columnRef = `DATE(${tableAlias}.${filteredColumns})`;
  
  switch (condition) {
    case ALPHANUMERIC_CONDITIONS.equals:
      return `${columnRef} = '${values}'`;
    case ALPHANUMERIC_CONDITIONS.before:
      return `${columnRef} < '${values}'`;
    case ALPHANUMERIC_CONDITIONS.after:
      return `${columnRef} > '${values}'`;
    case ALPHANUMERIC_CONDITIONS.between:
      // values should be an object: { from: string, to: string }
      if (values && typeof values === 'object' && values.from && values.to) {
      return `${columnRef} BETWEEN '${values.from}' AND '${values.to}'`;
      }
      return '';
    case ALPHANUMERIC_CONDITIONS.isEmpty:
      return `${columnRef} IS NULL`;
    default:
      return '';
  }
};

export const fetchKeyContactDetailsForInteractions = (schemaName : string, entityRid : string) => {
  return `
    SELECT kc.key_contact_name, kc.key_contact_email
    FROM
    ${schemaName}.key_contact_details kc
    WHERE
    kc.entity_rid = '${entityRid}'
    AND
    kc.include_in_communication = TRUE
  `
}

export const fetchFourPartAssessment = (page : number, limit : number, sort : string, sortBy : string, filters : filterType, search : string, schemaName : string, isPagination : boolean, isSorting : boolean, isFiltering : boolean, accountRid : string, projectFiscalRid : string, caseProjectFiscalRids : string[], type : string) => {
  let offset = (page - 1) * limit;
  let pagination = `LIMIT ${limit} OFFSET ${offset}`;
  let doPagination : string;
  let sortValue : string;
  let filterQueries : string;
  let andConditions : string;
  let searchValue : string
  let filterConditionsForLevel : string = ''

  if(type === 'account') filterConditionsForLevel = `i.account_rid = '${accountRid}'`
  else if(type === 'project') filterConditionsForLevel = `i.project_fiscal_rid = '${projectFiscalRid}'`
  else if(type === 'case') filterConditionsForLevel = `i.project_fiscal_rid IN (${caseProjectFiscalRids.map((d) => `'${d}'`).join(',')})`

  if(search) searchValue = `'%${search}%'`
  else searchValue = `'%%'`

  if(isPagination) {
    doPagination = pagination
  } else {
    doPagination = ''
  }
  if(isSorting) {
    let getSortOrder : string;
    if(sort === FourPartColumns.r_number) getSortOrder = FourPartColumns.r_number
    else if(sort.toLowerCase() === FourPartColumns.rd_potential_category) getSortOrder = FourPartColumns.rd_potential_category
    else if(sort.toLowerCase() === FourPartColumns.status) getSortOrder = FourPartColumns.status
    else if(sort.toLowerCase() === FourPartColumns.created_datetime) getSortOrder = FourPartColumns.created_datetime
    else if(sort.toLowerCase() === FourPartColumns.modified_datetime) getSortOrder = FourPartColumns.modified_datetime
    else if(sort.toLowerCase() === FourPartColumns.project_code) getSortOrder = FourPartColumns.project_code
    else getSortOrder = FourPartColumns.r_number!
    sortValue = `ORDER BY ${getSortOrder} ${sortBy}`
  } else sortValue = ''

  if(isFiltering) {
    if(Object.keys(filters).length > 0) filterQueries = filterUtilityFunction(filters, FourPartColumns)
    else filterQueries = ''
  } else filterQueries = ''

  andConditions = filterQueries === '' ? '' : ' AND '

  let query = 
  `WITH fetch_fpa_data AS (
  SELECT 
  f.rid, f.r_number, f.status, f.rd_potential_category, f.modified_datetime, f.created_datetime,
  p.project_code, f.created_by, f.modified_by
  FROM ${schemaName}.four_part_assessment f
  LEFT JOIN ${schemaName}.interactions i ON i.four_part_assessment_rid = f.rid
  LEFT JOIN ${schemaName}.project_fiscal p ON p.rid = i.project_fiscal_rid
  WHERE
  (f.r_number ILIKE ${searchValue} OR f.status ILIKE ${searchValue} OR f.rd_potential_category ILIKE ${searchValue} OR p.project_code ILIKE ${searchValue})
  AND
  ${filterConditionsForLevel}
  ${andConditions}
  ${filterQueries}
  ${sortValue}
  ),
  counted_results AS (
  SELECT *, COUNT(*) OVER() AS total_results FROM fetch_fpa_data
  )
  SELECT * FROM counted_results ${pagination}
  `
  return query;
}

const filterUtilityFunction = (filters : filterType, validColumns : any) => {
  let filteredColumns : string[] = [];
  for(let [key, conditions] of Object.entries(filters)) {
    if(Object.keys(validColumns).includes(key)) {
      let validFilterKey = validColumns[key];
      for(let [condition, value] of Object.entries(conditions)) {
        switch(FourPartColumnsTypes[key]) {
          case "string" : {
            if(condition === 'equals') {
              filteredColumns.push(`LOWER(${validFilterKey}) = LOWER('${value}')`);
              break;
            }
            if(condition === 'not_equals') {
              filteredColumns.push(`LOWER(${validFilterKey}) != LOWER('${value}')`);
              break;
            }
            if(condition === 'contains') {
              filteredColumns.push(`${validFilterKey} ILIKE '%${value}%'`);
              break;
            }
            if(condition === 'is_empty') {
              filteredColumns.push(`${validFilterKey} IS NULL`);
              break;
            }
          }
          case "date" : {
            if(condition === 'equals') {
              filteredColumns.push(`DATE(${validFilterKey}) = '${value}'`)
              break;
            }
            if(condition === 'not_equals') {
              filteredColumns.push(`DATE(${validFilterKey}) != '${value}'`)
              break;
            }
            if(condition === 'before') {
              filteredColumns.push(`DATE(${validFilterKey}) < '${value}'`)
              break;
            }
            if(condition === 'after') {
              filteredColumns.push(`DATE(${validFilterKey}) > '${value}'`)
              break;
            }
            if(condition === 'between') {
              filteredColumns.push(`DATE(${validFilterKey}) BETWEEN ${value.map((d : any) => `'${d}'`).join(' AND ')}`)
              break;
            }
          }
          default : {
            break
          }
        }
      }
    }
  }
  let finalFilteredQueries : string;
  if(filteredColumns.length > 0) {
    finalFilteredQueries = filteredColumns.map((d) => d).join(' AND ')
  } else {
    finalFilteredQueries = ''
  }
  return finalFilteredQueries;
} 

export const fetchProjectFiscalIds = (caseRid : string, schemaName : string) => {
  return `SELECT project_fiscal_rid FROM ${schemaName}.case_projects where case_rid = '${caseRid}'`
}