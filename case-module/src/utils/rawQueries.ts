
import { filterColumnsCaseTask, filterColumnsCaseTaskTypes, MAIN_SCHEMA_NAME, sortByColumnsCaseTask, validColumnsForFilters, validColumnsForSortFilters, validFilterColumnTypes } from "./constants";
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
    (cs.r_number ILIKE '${searchValue}' OR CONCAT(a.account_name, '-', c.country_code, '-',cs.fiscal_year,'-',cs.case_name) ILIKE '${searchValue}')
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

  export const listReviewProjectsInfo = (
  searchValue: string,
  caseRid: string,
  whereKey: string,
  joinedConditions: string,
  sortValue: string,
  pagination: string,
  schemaName: string,
  pointOfContactRoleid: string
) => `
    WITH fetch_all_cases AS 
    (select pf.rid,pf.project_rid,pf.account_rid,pf.r_number,pf.created_by,pf.modified_by,pf.created_datetime,pf.modified_datetime,
pf.project_code,pf.fiscal_year,pf.project_name,pf.project_type_rid,pf.project_classification_rid,pf.project_classification_other,
pf.project_group,pf.industry_rid,pf.industry_name,pf.status_rid,pf.total_fte_prj,pf.total_subcon_prj,pf.total_nonlabor_prj,
pf.total_effort_fte_prj,pf.total_effort_subcon_prj,
pf.total_effort_prj,
pf.total_cost_fte_prj,pf.total_cost_subcon_prj,pf.total_cost_nonlabor_prj,pf.total_cost_prj,
pf.total_resources_prj,
COUNT(pt.rid) AS total_tasks,
COUNT(ats.rid) AS total_technical_summaries,primary_contact.key_contact_name AS project_point_of_contact,
	primary_contact.key_contact_email as project_point_of_contact_email
from ${schemaName}.project_fiscal pf
LEFT JOIN ${schemaName}.project_task pt ON pt.project_fiscal_rid = pf.rid
LEFT JOIN ${schemaName}.ai_technical_summary ats ON ats.project_fiscal_rid = pf.rid
LEFT JOIN LATERAL (
  SELECT kcd.key_contact_name,
         kcd.key_contact_email
  FROM ${schemaName}.key_contact_details kcd
  WHERE 
        kcd.entity_rid = pf.rid
    AND kcd.is_primary_contact = true
    AND kcd.key_contact_role= '"${pointOfContactRoleid}"'
  LIMIT 1
) AS primary_contact ON true

    WHERE
    (pf.r_number ILIKE '${searchValue}' OR pf.project_code ILIKE '${searchValue}' OR pf.project_name ILIKE '${searchValue}'
    )
    
    AND pf.rid IN (
      SELECT project_fiscal_rid 
      FROM ${schemaName}.case_projects where case_rid = '${caseRid}'
    ) 
AND (
      pf.project_name IS NULL OR pf.project_name = ''
      OR pf.project_code IS NULL OR pf.project_code = ''
      OR pf.fiscal_year IS NULL
      OR pf.industry_rid IS NULL
      OR pf.total_cost_prj IS NULL
      OR pf.total_resources_prj IS NULL
      OR pf.total_effort_prj IS NULL
      OR pf.project_type_rid IS NULL
      OR pf.project_classification_rid IS NULL
      OR primary_contact.key_contact_name IS NULL OR primary_contact.key_contact_name = ''
      OR primary_contact.key_contact_email IS NULL OR primary_contact.key_contact_email = ''
      or pf.status_rid IS NULL 
      or pf.total_fte_prj IS NULL
      or pf.total_subcon_prj IS NULL
      or pf.total_nonlabor_prj IS NULL
      or pf.total_effort_fte_prj IS NULL
      or pf.total_effort_subcon_prj IS NULL
      or pf.total_cost_fte_prj IS NULL
      or pf.total_cost_subcon_prj IS NULL
      or pf.total_cost_nonlabor_prj IS NULL
    )
      GROUP BY pf.rid ,primary_contact.key_contact_name,primary_contact.key_contact_email
    ),
    paginated_data AS (
    SELECT * FROM fetch_all_cases c  where 1 = 1  ${joinedConditions} ${sortValue} ${pagination}
    )
    SELECT 
        array_agg(jsonb_build_object(
            'rid', c.rid,
            'project_code', c.project_code,
            'project_name', c.project_name,
            'r_number', c.r_number,
            'status_rid', c.status_rid,
            'created_by', c.created_by,
            'modified_by', c.modified_by,
            'created_datetime', c.created_datetime,
            'modified_datetime', c.modified_datetime,
            'account_rid', c.account_rid,
            'fiscal_year', c.fiscal_year,
            'project_type_rid', c.project_type_rid,
            'project_classification_rid', c.project_classification_rid,
            'project_group', c.project_group,
            'industry_rid', c.industry_rid,
            'total_fte_prj', c.total_fte_prj,
            'total_subcon_prj', c.total_subcon_prj,
            'total_nonlabor_prj', c.total_nonlabor_prj,
            'total_effort_fte_prj', c.total_effort_fte_prj,
            'total_effort_subcon_prj', c.total_effort_subcon_prj,
            'total_effort_prj', c.total_effort_prj,
            'total_cost_fte_prj', c.total_cost_fte_prj,
            'total_cost_subcon_prj', c.total_cost_subcon_prj,
            'total_cost_nonlabor_prj', c.total_cost_nonlabor_prj,
            'total_cost_prj', c.total_cost_prj,
            'total_resources_prj', c.total_resources_prj,
            'total_tasks', c.total_tasks,
            'total_technical_summaries', c.total_technical_summaries,
            'project_point_of_contact', c.project_point_of_contact,
            'project_point_of_contact_email', c.project_point_of_contact_email
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

export const listAllEmailTemplates = (
  searchValue: string,
  whereKey: string,
  joinedConditions: string,
  sortValue: string,
  pagination: string
) =>  `
    WITH fetch_email_templates AS (
        SELECT
            et.rid, et.r_number,
            et.status_rid,s.status_name,
            et.created_by, et.modified_by,
            et.created_datetime, et.modified_datetime,
            COUNT(et.rid) OVER() AS total_records,
            et.template_name,
            et.description,et.category_rid,etc.category_name,
            uc.first_name || ' ' || uc.last_name AS created_user_name,
            um.first_name || ' ' || um.last_name AS modified_user_name

            FROM
            ${MAIN_SCHEMA_NAME}.email_template et
            LEFT JOIN ${MAIN_SCHEMA_NAME}.email_template_category etc ON etc.rid = et.category_rid
            LEFT JOIN ${MAIN_SCHEMA_NAME}.status s ON s.rid = et.status_rid
            LEFT JOIN ${MAIN_SCHEMA_NAME}.user uc ON uc.rid = et.created_by
            LEFT JOIN ${MAIN_SCHEMA_NAME}.user um ON um.rid = et.modified_by
              WHERE
    (et.r_number ILIKE '${searchValue}' OR et.template_name ILIKE '${searchValue}')
    ${joinedConditions}
    ),
    paginated_datas AS (
    SELECT * FROM fetch_email_templates ${sortValue} ${pagination}
    
    )
        SELECT 
        array_agg(jsonb_build_object(
        'rid', i.rid,
        'r_number', i.r_number,
        'status_rid', i.status_rid,
        'status_name', i.status_name,
        'created_by', i.created_by,
        'modified_by', i.modified_by,
        'created_datetime', i.created_datetime,
        'modified_datetime', i.modified_datetime,
        'description', i.description,
        'template_name', i.template_name,
        'total_records', i.total_records,
        'created_user_name', i.created_user_name,
        'modified_user_name', i.modified_user_name,
        'category_name', i.category_name,
        'category_rid',i.category_rid
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

  if(Object.keys(validColumnsForSortFilters).includes(sort)) finalSortOrder = `ORDER BY ${validColumnsForSortFilters[sort]} ${sortBy} NULLS LAST`
  else finalSortOrder = `ORDER BY t.r_number ASC NULLS LAST`

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
                  queryContainer.push(`${validKeyColumns} IN (${value.map((d : any) => `'${d}'`).join(',')})`)
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
                  break
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
                  queryContainer.push(`${validKeyColumns} BETWEEN ${value['from']} AND ${value['to']}`)
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
                  queryContainer.push(`DATE(${validKeyColumns}) BETWEEN '${value['from']}' AND '${value['to']}'`)
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
    t.effort_in_days, t.effective_start_datetime,
    t.effective_end_datetime, r.role_name, t.case_team_member_role_rid,
    c.checklist_name, t.checklist_template_rid, p.priority_name, t.priority_rid,
    s.status_name, t.status_rid, m.milestone_name, t.milestone_template_rid,
    t.task_type_rid, tt.task_type_name, t.task_description, wt.weightage_value, t.weightage_rid,
    t.task_category_rid, tc.category_name,
    array_agg(jsonb_build_object(
    'source_rid', w.source_rid,
    'source_name', t.task_name,
    'target_rid', w.target_rid,
    'target_name', ttt.task_name,
    'relationship_connector_rid', w.relationship_connector_rid,
    'relationship_type_name', wc.relationship_type
    )) AS workflow_connector
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
    LEFT JOIN ${MAIN_SCHEMA_NAME}.workflow_connector_mapping w ON w.source_rid = t.rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_template ttt ON ttt.rid = w.target_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.workflow_connector wc ON wc.rid = w.relationship_connector_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_weightage wt ON wt.rid = t.weightage_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.task_category tc ON tc.rid = t.task_category_rid
    WHERE
    (t.task_name ILIKE '${searchValue}' OR t.r_number ILIKE '${searchValue}' OR 
    u.first_name ILIKE '${searchValue}' OR u.last_name ILIKE '${searchValue}' OR CONCAT(u.first_name,' ', u.last_name) ILIKE '${searchValue}' OR
    uu.first_name ILIKE '${searchValue}' OR uu.last_name ILIKE '${searchValue}' OR CONCAT(uu.first_name,' ', uu.last_name) ILIKE '${searchValue}' OR
    r.role_name ILIKE '${searchValue}' OR c.checklist_name ILIKE '${searchValue}' OR p.priority_name ILIKE '${searchValue}' OR
    s.status_name ILIKE '${searchValue}' OR m.milestone_name ILIKE '${searchValue}')
    ${graphqlConditions}
    ${andConditions}
    ${finalContainer}
    GROUP BY
    t.rid, t.r_number, u.first_name, u.last_name,
    uu.first_name,uu.last_name, 
    t.created_datetime, t.modified_datetime, t.task_name, t.sequence_no,
    t.effort_in_days, t.effective_start_datetime,
    t.effective_end_datetime, r.role_name, t.case_team_member_role_rid,
    c.checklist_name, t.checklist_template_rid, p.priority_name, t.priority_rid,
    s.status_name, t.status_rid, m.milestone_name, t.milestone_template_rid,
    t.task_type_rid, tt.task_type_name, t.task_description,wt.weightage_value, t.weightage_rid,
    t.task_category_rid, tc.category_name
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

export const fetchMilestoneTaskTemplate = (taskTypeRid : string, filingTypeRid : string, statusId : string) => {
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
  t.rid AS task_rid, t.created_by AS "task_created_by", t.modified_by AS "task_modified_by", t.created_datetime AS "task_created_datetime",
  t.modified_datetime AS "task_modified_datetime", t.task_name, t.sequence_no, t.effort_in_days,
  t.effective_start_datetime, t.effective_end_datetime, t.case_team_member_role_rid,
  t.checklist_template_rid, t.status_rid AS "task_status_rid", t.priority_rid, t.task_type_rid,
  t.milestone_template_rid, t.task_description
  FROM
  fetch_milestone_result m
  LEFT JOIN ${MAIN_SCHEMA_NAME}.task_template t ON t.milestone_template_rid = m.rid
  WHERE
  t.task_type_rid = '${taskTypeRid}'
  AND
  t.status_rid = '${statusId}'
  ),
  fetch_workflow_connector_map AS (
  SELECT w.created_by, w.created_datetime, w.source_rid, w.target_rid, w.relationship_connector_rid
  FROM ${MAIN_SCHEMA_NAME}.workflow_connector_mapping w
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
    'task_rid', t.task_rid,
    'created_by', t.task_created_by,
    'modified_by', t.task_modified_by,
    'created_datetime', t.task_created_datetime,
    'modified_datetime', t.task_modified_datetime,
    'task_name', t.task_name,
    'sequence_no', t.sequence_no,
    'effort_in_days', t.effort_in_days,
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
  ),
  aggregate_workflow_connector AS (
  SELECT array_agg(jsonb_build_object(
    'created_by', w.created_by,
    'created_datetime', NOW(),
    'source_rid', w.source_rid,
    'target_rid', w.target_rid,
    'relationship_connector_rid', w.relationship_connector_rid
  )) AS workflow_data
  FROM
  fetch_workflow_connector_map w
  )

  SELECT a.*, t.*, w.*
  FROM
  aggregate_milestone a
  CROSS JOIN aggregate_task_data t
  CROSS JOIN aggregate_workflow_connector w
  `
  return query;
}

export const fetchCaseTemplateData = (schemaName : string, caseRid : string, accountRid : string) => {
  let query = 
  `
  WITH fetch_task AS (
  SELECT cm.rid, cm.account_rid, cm.case_rid,
  array_agg(jsonb_build_object(
  'rid', t.rid,
  'task_name', t.task_name,
  'r_number', t.r_number,
  'created_by', t.created_by,
  'sequence_no', t.sequence_no,
  'effort_in_days', t.effort_in_days,
  'effective_start_datetime', t.effective_start_datetime,
  'effective_end_datetime', t.effective_end_datetime,
  'case_team_member_role_rid', t.case_team_member_role_rid,
  'assigned_to', ct.user_rid,
  'status_rid', t.status_rid,
  'priority_rid', t.priority_rid,
  'task_type_rid', t.task_type_rid,
  'task_description', t.task_description,
  'milestone_template_rid', t.milestone_template_rid,
  'checklists_count', (SELECT COUNT(DISTINCT chi.rid) FROM ${schemaName}.case_task ct LEFT JOIN ${schemaName}.checklists ch ON ch.checklist_template_rid = ct.checklist_template_rid LEFT JOIN ${schemaName}.checklist_items chi ON chi.checklist_rid = ch.rid WHERE ct.milestone_template_rid = cm.rid AND ct.case_rid = '${caseRid}' AND ct.account_rid = '${accountRid}' AND ct.rid = t.rid AND (ct.checklist_template_rid IS NOT NULL AND ct.checklist_template_rid != '')),
  'comments_count', (SELECT COUNT(DISTINCT tc.rid) from ${schemaName}.task_comments tc WHERE tc.task_rid = t.rid),
  'task_status_rid', t.task_status_rid
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
  cm.rid, cm.account_rid, cm.case_rid
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
LEFT JOIN fetch_task ft ON ft.rid = m.rid AND ft.case_rid = '${caseRid}' AND ft.account_rid = '${accountRid}'
WHERE
c.rid = '${caseRid}'
AND
c.account_rid = '${accountRid}'
  `
return query;
}

  export const fetchCaseDetails = (schemaName : string, rid : string) => {
    return `
    SELECT 
    c.rid, c.checklist_description,
    c.created_by, c.modified_by, c.account_rid, 
    c.created_datetime, c.modified_datetime,
    c.checklist_name, c.fiscal_year, e.name AS attached_to, 
    c.attachment_level, c.r_number, c.attach_to, c.status_rid
    FROM
    ${schemaName}.checklists c
    LEFT JOIN LATERAL (
    SELECT ad.account_rid, ad.account_name AS name 
    FROM ${schemaName}.account_details ad 
    WHERE
    LOWER(c.attachment_level) = 'account'
    AND
    ad.account_rid = c.attach_to

    UNION ALL

    SELECT pf.rid, pf.project_code AS name 
    FROM
    ${schemaName}.project_fiscal pf
    WHERE
    LOWER(c.attachment_level) = 'project'
    AND
    pf.rid = c.attach_to

    UNION ALL

    SELECT cd.rid, cd.case_name AS name 
    FROM
    ${schemaName}.cases cd
    WHERE
    LOWER(c.attachment_level) = 'case'
    AND
    cd.rid = c.attach_to

    UNION ALL

    SELECT r.rid, r.resource_code AS name
    FROM
    ${schemaName}.resources r
    WHERE
    LOWER(c.attachment_level) = 'resource'
    AND
    r.rid = c.attach_to
    
    UNION ALL

    SELECT rc.rid, rc.r_number AS name
    FROM
    ${schemaName}.resource_cost rc
    WHERE
    LOWER(c.attachment_level) = 'resource_cost'
    AND
    rc.rid = c.attach_to

    UNION ALL

    SELECT rs.rid, rs.r_number AS name
    FROM
    ${schemaName}.resource_skill rs
    WHERE
    LOWER(c.attachment_level) = 'resource_skill'
    AND
    rs.rid = c.attach_to
    UNION ALL

    SELECT pt.rid, pt.r_number AS name
    FROM
    ${schemaName}.project_task pt
    WHERE
    LOWER(c.attachment_level) = 'project_task'
    AND
    pt.rid = c.attach_to

    UNION ALL

    SELECT pr.rid, pr.r_number AS name
    FROM
    ${schemaName}.project_resource pr
    WHERE
    LOWER(c.attachment_level) = 'project_resource'
    AND
    pr.rid = c.attach_to
    ) e ON true
    WHERE
    c.rid = '${rid}'
    `
  }

  export const fetchCaseSpecificTaskQuery = (page : number, limit : number, search : string, sort : string, sortBy : string, filter : FilterType, doSorting : boolean, caseRid : string, accountRid : string, schemaName : string, isExport : boolean) => {
    let searchValue : string = ``
    let sortValue : string = ``
    let filterQueryArray : string[] = []
    let combinedQueryString : string = ``
    let andOperator : string = ``
    let validKey : string = ``
    let pagination : string = ``

    if(!isExport) {
      let offset = (page - 1) * limit;
      pagination = `LIMIT ${limit} OFFSET ${offset}`
    } else {
      pagination = ` `
    }

    if(search) searchValue = `%${search}%`
    else searchValue = `%%`

    if(doSorting) {
      if(sort.includes(sortByColumnsCaseTask[sort])) {
        sortValue = `ORDER BY ct.${sortByColumnsCaseTask[sort]} ${sortBy}`
      } else {
        sortValue = `ORDER BY ct.task_name ASC`
      }
    } else {
      sortValue = ` `
    }

    if(Object.keys(filter).length > 0) {
      andOperator = ` AND `
      for(let [key, conditions] of Object.entries(filter)) {
        if(Object.keys(filterColumnsCaseTask).includes(key)) {
          validKey = key;
          for(let [cond, values] of Object.entries(conditions)) {
            switch (filterColumnsCaseTaskTypes[validKey]) {
              case "string" : {
                if(cond === 'equals') 
                  filterQueryArray.push(`LOWER(ct.${validKey}) = '${values.toLowerCase()}'`)
                if(cond === 'not_equals')
                  filterQueryArray.push(`LOWER(ct.${validKey}) != '${values.toLowerCase()}'`)
                if(cond === 'contains')
                  filterQueryArray.push(`ct.${validKey} ILIKE '%${values}%'`)
                if(cond === 'is_empty') 
                  filterQueryArray.push(`ct.${validKey} IS NULL`)
                if(cond === 'in')
                  filterQueryArray.push(`ct.${validKey} IN (${values.map((d : any) => `'${d}'`).join(',')})`)
                break;
              }
              case "date" : {
                if(cond === 'equals') 
                  filterQueryArray.push(`ct.${validKey} = '${values}'`)
                if(cond === 'before')
                  filterQueryArray.push(`ct.${validKey} < '${values}'`)
                if(cond === 'after')
                  filterQueryArray.push(`ct.${validKey} > '${values}'`)
                if(cond === 'is_empty')
                  filterQueryArray.push(`ct.${validKey} IS NULL`)
                if(cond === 'between')
                  filterQueryArray.push(`ct.${validKey} BETWEEN ${values.map((d : any) => `'${d}'`).join(' AND ')}`)
                break;
              }
              default : 
              break;
            }
          }
        }
      }
    } else {
      filterQueryArray = []
      andOperator = ` `
    }

    if(filterQueryArray.length > 0) {
      combinedQueryString = filterQueryArray.join(' AND ')
    } else {
      combinedQueryString = ` `
    }
    let query =
    `
    WITH fetch_case_task AS (
    SELECT 
    ct.rid, ct.task_name, ct.assigned_to, 
    ct.effective_start_datetime, 
    ct.effective_end_datetime, ct.task_status_rid
    FROM
    ${schemaName}.case_task ct
    WHERE
    ct.case_rid = '${caseRid}'
    AND
    ct.account_rid = '${accountRid}'
    AND
    ct.task_name ILIKE '${searchValue}'
    ${andOperator}
    ${combinedQueryString}
    ${sortValue}),
    count_results AS (
    SELECT f.*, COUNT(f.rid) OVER() AS total_result FROM fetch_case_task f
    )

    SELECT c.* FROM count_results c ${pagination}
    `
    return query;
  }

  export const fetchTaskComments = (page : number, limit : number, taskRid : string, accountRid : string, caseRid : string, schemaName : string) => {
    let offset = (page - 1) * limit;
    let pagination = `LIMIT ${limit} OFFSET ${offset}`
    let query = 
    `
    WITH calculate_total_result AS(
    SELECT tc.rid, COUNT(tc.*) OVER() AS total_result
    FROM ${schemaName}.task_comments tc
    WHERE
    tc.account_rid = '${accountRid}'
    AND
    tc.case_rid = '${caseRid}'
    AND
    tc.task_rid = '${taskRid}'
    ), 
    
    fetch_task_comments AS (
    SELECT tc.rid, tc.comments, tc.account_rid, tc.case_rid, tc.task_rid, c.total_result, tc.created_by, tc.created_datetime
    FROM ${schemaName}.task_comments tc
    LEFT JOIN calculate_total_result c ON c.rid = tc.rid
    WHERE
    tc.account_rid = '${accountRid}'
    AND
    tc.case_rid = '${caseRid}'
    AND
    tc.task_rid = '${taskRid}'
    ORDER BY tc.created_datetime ASC 
    ${pagination} 
    ),

    fetch_comments_attachments AS (
    SELECT
    ca.comments_rid, 
    array_agg(jsonb_build_object(
    'rid', ca.rid,
    'comments_rid', ca.comments_rid,
    'browse_file', ca.browse_file,
    'size', ca.size,
    'format', ca.format,
    'document_name', ca.document_name,
    'is_file_deleted', ca.is_file_deleted
    )) AS comments_attachments
    FROM
    ${schemaName}.comments_attachments ca
    LEFT JOIN fetch_task_comments ftc ON ftc.rid = ca.comments_rid
    WHERE
    ca.comments_rid = ftc.rid
    AND
    ca.is_file_deleted = false
    GROUP BY ca.comments_rid
    )

    SELECT 
    array_agg(jsonb_build_object(
    'rid', tc.rid,
    'comments', tc.comments,
    'account_rid', tc.account_rid,
    'case_rid', tc.case_rid,
    'task_rid', tc.task_rid,
    'total_result', tc.total_result,
    'created_by', tc.created_by,
    'created_datetime', tc.created_datetime,
    'comments_attachments', ca.comments_attachments
    )) AS comments
    FROM
    fetch_task_comments tc
    LEFT JOIN fetch_comments_attachments ca ON ca.comments_rid = tc.rid
    `
    return query;
  }

  export const fetchTaskActivities = (page : number, limit : number ,schemaName : string, caseRid : string, taskRid : string) => {
    const offset = (page - 1) * limit;
    let pagination = `LIMIT ${limit} OFFSET ${offset}`

    let query = 
    `
    WITH fetch_data AS (SELECT 
    rid, r_number, created_by, case_rid, created_datetime, attribute_name, old_value, new_value, task_rid
    FROM ${schemaName}.case_history
    WHERE
    task_rid = '${taskRid}'
    AND
    case_rid = '${caseRid}'
    ORDER BY created_datetime DESC),
    calculate_total AS (
    SELECT f.*, COUNT(f.rid) OVER() AS total_result FROM fetch_data f
    )
    SELECT * FROM calculate_total ${pagination}
    
    `
    return query;
  }

  export const taskCardDetails = (schemaName : string, taskRid : string, accountRid : string, caseRid : string, checklistItemsStatusRid : string) => {
    let query =
    `
    WITH fetch_checklists AS (
    SELECT c.rid, c.account_rid, c.checklist_name, c.checklist_description, ct.rid AS task_rid
    FROM 
    ${schemaName}.case_task ct
    LEFT JOIN ${schemaName}.checklists c ON c.attach_to = ct.rid
    WHERE
    ct.rid = '${taskRid}'
    AND
    ct.account_rid = '${accountRid}'
    AND
    ct.case_rid = '${caseRid}' 
    ORDER BY c.created_datetime ASC
    ),

    fetch_task_tags AS (
    SELECT t.rid,
    array_agg(jsonb_build_object(
    'tag_rid', tt.tag_rid
    )) AS tags
    FROM
    ${schemaName}.case_task t
    LEFT JOIN ${schemaName}.task_tags tt ON tt.task_rid = t.rid AND t.account_rid = tt.account_rid AND tt.case_rid = t.case_rid
    WHERE
    t.rid = '${taskRid}'
    AND
    t.account_rid = '${accountRid}'
    AND
    t.case_rid = '${caseRid}' 
    GROUP BY t.rid
    ),

    fetch_checlist_items AS (
    SELECT
    f.rid, COUNT(ch.rid) AS checklist_items_count,
    (SELECT COUNT(*) FROM ${schemaName}.checklist_items cit WHERE cit.checklist_rid = f.rid AND cit.status_rid = '${checklistItemsStatusRid}') AS completed_items_count,
    array_agg(jsonb_build_object(
    'rid', ch.rid,
    'checklist_item_name', ch.checklist_item_name,
    'checklist_item_description', ch.checklist_item_description,
    'status_rid', ch.status_rid
    )ORDER BY ch.created_datetime ASC) AS check_list_items
    FROM
    fetch_checklists f
    LEFT JOIN ${schemaName}.checklist_items ch ON ch.checklist_rid = f.rid
    WHERE
    ch.checklist_rid = f.rid 
    GROUP BY f.rid
    ),

    aggregate_workflow_connector AS (
    SELECT t.rid, t.account_rid, t.case_rid,
    array_agg(jsonb_build_object(
    'rid', w.rid,
    'source_rid', w.source_rid,
    'target_rid', w.target_rid,
    'relationship_connector_rid', w.relationship_connector_rid
    )) AS workflow_connector
    FROM
    ${schemaName}.case_task t
    LEFT JOIN ${schemaName}.case_task_dependency_mapping w ON w.source_rid = t.rid AND w.account_rid = t.account_rid AND w.case_rid = t.case_rid
    WHERE
    t.rid = '${taskRid}'
    AND
    t.account_rid = '${accountRid}'
    AND
    t.case_rid = '${caseRid}'
    GROUP BY t.rid, t.account_rid, t.case_rid
    ),

    aggregate_checklists AS (
    SELECT 
    c.task_rid,
    jsonb_build_object (
    'rid', c.rid,
    'checklist_name', c.checklist_name,
    'checklist_description', c.checklist_description,
    'task_rid', c.task_rid,
    'checklist_items_count', fci.checklist_items_count,
    'completed_items_count', fci.completed_items_count,
    'checklist_items', fci.check_list_items
    ) AS checklists
    FROM
    fetch_checklists c
    LEFT JOIN fetch_checlist_items fci ON fci.rid = c.rid
    )

    SELECT 
    jsonb_build_object(
    'rid', ct.rid,
    'r_number', ct.r_number,
    'created_by', ct.created_by,
    'modified_by', ct.modified_by,
    'created_datetime', ct.created_datetime,
    'task_name', ct.task_name,
    'effective_start_datetime', ct.effective_start_datetime,
    'effective_end_datetime', ct.effective_end_datetime,
    'assigned_to', ct.assigned_to,
    'priority_rid', ct.priority_rid,
    'task_description', ct.task_description,
    'task_status_rid', ct.task_status_rid,
    'checklists', fci.checklists,
    'tags', ftt.tags,
    'workflow_connector', w.workflow_connector,
    'case_team_member_role_rid', ct.case_team_member_role_rid,
    'weightage_rid', ct.weightage_rid,
    'task_category_rid', ct.task_category_rid
    ) AS task_details
    FROM
    ${schemaName}.case_task ct
    LEFT JOIN aggregate_checklists fci ON fci.task_rid = ct.rid
    LEFT JOIN fetch_task_tags ftt ON ftt.rid = ct.rid
    LEFT JOIN aggregate_workflow_connector w ON w.rid = ct.rid
    WHERE
    ct.rid = '${taskRid}'
    AND
    ct.account_rid = '${accountRid}'
    AND
    ct.case_rid = '${caseRid}'
    `
    return query;
  }

  export const taskCardDetailsActivityTask = (schemaName : string, taskRid : string, accountRid : string,checklistItemsStatusRid : string) => {
  let query =
  `
  WITH fetch_checklists AS (
  SELECT c.rid, c.account_rid, c.checklist_name, c.checklist_description, ct.rid AS task_rid
  FROM 
  ${schemaName}.activities ct
  LEFT JOIN ${schemaName}.checklists c ON c.attach_to = ct.rid
  WHERE
  ct.rid = '${taskRid}'
  AND
  ct.account_rid = '${accountRid}'
  and c.attachment_level = 'task'
  ORDER BY c.created_datetime ASC
  ),

  fetch_task_tags AS (
  SELECT t.rid,
  array_agg(jsonb_build_object(
  'tag_rid', tt.tag_rid
  )) AS tags
  FROM
  ${schemaName}.activities t
  LEFT JOIN ${schemaName}.task_tags tt ON tt.task_rid = t.rid AND t.account_rid = tt.account_rid 
  WHERE
  t.rid = '${taskRid}'
  AND
  t.account_rid = '${accountRid}'
  GROUP BY t.rid
  ),

  fetch_checlist_items AS (
  SELECT
  f.rid, COUNT(ch.rid) AS checklist_items_count,
  (SELECT COUNT(*) FROM ${schemaName}.checklist_items cit WHERE cit.checklist_rid = f.rid AND cit.status_rid = '${checklistItemsStatusRid}') AS completed_items_count,
  array_agg(jsonb_build_object(
  'rid', ch.rid,
  'checklist_item_name', ch.checklist_item_name,
  'checklist_item_description', ch.checklist_item_description,
  'status_rid', ch.status_rid
  )ORDER BY ch.created_datetime ASC) AS check_list_items
  FROM
  fetch_checklists f
  LEFT JOIN ${schemaName}.checklist_items ch ON ch.checklist_rid = f.rid
  WHERE
  ch.checklist_rid = f.rid 
  and ch.account_rid = '${accountRid}'
  GROUP BY f.rid
  ),

  aggregate_checklists AS (
  SELECT 
  c.task_rid,
  jsonb_build_object (
  'rid', c.rid,
  'checklist_name', c.checklist_name,
  'checklist_description', c.checklist_description,
  'task_rid', c.task_rid,
  'checklist_items_count', fci.checklist_items_count,
  'completed_items_count', fci.completed_items_count,
  'checklist_items', fci.check_list_items
  ) AS checklists
  FROM
  fetch_checklists c
  LEFT JOIN fetch_checlist_items fci ON fci.rid = c.rid
  )

  SELECT 
  jsonb_build_object(
  'rid', ct.rid,
  'r_number', ct.r_number,
  'created_by', ct.created_by,
  'modified_by', ct.modified_by,
  'created_datetime', ct.created_datetime,
  'task_name', ct.task_name,
  'effective_start_datetime', ct.effective_start_datetime,
  'effective_end_datetime', ct.effective_end_datetime,
  'assigned_to', ct.assigned_to,
  'priority_rid', ct.priority_rid,
  'description', ct.description,
  'status_rid', ct.status_rid,
  'checklists', fci.checklists,
  'tags', ftt.tags
  ) AS task_details
  FROM
  ${schemaName}.activities ct
  LEFT JOIN aggregate_checklists fci ON fci.task_rid = ct.rid
  LEFT JOIN fetch_task_tags ftt ON ftt.rid = ct.rid
  WHERE
  ct.rid = '${taskRid}'
  AND
  ct.account_rid = '${accountRid}'
  `
  return query;
  }
  export const listAllTaskStatus = () => {
    return `SELECT rid, task_status_name FROM ${MAIN_SCHEMA_NAME}.case_task_status ORDER BY task_status_level ASC`
  }

  export const getCurrencyDetailsQuery = (
    schemaName: string,
    currencyIds: string[]
  ) => {
    const query = `
      SELECT rid, currency_name, currency_symbol, currency_code
      FROM ${schemaName}.currency
      WHERE rid IN (:ids)
    `;
  
    const replacements = {
      ids: currencyIds,
    };
  
    return { query, replacements };
  };
  export const fetchEmailActivityDetails = (schemaName : string, rid : string) => {
    return `
    SELECT 
    a.rid, a.subject, a.body_html,
    a.created_by, a.modified_by, a.account_rid, 
    a.created_datetime, a.modified_datetime,
    a.fiscal_year, e.name AS attached_to, 
    a.attachment_level, a.r_number, a.attach_to, a.status_rid,
    a.to_email,a.cc_email,a.sender_email
    FROM
    ${schemaName}.activities a
    LEFT JOIN LATERAL (
    SELECT ad.account_rid, ad.account_name AS name 
    FROM ${schemaName}.account_details ad 
    WHERE
    LOWER(a.attachment_level) = 'account'
    AND
    ad.account_rid = a.attach_to

    UNION ALL

    SELECT pf.rid, pf.project_code AS name 
    FROM
    ${schemaName}.project_fiscal pf
    WHERE
    LOWER(a.attachment_level) = 'project'
    AND
    pf.rid = a.attach_to

    UNION ALL

    SELECT cd.rid, cd.case_name AS name 
    FROM
    ${schemaName}.cases cd
    WHERE
    LOWER(a.attachment_level) = 'case'
    AND
    cd.rid = a.attach_to

    UNION ALL

    SELECT r.rid, r.resource_code AS name
    FROM
    ${schemaName}.resources r
    WHERE
    LOWER(a.attachment_level) = 'resource'
    AND
    r.rid = a.attach_to
    
    UNION ALL

    SELECT rc.rid, rc.r_number AS name
    FROM
    ${schemaName}.resource_cost rc
    WHERE
    LOWER(a.attachment_level) = 'resource_cost'
    AND
    rc.rid = a.attach_to

    UNION ALL

    SELECT rs.rid, rs.r_number AS name
    FROM
    ${schemaName}.resource_skill rs
    WHERE
    LOWER(a.attachment_level) = 'resource_skill'
    AND
    rs.rid = a.attach_to
    UNION ALL

    SELECT pt.rid, pt.r_number AS name
    FROM
    ${schemaName}.project_task pt
    WHERE
    LOWER(a.attachment_level) = 'project_task'
    AND
    pt.rid = a.attach_to

    UNION ALL

    SELECT pr.rid, pr.r_number AS name
    FROM
    ${schemaName}.project_resource pr
    WHERE
    LOWER(a.attachment_level) = 'project_resource'
    AND
    pr.rid = a.attach_to
    ) e ON true
    WHERE
    a.rid = '${rid}'
    `
  }

   export const fetchActivityDetails = (schemaName : string, rid : string,selectColumns: string[]) => {
    return `
    SELECT 
    a.rid, ${  selectColumns  }
    FROM
    ${schemaName}.activities a
    LEFT JOIN LATERAL (
    SELECT ad.account_rid, ad.account_name AS name 
    FROM ${schemaName}.account_details ad 
    WHERE
    LOWER(a.attachment_level) = 'account'
    AND
    ad.account_rid = a.attach_to

    UNION ALL

    SELECT pf.rid, pf.project_code AS name 
    FROM
    ${schemaName}.project_fiscal pf
    WHERE
    LOWER(a.attachment_level) = 'project'
    AND
    pf.rid = a.attach_to

    UNION ALL

    SELECT cd.rid, cd.case_name AS name 
    FROM
    ${schemaName}.cases cd
    WHERE
    LOWER(a.attachment_level) = 'case'
    AND
    cd.rid = a.attach_to

    UNION ALL

    SELECT r.rid, r.resource_code AS name
    FROM
    ${schemaName}.resources r
    WHERE
    LOWER(a.attachment_level) = 'resource'
    AND
    r.rid = a.attach_to
    
    UNION ALL

    SELECT rc.rid, rc.r_number AS name
    FROM
    ${schemaName}.resource_cost rc
    WHERE
    LOWER(a.attachment_level) = 'resource_cost'
    AND
    rc.rid = a.attach_to

    UNION ALL

    SELECT rs.rid, rs.r_number AS name
    FROM
    ${schemaName}.resource_skill rs
    WHERE
    LOWER(a.attachment_level) = 'resource_skill'
    AND
    rs.rid = a.attach_to
    UNION ALL

    SELECT pt.rid, pt.r_number AS name
    FROM
    ${schemaName}.project_task pt
    WHERE
    LOWER(a.attachment_level) = 'project_task'
    AND
    pt.rid = a.attach_to

    UNION ALL

    SELECT pr.rid, pr.r_number AS name
    FROM
    ${schemaName}.project_resource pr
    WHERE
    LOWER(a.attachment_level) = 'project_resource'
    AND
    pr.rid = a.attach_to
    ) e ON true
    WHERE
    a.rid = '${rid}'
    `
  }

  export const fetchTaskWeightage = () => {
    return `SELECT rid, weightage_value FROM ${MAIN_SCHEMA_NAME}.task_weightage ORDER BY weightage_value ASC`
  }

 
