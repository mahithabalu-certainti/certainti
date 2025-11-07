import { MAIN_SCHEMA_NAME, validColumnsForFilters, validColumnsForSortFilters, validFilterColumnTypes } from "./constants";
import {
  FilterType,
  validColumns,
  columnType,
  validColumnsForSorting,
} from "./types";

export const fetchCasesHeadersDatas = (schemaName: string, caseRid: string) => {
  let   query = `
    WITH fetch_fiscal_year AS (
    SELECT fiscal_year, account_rid FROM ${schemaName}.cases where rid = '${caseRid}'
    ),
    fetch_project_count_cost AS (
    SELECT COALESCE(COUNT(pf.rid), 0) AS total_projects, COALESCE(SUM(pf.total_cost_prj), 0.00) AS total_project_cost
    FROM ${schemaName}.project_fiscal pf
    CROSS JOIN fetch_fiscal_year f
    WHERE
    pf.account_rid = f.account_rid
    AND
    pf.fiscal_year = f.fiscal_year
    )

    SELECT c.rid, c.account_rid, ad.account_name, c.case_name, c.filing_type_rid,
    c.case_owner_rid, c.fiscal_year, c.status_rid, f.total_projects AS case_total_projects,c.case_total_qualified_projects,
    f.total_project_cost AS case_total_project_cost, c.case_total_rd_cost, c.case_total_qre_cost,c.case_completion_percentage,c.case_total_qualified_project_cost,
    c.planned_submission_date, c.statutory_submission_date, c.case_startdate,
    c.description, c.r_number, c.created_by, c.modified_by, c.created_datetime,
    c.modified_datetime

    FROM
    ${schemaName}.cases c
    LEFT JOIN ${schemaName}.account_details ad ON ad.account_rid = c.account_rid
    CROSS JOIN fetch_project_count_cost f
    WHERE
    c.rid = '${caseRid}'
    `;
    return query
};

export const fetchProjectsForCases = (
  schemaName: string,
  page: number,
  limit: number,
  sort: string,
  sortBy: string,
  filter: FilterType,
  accountRid: string,
  fiscalYear: number,
  pointOfContactRid: string,
  technicalPointOfContactRid: string,
  isSorting: boolean,
  search: string,
  caseRid: string,
  assignedApi: boolean,
  accessibleIds: string[],
  isExport : boolean
) => {
  let pagination : string = ``
  if(isExport) {
    const offset = (page - 1) * limit;
    pagination = `LIMIT ${limit} OFFSET ${offset}`;
  } else {
    pagination = ` `
  }
    
  let sortValue: string;
  let searchValue: string;
  let filterQueryConditions: string[] = [];
  let combinedFilterQuery: string = ``;
  let and: string = ``;

  let whereConditions: string = ``;
  let subQuery: string = ``;
  let subQueryConditions: string = ``;
  let subQueryJoinConditions: string = ``;
  let accessibleProjects: string = ``;

  if (accessibleIds.length > 0)
    accessibleProjects = `AND pf.rid IN (${accessibleIds
      .map((d: any) => `'${d}'`)
      .join(",")})`;
  else accessibleProjects = ``;

  if (assignedApi) {
    whereConditions = `cp.case_rid = '${caseRid}'`;
    subQuery = ` `;
    subQueryConditions = ` `;
    subQueryJoinConditions = ` `;
  } else {
    subQuery = `
        fetch_case_projects_ids AS (
        SELECT c.project_fiscal_rid FROM ${schemaName}.case_projects c WHERE c.case_rid = '${caseRid}' AND c.account_rid = '${accountRid}'        
        ),
        `;
    subQueryConditions = ` AND NOT EXISTS (SELECT 1 FROM fetch_case_projects_ids f WHERE f.project_fiscal_rid = pf.rid)`;
    subQueryJoinConditions = `LEFT JOIN fetch_case_projects_ids f ON f.project_fiscal_rid = pf.rid`;
    whereConditions = `pf.account_rid = '${accountRid}' AND pf.fiscal_year = ${fiscalYear} ${accessibleProjects}`;
  }

  if (!isSorting) {
    let dynamicAlias: string = ``;
    if (
      sort.includes(validColumnsForSorting[sort]) &&
      validColumnsForSorting[sort] === "project_point_of_contact"
    ) {
      dynamicAlias = `poc`;
      sortValue = `ORDER BY ${dynamicAlias}.${validColumnsForSorting[sort]} ${sortBy}`;
    } else if (
      sort.includes(validColumnsForSorting[sort]) &&
      validColumnsForSorting[sort] === "project_point_of_contact"
    ) {
      dynamicAlias = `tpoc`;
      sortValue = `ORDER BY ${dynamicAlias}.${validColumnsForSorting[sort]} ${sortBy}`;
    } else if (sort.includes(validColumnsForSorting[sort])) {
      dynamicAlias = `pf`;
      sortValue = `ORDER BY ${dynamicAlias}.${validColumnsForSorting[sort]} ${sortBy}`;
    } else sortValue = `ORDER BY pf.project_code ASC`;
  } else {
    sortValue = ``;
  }

  if (search) searchValue = `%${search}%`;
  else searchValue = `%%`;

  if (Object.keys(filter).length > 0) {
    let validKey: string;
    let dynamicAlias: string = ``;
    and = ` AND `;
    for (let [key, condition] of Object.entries(filter)) {
      if (Object.keys(validColumns).includes(key)) {
        validKey = validColumns[key];
        if (validKey === "project_point_of_contact") dynamicAlias = `poc`;
        else if (validKey === "project_technical_point_of_contact")
          dynamicAlias = `tpoc`;
        else dynamicAlias = `pf`;
        for (let [cond, value] of Object.entries(condition)) {
          switch (columnType[validKey]) {
            case "string": {
              if (cond === "equals") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} = '${value}'`
                );
              }
              if (cond === "not_equals") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} != '${value}'`
                );
              }
              if (cond === "contains") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} ILIKE '%${value}%'`
                );
              }
              if (cond === "is_empty") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} IS NULL`
                );
              }
              if (cond === "in") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} IN (${value
                    .map((d: any) => `'${d}'`)
                    .join(",")})`
                );
              }
              break;
            }
            case "number": {
              if (cond === "equals") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} = ${value}`
                );
              }
              if (cond === "not_equals") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} != ${value}`
                );
              }
              if (cond === "greater_than") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} > ${value}`
                );
              }
              if (cond === "less_than") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} < ${value}`
                );
              }
              if (cond === "is_empty") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} IS NULL`
                );
              }
              if (cond === "between") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} BETWEEN ${value
                    .map((d: any) => d)
                    .join(" AND ")}`
                );
              }
              break;
            }
            case "date": {
              if (cond === "equals") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} = '${value}'`
                );
              }
              if (cond === "after") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} > '${value}'`
                );
              }
              if (cond === "before") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} < '${value}'`
                );
              }
              if (cond === "is_empty") {
                filterQueryConditions.push(
                  `${dynamicAlias}.${validKey} IS NULL`
                );
              }
              if (cond === "between") {
                filterQueryConditions.push(
                  `DATE(${dynamicAlias}.${validKey}) BETWEEN ${value
                    .map((d: any) => `'${d}'`)
                    .join(" AND ")}`
                );
              }
              break;
            }
          }
        }
      }
    }
  } else {
    and = ` `;
    filterQueryConditions = [];
  }
  if (filterQueryConditions.length > 0) {
    combinedFilterQuery = filterQueryConditions.join("AND");
  } else {
    combinedFilterQuery = ` `;
  }

  let query = `
    WITH fetch_all_prj_ids AS (
    SELECT pf.rid 
    FROM ${schemaName}.project_fiscal pf
    WHERE
    pf.account_rid = '${accountRid}' AND pf.fiscal_year = ${fiscalYear} ${accessibleProjects}
    ),
    fetch_project_point_of_contact AS (
    SELECT pf.rid, kc.key_contact_name AS project_point_of_contact
    FROM 
    ${schemaName}.key_contact_details kc
    LEFT JOIN fetch_all_prj_ids pf ON pf.rid = kc.entity_rid
    WHERE
    kc.entity_rid IN (pf.rid)
    AND
    kc.key_contact_role = '${pointOfContactRid}'
    ),
    ${subQuery}
    fetch_project_technical_point_of_contact AS (
    SELECT pf.rid, kc.key_contact_name AS project_technical_point_of_contact
    FROM 
    ${schemaName}.key_contact_details kc
    LEFT JOIN fetch_all_prj_ids pf ON pf.rid = kc.entity_rid
    WHERE
    kc.entity_rid IN (pf.rid)
    AND
    kc.key_contact_role = '${technicalPointOfContactRid}'
    ), 

    fetch_projects AS (
    SELECT pf.rid, pf.project_code, pf.project_name, pf.project_type_rid, 
    pf.fiscal_year, pf.project_classification_rid, pf.project_client_group,
    pf.project_group, pf.total_effort_prj, pf.total_cost_prj, pf.total_cost_fte_prj,
    pf.total_cost_subcon_prj, pf.total_cost_nonlabor_prj, pf.assessment_status,
    pf.rd_percent_final, pf.qre_final, pf.comments, pf.modified_datetime, pf.r_number,
    poc.project_point_of_contact, tpoc.project_technical_point_of_contact, pf.account_rid,
    pf.project_rid
    FROM
    ${schemaName}.project_fiscal pf
    LEFT JOIN fetch_project_point_of_contact poc ON poc.rid = pf.rid
    LEFT JOIN fetch_project_technical_point_of_contact tpoc ON tpoc.rid = pf.rid
    LEFT JOIN fetch_all_prj_ids fp ON fp.rid = pf.rid
    LEFT JOIN ${schemaName}.case_projects cp ON cp.project_fiscal_rid = pf.rid
    ${subQueryJoinConditions}
    WHERE
    ${whereConditions}
    ${subQueryConditions}
    AND
    (pf.project_code ILIKE '${searchValue}' OR pf.project_name ILIKE '${searchValue}' OR pf.r_number ILIKE '${searchValue}')
    ${and}
    ${combinedFilterQuery}
    ${sortValue}
    ),

    total_projects AS (
    SELECT t.*, COUNT(t.*) OVER() AS total_result FROM fetch_projects t
    ),

    paginated_projects AS (
    SELECT * FROM total_projects ${pagination}
    )
    SELECT * FROM paginated_projects
    `;
  return query;
};

export const listAllCasesSummaryQuery = (
  searchValue: string,
  whereKey: string,
  joinedConditions: string,
  sortValue: string,
  pagination: string,
  accessibleIds: string[]
) => `
    WITH fetch_all_cases AS 
    (SELECT cs.case_rid AS rid, cs.r_number, cs.status_rid,s.status_name,
    cs.created_by, CONCAT(u.first_name, ' ', u.last_name) AS created_user_name,
    CASE WHEN uu.first_name IS NULL THEN cs.modified_by ELSE CONCAT(uu.first_name, ' ', uu.last_name) END AS modified_user_name,
    cs.created_datetime, cs.modified_datetime, cs.account_rid,cs.case_owner_rid,
    cs.modified_by,cs.filing_type_rid,cft.filing_type_name, cs.case_name,
    a.account_name,cs.fiscal_year,c.country_name,c.country_code,c.rid AS country_rid,
    CONCAT(co.first_name, ' ', co.last_name) AS case_owner_name,
    case_total_projects, case_total_project_cost, case_total_rd_cost, case_total_qre_cost,case_total_qualified_projects,
    submitted_datetime, approved_datetime,COUNT(*) OVER() AS total_records,a.r_number as account_r_number,a.status_rid as account_status_rid,
    COALESCE( acc_curr.currency_code, usd_curr.currency_code) as currency_code,
      COALESCE( acc_curr.currency_symbol, usd_curr.currency_symbol) as currency_symbol,accountStatus.status_name as account_status_name,
      CONCAT(a.account_name, '-', c.country_name, '-',cs.fiscal_year,'-',cs.case_name) AS case_full_name
    FROM
    ${MAIN_SCHEMA_NAME}.case_summary cs
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_filing_type cft ON cft.rid = cs.filing_type_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_status s ON s.rid = cs.status_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user u ON u.rid = cs.created_by
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user uu ON uu.rid = cs.modified_by
    LEFT JOIN ${MAIN_SCHEMA_NAME}.account a ON a.rid = cs.account_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON a.country_rid = c.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user co ON co.rid = cs.case_owner_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.currency acc_curr ON acc_curr.rid = a.currency_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.currency usd_curr ON usd_curr.currency_code = 'USD'
    LEFT JOIN ${MAIN_SCHEMA_NAME}.status accountStatus ON accountStatus.rid = a.status_rid
    WHERE
    (cs.r_number ILIKE '${searchValue}' OR CONCAT(a.account_name, '-', c.country_name, '-',cs.fiscal_year,'-',cs.case_name) ILIKE '${searchValue}')
    ${joinedConditions}
    ),
    paginated_data AS (
    SELECT * FROM fetch_all_cases c ${sortValue} ${pagination}
    )
    SELECT 
        array_agg(jsonb_build_object(
            'rid', c.rid,
            'r_number', c.r_number,
            'status_rid', c.status_rid,
            'status_name', c.status_name,
            'created_by', c.created_by,
            'modified_by', c.modified_by,
            'created_datetime', c.created_datetime,
            'modified_datetime', c.modified_datetime,
            'account_rid', c.account_rid,
            'account_name', c.account_name,
            'account_status_rid', c.account_status_rid,
            'fiscal_year', c.fiscal_year,
            'filing_type_rid', c.filing_type_rid,
            'filing_type_name', c.filing_type_name,
            'case_name', c.case_name,
            'country_name', c.country_name,
            'country_rid', c.country_rid,
            'country_code', c.country_code,
            'currency_code', c.currency_code,
            'currency_symbol', c.currency_symbol,
            'account_status_name', c.account_status_name,
            'case_owner_name', c.case_owner_name,
            'case_owner_rid', c.case_owner_rid,
            'created_user_name', c.created_user_name,
            'modified_user_name', c.modified_user_name,
            'case_total_projects', c.case_total_projects,
            'case_total_project_cost', c.case_total_project_cost,
            'case_total_rd_cost', c.case_total_rd_cost,
            'case_total_qre_cost', c.case_total_qre_cost,
            'submitted_datetime', c.submitted_datetime,
            'approved_datetime', c.approved_datetime,
            'total_records', c.total_records,
            'account_r_number', c.account_r_number,
            'case_total_qualified_projects', c.case_total_qualified_projects,
            'case_full_name', c.case_full_name
           
        )) AS cases_summary

        FROM
        paginated_data c`;

export const listAllCheckList = (
  searchValue: string,
  whereKey: string,
  joinedConditions: string,
  sortValue: string,
  pagination: string
) =>  `
    WITH fetch_case_checklist AS (
        SELECT
            ct.rid, ct.r_number,
            ct.status_rid,s.status_name,
            ct.created_by, ct.modified_by,
            ct.created_datetime, ct.modified_datetime,
            COUNT(ct.rid) OVER() AS total_records,
            ct.checklist_name,
            ct.checklist_description,
            uc.first_name || ' ' || uc.last_name AS created_user_name,
            um.first_name || ' ' || um.last_name AS modified_user_name

            FROM
            ${MAIN_SCHEMA_NAME}.checklist_template ct
            LEFT JOIN ${MAIN_SCHEMA_NAME}.status s ON s.rid = ct.status_rid
            LEFT JOIN ${MAIN_SCHEMA_NAME}.user uc ON uc.rid = ct.created_by
            LEFT JOIN ${MAIN_SCHEMA_NAME}.user um ON um.rid = ct.modified_by
              WHERE
    (ct.r_number ILIKE '${searchValue}' OR ct.checklist_name ILIKE '${searchValue}')
    ${joinedConditions}
    ),
    paginated_datas AS (
    SELECT * FROM fetch_case_checklist ${sortValue} ${pagination}
    
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
        'checklist_description', i.checklist_description,
        'checklist_name', i.checklist_name,
        'total_records', i.total_records,
        'created_user_name', i.created_user_name,
        'modified_user_name', i.modified_user_name
        ) ) AS admin_checklists

        FROM
        paginated_datas i
    `;

export const fetchAdminTemplates = (page : number, limit : number, sort : string, sortBy : string, filter : FilterType, search : string, isExport : boolean, isGraphql : boolean, templateRid : string | null) => {
  let pagination : string = ``
  if(isExport) pagination = ` `
  else {
  let offset = (page - 1) * limit;
  pagination = `LIMIT ${limit} OFFSET ${offset}`
  }
  let searchValue : string = ``
  let finalSortOrder : string = ``
  let andConditions : string = ``
  let queryContainer : string[] = []
  let finalContainer : string = ``
  let graphqlConditions : string = ``

  if(search) searchValue = `%${search}%`
  else searchValue = `%%`

  if(isGraphql) {
    graphqlConditions = ` AND t.rid = '${templateRid}'`
  } else {
    graphqlConditions = ` `
  }

  if(Object.keys(validColumnsForSortFilters).includes(sort)) finalSortOrder = `ORDER BY ${validColumnsForSortFilters[sort]} ${sortBy}`
  else finalSortOrder = `ORDER BY t.r_number ASC`

  if(Object.keys(filter).length > 0) {
    let validKeyColumns : string;
    for(let [key, conditions] of Object.entries(filter)) {
      if(Object.keys(validColumnsForFilters).includes(key)) {
        validKeyColumns = validColumnsForFilters[key]!
        andConditions = ` AND `
        for(let [cond, value] of Object.entries(conditions)) {
          switch(validFilterColumnTypes[key]) {
            case "string" : {
              switch(cond) {
                case "equals" : {
                  queryContainer.push(`LOWER(${validKeyColumns}) = '${value.toLowerCase()}'`)
                  break;
                }
                case "not_equals" : {
                  queryContainer.push(`LOWER(${validKeyColumns}) != '${value.toLowerCase()}'`)
                  break;
                }
                case "contains" : {
                  queryContainer.push(`${validKeyColumns} ILIKE '%${value}%'`)
                  break;
                }
                case "is_empty" : {
                  queryContainer.push(`${validKeyColumns} IS NULL`)
                  break;
                }
                case "in" : {
                  queryContainer.push(`${validKeyColumns} IN ${value.map((d : any) => `'${d}'`).join(',')}`)
                  break;
                }
                default : {
                  break;
                }
              }
              break;
            }
            case "number" : {
              switch (cond) {
                case "equals" : {
                  queryContainer.push(`${validKeyColumns} = ${value}`)
                  break;
                }
                case "not_equals" : {
                  queryContainer.push(`${validKeyColumns} != ${value}`)
                  break;
                }
                case "greater_than" : {
                  queryContainer.push(`${validKeyColumns} > ${value}`)
                  break;
                }
                case "less_than" : {
                  queryContainer.push(`${validKeyColumns} < ${value}`)
                  break;
                }
                case "is_empty" : {
                  queryContainer.push(`${validKeyColumns} IS NULL`)
                  break;
                }
                case "between" : {
                  queryContainer.push(`${validKeyColumns} BETWEEN ${value.map((d : any) => d).join(' AND ')}`)
                  break;
                }
                default : {
                  break;
                }
              }
              break;
            }
            case "date" : {
              switch (cond) {
                case "equals" : {
                  queryContainer.push(`DATE(${validKeyColumns}) = '${value}'`)
                  break;
                }
                case "before" : {
                  queryContainer.push(`DATE(${validKeyColumns}) < '${value}'`)
                  break;
                }
                case "after" : {
                  queryContainer.push(`DATE(${validKeyColumns}) > '${value}'`)
                  break;
                }
                case "is_empty" : {
                  queryContainer.push(`DATE(${validKeyColumns}) IS NULL`)
                  break;
                }
                case "between" : {
                  queryContainer.push(`DATE(${validKeyColumns}) BETWEEN ${value.map((d: string) => `${d}`).join(' AND ')}`)
                  break;
                }
                default : {
                  break;
                }
              }
              break;
            }
            default : {
              break;
            }
          }
        }
      }
    }
  } else {
    queryContainer = []
    andConditions = ` `
  }
  if(queryContainer.length > 0) {
    finalContainer = queryContainer.join(' AND ');
  } else {
    finalContainer = ` `
  }

  let query = 
  `
  WITH fetch_template_data AS (
    SELECT t.rid, t.r_number, CONCAT(u.first_name,' ', u.last_name) AS created_by_name,
    CONCAT(uu.first_name,' ', uu.last_name) AS modified_by_name, 
    t.created_datetime, t.modified_datetime, t.task_name, t.sequence_no,
    t.effort_in_days, t.reminder_interval, t.effective_start_datetime,
    t.effective_end_datetime, r.role_name, t.case_team_member_role_rid,
    c.checklist_name, t.checklist_template_rid, p.priority_name, t.priority_rid,
    s.status_name, t.status_rid, m.milestone_name, t.milestone_template_rid,
    t.task_type_rid, tt.task_type_name, t.task_description
    FROM
    ${MAIN_SCHEMA_NAME}.task_template t
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_priority p ON p.rid = t.priority_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user u ON u.rid = t.created_by
    LEFT JOIN ${MAIN_SCHEMA_NAME}.user uu ON uu.rid = t.modified_by
    LEFT JOIN ${MAIN_SCHEMA_NAME}.checklist_template c ON c.rid = t.checklist_template_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.milestone_template m ON m.rid = t.milestone_template_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.status s ON s.rid = t.status_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.case_team_role r ON r.rid = t.case_team_member_role_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_type tt ON tt.rid = t.task_type_rid
    WHERE
    (t.task_name ILIKE '${searchValue}' OR t.r_number ILIKE '${searchValue}' OR 
    u.first_name ILIKE '${searchValue}' OR u.last_name ILIKE '${searchValue}' OR CONCAT(u.first_name,' ', u.last_name) ILIKE '${searchValue}' OR
    uu.first_name ILIKE '${searchValue}' OR uu.last_name ILIKE '${searchValue}' OR CONCAT(uu.first_name,' ', uu.last_name) ILIKE '${searchValue}' OR
    r.role_name ILIKE '${searchValue}' OR c.checklist_name ILIKE '${searchValue}' OR p.priority_name ILIKE '${searchValue}' OR
    s.status_name ILIKE '${searchValue}' OR m.milestone_name ILIKE '${searchValue}')
    ${graphqlConditions}
    ${andConditions}
    ${finalContainer}
    ${finalSortOrder}
  ),
  fetch_total_result AS (
  SELECT COUNT(*) OVER() AS total_result, * FROM fetch_template_data
  ),
  fetch_paginated_data AS (
  SELECT * FROM fetch_total_result ${pagination}
  )
  SELECT * FROM fetch_paginated_data`
  return query
}

export const fetchMilestoneTaskTemplate = (taskTypeRid : string, filingTypeRid : string) => {
  let query = 
  `
  WITH fetch_milestone_result AS (
  SELECT m.r_number, m.rid, m.created_by AS "milestone_created_by", m.modified_by AS "milestone_modified_by",
  m.created_datetime AS "milestone_created_datetime", m.modified_datetime AS "milestone_modified_datetime",
  m.milestone_name, m.milestone_description, m.status_rid AS "milestone_status_rid", m.case_filing_type_rid
  FROM
  ${MAIN_SCHEMA_NAME}.milestone_template m
  WHERE
  m.case_filing_type_rid = '${filingTypeRid}'
  ),
  fetch_task_data AS (
  SELECT 
  t.created_by AS "task_created_by", t.modified_by AS "task_modified_by", t.created_datetime AS "task_created_datetime",
  t.modified_datetime AS "task_modified_datetime", t.task_name, t.sequence_no, t.effort_in_days,
  t.reminder_interval, t.effective_start_datetime, t.effective_end_datetime, t.case_team_member_role_rid,
  t.checklist_template_rid, t.status_rid AS "task_status_rid", t.priority_rid, t.task_type_rid,
  t.milestone_template_rid, t.task_description
  FROM
  fetch_milestone_result m
  LEFT JOIN ${MAIN_SCHEMA_NAME}.task_template t ON t.milestone_template_rid = m.rid
  WHERE
  t.task_type_rid = '${taskTypeRid}'
  ),
  aggregate_milestone AS (
  SELECT array_agg(jsonb_build_object(
  'milestone_sequence_no', m.r_number,
  'milestone_rid', m.rid,
  'created_by', m.milestone_created_by,
  'modified_by', m.milestone_modified_by,
  'created_datetime', m.milestone_created_datetime,
  'modified_datetime', m.milestone_modified_datetime,
  'milestone_name', m.milestone_name,
  'milestone_description', m.milestone_description,
  'status_rid', m.milestone_status_rid,
  'case_filing_type_rid',m.case_filing_type_rid
  )ORDER BY m.r_number ASC ) AS milestone_data
   FROM
   fetch_milestone_result m
  ),
  aggregate_task_data AS (
  SELECT array_agg(jsonb_build_object(
    'created_by', t.task_created_by,
    'modified_by', t.task_modified_by,
    'created_datetime', t.task_created_datetime,
    'modified_datetime', t.task_modified_datetime,
    'task_name', t.task_name,
    'sequence_no', t.sequence_no,
    'effort_in_days', t.effort_in_days,
    'reminder_interval', t.reminder_interval,
    'effective_start_datetime', t.effective_start_datetime,
    'effective_end_datetime', t.effective_end_datetime,
    'case_team_member_role_rid', t.case_team_member_role_rid,
    'checklist_template_rid', t.checklist_template_rid,
    'status_rid', t.task_status_rid,
    'priority_rid', t.priority_rid,
    'task_type_rid', t.task_type_rid,
    'milestone_template_rid', t.milestone_template_rid,
    'task_description', t.task_description
  )ORDER BY t.task_created_datetime ASC ) AS task_data
  FROM fetch_task_data t
  )
  SELECT a.*, t.* 
  FROM
  aggregate_milestone a
  CROSS JOIN aggregate_task_data t
  `
  return query;
}

export const fetchCaseTemplateData = (schemaName : string, caseRid : string, accountRid : string) => {
  let query = 
  `
  WITH fetch_task AS (
  SELECT cm.rid, 
  array_agg(jsonb_build_object(
  'rid', t.rid,
  'task_name', t.task_name,
  'r_number', t.r_number,
  'created_by', t.created_by,
  'sequence_no', t.sequence_no,
  'effort_in_days', t.effort_in_days,
  'reminder_interval', t.reminder_interval,
  'effective_start_datetime', t.effective_start_datetime,
  'effective_end_datetime', t.effective_end_datetime,
  'case_team_member_role_rid', t.case_team_member_role_rid,
  'assigned_to', ct.user_rid,
  'status_rid', t.status_rid,
  'priority_rid', t.priority_rid,
  'task_type_rid', t.task_type_rid,
  'task_description', t.task_description,
  'milestone_template_rid', t.milestone_template_rid,
  'checklists_count', (SELECT COUNT(DISTINCT chi.rid) FROM ${schemaName}.case_task ct LEFT JOIN ${schemaName}.checklists ch ON ch.checklist_template_rid = ct.checklist_template_rid LEFT JOIN ${schemaName}.checklist_items chi ON chi.case_checklist_rid = ch.rid WHERE ct.milestone_template_rid = cm.rid AND ct.case_rid = '${caseRid}' AND ct.account_rid = '${accountRid}')
  )ORDER BY t.sequence_no ASC) AS tasks
  FROM 
  ${schemaName}.case_milestone cm
  LEFT JOIN ${schemaName}.case_task t ON t.milestone_template_rid = cm.rid
  LEFT JOIN ${schemaName}.case_team ct ON ct.role_rid = t.case_team_member_role_rid AND ct.case_rid = '${caseRid}' AND ct.account_rid = '${accountRid}'
  WHERE
  t.milestone_template_rid = cm.rid
  AND
  t.case_rid = '${caseRid}'
  AND
  t.account_rid = '${accountRid}'
  GROUP BY
  cm.rid
  )
  SELECT array_agg(jsonb_build_object(
  'rid', m.rid,
  'milestone_name', m.milestone_name,
  'task_count', (SELECT COUNT(DISTINCT ct.rid) FROM ${schemaName}.case_task ct LEFT JOIN ${schemaName}.case_milestone cm ON ct.milestone_template_rid = cm.rid where ct.milestone_template_rid = m.rid AND ct.account_rid = '${accountRid}' AND ct.case_rid = '${caseRid}'),
  'tasks', ft.tasks
  ))
FROM
${schemaName}.cases c
LEFT JOIN ${schemaName}.case_milestone m ON m.case_rid = c.rid
LEFT JOIN fetch_task ft ON ft.rid = m.rid
WHERE
c.rid = '${caseRid}'
AND
c.account_rid = '${accountRid}'
  `
return query;
}

