
import { filterColumnsCaseTask, filterColumnsCaseTaskTypes, MAIN_SCHEMA_NAME, sortByColumnsCaseTask, validColumnsForFilters, validColumnsForSortFilters, validFilterColumnTypes } from "./constants";
import {
  FilterType,
  validColumns,
  columnType,
  validColumnsForSorting,
} from "./types";

export const fetchCasesHeadersDatas = (schemaName: string, caseRid: string, accountRid: string, activeStatusRid: string) => {
  let query = `
    WITH fetch_fiscal_year AS (
    SELECT project_fiscal_rid FROM ${schemaName}.case_projects where case_rid = '${caseRid}'
    ),
    fetch_project_count_cost AS (
    SELECT NULLIF(COUNT(pf.rid), 0) AS total_projects, NULLIF(SUM(pf.total_cost_prj), 0.00) AS total_project_cost, 
    COUNT(CASE WHEN pf.is_qualified = true THEN pf.rid END) AS case_total_qualified_projects,
    COALESCE(SUM(CASE WHEN pf.is_qualified THEN pf.total_cost_prj END), 0) AS case_total_qualified_project_cost
    FROM ${schemaName}.project_fiscal pf
    CROSS JOIN fetch_fiscal_year f
    WHERE
    rid = f.project_fiscal_rid
    )

    SELECT c.rid, c.account_rid, ad.account_name, c.case_name, c.filing_type_rid,
    c.case_owner_rid, c.fiscal_year, c.status_rid, f.total_projects AS case_total_projects,f.case_total_qualified_projects,
    f.total_project_cost AS case_total_project_cost, c.case_total_rd_cost, NULLIF(c.case_total_qre_cost, 0) AS case_total_qre_cost, c.case_completion_percentage, f.case_total_qualified_project_cost,
    c.planned_submission_date, c.statutory_submission_date, c.case_startdate,
    c.description, c.r_number, c.created_by, c.modified_by, c.created_datetime,
    c.modified_datetime, c.total_nonlabor_cost, c.heat_light_power,c.tax_liability,
    c.employers_pension_contribution, c.other, c.material_software_cost, 
    c.sub_contracts, c.cloud_software,c.unpaid_amounts_paid, c.unpaid_amounts,
    c.aggregated_turnover, c.total_expenses, c.taxable_income, c.export_sales_revenue,financial_working_signoff,
    c.lease_costs_of_computers,c.illinois_rd_credit_partnership_corp, c.illinois_research_payments_corp_only, c.basic_research_payments, c.qualified_computer_rental_time_expenses,c.credit_carry_forward_py,c.current_year_gross_receipts,c.other_credits_total,
    rcc.final_credit,
    CASE WHEN EXISTS (SELECT 1 from ${schemaName}.case_team ct WHERE ct.case_rid = '${caseRid}' AND ct.account_rid = '${accountRid}' AND ct.status_rid = '${activeStatusRid}') THEN TRUE
    ELSE FALSE END AS is_case_team_created
    FROM
    ${schemaName}.cases c
    LEFT JOIN ${schemaName}.account_details ad ON ad.account_rid = c.account_rid
    LEFT JOIN ${schemaName}.rd_credit_country_calculations rcc ON rcc.case_rid = c.rid
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
  isExport: boolean,
  projectTypeRids: string[],
  type? : string
) => {
  let pagination: string = ``
  if (!isExport) {
    const offset = (page - 1) * limit;
    pagination = `LIMIT ${limit} OFFSET ${offset}`;
  } else {
    pagination = ` `
  }
  let joinKey : string;
  let qualifiedConditions : string

  if(type === 'qualifiedProjects') {
    qualifiedConditions = `AND pf.is_qualified = true`
  } else {
    qualifiedConditions = ` `
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
  let projectTypeCondition: string = ``;

  if (accessibleIds.length > 0)
    accessibleProjects = `AND pf.rid IN (${accessibleIds
      .map((d: any) => `'${d}'`)
      .join(",")})`;
  else accessibleProjects = ``;
  if( projectTypeRids.length > 0 ) {
    projectTypeCondition = ` AND pf.project_type_rid IN (${projectTypeRids .map((d: any) => `'${d}'`).join(",")}) `;
  }

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
    whereConditions = `pf.account_rid = '${accountRid}' AND pf.fiscal_year = ${fiscalYear} ${accessibleProjects} ${projectTypeCondition}`;
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
    pf.account_rid = '${accountRid}'
    AND pf.fiscal_year = ${fiscalYear} 
    ${accessibleProjects}

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
    AND
    kc.is_primary_contact = TRUE
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
    AND
    kc.is_primary_contact = TRUE
    ), 

    fetch_projects AS (
    SELECT DISTINCT pf.rid, pf.project_code, pf.project_name, pf.project_type_rid, 
    pf.fiscal_year, pf.project_classification_rid, pf.project_client_group,
    pf.project_group, pf.total_effort_prj, pf.total_cost_prj, pf.total_cost_fte_prj,
    pf.total_cost_subcon_prj, pf.total_cost_nonlabor_prj, pf.assessment_status,
    pf.rd_percent_final, pf.qre_final, pf.comments, pf.modified_datetime, pf.r_number,
    poc.project_point_of_contact, tpoc.project_technical_point_of_contact, pf.account_rid,
    pf.project_rid, pf.currency_rid, pf.is_rd_claim_qualified, pf.is_qualified
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
    ${qualifiedConditions}
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
    WITH 
    task_cnt AS (
  SELECT project_fiscal_rid, COUNT(*) AS cnt
  FROM ${schemaName}.project_task
  GROUP BY project_fiscal_rid
),
ats_cnt AS (
  SELECT project_fiscal_rid, COUNT(*) AS cnt
  FROM ${schemaName}.ai_technical_summary
  GROUP BY project_fiscal_rid
),
res_cnt AS (
  SELECT project_fiscal_rid, COUNT(*) AS cnt
  FROM ${schemaName}.project_resource
  GROUP BY project_fiscal_rid
),
    fetch_all_cases AS 
    (select pf.rid,pf.project_rid,pf.account_rid,pf.r_number,pf.created_by,pf.modified_by,pf.created_datetime,pf.modified_datetime,
pf.project_code,pf.fiscal_year,pf.project_name,pf.project_type_rid,pf.project_classification_rid,pf.project_classification_other,
pf.project_group,pf.industry_rid,pf.industry_name,pf.status_rid,pf.total_fte_prj,pf.total_subcon_prj,pf.total_nonlabor_prj,pf.currency_rid,
pf.total_effort_fte_prj,pf.total_effort_subcon_prj,
pf.total_effort_prj,
pf.total_cost_fte_prj,pf.total_cost_subcon_prj,pf.total_cost_nonlabor_prj,pf.total_cost_prj,
 COALESCE(res_cnt.cnt, 0) AS total_resources_prj,
  COALESCE(task_cnt.cnt, 0) AS total_tasks,
  COALESCE(ats_cnt.cnt, 0)  AS total_technical_summaries,
primary_contact.key_contact_name AS project_point_of_contact,
    primary_contact.key_contact_email as project_point_of_contact_email
from ${schemaName}.project_fiscal pf
LEFT JOIN res_cnt ON res_cnt.project_fiscal_rid = pf.rid
LEFT JOIN task_cnt ON task_cnt.project_fiscal_rid = pf.rid
LEFT JOIN ats_cnt ON ats_cnt.project_fiscal_rid = pf.rid
LEFT JOIN LATERAL (
  SELECT kcd.key_contact_name,
         kcd.key_contact_email
  FROM ${schemaName}.key_contact_details kcd
  WHERE 
        kcd.entity_rid = pf.rid
    AND kcd.is_primary_contact = true
    AND kcd.key_contact_role= '${pointOfContactRoleid}'
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
      OR COALESCE(res_cnt.cnt, 0) = 0
      OR COALESCE(task_cnt.cnt, 0) = 0
      OR COALESCE(ats_cnt.cnt, 0) = 0
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
      GROUP BY pf.rid, primary_contact.key_contact_name, primary_contact.key_contact_email, res_cnt.cnt, task_cnt.cnt, ats_cnt.cnt
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
            'project_point_of_contact_email', c.project_point_of_contact_email,
            'currency_rid' , c.currency_rid
        )) AS cases_summary

        FROM
        paginated_data c`;

export const listAllCheckList = (
  searchValue: string,
  whereKey: string,
  joinedConditions: string,
  sortValue: string,
  pagination: string
) => `
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
) => `
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

export const fetchAdminTemplates = (page: number, limit: number, sort: string, sortBy: string, filter: FilterType, search: string, isExport: boolean, isGraphql: boolean, templateRid: string | null) => {
  let pagination: string = ``
  if (isExport) pagination = ` `
  else {
    let offset = (page - 1) * limit;
    pagination = `LIMIT ${limit} OFFSET ${offset}`
  }
  let searchValue: string = ``
  let finalSortOrder: string = ``
  let andConditions: string = ``
  let queryContainer: string[] = []
  let finalContainer: string = ``
  let graphqlConditions: string = ``

  if (search) searchValue = `%${search}%`
  else searchValue = `%%`

  if (isGraphql) {
    graphqlConditions = ` AND t.rid = '${templateRid}'`
  } else {
    graphqlConditions = ` `
  }

  if (Object.keys(validColumnsForSortFilters).includes(sort)) finalSortOrder = `ORDER BY ${validColumnsForSortFilters[sort]} ${sortBy} NULLS LAST`
  else finalSortOrder = `ORDER BY t.r_number ASC NULLS LAST`

  if (Object.keys(filter).length > 0) {
    let validKeyColumns: string;
    for (let [key, conditions] of Object.entries(filter)) {
      if (Object.keys(validColumnsForFilters).includes(key)) {
        validKeyColumns = validColumnsForFilters[key]!
        andConditions = ` AND `
        for (let [cond, value] of Object.entries(conditions)) {
          switch (validFilterColumnTypes[key]) {
            case "string": {
              switch (cond) {
                case "equals": {
                  queryContainer.push(`LOWER(${validKeyColumns}) = '${value.toLowerCase()}'`)
                  break;
                }
                case "not_equals": {
                  queryContainer.push(`LOWER(${validKeyColumns}) != '${value.toLowerCase()}'`)
                  break;
                }
                case "contains": {
                  queryContainer.push(`${validKeyColumns} ILIKE '%${value}%'`)
                  break;
                }
                case "is_empty": {
                  let newCol: string;
                  if (validKeyColumns === `CONCAT(u.first_name,' ', u.last_name)`)
                    newCol = `(u.first_name IS NULL AND u.last_name IS NULL)`
                  else if (validKeyColumns == `CONCAT(uu.first_name,' ', uu.last_name)`)
                    newCol = `(uu.first_name IS NULL AND uu.last_name IS NULL)`
                  else newCol = `${validKeyColumns} IS NULL`
                  queryContainer.push(newCol)
                  break;
                }
                case "in": {
                  queryContainer.push(`${validKeyColumns} IN (${value.map((d: any) => `'${d}'`).join(',')})`)
                  break;
                }
                default: {
                  break;
                }
              }
              break;
            }
            case "number": {
              switch (cond) {
                case "equals": {
                  queryContainer.push(`${validKeyColumns} = ${value}`)
                  break
                }
                case "not_equals": {
                  queryContainer.push(`${validKeyColumns} != ${value}`)
                  break;
                }
                case "greater_than": {
                  queryContainer.push(`${validKeyColumns} > ${value}`)
                  break;
                }
                case "less_than": {
                  queryContainer.push(`${validKeyColumns} < ${value}`)
                  break;
                }
                case "is_empty": {
                  queryContainer.push(`${validKeyColumns} IS NULL`)
                  break;
                }
                case "between": {
                  queryContainer.push(`${validKeyColumns} BETWEEN ${value.map((d: any) => `${d}`).join(' AND ')}`)
                  break;
                }
                default: {
                  break;
                }
              }
              break;
            }
            case "date": {
              switch (cond) {
                case "equals": {
                  queryContainer.push(`DATE(${validKeyColumns}) = '${value}'`)
                  break;
                }
                case "before": {
                  queryContainer.push(`DATE(${validKeyColumns}) < '${value}'`)
                  break;
                }
                case "after": {
                  queryContainer.push(`DATE(${validKeyColumns}) > '${value}'`)
                  break;
                }
                case "is_empty": {
                  queryContainer.push(`DATE(${validKeyColumns}) IS NULL`)
                  break;
                }
                case "between": {
                  queryContainer.push(`DATE(${validKeyColumns}) BETWEEN '${value['from']}' AND '${value['to']}'`)
                  break;
                }
                default: {
                  break;
                }
              }
              break;
            }
            default: {
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
  if (queryContainer.length > 0) {
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

export const fetchMilestoneTaskTemplate = (taskTypeRid: string, filingTypeRid: string, statusId: string) => {
  let query =
    `
  WITH fetch_milestone_result AS (
  SELECT m.r_number, m.rid, m.created_by AS "milestone_created_by", m.modified_by AS "milestone_modified_by",
  m.created_datetime AS "milestone_created_datetime", m.modified_datetime AS "milestone_modified_datetime",
  m.milestone_name, m.milestone_description, m.status_rid AS "milestone_status_rid", m.case_filing_type_rid
  FROM
  ${MAIN_SCHEMA_NAME}.milestone_template m
  ORDER BY m.r_number ASC
  ),
  fetch_task_data AS (
  SELECT 
  t.rid AS task_rid, t.created_by AS "task_created_by", t.modified_by AS "task_modified_by", t.created_datetime AS "task_created_datetime",
  t.modified_datetime AS "task_modified_datetime", t.task_name, t.sequence_no, t.effort_in_days,
  t.effective_start_datetime, t.effective_end_datetime, t.case_team_member_role_rid,
  t.checklist_template_rid, t.status_rid AS "task_status_rid", t.priority_rid, t.task_type_rid,
  t.milestone_template_rid, t.task_description, t.milestone_sequence, t.weightage_rid, t.task_category_rid
  FROM
  fetch_milestone_result m
  LEFT JOIN ${MAIN_SCHEMA_NAME}.task_template t ON t.milestone_template_rid = m.rid
  WHERE
  t.task_type_rid = '${taskTypeRid}'
  AND
  t.status_rid = '${statusId}'
  ORDER BY t.milestone_sequence ASC
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
    'task_description', t.task_description,
    'weightage_rid', t.weightage_rid,
    'task_category_rid', t.task_category_rid
  )ORDER BY t.milestone_sequence, t.sequence_no ASC) AS task_data
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

export const fetchCaseTemplateData = (schemaName : string, caseRid : string, accountRid : string, statusRid : string, checkItemsCompletedStatusId : string) => {
  let query = 
  `
  WITH fetch_tags AS (
  SELECT 
  ct.case_rid, ct.account_rid, ct.rid AS task_rid,
  array_agg(jsonb_build_object(
  'rid', ctag.tag_rid
  )) AS tags
  FROM ${schemaName}.task_tags ctag
  LEFT JOIN ${schemaName}.case_task ct ON ct.rid = ctag.task_rid AND ct.account_rid = ctag.account_rid AND ct.case_rid = ctag.case_rid
  WHERE
  ct.case_rid = '${caseRid}'
  AND
  ct.account_rid = '${accountRid}'
  GROUP BY
  ct.case_rid, ct.account_rid, ct.rid
  ),
  fetch_task AS (
  SELECT cm.rid, cm.account_rid, cm.case_rid,
  array_agg(jsonb_build_object(
  'rid', t.rid,
  'task_name', t.task_name,
  'is_flagged', t.is_flagged,
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
  'attachment_count', 
  (
  SELECT COUNT(DISTINCT ta.rid) AS total_result
  FROM
  ${schemaName}.task_attachments ta
  LEFT JOIN ${schemaName}.case_task ct ON ct.rid = ta.task_rid AND ct.case_rid = ta.case_rid AND ct.account_rid = ta.account_rid
  WHERE
  ta.task_rid = t.rid
  AND
  ta.case_rid = t.case_rid
  AND
  ta.account_rid = t.account_rid
  AND
  ta.is_file_deleted = FALSE
  ),
  'checklists_count', 
  (
  SELECT COUNT(DISTINCT chi.rid) 
  FROM ${schemaName}.checklists ch 
  LEFT JOIN ${schemaName}.checklist_items chi ON chi.checklist_rid = ch.rid 
  WHERE 
  ch.attach_to = t.rid
  AND ch.case_rid = '${caseRid}'
  AND ch.attachment_level = 'task'
  ),
  'complete_items', 
  (
  SELECT COUNT(DISTINCT chi.rid) 
  FROM ${schemaName}.checklists ch 
  LEFT JOIN ${schemaName}.checklist_items chi ON chi.checklist_rid = ch.rid 
  WHERE 
  ch.attach_to = t.rid
  AND ch.case_rid = '${caseRid}'
  AND attachment_level = 'task'
  AND chi.status_rid = '${checkItemsCompletedStatusId}'
  ),
  'comments_count', (SELECT COUNT(DISTINCT tc.rid) from ${schemaName}.task_comments tc WHERE tc.task_rid = t.rid AND tc.case_rid = '${caseRid}'),
  'task_status_rid', t.task_status_rid,
  'tags', ftt.tags
  )ORDER BY t.sequence_no ASC) AS tasks
  FROM 
  ${schemaName}.case_milestone cm
  LEFT JOIN ${schemaName}.case_task t ON t.milestone_template_rid = cm.rid
  LEFT JOIN fetch_tags ftt ON ftt.case_rid = t.case_rid AND ftt.account_rid = t.account_rid AND ftt.task_rid = t.rid
  LEFT JOIN ${schemaName}.case_team ct ON ct.user_rid = t.assigned_to AND ct.role_rid = t.case_team_member_role_rid AND ct.case_rid = '${caseRid}' AND ct.account_rid = '${accountRid}' AND ct.status_rid = '${statusRid}'
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

export const fetchCaseDetails = (schemaName: string, rid: string) => {
  return `
    SELECT 
    c.rid, c.checklist_description,
    c.created_by, c.modified_by, c.account_rid, 
    c.created_datetime, c.modified_datetime,
    c.checklist_name, c.fiscal_year,
    c.attachment_level, c.r_number, c.attach_to, c.status_rid
    FROM
    ${schemaName}.checklists c
    WHERE
    c.rid = '${rid}'
    `
}
export const fetchEmailActivityDetails = (schemaName: string, rid: string) => {
  return `
    SELECT 
    a.rid, a.subject, a.body_html,
    a.created_by, a.modified_by, a.account_rid, 
    a.created_datetime, a.modified_datetime,
    a.fiscal_year,
    a.attachment_level, a.r_number, a.attach_to, a.status_rid,
    a.to_email,a.cc_email,a.sender_email,a.activity_type
    FROM
    ${schemaName}.activities a
    WHERE
    a.rid = '${rid}'
    `
}

export const fetchActivityDetails = (schemaName: string, rid: string,selectedFields: any) => {
  return `
    SELECT 
    a.rid, ${selectedFields}
    FROM
    ${schemaName}.activities a
    WHERE
    a.rid = '${rid}'
    `
}
/**
* Returns the query to fetch attach_to details based on attachment level.
*/
export function fetchChecklistAttachToDetails(schemaName: string, attachTo: string, attachmentLevel: string, checklistId: string): string {
  switch (attachmentLevel.toLowerCase()) {
    case 'account':
      return `SELECT ad.account_rid, ad.account_name AS name FROM ${schemaName}.account_details ad WHERE ad.account_rid = '${attachTo}'`;
    case 'project':
      return `SELECT pf.rid, pf.project_code AS name  FROM ${schemaName}.project_fiscal pf WHERE pf.rid = '${attachTo}'`;
    case 'case':
      return `SELECT cd.rid, cd.case_name AS name FROM ${schemaName}.cases cd WHERE cd.rid = '${attachTo}'`;
    case 'resource':
      return `SELECT r.rid, r.resource_code AS name FROM ${schemaName}.resources r WHERE r.rid = '${attachTo}'`;
    case 'resource_cost':
      return `SELECT rc.rid, rc.r_number AS name FROM ${schemaName}.resource_cost rc WHERE rc.rid = '${attachTo}'`;
    case 'resource_skill':
      return `SELECT rs.rid, rs.r_number AS name FROM ${schemaName}.resource_skill rs WHERE rs.rid = '${attachTo}'`;
    case 'project_task':
      return `SELECT pt.rid, pt.r_number AS name FROM ${schemaName}.project_task pt WHERE pt.rid = '${attachTo}'`;
    case 'project_resource':
      return `SELECT pr.rid, pr.r_number AS name FROM ${schemaName}.project_resource pr WHERE pr.rid = '${attachTo}'`;
    default:
      return `SELECT NULL AS name`;
  }
}

/**
* Returns the query to fetch attach_to details based on attachment level.
*/
export function fetchActivityAttachToDetails(schemaName: string, attachTo: string, attachmentLevel: string, checklistId: string): string {
  switch (attachmentLevel.toLowerCase()) {
    case 'account':
      return `SELECT ad.account_rid, ad.account_name AS name FROM ${schemaName}.account_details ad WHERE ad.account_rid = '${attachTo}'`;
    case 'project':
      return `SELECT pf.rid, pf.project_code AS name  FROM ${schemaName}.project_fiscal pf WHERE pf.rid = '${attachTo}'`;
    case 'case':
      return `SELECT cd.rid, cd.case_name AS name FROM ${schemaName}.cases cd WHERE cd.rid = '${attachTo}'`;
    case 'resource':
      return `SELECT r.rid, r.resource_code AS name FROM ${schemaName}.resources r WHERE r.rid = '${attachTo}'`;
    case 'resource_cost':
      return `SELECT rc.rid, rc.r_number AS name FROM ${schemaName}.resource_cost rc WHERE rc.rid = '${attachTo}'`;
    case 'resource_skill':
      return `SELECT rs.rid, rs.r_number AS name FROM ${schemaName}.resource_skill rs WHERE rs.rid = '${attachTo}'`;
    case 'project_task':
      return `SELECT pt.rid, pt.r_number AS name FROM ${schemaName}.project_task pt WHERE pt.rid = '${attachTo}'`;
    case 'project_resource':
      return `SELECT pr.rid, pr.r_number AS name FROM ${schemaName}.project_resource pr WHERE pr.rid = '${attachTo}'`;
    default:
      return `SELECT NULL AS name`;
  }
}

export const fetchCaseSpecificTaskQuery = (page: number, limit: number, search: string, sort: string, sortBy: string, filter: FilterType, doSorting: boolean, caseRid: string, accountRid: string, schemaName: string, isExport: boolean, statusId: string, disablePagination: boolean) => {
  let searchValue: string = ``
  let sortValue: string = ``
  let filterQueryArray: string[] = []
  let combinedQueryString: string = ``
  let andOperator: string = ``
  let validKey: string = ``
  let pagination: string = ``

  if (!isExport && !disablePagination) {
    let offset = (page - 1) * limit;
    pagination = `LIMIT ${limit} OFFSET ${offset}`
  } else {
    pagination = ` `
  }

  if (search) searchValue = `%${search}%`
  else searchValue = `%%`

  if (doSorting) {
    if (sort.includes(sortByColumnsCaseTask[sort])) {
      sortValue = `ORDER BY ct.${sortByColumnsCaseTask[sort]} ${sortBy}`
    } else {
      sortValue = `ORDER BY ct.task_name ASC`
    }
  } else {
    sortValue = ` `
  }

  if (Object.keys(filter).length > 0) {
    andOperator = ` AND `
    for (let [key, conditions] of Object.entries(filter)) {
      if (Object.keys(filterColumnsCaseTask).includes(key)) {
        validKey = key;
        let dynamicAlias;
        for (let [cond, values] of Object.entries(conditions)) {
          switch (filterColumnsCaseTaskTypes[validKey]) {
            case "string": {
              if (validKey === 'assigned_to') {
                dynamicAlias = `ctt`
                validKey = `user_rid`
              } else if (validKey === 'role_rid') {
                dynamicAlias = `ctt`
                validKey = `role_rid`
              } else {
                dynamicAlias = `ct`
              }
              if (cond === 'equals')
                filterQueryArray.push(`LOWER(${dynamicAlias}.${validKey}) = '${values.toLowerCase()}'`)
              if (cond === 'not_equals')
                filterQueryArray.push(`(LOWER(${dynamicAlias}.${validKey}) != '${values.toLowerCase()}' OR ${dynamicAlias}.${validKey} IS NULL)`)
              if (cond === 'contains')
                filterQueryArray.push(`${dynamicAlias}.${validKey} ILIKE '%${values}%'`)
              if (cond === 'is_empty')
                filterQueryArray.push(`(${dynamicAlias}.${validKey} IS NULL OR ${dynamicAlias}.${validKey} = '')`)
              if (cond === 'in')
                filterQueryArray.push(`${dynamicAlias}.${validKey} IN (${values.map((d: any) => `'${d}'`).join(',')})`)
              break;
            }
            case "date": {
              if (cond === 'equals')
                filterQueryArray.push(`ct.${validKey} = '${values}'`)
              if (cond === 'before')
                filterQueryArray.push(`ct.${validKey} < '${values}'`)
              if (cond === 'after')
                filterQueryArray.push(`ct.${validKey} > '${values}'`)
              if (cond === 'is_empty')
                filterQueryArray.push(`ct.${validKey} IS NULL`)
              if (cond === 'between')
                filterQueryArray.push(`ct.${validKey} BETWEEN ${values.map((d: any) => `'${d}'`).join(' AND ')}`)
              break;
            }
            default:
              break;
          }
        }
      }
    }
  } else {
    filterQueryArray = []
    andOperator = ` `
  }

  if (filterQueryArray.length > 0) {
    combinedQueryString = filterQueryArray.join(' AND ')
  } else {
    combinedQueryString = ` `
  }
  let query =
    `
    WITH fetch_case_task AS (
    SELECT
    ct.rid, ct.task_name, ctt.user_rid AS assigned_to,
    ct.effective_start_datetime,
    ct.effective_end_datetime, ct.task_status_rid, ctt.role_rid
    FROM
    ${schemaName}.case_task ct
    LEFT JOIN ${schemaName}.case_team ctt ON ctt.user_rid = ct.assigned_to AND ctt.case_rid = ct.case_rid AND ctt.account_rid = ct.account_rid AND ctt.status_rid = '${statusId}' AND ct.case_team_member_role_rid = ctt.role_rid
    WHERE
    ct.status_rid = '${statusId}'
    AND
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


export const fetchTaskComments = (page: number, limit: number, taskRid: string, accountRid: string, caseRid: string, schemaName: string, taskType: string) => {
  let offset = (page - 1) * limit;
  let pagination = `LIMIT ${limit} OFFSET ${offset}`;
  let caseRidFilter = taskType !== 'activity' ? `AND tc.case_rid = '${caseRid}'` : '';
  let query =
    `
    WITH calculate_total_result AS(
    SELECT tc.rid, COUNT(tc.*) OVER() AS total_result
    FROM ${schemaName}.task_comments tc
    WHERE
    tc.account_rid = '${accountRid}'
    ${caseRidFilter}
    AND
    tc.task_rid = '${taskRid}'
    ), 
    
    fetch_task_comments AS (
    SELECT tc.rid, tc.comments, tc.account_rid, tc.case_rid, tc.task_rid, c.total_result, tc.created_by, tc.created_datetime
    FROM ${schemaName}.task_comments tc
    LEFT JOIN calculate_total_result c ON c.rid = tc.rid
    WHERE
    tc.account_rid = '${accountRid}'
    ${caseRidFilter}
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

export const fetchTaskActivities = (page: number, limit: number, schemaName: string, caseRid: string, taskRid: string, taskType: string) => {
  const offset = (page - 1) * limit;
  let pagination = `LIMIT ${limit} OFFSET ${offset}`;
  let query = ``;
  if (taskType === 'activity') {
    query =
      `
    WITH fetch_data AS (SELECT 
    rid, r_number, created_by, created_datetime, attribute_name, old_value, new_value, activity_rid
    FROM ${schemaName}.activity_history
    WHERE
    activity_rid = '${taskRid}'
    ORDER BY created_datetime DESC),
    calculate_total AS (
    SELECT f.*, COUNT(f.rid) OVER() AS total_result FROM fetch_data f
    )
    SELECT * FROM calculate_total ${pagination}
    `
  }
  else {
    query =
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
  }
  return query;
}

export const taskCardDetails = (schemaName: string, taskRid: string, accountRid: string, caseRid: string, checklistItemsStatusRid: string, activeStatusId: string) => {
  let query =
    `
    WITH fetch_checklists AS (
    SELECT c.rid, c.account_rid, c.checklist_name, c.checklist_description, ct.rid AS task_rid
    FROM 
    ${schemaName}.case_task ct
    LEFT JOIN ${schemaName}.checklists c ON c.attach_to = '${taskRid}' AND c.case_rid = '${caseRid}' AND c.attachment_level = 'task'
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
    'is_flagged', ct.is_flagged,
    'effective_start_datetime', ct.effective_start_datetime,
    'effective_end_datetime', ct.effective_end_datetime,
    'assigned_to', ctt.user_rid,
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
    LEFT JOIN ${schemaName}.case_team ctt ON ctt.user_rid = ct.assigned_to AND ctt.role_rid = ct.case_team_member_role_rid AND ctt.case_rid = '${caseRid}' AND ctt.account_rid = '${accountRid}' AND ctt.status_rid = '${activeStatusId}'
    WHERE
    ct.rid = '${taskRid}'
    AND
    ct.account_rid = '${accountRid}'
    AND
    ct.case_rid = '${caseRid}'
    `
  return query;
}

export const taskCardDetailsActivityTask = (schemaName: string, taskRid: string, accountRid: string, checklistItemsStatusRid: string) => {
  let query =
    `
  WITH fetch_checklists AS (
  SELECT c.rid, c.account_rid, c.checklist_name, c.checklist_description, ct.rid AS task_rid,ct.checklist_rid
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
  'checklist_rid', ct.checklist_rid,
  'assigned_to', ct.assigned_to,
  'priority_rid', ct.priority_rid,
  'description', ct.description,
  'task_status_rid', ct.status_rid,
  'checklists', fci.checklists,
  'tags', ftt.tags,
  'fiscal_year', ct.fiscal_year
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

export const fetchTaskWeightage = () => {
  return `SELECT rid, weightage_value FROM ${MAIN_SCHEMA_NAME}.task_weightage ORDER BY weightage_value ASC`
}

export const fetchCaseProjects = (caseRid: string, accountRid: string, schemaName: string) => {
  return `
    SELECT pf.total_cost_prj, pf.qre_final 
    FROM ${schemaName}.project_fiscal pf 
    LEFT JOIN ${schemaName}.case_projects cp ON cp.project_fiscal_rid = pf.rid
    WHERE
    cp.case_rid = '${caseRid}'
    AND
    cp.account_rid = '${accountRid}'
    `
}

export const updateCaseAggregatedValue = (totalCostPrj: any, totalQreCost: any, schemaName: string, caseRid: string, accountRid: string) => {
  return `UPDATE ${schemaName}.cases SET case_total_project_cost = ${totalCostPrj}, case_total_qre_cost = ${totalQreCost} 
    WHERE rid = '${caseRid}' AND account_rid = '${accountRid}'`
}

export const listAllJurisdictionConfig = (
  searchValue: string,
  whereKey: string,
  joinedConditions: string,
  sortValue: string,
  pagination: string
) => `
    WITH fetch_jurisdiction_config AS (
        SELECT
            jc.rid, jc.r_number,jc.config_name,
            jc.status_rid,s.status_name,
            g.credit_program_name,
            jc.created_by, jc.modified_by,
            jc.created_datetime, jc.modified_datetime,
            COUNT(jc.rid) OVER() AS total_records,
            jc.effective_start_date,
            jc.effective_end_date,g.is_federal,
            uc.first_name || ' ' || uc.last_name AS created_user_name,
            um.first_name || ' ' || um.last_name AS modified_user_name,
            jc.credit_config_group_rid,g.country_rid,c.country_name,c.country_code,
            g.state_rid,st.state_name,
            CONCAT('C','-',c.country_code, '-', (CASE WHEN g.is_federal = false AND st.state_name IS NOT NULL AND st.state_name != '' THEN st.state_name || '-' ELSE '' END), jc.config_name ) AS config_full_name
            FROM
            ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values jc
             LEFT JOIN ${MAIN_SCHEMA_NAME}.rd_credit_config_group g ON jc.credit_config_group_rid = g.rid
             LEFT JOIN ${MAIN_SCHEMA_NAME}.country c ON g.country_rid = c.rid
             LEFT JOIN ${MAIN_SCHEMA_NAME}.status s ON jc.status_rid = s.rid
              LEFT JOIN ${MAIN_SCHEMA_NAME}.state st ON g.state_rid = st.rid
             LEFT JOIN ${MAIN_SCHEMA_NAME}.user uc ON uc.rid = jc.created_by
             LEFT JOIN ${MAIN_SCHEMA_NAME}.user um ON um.rid = jc.modified_by
              WHERE
    (jc.r_number ILIKE '${searchValue}' OR CONCAT('C','-',c.country_code, '-', (CASE WHEN g.is_federal = false AND st.state_name IS NOT NULL AND st.state_name != '' THEN st.state_name || '-' ELSE '' END), jc.config_name ) ILIKE '${searchValue}' )
    and jc.federal_config_id is null
    ${joinedConditions}
    ),
    paginated_datas AS (
    SELECT * FROM fetch_jurisdiction_config ${sortValue} ${pagination}
    
    )
        SELECT 
        array_agg(jsonb_build_object(
        'rid', i.rid,
        'r_number', i.r_number,
        'config_name', i.config_name,
        'credit_program_name', i.credit_program_name,
        'status_rid', i.status_rid,
        'status_name', i.status_name,
        'created_by', i.created_by,
        'modified_by', i.modified_by,
        'created_datetime', i.created_datetime,
        'modified_datetime', i.modified_datetime,
        'effective_start_date', i.effective_start_date,
        'effective_end_date', i.effective_end_date,
        'total_records', i.total_records,
        'created_user_name', i.created_user_name,
        'modified_user_name', i.modified_user_name,
        'is_federal', i.is_federal,
        'credit_config_group_rid', i.credit_config_group_rid,
        'country_rid', i.country_rid,
        'country_name', i.country_name,
        'state_rid', i.state_rid,
        'state_name', i.state_name,
        'country_code', i.country_code
        ) ) AS jurisdiction_config_list

        FROM
        paginated_datas i
    `;

export const checkProjectMappedToProjectRes = (schemaName: string, projectFiscalRid: string) => {
  return `SELECT project_fiscal_rid FROM ${schemaName}.project_resource WHERE project_fiscal_rid = '${projectFiscalRid}'`
}

export const checkProjectMappedToCaseProjectResource = (schemaName: string, projectFiscalRid: string, caseId: string) => {
  return `SELECT project_fiscal_rid FROM ${schemaName}.case_project_resource WHERE project_fiscal_rid = '${projectFiscalRid}' AND case_rid = '${caseId}'`
}

export const fetchProjectQueryByPrjId = (
  account_rid: string,
  schemaName: string,
  fiscal_year: number,
  project_fiscal_rid: string,
  case_rid: string
) => {
  let query = `
    WITH calculate_resource_metrics AS (
        SELECT 
        DISTINCT ON (a.account_rid)  
        COALESCE(pf.total_fte_prj, 0) AS total_fte, 
        COALESCE(pf.total_subcon_prj, 0) AS total_subcon,
        COALESCE(pf.total_nonlabor_prj, 0) AS total_nonlabor,
        a.account_rid,
        pf.claim_status
        FROM
        ${schemaName}.account_details a
        LEFT JOIN ${schemaName}.project p ON p.account_rid = a.account_rid
        LEFT JOIN ${schemaName}.case_projects pf ON pf.project_rid = p.rid AND pf.case_rid = '${case_rid}'
        WHERE 
        a.account_rid = '${account_rid}'
        AND
        pf.fiscal_year = ${fiscal_year}
        AND
        pf.project_fiscal_rid = '${project_fiscal_rid}'
        GROUP BY
        a.account_rid,pf.total_fte_prj, pf.total_subcon_prj, pf.total_nonlabor_prj,pf.claim_status
    ),
    fetch_project_name AS (
        SELECT project_name, account_rid FROM ${schemaName}.case_projects
        WHERE
        project_fiscal_rid = '${project_fiscal_rid}'
        AND
        case_rid = '${case_rid}'
    ),
    calculate_hours_fte AS (
        SELECT DISTINCT ON (ad.account_rid)
                ad.account_rid,
                CAST(COALESCE(pf.total_effort_fte_prj,0.00) AS DECIMAL(18,2)) AS project_level, 
                CAST(COALESCE(pf.total_effort_fte_from_prj_res,0.00) AS DECIMAL(18,2)) AS project_resource_level, 
                CAST(COALESCE(pf.total_effort_fte_from_tasks,0.00) AS DECIMAL(18,2)) AS project_task_level
            FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.case_projects pf ON pf.project_rid = p.rid AND pf.case_rid = '${case_rid}'
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.project_fiscal_rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid,pf.total_effort_fte_prj,pf.total_effort_fte_from_prj_res,pf.total_effort_fte_from_tasks 
    ),
    calculate_hours_subcon AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            CAST(COALESCE(pf.total_effort_subcon_prj,0.00) AS DECIMAL(18,2)) AS project_level, 
            CAST(COALESCE(pf.total_effort_subcon_from_prj_res,0.00) AS DECIMAL(18,2)) AS project_resource_level, 
            CAST(COALESCE(pf.total_effort_subcon_from_tasks,0.00) AS DECIMAL(18,2)) AS project_task_level
            FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.case_projects pf ON pf.project_rid = p.rid AND pf.case_rid = '${case_rid}'
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.project_fiscal_rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid, pf.total_effort_subcon_prj,pf.total_effort_subcon_from_prj_res, pf.total_effort_subcon_from_tasks
            ),
    calculate_cost_fte AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            CAST(COALESCE(pf.total_cost_fte_prj,0.00) AS DECIMAL(18,2)) AS project_level, 
            CAST(COALESCE(pf.total_cost_fte_from_prj_res,0.00) AS DECIMAL(18,2)) AS project_resource_level, 
            CAST(COALESCE(pf.total_cost_fte_from_tasks,0.00) AS DECIMAL(18,2)) AS project_task_level
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.case_projects pf ON pf.project_rid = p.rid AND pf.case_rid = '${case_rid}'
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.project_fiscal_rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid, pf.total_cost_fte_prj, pf.total_cost_fte_from_prj_res, pf.total_cost_fte_from_tasks
    ),
    calculate_cost_subcon AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            CAST(COALESCE(pf.total_cost_subcon_prj,0.00) AS DECIMAL(18,2)) AS project_level, 
            CAST(COALESCE(pf.total_cost_subcon_from_prj_res,0.00) AS DECIMAL(18,2)) AS project_resource_level, 
            CAST(COALESCE(pf.total_cost_subcon_from_tasks,0.00) AS DECIMAL(18,2)) AS project_task_level
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.case_projects pf ON pf.project_rid = p.rid AND pf.case_rid = '${case_rid}'
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.project_fiscal_rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid, pf.total_cost_subcon_prj, pf.total_cost_subcon_from_prj_res, pf.total_cost_subcon_from_tasks
    ),
    calculate_cost_nonlabor AS (
    SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            CAST(COALESCE(pf.total_cost_nonlabor_prj,0.00) AS DECIMAL(18,2)) AS project_level, 
            CAST(COALESCE(pf.total_cost_nonlabor_from_prj_res,0.00) AS DECIMAL(18,2)) AS project_resource_level
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.case_projects pf ON pf.project_rid = p.rid AND pf.case_rid = '${case_rid}'
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.project_fiscal_rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid, pf.total_cost_nonlabor_prj, pf.total_cost_nonlabor_from_prj_res
    ),
    calculate_rd_credits_federal AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            CAST(COALESCE(pf.rd_credits_fte_fed_level,0.00) AS DECIMAL(18,2)) AS rd_credits_fte,
            CAST(COALESCE(pf.rd_credits_subcon_fed_level,0.00) AS DECIMAL(18,2)) AS rd_credits_subcon,
            CAST(COALESCE(pf.rd_credits_nonlabor_fed_level, 0.00) AS DECIMAL(18,2)) AS rd_credits_nonlabor,
            CAST(COALESCE(pf.rd_credits_total, 0.00) AS DECIMAL(18,2)) AS rd_credits_total
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.case_projects pf ON pf.project_rid = p.rid AND pf.case_rid = '${case_rid}'
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.project_fiscal_rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid, pf.rd_credits_fte_fed_level, pf.rd_credits_subcon_fed_level,pf.rd_credits_nonlabor_fed_level,pf.rd_credits_total  
    ),
    calculate_rd_credits_statewise AS (
    SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            CAST(COALESCE(pf.qre_fte,0.00) AS DECIMAL(18,2)) AS qre_fte,
            CAST(COALESCE(pf.qre_subcon,0.00) AS DECIMAL(18,2)) AS qre_subcon,
            CAST(COALESCE(pf.qre_nonlabor, 0.00) AS DECIMAL(18,2)) AS qre_nonlabor,
            CAST(COALESCE(pf.qre_final, 0.00) AS DECIMAL(18,2)) AS qre_final
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.case_projects pf ON pf.project_rid = p.rid AND pf.case_rid = '${case_rid}'
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.project_fiscal_rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid, pf.qre_fte, pf.qre_subcon, pf.qre_nonlabor, pf.qre_final
    ),

    calculate_rd_credits_total AS (
            SELECT DISTINCT ON (ad.account_rid) ad.account_rid, 
            CAST(COALESCE(pf.rd_percent_potential_ai,0.00) AS DECIMAL(18,2)) AS rd_percent_potential,
            CAST(COALESCE(pf.rd_percent_adjustment,0.00) AS DECIMAL(18,2)) AS rd_percent_adjustment,
            CAST(COALESCE(pf.rd_percent_final,0.00) AS DECIMAL(18,2)) AS rd_percent_final
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.case_projects pf ON pf.project_rid = p.rid AND pf.case_rid = '${case_rid}'
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.project_fiscal_rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid,pf.rd_percent_potential_ai,pf.rd_percent_adjustment,pf.rd_percent_final
        ),
    
        calculate_federal AS (
        SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            CAST(SUM(COALESCE(pf.rd_credits_fte_fed_level,0.00)) AS DECIMAL(18,2)) AS rd_credits_fte,
            CAST(SUM(COALESCE(pf.rd_credits_subcon_fed_level,0.00)) AS DECIMAL(18,2)) AS rd_credits_subcon,
            CAST(SUM(COALESCE(pf.rd_credits_nonlabor_fed_level,0.00)) AS DECIMAL(18,2)) AS rd_credits_nonlabor
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.case_projects pf ON pf.project_rid = p.rid AND pf.case_rid = '${case_rid}'
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.project_fiscal_rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid
    ),
    calculate_statewise AS (
    SELECT DISTINCT ON (ad.account_rid)
            ad.account_rid,
            CAST(SUM(COALESCE(afr.rd_credits_fte_fed_level,0.00)) AS DECIMAL(18,2))  AS rd_credits_fte,
            CAST(SUM(COALESCE(afr.rd_credits_subcon_fed_level,0.00)) AS DECIMAL(18,2)) AS rd_credits_subcon,
            CAST(SUM(COALESCE(afr.rd_credits_nonlabor_fed_level,0.00)) AS DECIMAL(18,2)) AS rd_credits_nonlabor
        FROM
            ${schemaName}.account_details ad
            LEFT JOIN ${schemaName}.project p ON p.account_rid = ad.account_rid
            LEFT JOIN ${schemaName}.case_project_fiscal_region afr ON afr.project_rid = p.rid AND afr.case_rid = '${case_rid}'
            LEFT JOIN ${schemaName}.case_projects pf ON pf.region_rid = afr.region_rid AND pf.case_rid = '${case_rid}'
            WHERE 
            ad.account_rid = '${account_rid}'
            AND
            pf.fiscal_year = ${fiscal_year}
            AND
            pf.project_fiscal_rid = '${project_fiscal_rid}'
            GROUP BY
            ad.account_rid
    ),
    calculate_total AS (
            SELECT DISTINCT ON (ad.account_rid) ad.account_rid, 
            CAST(COALESCE(cf.rd_credits_fte,0.00) + COALESCE(cr.rd_credits_fte,0.00) AS DECIMAL(18,2)) AS rd_credits_fte,
            CAST(COALESCE(cf.rd_credits_subcon,0.00) + COALESCE(cr.rd_credits_subcon,0.00) AS DECIMAL(18,2)) AS rd_credits_subcon,
            CAST(COALESCE(cf.rd_credits_nonlabor,0.00) + COALESCE(cr.rd_credits_nonlabor,0.00) AS DECIMAL(18,2)) AS rd_credits_nonlabor
        FROM 
            ${schemaName}.account_details ad
            LEFT JOIN calculate_statewise cf ON cf.account_rid = ad.account_rid
            LEFT JOIN calculate_federal cr ON cr.account_rid = ad.account_rid
        WHERE 
            ad.account_rid = '${account_rid}'
        )
    
    SELECT 
        jsonb_build_object(
        'metric','No Of Resources',
        'fte', rm.total_fte,
        'subcon', rm.total_subcon,
        'nonlabor', rm.total_nonlabor,
        'project_name', fpn.project_name,
        'claim_status', rm.claim_status
        ) AS resource_metrics,

        jsonb_build_object(
        'metric_name', 'FTE Effort',
        'permission', 'fte_effort',
        'project_level', chf.project_level,
        'project_resource_level', chf.project_resource_level,
        'project_task_level', chf.project_task_level
        ) AS fte_hours,

        jsonb_build_object(
        'metric_name', 'FTE Cost',
        'permission', 'fte_cost',
        'project_level', ccf.project_level,
        'project_resource_level', ccf.project_resource_level,
        'project_task_level', ccf.project_task_level
        ) AS fte_cost,

        jsonb_build_object(
        'metric_name', 'Sub Con Effort',
        'permission', 'sub_con_effort',
        'project_level', csh.project_level,
        'project_resource_level', csh.project_resource_level,
        'project_task_level', csh.project_task_level
        ) AS subcon_hours,

        jsonb_build_object(
        'metric_name', 'Sub Con Cost',
        'permission', 'sub_con_cost',
        'project_level', scc.project_level,
        'project_resource_level', scc.project_resource_level,
        'project_task_level', scc.project_task_level
        ) AS subcon_cost,

        jsonb_build_object(
        'metric_name', 'Non Labor Cost',
        'permission', 'non_labor_cost',
        'project_level', ccn.project_level,
        'project_resource_level', ccn.project_resource_level
        ) AS nonlabor_cost,

        jsonb_build_object(
        'name', 'rd_credits',
        'rd_credits_fte', rdf.rd_credits_fte,
        'rd_credits_subcon', rdf.rd_credits_subcon,
        'rd_credits_nonlabor', rdf.rd_credits_nonlabor,
        'rd_credits_total', rdf.rd_credits_total
        ) AS rd_credits,

        jsonb_build_object(
        'name' ,'qre',
        'qre_fte', rds.qre_fte,
        'qre_subcon', rds.qre_subcon,
        'qre_nonlabor', rds.qre_nonlabor,
        'qre_final', rds.qre_final
        ) AS qre,

        jsonb_build_object(
        'name','rd_percent',
        'rd_percent_potential', trd.rd_percent_potential,
        'rd_percent_adjustment', trd.rd_percent_adjustment,
        'rd_percent_final', trd.rd_percent_final
        ) AS rd_percent,

        jsonb_build_object(
        'name', 'Federal',
        'rd_credits_fte', rdff.rd_credits_fte,
        'rd_credits_subcon', rdff.rd_credits_subcon,
        'rd_credits_nonlabor', rdff.rd_credits_nonlabor
        ) AS federal,

        jsonb_build_object(
        'name' ,'Statewise',
        'rd_credits_fte', rdss.rd_credits_fte,
        'rd_credits_subcon', rdss.rd_credits_subcon,
        'rd_credits_nonlabor', rdss.rd_credits_nonlabor
        ) AS state_wise,

        jsonb_build_object(
        'name','Grand Total',
        'rd_credits_fte', trdd.rd_credits_fte,
        'rd_credits_subcon', trdd.rd_credits_subcon,
        'rd_credits_nonlabor', trdd.rd_credits_nonlabor
        ) AS grand_total
        
        FROM
        ${schemaName}.account_details ad
        LEFT JOIN calculate_resource_metrics rm ON rm.account_rid = ad.account_rid
        LEFT JOIN calculate_hours_fte chf ON chf.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_fte ccf ON ccf.account_rid = ad.account_rid
        LEFT JOIN calculate_hours_subcon csh ON csh.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_subcon scc ON scc.account_rid = ad.account_rid
        LEFT JOIN calculate_cost_nonlabor ccn ON ccn.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_federal rdf ON rdf.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_statewise rds ON rds.account_rid = ad.account_rid
        LEFT JOIN calculate_rd_credits_total trd ON trd.account_rid = ad.account_rid
        LEFT JOIN calculate_federal rdff ON rdf.account_rid = ad.account_rid
        LEFT JOIN calculate_statewise rdss ON rds.account_rid = ad.account_rid
        LEFT JOIN calculate_total trdd ON trd.account_rid = ad.account_rid
        LEFT JOIN fetch_project_name fpn ON fpn.account_rid = ad.account_rid
        WHERE
        ad.account_rid = '${account_rid}'
    `;
  return query;
};

export const fetchProjetFiscalForFinancialHighlights = (
  schemaName: string,
  accountFilter: any,
  projectFilter: any,
  filterConditions: any,
  searchCondition: any,
  case_rid: string // Added argument
) => {
  return `
      SELECT 
        prf.total_cost_pro_res,
        prf.rd_percent_final,
        prf.qre_final,
        prf.rd_credits_total,
        prf.resource_rid,
        prf.project_fiscal_rid,
        prf.country_rid,
        prf.fiscal_year,
        prf.region_rid,
        pf.project_code,
        pf.currency_rid,
        pf.r_number,
        pf.project_name,
        r.resource_code,
        r.resource_name,
        r.resource_type_rid
      FROM "${schemaName}"."case_project_resource_fiscal" prf
      INNER JOIN "${schemaName}"."case_projects" pf ON pf.project_fiscal_rid = prf.project_fiscal_rid AND pf.case_rid = '${case_rid}'
      INNER JOIN "${schemaName}"."resources" r ON r.rid = prf.resource_rid
      WHERE 1=1 
      AND prf.case_rid = '${case_rid}'
      ${accountFilter}
      ${projectFilter}
      ${filterConditions}
      ${searchCondition}
    `;
};

export const fetchIsRdQualifiedProjectQuery = (
  account_rid: string,
  schemaName: string,
  fiscal_year: number,
  case_rid: string
) => {
  let query = `
    SELECT count(*) as count 
    FROM ${schemaName}.case_projects 
    WHERE case_rid = '${case_rid}' AND is_rd_qualified = true
    `;
  return query;
};

export const summaryHighlightsQuery = (
  account_rid: string,
  fiscal_year: number,
  schemaName: string,
  case_rid: string
) => {
  let query = `
    WITH calculate_rd_credits_projects AS (
    SELECT DISTINCT ON (p.case_rid) 
            COUNT(*) AS total_projects_rd_credits,
            p.case_rid
        FROM 
        ${schemaName}.case_projects p
        WHERE 
            p.case_rid = '${case_rid}'
            AND
            p.is_rd_qualified = true
        GROUP BY
        p.case_rid
    ),
    resource_metrics AS (
        SELECT 
            COUNT(DISTINCT prf.resource_rid) as total_resources,
            p.case_rid
        FROM 
        ${schemaName}.case_project_resource_fiscal prf
        JOIN ${schemaName}.case_projects p ON p.project_fiscal_rid = prf.project_fiscal_rid AND p.case_rid = '${case_rid}'
        WHERE 
            prf.case_rid = '${case_rid}'
        GROUP BY
        p.case_rid
    )
    SELECT 
        jsonb_build_object(
        'metric','No Of Resources',
        'fte', (SELECT COUNT(*) FROM ${schemaName}.case_project_resource_fiscal prf 
                JOIN ${schemaName}.resources r ON r.rid = prf.resource_rid 
                WHERE prf.case_rid = '${case_rid}' AND r.resource_type_rid = 'fte_uuid_placeholder'), 
        'subcon', 0,
        'nonlabor', 0,
        'total_projects_rd_credits', COALESCE(crcp.total_projects_rd_credits, 0)
        ) AS resource_metrics,
        
        jsonb_build_object(
        'metric_name', 'FTE Effort',
        'permission', 'fte_effort',
        'project_level', 0,
        'project_resource_level', 0,
        'project_task_level', 0
        ) AS fte_hours

        FROM
        ${schemaName}.case_projects cp
        LEFT JOIN calculate_rd_credits_projects crcp ON crcp.case_rid = cp.case_rid
        WHERE
        cp.case_rid = '${case_rid}'
        LIMIT 1
    `;
  return query;
};

export const fetchProjectFiscalCountQuery = (
  schemaName: string,
  accountFilter: any,
  projectFilter: any,
  filterConditions: any,
  searchCondition: any,
  case_rid: string
) => {
  return `
      SELECT COUNT(*) as total
      FROM "${schemaName}"."case_project_resource_fiscal" prf
      INNER JOIN "${schemaName}"."case_projects" pf ON pf.project_fiscal_rid = prf.project_fiscal_rid AND pf.case_rid = '${case_rid}'
      INNER JOIN "${schemaName}"."resources" r ON r.rid = prf.resource_rid
      WHERE 1=1
      ${accountFilter}
      ${projectFilter}
      ${filterConditions}
      ${searchCondition}
  `;
};

export const fetchQueryForReferenceMap = (idField: any, nameField: any, table: any, ids?: string[]) => {
  let query = `SELECT ${idField}, ${nameField} FROM ${MAIN_SCHEMA_NAME}.${table}`;

  if (ids && ids.length > 0) {
    // Ensure IDs are properly quoted for SQL IN clause
    const formattedIds = ids.map(id => `'${id}'`).join(',');
    query += ` WHERE ${idField} IN (${formattedIds})`;
  }

  return query;
};

export const signoffProjectTechSummary  = (schemaName : string, projectFiscalRid : string, accountRid : string, signoff : boolean, userId : string) =>{
  const query = `
  UPDATE ${schemaName}.project_fiscal 
  SET 
  signoff = ${signoff}, modified_datetime = NOW(), modified_by = '${userId}'
  WHERE
  rid = '${projectFiscalRid}'
  AND
  account_rid = '${accountRid}'
  `
  return query;
}

export const getValidRegionIdsFromCases = (schemaName : string, accountId : string, caseId : string) => {
  return `SELECT distinct region_rid AS rid FROM ${schemaName}.case_project_resource WHERE case_rid = '${caseId}' AND account_rid = '${accountId}' AND region_rid IS NOT NULL`
}
export const fetchAvailableConfigLevelQuery = () => {
   let query = `
     WITH eligible_configs AS (
    SELECT
        ctry.country_code,
        rdcg.is_federal,
        ROW_NUMBER() OVER (
          PARTITION BY 
            ctry.country_code,
            CASE WHEN rdcg.is_federal THEN 'FEDERAL'
            ELSE rdcg.state_rid
            END
          ORDER BY
            CASE
              WHEN rdval.effective_start_date >= :effectiveStart THEN 1
              ELSE 2
            END,
          rdval.effective_start_date DESC
      ) AS rn
      FROM ${MAIN_SCHEMA_NAME}.rd_credit_config_group rdcg
      JOIN ${MAIN_SCHEMA_NAME}.rd_credit_parameter_key rdkey
          ON rdkey.credit_config_group_rid = rdcg.rid
      JOIN ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values rdval
          ON rdval.credit_config_group_rid = rdcg.rid
      JOIN ${MAIN_SCHEMA_NAME}.country ctry
          ON ctry.rid = rdcg.country_rid
      LEFT JOIN ${MAIN_SCHEMA_NAME}.state st
          ON st.rid = rdcg.state_rid
        AND st.country_rid = ctry.rid
      WHERE LOWER(ctry.country_code) = LOWER(:countryCode)
        -- Overlap logic
        AND (rdval.effective_start_date IS NULL OR rdval.effective_start_date <= :effectiveEnd)
        AND (rdval.effective_end_date IS NULL OR rdval.effective_end_date >= :effectiveStart)
        AND rdval.status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_name ='Active')
  )
  SELECT country_code, is_federal
  FROM eligible_configs
  WHERE rn = 1;
  `
  return query;
}
export const fetchRdCreditConfigQuery = () => {
  let query = `
  WITH eligible_configs AS (
    SELECT 
    rdval.config_json, ctry.rid AS country_rid,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE
          WHEN rdval.effective_start_date >= :effectiveStart THEN 1
          ELSE 2
        END,
      rdval.effective_start_date DESC
    ) AS rn
    FROM ${MAIN_SCHEMA_NAME}.rd_credit_config_group rdcg
    JOIN ${MAIN_SCHEMA_NAME}.rd_credit_parameter_key rdkey ON rdkey.credit_config_group_rid = rdcg.rid
    JOIN ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values rdval ON rdval.credit_config_group_rid = rdcg.rid
    JOIN ${MAIN_SCHEMA_NAME}.country ctry ON ctry.rid = rdcg.country_rid
    LEFT JOIN ${MAIN_SCHEMA_NAME}.state st ON st.rid = rdcg.state_rid AND st.country_rid = ctry.rid
    WHERE LOWER(ctry.country_code) = LOWER(:countryCode)

    -- State filter
    AND (
        (:regionName IS NOT NULL AND LOWER(st.state_code) = LOWER(:regionName))
        OR (:regionName IS NULL AND st.state_code IS NULL)
    )

    -- ProgramName filter (RRC vs ASC for USA Federal)
    AND (
        (:programName IS NOT NULL AND LOWER(rdcg.credit_program_name) = LOWER(:programName))
        OR (:programName IS NULL)
    )
    
    -- Effective date filter
    AND (rdval.effective_start_date IS NULL OR rdval.effective_start_date <= :effectiveEnd)
    AND (rdval.effective_end_date IS NULL OR rdval.effective_end_date >= :effectiveStart)
    AND rdval.status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_name ='Active')
  ) 
  SELECT config_json, country_rid
  FROM eligible_configs
  WHERE rn = 1;
  `
  return query;
}
export const fetchRdCreditConfigStateLevelQuery = () => {
  let query =  
  `
  WITH eligible_configs AS (
    SELECT 
    rdval.config_json, st.state_code, st.rid AS state_rid, ctry.rid AS country_rid,
    ROW_NUMBER() OVER(
      PARTITION BY 
      st.state_code
      ORDER BY
        CASE
          WHEN rdval.effective_start_date >= :effectiveStart THEN 1
          ELSE 2
        END,
      rdval.effective_start_date DESC
    ) AS rn
    FROM ${MAIN_SCHEMA_NAME}.rd_credit_config_group rdcg
    JOIN ${MAIN_SCHEMA_NAME}.rd_credit_parameter_key rdkey ON rdkey.credit_config_group_rid = rdcg.rid
    JOIN ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values rdval ON rdval.credit_config_group_rid = rdcg.rid
    JOIN ${MAIN_SCHEMA_NAME}.country ctry ON ctry.rid = rdcg.country_rid
    JOIN ${MAIN_SCHEMA_NAME}.state st ON st.rid = rdcg.state_rid AND st.country_rid = ctry.rid
    WHERE LOWER(ctry.country_code) = LOWER(:countryCode)
    AND rdcg.is_federal IS FALSE
    -- ProgramName filter
    AND (
        (:programName IS NOT NULL AND LOWER(rdcg.credit_program_name) = LOWER(:programName))
        OR (:programName IS NULL)
    )
    -- Effective date filter
    AND (rdval.effective_start_date IS NULL OR rdval.effective_start_date <= :effectiveEnd)
    AND (rdval.effective_end_date IS NULL OR rdval.effective_end_date >= :effectiveStart)
    AND rdval.status_rid = (SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_name ='Active')
  )
  select config_json, state_code, state_rid, country_rid
  from eligible_configs
  where rn = 1
  `
  return query;
}